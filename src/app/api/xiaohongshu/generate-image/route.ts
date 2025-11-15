import { NextRequest, NextResponse } from "next/server";
import { doubaoClient } from "@/lib/doubao-client";

/**
 * POST /api/xiaohongshu/generate-image
 * 图片生成 - 使用豆包 SeeDream 4.0 生成图片
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, referenceImageUrl } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "提示词不能为空" },
        { status: 400 }
      );
    }

    if (!referenceImageUrl || !referenceImageUrl.trim()) {
      return NextResponse.json(
        { success: false, error: "参考图片URL不能为空" },
        { status: 400 }
      );
    }

    console.log(`🎨 开始生成图片...`);
    console.log(`📝 提示词: ${prompt.slice(0, 100)}...`);
    console.log(`🖼️ 参考图片: ${referenceImageUrl.slice(0, 80)}...`);

    // 检查图片生成配置
    if (!doubaoClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "图片生成功能未配置，请检查 DOUBAO_API_KEY 环境变量",
        },
        { status: 500 }
      );
    }

    // 调用豆包 SeeDream 4.0 生成图片
    const generatedImageUrl = await doubaoClient.generateImage(
      prompt,
      referenceImageUrl,
      { maxRetries: 3 }
    );

    console.log(`✅ 图片生成成功: ${generatedImageUrl.slice(0, 80)}...`);

    return NextResponse.json({
      success: true,
      data: {
        generatedImageUrl,
      },
    });
  } catch (error: any) {
    console.error("图片生成失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "图片生成失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/xiaohongshu/generate-images
 * 批量图片生成 - 生成多张图片
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompts, referenceImageUrls } = body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return NextResponse.json(
        { success: false, error: "提示词数组不能为空" },
        { status: 400 }
      );
    }

    if (!referenceImageUrls || !Array.isArray(referenceImageUrls) || referenceImageUrls.length === 0) {
      return NextResponse.json(
        { success: false, error: "参考图片URL数组不能为空" },
        { status: 400 }
      );
    }

    if (prompts.length !== referenceImageUrls.length) {
      return NextResponse.json(
        { success: false, error: "提示词和参考图片数量不匹配" },
        { status: 400 }
      );
    }

    console.log(`🎨 开始批量生成 ${prompts.length} 张图片...`);

    // 检查图片生成配置
    if (!doubaoClient.isConfigured()) {
      return NextResponse.json(
        {
          success: false,
          error: "图片生成功能未配置，请检查 DOUBAO_API_KEY 环境变量",
        },
        { status: 500 }
      );
    }

    // 批量生成图片
    const generatedImageUrls = await doubaoClient.generateImages(
      prompts,
      referenceImageUrls
    );

    const successCount = generatedImageUrls.filter((url) => url.length > 0).length;
    console.log(`✅ 批量图片生成完成: ${successCount}/${prompts.length} 成功`);

    return NextResponse.json({
      success: true,
      data: {
        generatedImageUrls,
        successCount,
        totalCount: prompts.length,
      },
    });
  } catch (error: any) {
    console.error("批量图片生成失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "批量图片生成失败，请稍后重试",
      },
      { status: 500 }
    );
  }
}

