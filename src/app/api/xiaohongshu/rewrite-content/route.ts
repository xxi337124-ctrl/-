import { NextRequest, NextResponse } from "next/server";
import { geminiClient } from "@/lib/gemini-client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/xiaohongshu/rewrite-content
 * 文案二创 - 使用 Gemini 2.5 Pro 改写文案
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { originalContent, style } = body;

    if (!originalContent || !originalContent.trim()) {
      return NextResponse.json(
        { success: false, error: "原始文案不能为空" },
        { status: 400 }
      );
    }

    console.log(`📝 开始文案二创，原文长度: ${originalContent.length}`);

    // 获取用户配置的提示词
    const promptSettings = await prisma.promptSettings.findUnique({
      where: { userId: "default" },
    });

    const customPrompt = promptSettings?.xiaohongshuTextPrompt;

    // 调用 Gemini 2.5 Pro 进行文案二创
    const rewrittenContent = await geminiClient.optimizeContent(originalContent, {
      platform: "xiaohongshu",
      style: style || "轻松活泼",
      maxRetries: 3,
    });

    console.log(`✅ 文案二创完成，新文案长度: ${rewrittenContent.length}`);

    return NextResponse.json({
      success: true,
      data: {
        rewrittenContent,
        originalLength: originalContent.length,
        newLength: rewrittenContent.length,
      },
    });
  } catch (error: any) {
    console.error("文案二创失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "文案二创失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

