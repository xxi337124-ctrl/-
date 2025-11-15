import { NextRequest, NextResponse } from 'next/server';
import { aiDetector } from '@/lib/ai-detection-engines';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/auth';

/**
 * AI检测API
 * 多引擎AI内容检测服务
 */

// 执行AI检测
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const {
      text,
      engines = ['local'],
      useCache = true,
      contentId,
      contentType = 'text'
    } = body;

    // 验证输入
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '缺少文本内容或格式不正确' },
        { status: 400 }
      );
    }

    if (text.length < 50) {
      return NextResponse.json(
        { error: '文本长度至少需要50个字符' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: '文本长度不能超过10000个字符' },
        { status: 400 }
      );
    }

    const startTime = Date.now();

    try {
      // 执行AI检测
      const detectionResult = await aiDetector.detect(text, { engines, useCache });

      const detectionTime = Date.now() - startTime;

      // 记录检测历史到数据库
      const detectionRecords = detectionResult.results.map(result => ({
        content: text,
        contentType,
        contentId,
        detector: result.engine,
        aiScore: result.aiScore,
        humanScore: result.humanScore,
        details: result.details,
        createdBy: session.user?.id || 'test-user',
        createdAt: new Date(result.timestamp)
      }));

      // 批量创建检测记录（暂时注释掉，等数据库模型应用后再启用）
      // await Promise.all(
      //   detectionRecords.map(record =>
      //     prisma.aIDetectionRecord.create({ data: record })
      //   )
      // );

      // 返回结果
      return NextResponse.json({
        success: true,
        data: {
          ...detectionResult,
          metadata: {
            detectionTime,
            textLength: text.length,
            enginesUsed: engines,
            timestamp: new Date().toISOString()
          }
        }
      });

    } catch (detectionError) {
      console.error('AI检测执行失败:', detectionError);

      // 记录失败日志 (暂时注释掉，等数据库模型应用后再启用)
      // await prisma.aIDetectionRecord.create({
      //   data: {
      //     content: text,
      //     contentType,
      //     contentId,
      //     detector: 'error',
      //     aiScore: 0,
      //     humanScore: 0,
      //     details: {
      //       error: detectionError instanceof Error ? detectionError.message : 'Unknown error',
      //       engines: engines
      //     },
      //     createdBy: session.user.id,
      //     createdAt: new Date()
      //   }
      // });

      return NextResponse.json({
        success: false,
        error: 'AI检测执行失败',
        details: detectionError instanceof Error ? detectionError.message : 'Unknown error'
      }, { status: 500 });
    }

  } catch (error) {
    console.error('AI检测请求处理失败:', error);
    return NextResponse.json(
      { error: 'AI检测服务暂时不可用' },
      { status: 500 }
    );
  }
}

// 获取AI检测历史 (暂时返回空数据，等数据库模型应用后再启用)
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 暂时返回空数据
    return NextResponse.json({
      success: true,
      data: {
        records: [],
        stats: []
      },
      pagination: {
        total: 0,
        limit: 20,
        offset: 0,
        hasMore: false
      }
    });

    /* 等数据库模型应用后再启用完整功能
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const detector = searchParams.get('detector');
    const contentType = searchParams.get('contentType');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // 构建查询条件
    const where: any = {
      createdBy: session.user.id
    };

    if (detector) {
      where.detector = detector;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    const [records, totalCount] = await Promise.all([
      prisma.aIDetectionRecord.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.aIDetectionRecord.count({ where })
    ]);

    // 统计信息
    const stats = await prisma.aIDetectionRecord.groupBy({
      by: ['detector'],
      where: { createdBy: session.user.id },
      _avg: {
        aiScore: true,
        humanScore: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        records,
        stats: stats.map(stat => ({
          detector: stat.detector,
          avgAiScore: stat._avg.aiScore,
          avgHumanScore: stat._avg.humanScore,
          count: stat._count.id
        }))
      },
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + limit < totalCount
      }
    });
    */
  } catch (error) {
    console.error('获取AI检测历史失败:', error);
    return NextResponse.json(
      { error: '获取检测历史失败' },
      { status: 500 }
    );
  }
}

// 获取可用检测引擎信息
export async function HEAD(request: NextRequest) {
  try {
    const availableEngines = aiDetector.getAvailableEngines();

    return NextResponse.json({
      success: true,
      data: {
        engines: availableEngines.map(engine => ({
          name: engine.name,
          displayName: engine.displayName,
          description: engine.description,
          isAvailable: engine.isAvailable()
        }))
      }
    });

  } catch (error) {
    console.error('获取引擎信息失败:', error);
    return NextResponse.json(
      { error: '获取引擎信息失败' },
      { status: 500 }
    );
  }
}