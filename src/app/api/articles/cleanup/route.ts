import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 清理所有文章数据
 */
export async function DELETE(request: NextRequest) {
  try {
    // 先删除所有发布记录
    await prisma.publishes.deleteMany({});

    // 再删除所有文章
    const result = await prisma.articles.deleteMany({});

    return NextResponse.json({
      success: true,
      message: `已删除 ${result.count} 篇文章及其发布记录`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("清理文章失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "清理失败",
      },
      { status: 500 }
    );
  }
}

/**
 * 获取文章统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const articlesCount = await prisma.articles.count();
    const publishesCount = await prisma.publishes.count();

    return NextResponse.json({
      success: true,
      articlesCount,
      publishesCount,
      message: `当前有 ${articlesCount} 篇文章，${publishesCount} 条发布记录`,
    });
  } catch (error: any) {
    console.error("查询文章失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "查询失败",
      },
      { status: 500 }
    );
  }
}
