import { NextRequest, NextResponse } from "next/server";
import { geminiClient } from "@/lib/gemini-client";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/xiaohongshu/analyze-image
 * 图片分析 - 使用 Gemini 3 Pro 分析图片并返回提示词
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrl } = body;

    if (!imageUrl || !imageUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "图片URL不能为空" },
        { status: 400 }
      );
    }

    console.log(`🖼️ 开始分析图片: ${imageUrl.slice(0, 80)}...`);

    // 获取用户配置的图片分析提示词
    const promptSettings = await prisma.prompt_settings.findUnique({
      where: { userId: "default" },
    });

    const customAnalysisPrompt = promptSettings?.imageAnalysisPrompt;

    // 调用 Gemini 3 Pro 分析图片，只返回提示词
    const prompt = await geminiClient.analyzeImageForPrompt(
      imageUrl,
      customAnalysisPrompt || undefined,
      { maxRetries: 3 }
    );

    if (!prompt || !prompt.trim()) {
      throw new Error("图片分析未返回有效提示词");
    }

    console.log(`✅ 图片分析完成，提示词长度: ${prompt.length}`);

    return NextResponse.json({
      success: true,
      data: {
        prompt, // 只返回提示词
      },
    });
  } catch (error: any) {
    console.error("图片分析失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "图片分析失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/xiaohongshu/analyze-images
 * 批量图片分析 - 分析多张图片并返回提示词数组
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { imageUrls } = body;

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "图片URL数组不能为空" },
        { status: 400 }
      );
    }

    console.log(`🖼️ 开始批量分析 ${imageUrls.length} 张图片...`);

    // 获取用户配置的图片分析提示词
    const promptSettings = await prisma.prompt_settings.findUnique({
      where: { userId: "default" },
    });

    const customAnalysisPrompt = promptSettings?.imageAnalysisPrompt;

    // 批量分析图片，只返回提示词数组
    const prompts = await geminiClient.analyzeImagesForPrompts(
      imageUrls,
      customAnalysisPrompt || undefined
    );

    const successCount = prompts.filter((p) => p.length > 0).length;
    console.log(`✅ 批量图片分析完成: ${successCount}/${imageUrls.length} 成功`);

    return NextResponse.json({
      success: true,
      data: {
        prompts, // 返回提示词数组
        successCount,
        totalCount: imageUrls.length,
      },
    });
  } catch (error: any) {
    console.error("批量图片分析失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "批量图片分析失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

