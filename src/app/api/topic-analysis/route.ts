import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateInteractionRate } from "@/lib/utils";
import { openRouterClient } from "@/lib/openai";
import type { ArticleData, InsightReport, EnhancedInsightReport, ArticleSummary, StructuredInsight } from "@/types";

// Dajiala API 响应类型定义
interface DajialaResponse {
  code: number;
  cost_money: number;
  cut_words: string;
  data: DajialaArticle[];
  data_number: number;
  msg: string;
  page: number;
  remain_money: number;
  total: number;
  total_page: number;
}

interface DajialaArticle {
  avatar: string;
  classify: string;
  content: string;
  ghid: string;
  ip_wording: string;
  is_original: number;
  looking: number;
  praise: number;
  publish_time: number;
  publish_time_str: string;
  read: number;
  short_link: string;
  title: string;
  update_time: number;
  update_time_str: string;
  url: string;
  wx_id: string;
  wx_name: string;
}

// 公众号文章响应类型
interface PostConditionResponse {
  code: number;
  cost_money: number;
  data: PostConditionArticle[];
  head_img?: string;
  masssend_count: number;
  mp_ghid?: string;
  mp_nickname?: string;
  mp_wxid?: string;
  msg: string;
  now_page: number;
  now_page_articles_num: number;
  publish_count: number;
  remain_money: number;
  total_num: number;
  total_page: number;
}

interface PostConditionArticle {
  appmsgid: number;
  cover_url: string;
  digest: string;
  is_deleted: string;
  item_show_type: number;
  msg_fail_reason: string;
  msg_status: number;
  original: number;
  pic_cdn_url_16_9: string;
  pic_cdn_url_1_1: string;
  pic_cdn_url_235_1: string;
  position: number;
  post_time: number;
  post_time_str: string;
  pre_post_time: number;
  send_to_fans_num: number;
  title: string;
  types: number;
  update_time: number;
  url: string;
}

// 根据公众号名称获取文章
async function fetchAccountArticles(accountName: string, accountUrl?: string): Promise<ArticleData[]> {
  try {
    console.log(`正在搜索公众号: ${accountName}`);

    const requestBody = {
      biz: "",
      url: accountUrl || "",
      name: accountName,
      key: "JZL825c4023bd4c5960",
      verifycode: ""
    };

    console.log('请求参数:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://www.dajiala.com/fbmain/monitor/v3/post_condition', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
    }

    const data: PostConditionResponse = await response.json();

    console.log('API响应:', {
      code: data.code,
      msg: data.msg,
      total_num: data.total_num,
      now_page_articles_num: data.now_page_articles_num,
      mp_nickname: data.mp_nickname,
      mp_wxid: data.mp_wxid
    });

    if (data.code !== 200) {
      throw new Error(`API返回错误: ${data.msg} (code: ${data.code})`);
    }

    if (!data.data || data.data.length === 0) {
      console.log('未找到该公众号的文章');
      return [];
    }

    console.log(`找到 ${data.data.length} 篇文章 (总共: ${data.total_num})`);

    // 过滤有效文章
    const validArticles = data.data.filter(article =>
      article.is_deleted === "0" && article.msg_status === 2
    );

    console.log(`有效文章数: ${validArticles.length}`);

    // 转换为ArticleData格式
    return validArticles.map((article) => ({
      title: article.title,
      content: article.digest, // 只有摘要
      likes: 0, // 该接口不返回点赞数
      views: 0, // 该接口不返回阅读数
      reads: 0,
      url: article.url,
      publishTime: new Date(article.post_time * 1000).toISOString(),
    }));
  } catch (error) {
    console.error('获取公众号文章失败:', error);
    throw error; // 抛出错误而不是返回空数组,这样可以看到具体错误信息
  }
}

