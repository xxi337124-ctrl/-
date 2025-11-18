import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/content-creation/[taskId] - 查询任务状态
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // 🔥 强制禁用缓存,确保获取最新数据
    const task = await prisma.creation_tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      return NextResponse.json(
        { success: false, error: "任务不存在" },
        { status: 404 }
      );
    }

    console.log(`📊 [轮询] 任务 ${taskId} 状态:`, {
      status: task.status,
      progress: task.progress,
      message: task.progressMessage,
      updatedAt: task.updatedAt
    });

    // 如果任务已完成,返回文章数据
    let article = null;
    if (task.status === "COMPLETED" && task.articleId) {
      article = await prisma.articles.findUnique({
        where: { id: task.articleId },
      });
      console.log(`✅ [轮询] 文章已加载:`, article?.title);
    }

    return NextResponse.json(
      {
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
      },
      {
        headers: {
          // 🔥 禁用所有缓存,确保实时性
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    );
  } catch (error) {
    console.error("查询任务失败:", error);
    return NextResponse.json(
      { success: false, error: "查询任务失败" },
      { status: 500 }
    );
  }
}
