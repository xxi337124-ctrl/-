import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/content-creation/[taskId] - 查询任务状态
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    const task = await prisma.creationTask.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    // 如果任务已完成,返回文章数据
    let article = null;
    if (task.status === "COMPLETED" && task.articleId) {
      article = await prisma.article.findUnique({
        where: { id: task.articleId },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        task: {
          id: task.id,
          status: task.status,
          progress: task.progress,
          progressMessage: task.progressMessage,
          error: task.error,
          articleId: task.articleId,
          createdAt: task.createdAt,
          updatedAt: task.updatedAt,
        },
        article,
      },
    });
  } catch (error) {
    console.error("查询任务失败:", error);
    return NextResponse.json(
      { success: false, error: "查询任务失败" },
      { status: 500 }
    );
  }
}
