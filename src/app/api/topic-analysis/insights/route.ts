import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { openRouterClient } from "@/lib/openai";
import { calculateInteractionRate } from "@/lib/utils";
import type { ArticleSummary, StructuredInsight } from "@/types";
import { randomUUID } from "crypto";

// 分析单篇文章
async function analyzeArticle(article: any): Promise<ArticleSummary | null> {
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

// 生成结构化洞察
async function generateStructuredInsights(
  summaries: ArticleSummary[],
  keyword: string
): Promise<StructuredInsight[]> {
  try {
    // 获取用户的洞察提示词设置
    const promptSettings = await prisma.prompt_settings.findUnique({
      where: { userId: 'default' }
    });

    const insightPrompt = promptSettings?.insightPrompt || '深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。';

    const summaryText = summaries.map((s, i) =>
      `${i + 1}. ${s.title.slice(0, 30)}\n${s.summary.slice(0, 50)}`
    ).join('\n');

    const prompt = `基于"${keyword}"的${summaries.length}篇热门文章,给3个选题:

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

    const result = await openRouterClient.generateJSON<StructuredInsight[]>(
      prompt,
      {
        systemPrompt: `你是专业的内容洞察分析师。

分析要求：
${insightPrompt}

返回3个JSON选题,简洁直接,避免套话。`,
        timeout: 90000,
        maxTokens: 8000,
      }
    );

    if (!Array.isArray(result)) {
      throw new Error("AI返回的数据格式不正确");
    }

    return result.slice(0, 3);
  } catch (error) {
    console.error("生成结构化洞察失败:", error);
    throw error;
  }
}

// 生成词云
function generateWordCloud(articles: any[]): { word: string; count: number }[] {
  const wordMap = new Map<string, number>();
  const stopWords = new Set(['的', '了', '和', '是', '在', '有', '个', '不', '人', '我', '这', '你', '他', '她', '它', '们', '到', '说', '就', '去', '得', '着', '能', '上', '下', '为', '与', '对', '从', '把', '被', '让', '给', '向', '用', '由', '其', '而', '或', '等', '及']);

  articles.forEach(article => {
    const words = article.title
      .replace(/[,.!?;:，。!?;:、【】()（）]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length >= 2 && !stopWords.has(word));

    words.forEach(word => {
      wordMap.set(word, (wordMap.get(word) || 0) + 1);
    });
  });

  return Array.from(wordMap.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 50);
}

/**
 * POST /api/topic-analysis/insights
 * 基于已抓取的文章生成洞察
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await request.json();
    const { fetchId } = body;

    if (!fetchId) {
      return NextResponse.json(
        { success: false, error: "fetchId不能为空" },
        { status: 400 }
      );
    }

    console.log(`🔍 开始生成洞察: ${fetchId}`);

    // 1. 读取抓取记录
    const fetchRecord = await prisma.article_fetches.findUnique({
      where: { id: fetchId }
    });

    if (!fetchRecord) {
      return NextResponse.json(
        { success: false, error: "未找到抓取记录" },
        { status: 404 }
      );
    }

    const articles = JSON.parse(fetchRecord.articles);
    console.log(`📚 读取到 ${articles.length} 篇文章`);

    // 2. 选取TOP 5文章进行分析
    const topArticles = articles
      .sort((a: any, b: any) => b.likes - a.likes)
      .slice(0, 5);

    console.log(`📊 开始分析TOP ${topArticles.length}篇文章`);

    // 3. AI分析文章（串行避免速率限制）
    const successfulSummaries: ArticleSummary[] = [];

    for (let i = 0; i < topArticles.length; i++) {
      const article = topArticles[i];
      console.log(`分析文章 ${i + 1}/${topArticles.length}: ${article.title}`);

      const summary = await analyzeArticle(article);
      if (summary) {
        successfulSummaries.push(summary);
      }

      // 延迟避免速率限制
      if (i < topArticles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`✅ 文章分析完成: ${successfulSummaries.length}/${topArticles.length} 成功`);

    if (successfulSummaries.length < 3) {
      return NextResponse.json({
        success: false,
        error: `AI分析失败,仅成功分析${successfulSummaries.length}篇文章(最少需要3篇)`,
      }, { status: 500 });
    }

    // 4. 生成结构化洞察
    console.log("💡 开始生成结构化洞察...");
    const structuredInsights = await generateStructuredInsights(
      successfulSummaries,
      fetchRecord.keyword
    );

    // 5. 生成基础数据分析
    const articlesWithRate = articles.map((article: any) => ({
      ...article,
      interactionRate: calculateInteractionRate(article.likes, article.views, article.views),
    }));

    const topLiked = [...articles]
      .sort((a: any, b: any) => b.likes - a.likes)
      .slice(0, 5);

    const topInteractive = [...articlesWithRate]
      .sort((a: any, b: any) => b.interactionRate - a.interactionRate)
      .slice(0, 5);

    const wordCloud = generateWordCloud(articles);

    // 6. 计算元数据
    const analysisTime = Date.now() - startTime;
    const analysisMetadata = {
      totalArticlesAnalyzed: topArticles.length,
      successfulAnalyses: successfulSummaries.length,
      failedAnalyses: topArticles.length - successfulSummaries.length,
      totalTokensUsed: 0,
      estimatedCost: 0,
      modelUsed: openRouterClient.getModelName(),
      analysisTime,
    };

    // 7. 保存洞察到数据库
    const insight = await prisma.insights.create({
      data: {
        id: randomUUID(),
        fetchId: fetchRecord.id,
        keyword: fetchRecord.keyword,
        searchType: fetchRecord.searchType,
        totalArticles: articles.length,
        topLikedArticles: JSON.stringify(topLiked),
        topInteractiveArticles: JSON.stringify(topInteractive),
        wordCloud: JSON.stringify(wordCloud),
        insights: JSON.stringify(structuredInsights.map(i => i.title)),
        articleSummaries: JSON.stringify(successfulSummaries),
        structuredInsights: JSON.stringify(structuredInsights),
        analysisMetadata: JSON.stringify(analysisMetadata),
      },
    });

    console.log(`✅ 洞察生成完成 - 耗时${analysisTime}ms`);

    return NextResponse.json({
      success: true,
      data: {
        insightId: insight.id,
        report: {
          topLikedArticles: topLiked,
          topInteractiveArticles: topInteractive,
          wordCloud,
          insights: structuredInsights.map(i => i.title),
          articleSummaries: successfulSummaries,
          structuredInsights,
          analysisMetadata,
        },
        allArticles: articles,
      },
    });
  } catch (error) {
    console.error("洞察生成失败:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "生成失败" },
      { status: 500 }
    );
  }
}
