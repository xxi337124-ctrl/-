import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PromptVersionManager, naturalArticlePrompts } from '@/lib/natural-prompts';
import { auth } from '@/lib/auth';

// 获取用户的提示词版本列表
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const style = searchParams.get('style');
    const includeSystem = searchParams.get('includeSystem') === 'true';

    // 构建查询条件
    const where: any = {
      OR: [
        { createdBy: session.user.id },
        ...(includeSystem ? [{ isSystem: true }] : [])
      ]
    };

    if (platform) {
      where.platform = platform.toUpperCase();
    }
    if (style) {
      where.style = style;
    }

    const promptVersions = await prisma.promptVersion.findMany({
      where,
      include: {
        writingStyleDNA: true,
        testResults: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { 'performance->aiDetectionScore': 'desc' },
        { 'performance->userRating': 'desc' }
      ]
    });

    return NextResponse.json({
      success: true,
      data: promptVersions
    });

  } catch (error) {
    console.error('获取提示词版本失败:', error);
    return NextResponse.json(
      { error: '获取提示词版本失败' },
      { status: 500 }
    );
  }
}

// 创建新的提示词版本
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
      platform,
      style,
      content,
      writingStyleDNAId,
      baseOnVersionId
    } = body;

    // 验证必填字段
    if (!name || !platform || !style || !content) {
      return NextResponse.json(
        { error: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 如果基于现有版本创建，获取其信息
    let baseVersion = null;
    if (baseOnVersionId) {
      baseVersion = await prisma.promptVersion.findUnique({
        where: { id: baseOnVersionId }
      });

      if (!baseVersion) {
        return NextResponse.json(
          { error: '基础版本不存在' },
          { status: 404 }
        );
      }
    }

    // 生成版本号
    const latestVersion = await prisma.promptVersion.findFirst({
      where: {
        platform: platform.toUpperCase(),
        style,
        createdBy: session.user.id
      },
      orderBy: { createdAt: 'desc' }
    });

    let newVersion = 'v1.0';
    if (latestVersion) {
      const versionMatch = latestVersion.version.match(/v(\d+)\.(\d+)/);
      if (versionMatch) {
        const major = parseInt(versionMatch[1]);
        const minor = parseInt(versionMatch[2]);
        newVersion = `v${major}.${minor + 1}`;
      }
    }

    // 创建新版本
    const promptVersion = await prisma.promptVersion.create({
      data: {
        name,
        description,
        version: newVersion,
        platform: platform.toUpperCase(),
        style,
        content,
        writingStyleDNAId,
        createdBy: session.user.id,
        performance: {
          aiDetectionScore: 0,
          userRating: 0,
          usageCount: 0,
          lastUsed: new Date().toISOString()
        }
      },
      include: {
        writingStyleDNA: true
      }
    });

    return NextResponse.json({
      success: true,
      data: promptVersion
    });

  } catch (error) {
    console.error('创建提示词版本失败:', error);
    return NextResponse.json(
      { error: '创建提示词版本失败' },
      { status: 500 }
    );
  }
}

// 更新提示词版本
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, description, content, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 检查版本是否存在且属于当前用户
    const existingVersion = await prisma.promptVersion.findUnique({
      where: { id }
    });

    if (!existingVersion) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    if (existingVersion.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: '无权修改此版本' },
        { status: 403 }
      );
    }

    // 如果激活新版本，需要停用同类型的其他版本
    if (isActive === true) {
      await prisma.promptVersion.updateMany({
        where: {
          platform: existingVersion.platform,
          style: existingVersion.style,
          createdBy: session.user.id,
          id: { not: id }
        },
        data: { isActive: false }
      });
    }

    // 更新版本
    const updatedVersion = await prisma.promptVersion.update({
      where: { id },
      data: {
        name,
        description,
        content,
        isActive
      },
      include: {
        writingStyleDNA: true
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedVersion
    });

  } catch (error) {
    console.error('更新提示词版本失败:', error);
    return NextResponse.json(
      { error: '更新提示词版本失败' },
      { status: 500 }
    );
  }
}

// 删除提示词版本
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 检查版本是否存在且属于当前用户
    const existingVersion = await prisma.promptVersion.findUnique({
      where: { id }
    });

    if (!existingVersion) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    if (existingVersion.createdBy !== session.user.id) {
      return NextResponse.json(
        { error: '无权删除此版本' },
        { status: 403 }
      );
    }

    // 不能删除系统预设版本
    if (existingVersion.isSystem) {
      return NextResponse.json(
        { error: '不能删除系统预设版本' },
        { status: 400 }
      );
    }

    // 删除版本
    await prisma.promptVersion.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: '版本删除成功'
    });

  } catch (error) {
    console.error('删除提示词版本失败:', error);
    return NextResponse.json(
      { error: '删除提示词版本失败' },
      { status: 500 }
    );
  }
}