// 根据关键词获取公众号文章
async function fetchWechatArticles(keyword: string): Promise<ArticleData[]> {
  try {
    const response = await fetch('https://www.dajiala.com/fbmain/monitor/v3/kw_search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kw: keyword,
        sort_type: 1, // 排序类型：1-按时间，2-按阅读量，3-按点赞数
        mode: 1,
        period: 7, // 查询近7天的文章
        page: 1,
        key: 'JZL825c4023bd4c5960',
        any_kw: '',
        ex_kw: '',
        verifycode: '',
        type: 1,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data: DajialaResponse = await response.json();

    // Dajiala API 的 code 可能不是标准的 200,检查 msg 是否为"成功"
    if (data.code !== 200 && data.msg !== "成功") {
      throw new Error(`API返回错误: ${data.msg}`);
    }

    // 检查是否有数据
    if (!data.data || data.data.length === 0) {
      console.log('未找到相关文章');
      return [];
    }

    // 将Dajiala API数据格式转换为内部ArticleData格式
    return data.data.map((article) => ({
      title: article.title,
      content: article.content,
      likes: article.praise,
      views: article.read,
      reads: article.read, // 使用阅读数作为reads
      url: article.url,
      publishTime: new Date(article.publish_time * 1000).toISOString(), // 将时间戳转换为ISO字符串
    }));
  } catch (error) {
    console.error('获取公众号文章失败:', error);
    // 如果API调用失败，返回空数组
    return [];
  }
}

// 生成词云
function generateWordCloud(articles: ArticleData[]): { word: string; count: number }[] {
  const wordMap = new Map<string, number>();

  // 停用词列表
  const stopWords = new Set(['的', '了', '和', '是', '在', '有', '个', '不', '人', '我', '这', '你', '他', '她', '它', '们', '到', '说', '就', '去', '得', '着', '能', '上', '下', '为', '与', '对', '从', '把', '被', '让', '给', '向', '用', '由', '其', '而', '或', '等', '及']);

  articles.forEach(article => {
    // 分词 - 简单的中文分词(按字和标点分割)
    const words = article.title
      .replace(/[,.!?;:，。!?;:、【】()（）]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.has(word));

    words.forEach(word => {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    });
  });

  // 转换为数组并排序
  return Array.from(wordMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50); // 取前50个高频词
}

// 第一阶段: AI分析单篇文章,提取结构化摘要
async function analyzeArticle(article: ArticleData): Promise<ArticleSummary | null> {
  try {
    const prompt = `分析这篇文章,提取核心信息:

${article.title}

${article.content.slice(0, 1500)}${article.content.length > 1500 ? '...' : ''}

点赞: ${article.likes} | 阅读: ${article.views}

返回JSON:
{
  "summary": "一句话总结文章核心观点(50字内)",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "keywords": ["词1", "词2", "词3"],
  "highlights": ["数据或亮点1", "数据或亮点2"]
}

要求:
- summary用平实语言,像人说话
- keyPoints精炼,不要废话
- keywords提取核心概念
- highlights提取吸引眼球的内容或数据`;

    const result = await openRouterClient.generateJSON<{
      summary: string;
      keyPoints: string[];
      keywords: string[];
      highlights: string[];
    }>(prompt, {
      systemPrompt: "你是内容分析师。用简洁、口语化的表达,避免套话和AI腔。",
      timeout: 60000,
      maxRetries: 3
    });

    return {
      articleUrl: article.url || "",
      title: article.title,
      summary: result.summary,
      keyPoints: result.keyPoints,
      keywords: result.keywords,
      highlights: result.highlights,
    };
  } catch (error) {
    console.error(`分析文章失败 [${article.title}]:`, error);
    return null;
  }
}

// 第二阶段: 基于文章摘要生成结构化选题洞察
async function generateStructuredInsights(
  summaries: ArticleSummary[],
  keyword: string
): Promise<StructuredInsight[]> {
  try {
    // 使用全部5篇文章,但大幅精简每篇的内容
    const summaryText = summaries.map((s, i) =>
      `${i + 1}. ${s.title.slice(0, 30)}\n${s.summary.slice(0, 50)}`
    ).join('\n');

    const prompt = `基于"${keyword}"的5篇热门文章,给3个选题:

${summaryText}

返回JSON数组(3个):
[{
  "title": "选题标题",
  "description": "选题描述(40字内)",
  "reasoning": "为什么做(50字内)",
  "targetAudience": "目标读者",
  "contentAngle": "切入角度",
  "suggestedTitles": ["标题1", "标题2"],
  "relatedArticles": ["${summaries[0]?.articleUrl || ''}"],
  "confidenceScore": 85,
  "tags": ["标签1", "标签2"]
}]`;

    console.log(`📊 使用全部${summaries.length}篇文章生成洞察`);
    console.log(`📝 Prompt长度: ${prompt.length}字符`);

    const result = await openRouterClient.generateJSON<StructuredInsight[]>(
      prompt,
      {
        systemPrompt: "返回3个JSON选题,简洁直接",
        timeout: 90000,
        maxTokens: 8000, // 增加到8000确保完整输出
      }
    );

    // 确保返回的是数组
    if (!Array.isArray(result)) {
      console.error("AI返回的不是数组:", result);
      throw new Error("AI返回的数据格式不正确");
    }

    return result.slice(0, 3);
  } catch (error) {
    console.error("生成结构化洞察失败:", error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const {
      searchType = 'keyword',  // 默认为关键词搜索
      query,
      keyword  // 兼容旧版本
    } = body;

    const searchQuery = query || keyword;

    if (!searchQuery) {
      return NextResponse.json(
        { success: false, error: "搜索内容不能为空" },
        { status: 400 }
      );
    }

    console.log(`搜索类型: ${searchType}, 搜索内容: ${searchQuery}`);

    // 1. 根据搜索类型获取文章数据
    let articles: ArticleData[];

    if (searchType === 'account') {
      console.log(`按公众号名称获取文章: ${searchQuery}`);
      articles = await fetchAccountArticles(searchQuery);
    } else {
      console.log(`按关键词获取文章: ${searchQuery}`);
      articles = await fetchWechatArticles(searchQuery);
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: searchType === 'account'
          ? "未找到该公众号今日文章,请检查公众号名称或稍后重试"
          : "未找到相关文章,请尝试其他关键词",
      }, { status: 404 });
    }

    // 2. 选取TOP 5文章进行AI分析
    const topArticles = articles
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    console.log(`开始AI分析 - 选取TOP ${topArticles.length}篇文章`);

    // 3. 第一阶段: 顺序分析文章(避免速率限制)
    const successfulSummaries: ArticleSummary[] = [];
    const failedCount = 0;

    for (let i = 0; i < topArticles.length; i++) {
      const article = topArticles[i];
      console.log(`分析文章 ${i + 1}/${topArticles.length}: ${article.title}`);

      const summary = await analyzeArticle(article);
      if (summary) {
        successfulSummaries.push(summary);
      }

      // 添加延迟避免速率限制 (除了最后一个)
      if (i < topArticles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000)); // 等待2秒
      }
    }

    console.log(`文章分析完成: ${successfulSummaries.length}/${topArticles.length} 成功`);

    // 如果成功分析的文章少于3篇,返回错误
    if (successfulSummaries.length < 3) {
      return NextResponse.json({
        success: false,
        error: `AI分析失败,仅成功分析${successfulSummaries.length}篇文章(最少需要3篇)`,
      }, { status: 500 });
    }

    // 4. 第二阶段: 生成结构化洞察
    console.log("开始生成结构化洞察...");
    let structuredInsights: StructuredInsight[] = [];

    try {
      structuredInsights = await generateStructuredInsights(successfulSummaries, searchQuery);
    } catch (error) {
      console.error("生成洞察失败:", error);
      return NextResponse.json({
        success: false,
        error: "AI生成洞察失败,请稍后重试",
      }, { status: 500 });
    }

    // 5. 生成基础数据分析
    const articlesWithRate = articles.map((article) => ({
      ...article,
      interactionRate: calculateInteractionRate(
        article.likes,
        article.views,
        article.reads
      ),
    }));

    const topLiked = [...articles]
      .sort((a, b) => b.likes - a.likes)
      .slice(0, 5);

    const topInteractive = [...articlesWithRate]
      .sort((a, b) => b.interactionRate - a.interactionRate)
      .slice(0, 5);

    const wordCloud = generateWordCloud(articles);

    // 6. 计算成本和元数据
    const analysisTime = Date.now() - startTime;
    const totalTokensUsed = 0; // 将在实际使用中从API响应获取
    const estimatedCost = 0; // Gemini免费版

    const analysisMetadata = {
      totalArticlesAnalyzed: topArticles.length,
      successfulAnalyses: successfulSummaries.length,
      failedAnalyses: topArticles.length - successfulSummaries.length,
      totalTokensUsed,
      estimatedCost,
      modelUsed: openRouterClient.getModelName(),
      analysisTime,
    };

    // 7. 保存到数据库
    const insight = await prisma.insight.create({
      data: {
        keyword: searchQuery,
        searchType: searchType,
        totalArticles: articles.length,
        topLikedArticles: JSON.stringify(topLiked),
        topInteractiveArticles: JSON.stringify(topInteractive),
        wordCloud: JSON.stringify(wordCloud),
        insights: JSON.stringify(structuredInsights.map(i => i.title)), // 兼容旧格式
        articleSummaries: JSON.stringify(successfulSummaries),
        structuredInsights: JSON.stringify(structuredInsights),
        analysisMetadata: JSON.stringify(analysisMetadata),
      },
    });

    // 8. 构建增强型报告
    const enhancedReport: EnhancedInsightReport = {
      topLikedArticles: topLiked,
      topInteractiveArticles: topInteractive,
      wordCloud,
      insights: structuredInsights.map(i => i.title),
      articleSummaries: successfulSummaries,
      structuredInsights,
      analysisMetadata,
    };

    console.log(`分析完成 - 耗时${analysisTime}ms, 生成${structuredInsights.length}条洞察`);

    return NextResponse.json({
      success: true,
      data: {
        insightId: insight.id,
        report: enhancedReport,
        allArticles: articles,
      },
    });
  } catch (error) {
    console.error("选题分析失败:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "分析失败" },
      { status: 500 }
    );
  }
}
