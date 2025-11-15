import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { naturalArticlePrompts, naturalAIDetection } from '@/lib/natural-prompts';
import { generateArticleContent } from '@/lib/article-generator';
import { auth } from '@/lib/auth';

/**
 * 提示词调试API
 * 支持实时预览、AI检测、用户反馈等功能
 */

// 执行提示词调试
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

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

      // 3. 记录调试信息
      const debugRecord = await prisma.promptDebugRecord.create({
        data: {
          promptContent,
          platform: platform.toUpperCase(),
          style,
          generatedContent,
          aiDetection: aiDetectionResult,
          generationTime,
          userId: session.user.id,
          tokenUsage: estimateTokenUsage(promptContent, generatedContent)
        }
      });

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

      // 记录失败的调试尝试
      await prisma.promptDebugRecord.create({
        data: {
          promptContent,
          platform: platform.toUpperCase(),
          style,
          userId: session.user.id,
          generationTime: Date.now() - startTime,
          generatedContent: null,
          aiDetection: null
        }
      });

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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const platform = searchParams.get('platform');
    const style = searchParams.get('style');

    // 构建查询条件
    const where: any = {
      userId: session.user.id
    };

    if (platform) {
      where.platform = platform.toUpperCase();
    }
    if (style) {
      where.style = style;
    }

    const [debugRecords, totalCount] = await Promise.all([
      prisma.promptDebugRecord.findMany({
        where,
        include: {
          promptVersion: {
            select: {
              id: true,
              name: true,
              version: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.promptDebugRecord.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: debugRecords,
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
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { id, userRating, userFeedback } = body;

    if (!id || !userRating) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 检查记录是否存在且属于当前用户
    const existingRecord = await prisma.promptDebugRecord.findUnique({
      where: { id }
    });

    if (!existingRecord) {
      return NextResponse.json(
        { error: '调试记录不存在' },
        { status: 404 }
      );
    }

    if (existingRecord.userId !== session.user.id) {
      return NextResponse.json(
        { error: '无权更新此记录' },
        { status: 403 }
      );
    }

    // 更新记录
    const updatedRecord = await prisma.promptDebugRecord.update({
      where: { id },
      data: {
        userRating,
        userFeedback
      }
    });

    // 如果有对应的提示词版本，更新其评分
    if (existingRecord.promptVersionId) {
      await updatePromptVersionRating(existingRecord.promptVersionId, userRating);
    }

    return NextResponse.json({
      success: true,
      data: updatedRecord
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
async function updatePromptVersionRating(promptVersionId: string, rating: number): Promise<void> {
  try {
    const version = await prisma.promptVersion.findUnique({
      where: { id: promptVersionId }
    });

    if (!version) return;

    const currentRating = version.performance?.userRating || 0;
    const currentCount = version.performance?.usageCount || 0;

    // 计算新的平均评分
    const newRating = ((currentRating * currentCount) + rating) / (currentCount + 1);

    await prisma.promptVersion.update({
      where: { id: promptVersionId },
      data: {
        performance: {
          ...version.performance,
          userRating: newRating,
          usageCount: currentCount + 1
        }
      }
    });
  } catch (error) {
    console.error('更新提示词版本评分失败:', error);
  }
}