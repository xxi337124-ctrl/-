import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 清理旧的素材数据
 * 删除指定日期之前的所有素材
 */
export async function POST(request: NextRequest) {
  try {
    const { beforeDate } = await request.json();

    if (!beforeDate) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少 beforeDate 参数",
        },
        { status: 400 }
      );
    }

    // 删除指定日期之前的所有素材
    const result = await prisma.article_fetches.deleteMany({
      where: {
        createdAt: {
          lt: new Date(beforeDate),
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: `已删除 ${result.count} 条旧素材记录`,
      deletedCount: result.count,
    });
  } catch (error: any) {
    console.error("清理旧素材失败:", error);
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
 * 获取旧素材的统计信息
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const beforeDate = searchParams.get("beforeDate");

    if (!beforeDate) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少 beforeDate 参数",
        },
        { status: 400 }
      );
    }

    // 查询指定日期之前的素材数量
    const count = await prisma.article_fetches.count({
      where: {
        createdAt: {
          lt: new Date(beforeDate),
        },
      },
    });

    return NextResponse.json({
      success: true,
      count,
      message: `找到 ${count} 条旧素材记录`,
    });
  } catch (error: any) {
    console.error("查询旧素材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "查询失败",
      },
      { status: 500 }
    );
  }
}
