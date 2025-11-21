import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 获取单个文章抓取记录
 * GET /api/article-fetch/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const fetchRecord = await prisma.article_fetches.findUnique({
      where: { id }
    });

    if (!fetchRecord) {
      return NextResponse.json(
        { success: false, error: '记录不存在' },
        { status: 404 }
      );
    }

    // 解析JSON字段
    const articles = JSON.parse(fetchRecord.articles);

    return NextResponse.json({
      success: true,
      data: {
        id: fetchRecord.id,
        keyword: fetchRecord.keyword,
        searchType: fetchRecord.searchType,
        totalArticles: fetchRecord.totalArticles,
        createdAt: fetchRecord.createdAt,
        articles, // 返回解析后的文章列表
      }
    });
  } catch (error) {
    console.error('获取文章抓取记录失败:', error);
    return NextResponse.json(
      { success: false, error: '服务器错误' },
      { status: 500 }
    );
  }
}
