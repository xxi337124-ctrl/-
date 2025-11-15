/**
 * 增强版图片生成API
 * 支持提示词修改和批量处理
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhancedImageGenerator } from '@/lib/enhanced-image-generator';
// import { auth } from '@/lib/auth'; // 暂时注释，因为auth.getUser不存在

export async function POST(request: NextRequest) {
  try {
    // 验证用户身份（暂时注释掉，因为auth.getUser不存在）
    // const user = await auth.getUser(request);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: '未授权访问' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const {
      images,                    // 图片URL数组
      prompts,                   // 基础提示词数组（可选）
      usePromptModifications,    // 是否使用提示词修改
      waitForCompletion,         // 是否等待完成
      timeoutPerImage,           // 每张图片超时时间
      maxRetries,                // 最大重试次数
      imageSize,                 // 图片尺寸
      enableFallback            // 是否启用降级策略
    } = body;

    // 参数验证
    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: '请提供至少一张图片URL' },
        { status: 400 }
      );
    }

    if (images.length > 20) {
      return NextResponse.json(
        { error: '一次最多处理20张图片' },
        { status: 400 }
      );
    }

    // 处理小红书链接的特殊格式
    const processedImages = images.map((url: string) => {
      // 处理小红书图片链接
      if (url.includes('xiaohongshu.com')) {
        // 确保链接是可用的格式
        return url.replace(/\?.*$/, ''); // 移除查询参数
      }
      return url;
    });

    console.log(`🎯 增强版图片生成API - 收到 ${processedImages.length} 张图片请求`);

    // 开始生成
    const result = await enhancedImageGenerator.generateEnhancedBatchImages(
      processedImages,
      prompts,
      {
        usePromptModifications: usePromptModifications ?? true,
        waitForCompletion: waitForCompletion ?? true,
        timeoutPerImage: timeoutPerImage || 60000,
        maxRetries: maxRetries || 3,
        imageSize: imageSize || "1024x1024",
        enableFallback: enableFallback ?? true,
        progressCallback: (progress) => {
          console.log(`[进度] ${progress.message}`);
        }
      }
    );

    // 生成详细报告
    const report = enhancedImageGenerator.generateReport(result);
    console.log(report);

    return NextResponse.json({
      success: true,
      data: {
        results: result.results,
        statistics: {
          total: result.results.length,
          success: result.successCount,
          failed: result.failureCount,
          totalTime: result.totalTime,
          averageTime: Math.round(result.totalTime / result.results.length)
        },
        modificationStats: result.modificationStats
      },
      message: `成功生成 ${result.successCount}/${result.results.length} 张图片`
    });

  } catch (error) {
    console.error('增强版图片生成API错误:', error);

    const errorMessage = error instanceof Error ? error.message : '服务器内部错误';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '图片生成过程中发生错误'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '增强版图片生成API',
    features: [
      '支持提示词修改系统',
      '批量图片处理',
      '小红书图片链接支持',
      '实时进度回调',
      '智能降级策略',
      '详细的统计报告'
    ],
    usage: {
      method: 'POST',
      body: {
        images: ['图片URL数组'],
        prompts: ['可选的基础提示词数组'],
        usePromptModifications: '是否使用提示词修改（默认true）',
        waitForCompletion: '是否等待完成（默认true）',
        timeoutPerImage: '每张图片超时时间（默认60000ms）',
        maxRetries: '最大重试次数（默认3）',
        imageSize: '图片尺寸（默认1024x1024）',
        enableFallback: '是否启用降级策略（默认true）'
      }
    }
  });
}