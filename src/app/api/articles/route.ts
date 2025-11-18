import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    // 状态筛选逻辑
    if (status && status !== "all") {
      if (status === "PUBLISHED") {
        // 历史记录：获取所有已发布的文章（包含PUBLISHED关键字的状态）
        where.status = {
          contains: "PUBLISHED"
        };
      } else if (status === "DRAFT") {
        // 发布管理：只获取草稿状态的文章
        where.status = "DRAFT";
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.title = { contains: search };
    }

    const articles = await prisma.articles.findMany({
      where,
      include: {
        publishes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

// POST - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const { title, content, status, wordCount, insightId } = await request.json();

    const article = await prisma.articles.create({
      data: {
        title: title || "无标题",
        content: content || "",
        status: status || "DRAFT",
        wordCount: wordCount || 0,
        tags: JSON.stringify([]),
        images: JSON.stringify([]),
        insightId,
      },
    });

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error) {
    console.error("创建文章失败:", error);
    return NextResponse.json(
      { success: false, error: "创建失败" },
      { status: 500 }
    );
  }
}
