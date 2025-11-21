import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * 删除指定素材
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 删除素材记录
    await prisma.article_fetches.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "素材已删除",
    });
  } catch (error: any) {
    console.error("删除素材失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "删除素材失败",
      },
      { status: 500 }
    );
  }
}
