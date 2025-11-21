/**
 * 小红书增强版图片处理API
 * 专门处理小红书内容的图片生成和优化
 */

import { NextRequest, NextResponse } from 'next/server';
import { xiaohongshuProcessor, XiaohongshuPost } from '@/lib/xiaohongshu-processor';

// 模拟小红书数据（实际使用时应该从数据库或API获取）
const mockXiaohongshuPosts: XiaohongshuPost[] = [
  {
    id: "1",
    title: "今日份美食分享｜超治愈的日式拉面",
    content: "在忙碌的工作之余，来一碗热腾腾的日式拉面真的太幸福了🍜 浓郁的汤底配上Q弹的面条，再加上溏心蛋和叉烧，简直是人间美味！这家店的装修风格也很温馨，木质桌椅配上暖黄色的灯光，特别适合一个人静静地享受美食时光。",
    images: [
      "https://images.unsplash.com/photo-1557872943-16a5ac26437e",
      "https://images.unsplash.com/photo-1569718212165-3a8278d5f624",
      "https://images.unsplash.com/photo-1580822184713-fc5400e7fe10"
    ],
    author: "美食探索家",
    likes: 1234,
    collections: 567,
    comments: 89,
    tags: ["美食", "日式拉面", "治愈", "一人食", "温馨"],
    createdAt: "2024-01-15T10:30:00Z"
  },
  {
    id: "2",
    title: "周末下午茶｜和闺蜜的甜蜜时光",
    content: "周末和闺蜜一起去了新开的甜品店，环境超级棒！白色的墙面配上绿植，简约又不失温馨。我们点了他们家的招牌草莓蛋糕和抹茶拿铁，颜值超高味道也很好。这样的午后时光真的太美好了，和好朋友聊聊天，享受美食，生活就是要这样慢慢品味。",
    images: [
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac",
      "https://images.unsplash.com/photo-1486427944299-aa1a5e0def7d",
      "https://images.unsplash.com/photo-1514432324607-a09d9b4aefaa",
      "https://images.unsplash.com/photo-1558961363-fa8fdf82db35"
    ],
    author: "甜品控",
    likes: 2156,
    collections: 892,
    comments: 156,
    tags: ["下午茶", "甜品", "闺蜜时光", "草莓蛋糕", "抹茶"],
    createdAt: "2024-01-14T15:20:00Z"
  }
];

