import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { naturalArticlePrompts, naturalAIDetection } from '@/lib/natural-prompts';
import { auth } from '@/lib/auth';

/**
 * A/B测试API
 * 用于对比不同提示词版本的效果
 */

// 创建A/B测试
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      description,
      versionAId,
      versionBId,
      testType,
      sampleSize,
      successMetric,
      startDate,
      endDate
    } = body;

    // 验证必填字段
    if (!name || !versionAId || !versionBId || !testType || !successMetric) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 检查版本是否存在且属于当前用户
    const [versionA, versionB] = await Promise.all([
      prisma.promptVersion.findUnique({
        where: { id: versionAId }
      }),
      prisma.promptVersion.findUnique({
        where: { id: versionBId }
      })
    ]);

    if (!versionA || !versionB) {
      return NextResponse.json(
        { error: '提示词版本不存在' },
        { status: 404 }
      );
    }

    if (versionA.createdBy !== session.user.id || versionB.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: '无权使用这些提示词版本' },
        { status: 403 }
      );
    }

    // 创建A/B测试
    const abTest = await prisma.aBPromptTest.create({
      data: {
        name,
        description,
        versionAId,
        versionBId,
        testType,
        sampleSize: sampleSize || 100,
        successMetric,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: startDate ? 'SCHEDULED' : 'DRAFT'
      },
      include: {
        versionA: {
          select: {
            id: true,
            name: true,
            version: true,
            content: true,
            performance: true
          }
        },
        versionB: {
          select: {
            id: true,
            name: true,
            version: true,
            content: true,
            performance: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: abTest
    });

  } catch (error) {
    console.error('创建A/B测试失败:', error);
    return NextResponse.json(
      { error: '创建A/B测试失败' },
      { status: 500 }
    );
  }
}

// 获取A/B测试列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const status = searchParams.get('status');

    // 构建查询条件
    const where: any = {};

    if (status) {
      where.status = status;
    }

    const [abTests, totalCount] = await Promise.all([
      prisma.aBPromptTest.findMany({
        where,
        include: {
          versionA: {
            select: {
              id: true,
              name: true,
              version: true,
              content: true,
              performance: true
            }
          },
          versionB: {
            select: {
              id: true,
              name: true,
              version: true,
              content: true,
              performance: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.aBPromptTest.count({ where })
    ]);

    return NextResponse.json({
      success: true,
      data: abTests,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });

  } catch (error) {
    console.error('获取A/B测试列表失败:', error);
    return NextResponse.json(
      { error: '获取A/B测试列表失败' },
      { status: 500 }
    );
  }
}

// 执行A/B测试样本生成
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { testId, testParams } = body;

    if (!testId) {
      return NextResponse.json(
        { error: '缺少测试ID' },
        { status: 400 }
      );
    }

    // 获取A/B测试信息
    const abTest = await prisma.aBPromptTest.findUnique({
      where: { id: testId },
      include: {
        versionA: true,
        versionB: true
      }
    });

    if (!abTest) {
      return NextResponse.json(
        { error: 'A/B测试不存在' },
        { status: 404 }
      );
    }

    // 生成测试样本
    const results = await generateABTestSamples(abTest, testParams);

    // 更新测试结果
    const updatedTest = await prisma.aBPromptTest.update({
      where: { id: testId },
      data: {
        results: {
          ...abTest.results,
          samples: results,
          generatedAt: new Date().toISOString()
        }
      },
      include: {
        versionA: {
          select: {
            id: true,
            name: true,
            version: true
          }
        },
        versionB: {
          select: {
            id: true,
            name: true,
            version: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedTest
    });

  } catch (error) {
    console.error('执行A/B测试失败:', error);
    return NextResponse.json(
      { error: '执行A/B测试失败' },
      { status: 500 }
    );
  }
}

// 辅助函数

/**
 * 生成A/B测试样本
 */
async function generateABTestSamples(abTest: any, testParams: any): Promise<any[]> {
  const { versionA, versionB, sampleSize, testType } = abTest;

  const results = [];
  const actualSampleSize = Math.min(sampleSize || 10, 20); // 限制样本数量

  for (let i = 0; i < actualSampleSize; i++) {
    try {
      // 生成测试内容
      const [contentA, contentB] = await Promise.all([
        generateTestContent(versionA.content, testParams),
        generateTestContent(versionB.content, testParams)
      ]);

      // 根据测试类型进行评估
      let evaluationA, evaluationB;

      if (testType === 'AI_DETECTION') {
        evaluationA = naturalAIDetection.analyzeNaturalness(contentA);
        evaluationB = naturalAIDetection.analyzeNaturalness(contentB);
      } else {
        // 其他测试类型的评估逻辑
        evaluationA = { score: Math.random() * 100 };
        evaluationB = { score: Math.random() * 100 };
      }

      results.push({
        sampleId: i + 1,
        contentA: {
          content: contentA,
          evaluation: evaluationA
        },
        contentB: {
          content: contentB,
          evaluation: evaluationB
        },
        winner: evaluationA.score > evaluationB.score ? 'A' : 'B',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`生成第${i + 1}个测试样本失败:`, error);
      results.push({
        sampleId: i + 1,
        error: '生成失败',
        timestamp: new Date().toISOString()
      });
    }
  }

  return results;
}

/**
 * 生成测试内容
 */
async function generateTestContent(prompt: string, testParams: any): Promise<string> {
  // 这里应该调用实际的AI生成服务
  // 简化实现，返回模拟内容
  const mockTopics = [
    '人工智能的发展趋势',
    '内容创作的未来',
    '社交媒体营销策略',
    '个人品牌建设',
    '数字化转型的挑战'
  ];

  const randomTopic = mockTopics[Math.floor(Math.random() * mockTopics.length)];

  return `
基于提示词生成的测试内容：

主题：${randomTopic}
测试参数：${JSON.stringify(testParams)}

提示词预览：${prompt.substring(0, 200)}...

这是一个用于A/B测试的模拟生成内容。在实际应用中，这里会调用AI服务生成真实的内容用于对比测试。

内容特点：
- 自然化写作风格
- 具体细节支撑
- 个人化表达
- 情感真实流露
- 避免AI痕迹

测试时间：${new Date().toLocaleString()}
`;
}

/**
 * 分析A/B测试结果
 */
export async function analyzeABTestResults(testId: string) {
  const abTest = await prisma.aBPromptTest.findUnique({
    where: { id: testId },
    include: {
      versionA: true,
      versionB: true
    }
  });

  if (!abTest || !abTest.results?.samples) {
    return null;
  }

  const samples = abTest.results.samples;
  const validSamples = samples.filter((s: any) => !s.error);

  if (validSamples.length === 0) {
    return {
      winner: 'none',
      confidence: 0,
      analysis: '没有有效的测试样本'
    };
  }

  const aWins = validSamples.filter((s: any) => s.winner === 'A').length;
  const bWins = validSamples.filter((s: any) => s.winner === 'B').length;

  const winner = aWins > bWins ? 'A' : 'B';
  const confidence = Math.max(aWins, bWins) / validSamples.length;

  return {
    winner,
    confidence: Math.round(confidence * 100),
    statistics: {
      totalSamples: samples.length,
      validSamples: validSamples.length,
      aWins,
      bWins,
      tie: validSamples.length - aWins - bWins
    },
    versionA: {
      winRate: aWins / validSamples.length,
      avgScore: calculateAverageScore(validSamples, 'A')
    },
    versionB: {
      winRate: bWins / validSamples.length,
      avgScore: calculateAverageScore(validSamples, 'B')
    }
  };
}

/**
 * 计算平均分数
 */
function calculateAverageScore(samples: any[], version: string): number {
  const scores = samples
    .filter(s => s.winner === version || s[`content${version}`]?.evaluation?.score)
    .map(s => s[`content${version}`].evaluation.score);

  return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
}