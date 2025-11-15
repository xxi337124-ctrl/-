import { NextRequest, NextResponse } from 'next/server';
import { naturalArticlePrompts, naturalAIDetection } from '@/lib/natural-prompts';

/**
 * 简化版提示词调试API
 * 不依赖数据库和用户认证
 */

// 内存存储调试记录
let debugRecords: any[] = [];

// 执行提示词调试
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      promptContent,
      platform,
      style,
      testParams,
      writingStyleDNAId
    } = body;

    // 验证必填字段
    if (!promptContent || !platform || !style) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      // 1. 生成测试内容
      const generatedContent = await generateTestArticleContent({
        prompt: promptContent,
        platform,
        style,
        testParams,
        writingStyleDNAId
      });

      const generationTime = Date.now() - startTime;

      // 2. 进行AI检测
      const aiDetectionResult = naturalAIDetection.analyzeNaturalness(generatedContent);

      // 3. 记录调试信息（内存存储）
      const debugRecord = {
        id: `debug-${Date.now()}`,
        promptContent,
        platform: platform.toUpperCase(),
        style,
        generatedContent,
        aiDetection: aiDetectionResult,
        generationTime,
        userId: 'test-user',
        tokenUsage: estimateTokenUsage(promptContent, generatedContent),
        createdAt: new Date()
      };

      debugRecords.push(debugRecord);

      // 4. 返回调试结果
      return NextResponse.json({
        success: true,
        data: {
          debugId: debugRecord.id,
          generatedContent,
          aiDetection: aiDetectionResult,
          generationTime,
          tokenUsage: debugRecord.tokenUsage,
          platform,
          style
        }
      });

    } catch (generateError) {
      console.error('生成内容失败:', generateError);

      return NextResponse.json({
        success: false,
        error: '生成内容失败',
        details: generateError instanceof Error ? generateError.message : '未知错误'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('提示词调试失败:', error);
    return NextResponse.json(
      { error: '提示词调试失败' },
      { status: 500 }
    );
  }
}

// 获取调试历史
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const platform = searchParams.get('platform');
    const style = searchParams.get('style');

    // 构建查询条件（内存过滤）
    let filteredRecords = debugRecords;

    if (platform) {
      filteredRecords = filteredRecords.filter(r => r.platform === platform.toUpperCase());
    }
    if (style) {
      filteredRecords = filteredRecords.filter(r => r.style === style);
    }

    const totalCount = filteredRecords.length;
    const records = filteredRecords.slice(offset, offset + limit);

    return NextResponse.json({
      success: true,
      data: records,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('获取调试历史失败:', error);
    return NextResponse.json(
      { error: '获取调试历史失败' },
      { status: 500 }
    );
  }
}

// 更新调试记录（添加用户反馈）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, userRating, userFeedback } = body;

    if (!id || !userRating) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 查找记录
    const recordIndex = debugRecords.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return NextResponse.json(
        { error: '调试记录不存在' },
        { status: 404 }
      );
    }

    // 更新记录
    debugRecords[recordIndex] = {
      ...debugRecords[recordIndex],
      userRating,
      userFeedback,
      updatedAt: new Date()
    };

    return NextResponse.json({
      success: true,
      data: debugRecords[recordIndex]
    });

  } catch (error) {
    console.error('更新调试记录失败:', error);
    return NextResponse.json(
      { error: '更新调试记录失败' },
      { status: 500 }
    );
  }
}

// 辅助函数

/**
 * 估算token使用量
 */
function estimateTokenUsage(prompt: string, content: string): number {
  const totalChars = prompt.length + content.length;
  // 粗略估算：1个token约等于4个字符
  return Math.ceil(totalChars / 4);
}

/**
 * 生成测试文章内容
 */
async function generateTestArticleContent(params: {
  prompt: string;
  platform: string;
  style: string;
  testParams?: any;
  writingStyleDNAId?: string;
}): Promise<string> {
  const { prompt, platform, style, testParams, writingStyleDNAId } = params;

  // 这里调用实际的AI生成逻辑
  // 简化实现，实际应该调用OpenRouter或其他AI服务
  const mockContent = `
基于提示词生成的测试内容：

${prompt}

这是一个模拟生成的文章内容，用于测试新的提示词效果。
平台：${platform}
风格：${style}
测试参数：${JSON.stringify(testParams)}
写作风格DNA：${writingStyleDNAId}

在实际实现中，这里会调用AI服务生成真实的文章内容。
`;

  return mockContent;
}

/**
 * 更新提示词版本的评分
 */
export async function updatePromptVersionRating(promptVersionId: string, rating: number): Promise<void> {
  // 内存存储版本，暂时不实现
  console.log('更新提示词版本评分:', promptVersionId, rating);
  return;
}