export async function POST(request: NextRequest) {
  try {
    // TODO: 添加用户身份验证
    // const user = await auth.getUser(request);
    // if (!user) {
    //   return NextResponse.json(
    //     { error: '未授权访问' },
    //     { status: 401 }
    //   );
    // }

    const body = await request.json();
    const {
      posts,                           // 小红书帖子数据
      useMockData,                     // 是否使用模拟数据
      generateVariations,              // 是否生成变体
      variationCount,                  // 每个图片生成多少变体
      useContentAnalysis,              // 是否使用内容分析
      preserveStyle,                   // 是否保持原风格
      targetPlatform,                  // 目标平台
      enableBatchProcessing           // 是否启用批量处理
    } = body;

    let postsToProcess: XiaohongshuPost[];

    // 确定要处理的帖子数据
    if (useMockData) {
      postsToProcess = mockXiaohongshuPosts;
      console.log('🎯 使用模拟小红书数据进行测试');
    } else if (posts && Array.isArray(posts) && posts.length > 0) {
      postsToProcess = posts;
      console.log(`🎯 收到 ${posts.length} 个小红书帖子进行处理`);
    } else {
      return NextResponse.json(
        { error: '请提供小红书帖子数据或设置useMockData为true' },
        { status: 400 }
      );
    }

    // 参数验证
    if (variationCount > 10) {
      return NextResponse.json(
        { error: '每个图片最多生成10个变体' },
        { status: 400 }
      );
    }

    if (postsToProcess.length > 50) {
      return NextResponse.json(
        { error: '一次最多处理50个帖子' },
        { status: 400 }
      );
    }

    console.log(`🚀 开始处理 ${postsToProcess.length} 个小红书帖子`);
    console.log(`📊 配置: 变体生成=${generateVariations}, 变体数量=${variationCount}, 内容分析=${useContentAnalysis}`);

    // 开始处理
    const results = await xiaohongshuProcessor.processMultiplePosts(
      postsToProcess,
      {
        generateVariations: generateVariations ?? true,
        variationCount: variationCount || 3,
        useContentAnalysis: useContentAnalysis ?? true,
        preserveStyle: preserveStyle ?? true,
        targetPlatform: targetPlatform || 'xiaohongshu',
        enableBatchProcessing: enableBatchProcessing ?? true,
        progressCallback: (progress) => {
          console.log(`[进度] ${progress.message}`);
        }
      }
    );

    // 生成详细报告
    const report = xiaohongshuProcessor.generateProcessingReport(results);
    console.log(report);

    // 计算统计信息
    const totalOriginalImages = results.reduce((sum, result) => sum + result.originalPost.images.length, 0);
    const totalVariations = results.reduce(
      (sum, result) => sum + result.generatedImages.reduce((vSum, set) => vSum + set.variations.length, 0),
      0
    );
    const successfulVariations = results.reduce(
      (sum, result) => sum + result.generatedImages.reduce(
        (vSum, set) => vSum + set.variations.filter(v => v.success).length,
        0
      ),
      0
    );

    return NextResponse.json({
      success: true,
      data: {
        results,
        statistics: {
          totalPosts: results.length,
          totalOriginalImages,
          totalVariations,
          successfulVariations,
          overallSuccessRate: totalVariations > 0 ? Math.round((successfulVariations / totalVariations) * 100) : 0,
          averageProcessingTime: Math.round(
            results.reduce((sum, result) => sum + result.processingTime, 0) / results.length
          )
        }
      },
      message: `成功处理 ${results.length} 个小红书帖子，生成 ${successfulVariations}/${totalVariations} 个图片变体`
    });

  } catch (error) {
    console.error('小红书增强版处理API错误:', error);

    const errorMessage = error instanceof Error ? error.message : '服务器内部错误';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        message: '小红书内容处理过程中发生错误'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: '小红书增强版图片处理API',
    features: [
      '小红书内容分析和图片生成',
      '智能提示词修改系统',
      '批量图片变体生成',
      '内容感知的图片优化',
      '多平台适配（小红书/微信/通用）',
      '实时进度监控',
      '详细的统计报告'
    ],
    endpoints: {
      post: {
        description: '处理小红书帖子并生成图片变体',
        parameters: {
          posts: '小红书帖子数据数组',
          useMockData: '是否使用内置模拟数据进行测试',
          generateVariations: '是否为每张原图生成变体（默认true）',
          variationCount: '每个原图生成多少变体（默认3，最大10）',
          useContentAnalysis: '是否使用AI内容分析（默认true）',
          preserveStyle: '是否保持原图风格（默认true）',
          targetPlatform: '目标平台（xiaohongshu/wechat/universal）',
          enableBatchProcessing: '是否启用批量处理优化（默认true）'
        }
      }
    },
    exampleRequest: {
      useMockData: true,
      generateVariations: true,
      variationCount: 3,
      useContentAnalysis: true,
      preserveStyle: true,
      targetPlatform: 'xiaohongshu'
    }
  });
}

/**
 * 测试端点 - 用于验证系统状态
 */
export async function PUT(request: NextRequest) {
  try {
    // 简单的健康检查
    const healthCheck = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        xiaohongshuProcessor: 'available',
        imageGeneration: 'available',
        contentAnalysis: 'available'
      },
      configuration: {
        maxPostsPerRequest: 50,
        maxVariationsPerImage: 10,
        supportedPlatforms: ['xiaohongshu', 'wechat', 'universal'],
        features: [
          'prompt_modifications',
          'batch_processing',
          'content_analysis',
          'style_preservation',
          'progress_tracking'
        ]
      }
    };

    return NextResponse.json(healthCheck);
  } catch (error) {
    return NextResponse.json(
      {
        timestamp: new Date().toISOString(),
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}