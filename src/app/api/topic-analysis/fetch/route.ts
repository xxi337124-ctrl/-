import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractImagesFromContent } from "@/lib/image-utils";
import { searchXhsByKeyword, searchXhsByUserId } from "@/lib/xiaohongshu-client";

// Dajiala API 响应类型
interface DajialaResponse {
  code: number;
  data: DajialaArticle[];
  msg: string;
}

interface DajialaArticle {
  title: string;
  content: string;
  praise: number;
  read: number;
  url: string;
  publish_time: number;
}

// 公众号文章响应类型
interface PostConditionResponse {
  code: number;
  data: PostConditionArticle[];
  msg: string;
  total_num: number;
}

interface PostConditionArticle {
  title: string;
  digest: string;
  url: string;
  post_time: number;
  is_deleted: string;
  msg_status: number;
}

// 根据关键词获取文章
async function fetchWechatArticles(keyword: string) {
  try {
    const response = await fetch('https://www.dajiala.com/fbmain/monitor/v3/kw_search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kw: keyword,
        sort_type: 1,
        mode: 1,
        period: 7,
        page: 1,
        key: process.env.WECHAT_API_KEY,
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

    if (data.code !== 200 && data.msg !== "成功") {
      throw new Error(`API返回错误: ${data.msg}`);
    }

    if (!data.data || data.data.length === 0) {
      return [];
    }

    // 提取图片并返回
    return data.data.map((article) => ({
      title: article.title,
      content: article.content,
      likes: article.praise,
      views: article.read,
      url: article.url,
      publishTime: new Date(article.publish_time * 1000).toISOString(),
      images: extractImagesFromContent(article.content), // 提取配图
    }));
  } catch (error) {
    console.error('获取公众号文章失败:', error);
    return [];
  }
}

// 根据公众号名称获取文章
async function fetchAccountArticles(accountName: string) {
  try {
    const response = await fetch('https://www.dajiala.com/fbmain/monitor/v3/post_condition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        biz: "",
        url: "",
        name: accountName,
        key: process.env.WECHAT_API_KEY,
        verifycode: ""
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data: PostConditionResponse = await response.json();

    if (data.code !== 200) {
      throw new Error(`API返回错误: ${data.msg}`);
    }

    if (!data.data || data.data.length === 0) {
      return [];
    }

    const validArticles = data.data.filter(article =>
      article.is_deleted === "0" && article.msg_status === 2
    );

    return validArticles.map((article) => ({
      title: article.title,
      content: article.digest,
      likes: 0,
      views: 0,
      url: article.url,
      publishTime: new Date(article.post_time * 1000).toISOString(),
      images: extractImagesFromContent(article.digest), // 提取配图
    }));
  } catch (error) {
    console.error('获取公众号文章失败:', error);
    throw error;
  }
}

/**
 * POST /api/topic-analysis/fetch
 * 抓取文章（不做AI分析）
 * 支持平台：微信公众号、小红书
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { platform = 'wechat', searchType = 'keyword', query, xhsOptions } = body;

    if (!query) {
      return NextResponse.json(
        { success: false, error: "搜索内容不能为空" },
        { status: 400 }
      );
    }

    console.log(`📥 开始抓取文章: ${platform} - ${searchType} - ${query}`);
    if (xhsOptions) {
      console.log('小红书选项:', xhsOptions);
    }

    let articles: any[] = [];

    // 1. 根据平台抓取文章
    if (platform === 'xiaohongshu') {
      if (searchType === 'account') {
        // 小红书用户ID搜索
        const result = await searchXhsByUserId(query);
        articles = result.articles;

        // 限制数量
        if (xhsOptions?.count) {
          articles = articles.slice(0, xhsOptions.count);
        }
      } else {
        // 小红书关键词搜索
        const options = xhsOptions || {};
        const count = options.count || 20;

        // 可能需要多次请求来获取足够数量的文章
        let page = 1;
        const maxPages = Math.ceil(count / 20); // 假设每页20条

        while (articles.length < count && page <= maxPages) {
          const pageArticles = await searchXhsByKeyword(query, page, {
            sort: options.sort || 'general',
            note_type: options.note_type || 'image',
            note_time: options.note_time || '不限',
            note_range: options.note_range || '不限',
          });

          articles.push(...pageArticles);
          page++;

          // 如果返回的文章少于20条，说明没有更多了
          if (pageArticles.length < 20) {
            break;
          }
        }

        // 限制到指定数量
        articles = articles.slice(0, count);
      }
    } else {
      // 微信公众号
      articles = searchType === 'account'
        ? await fetchAccountArticles(query)
        : await fetchWechatArticles(query);
    }

    if (articles.length === 0) {
      return NextResponse.json({
        success: false,
        error: searchType === 'account'
          ? `未找到该${platform === 'xiaohongshu' ? '用户' : '公众号'}的内容`
          : "未找到相关文章，请尝试其他关键词",
      }, { status: 404 });
    }

    console.log(`✅ 成功抓取 ${articles.length} 篇文章`);

    // 2. 保存到数据库
    const fetchRecord = await prisma.articleFetch.create({
      data: {
        keyword: query,
        searchType: `${platform}_${searchType}`,
        articles: JSON.stringify(articles),
        totalArticles: articles.length,
      },
    });

    console.log(`💾 已保存抓取记录: ${fetchRecord.id}`);

    return NextResponse.json({
      success: true,
      data: {
        fetchId: fetchRecord.id,
        articles,
        totalArticles: articles.length,
        keyword: query,
        searchType,
        platform,
      },
    });
  } catch (error) {
    console.error("文章抓取失败:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "抓取失败" },
      { status: 500 }
    );
  }
}
