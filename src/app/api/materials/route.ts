import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/materials
 * 获取所有搜索材料
 */
export async function GET(request: NextRequest) {
  try {
    const fetches = await prisma.article_fetches.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const materials = fetches.map((fetch) => ({
      id: fetch.id,
      keyword: fetch.keyword,
      searchType: fetch.searchType,
      totalArticles: fetch.totalArticles,
      articles: JSON.parse(fetch.articles),
      createdAt: fetch.createdAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      data: materials,
    });
  } catch (error: any) {
    console.error("获取素材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "获取素材失败",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/materials
 * 保存小红书原始笔记到素材库
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { keyword, searchType = 'keyword', articles } = body;

    if (!keyword || !articles || articles.length === 0) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: keyword 和 articles' },
        { status: 400 }
      );
    }

    const normalizedKeyword = keyword.trim();

    // 检查是否已存在相同关键词的素材
    const existing = await prisma.article_fetches.findFirst({
      where: {
        keyword: normalizedKeyword,
        searchType,
      },
    });

    if (existing) {
      console.log(`⚠️ 素材库中已存在关键词 "${keyword}" 的内容，跳过保存`);
      return NextResponse.json({
        success: true,
        data: {
          id: existing.id,
          message: '该关键词的素材已存在',
          isExisting: true,
        },
      });
    }

    // 保存到素材库（限制JSON大小以避免SQLite TEXT字段限制）
    // SQLite TEXT字段默认最大约1MB，需要压缩或截断数据
    let articlesJson = JSON.stringify(articles);

    // 如果JSON太大（超过900KB），移除一些冗余字段
    if (articlesJson.length > 900000) {
      console.warn(`⚠️ 素材数据过大 (${Math.round(articlesJson.length / 1024)}KB)，正在精简...`);

      // 创建精简版本：只保留关键字段
      const compactArticles = articles.map((article: any) => ({
        id: article.id,
        title: article.title,
        content: article.content?.substring(0, 200) || '', // 截断内容到200字符
        coverImage: article.coverImage,
        images: article.images?.slice(0, 3) || [], // 只保留前3张图片
        author: typeof article.author === 'string' ? article.author : article.author?.name || '',
        stats: article.stats || { likes: article.likes || 0, comments: article.comments || 0, collects: article.collects || 0 },
        likes: article.likes || 0,
        comments: article.comments || 0,
        collects: article.collects || 0,
      }));

      articlesJson = JSON.stringify(compactArticles);
      console.log(`✅ 数据已精简到 ${Math.round(articlesJson.length / 1024)}KB`);
    }

    const material = await prisma.article_fetches.create({
      data: {
        keyword: normalizedKeyword,
        searchType,
        totalArticles: articles.length,
        articles: articlesJson,
        id: randomUUID(),
      },
    });

    console.log(`✅ 已保存 ${articles.length} 条笔记到素材库 (关键词: ${keyword})`);

    return NextResponse.json({
      success: true,
      data: {
        id: material.id,
        keyword: material.keyword,
        totalArticles: material.totalArticles,
        isExisting: false,
      },
    });
  } catch (error: any) {
    console.error('保存到素材库失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '保存到素材库失败',
      },
      { status: 500 }
    );
  }
}
