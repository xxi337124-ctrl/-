import { NextRequest, NextResponse } from 'next/server';

/**
 * 简化版提示词管理API
 * 暂时使用内存存储，不依赖数据库模型
 */

// 内存存储（实际应用中应该使用数据库）
let promptVersions: any[] = [];
let versionCounter = 1;

// 获取用户的提示词版本列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get('platform');
    const style = searchParams.get('style');
    const includeSystem = searchParams.get('includeSystem') === 'true';

    // 简化返回，不验证用户身份
    let filteredVersions = promptVersions;

    if (platform) {
      filteredVersions = filteredVersions.filter(v => v.platform === platform.toUpperCase());
    }
    if (style) {
      filteredVersions = filteredVersions.filter(v => v.style === style);
    }

    return NextResponse.json({
      success: true,
      data: filteredVersions
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

    // 生成版本号
    const newVersion = `v${versionCounter}.${Date.now() % 100}`;
    versionCounter++;

    // 创建新版本（内存存储）
    const newPromptVersion = {
      id: `prompt-${Date.now()}`,
      name,
      description: description || '',
      version: newVersion,
      platform: platform.toUpperCase(),
      style,
      content,
      writingStyleDNAId: writingStyleDNAId || null,
      performance: {
        aiDetectionScore: 0,
        userRating: 0,
        usageCount: 0,
        lastUsed: new Date().toISOString()
      },
      isActive: false,
      isSystem: false,
      createdBy: 'test-user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    promptVersions.push(newPromptVersion);

    return NextResponse.json({
      success: true,
      data: newPromptVersion
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
    const body = await request.json();
    const { id, name, description, content, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { error: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 查找版本
    const versionIndex = promptVersions.findIndex(v => v.id === id);
    if (versionIndex === -1) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    const version = promptVersions[versionIndex];

    // 如果激活新版本，需要停用同类型的其他版本
    if (isActive === true) {
      promptVersions.forEach(v => {
        if (v.platform === version.platform && v.style === version.style && v.id !== id) {
          v.isActive = false;
        }
      });
    }

    // 更新版本
    const updatedVersion = {
      ...version,
      name: name || version.name,
      description: description !== undefined ? description : version.description,
      content: content || version.content,
      isActive: isActive !== undefined ? isActive : version.isActive,
      updatedAt: new Date().toISOString()
    };

    promptVersions[versionIndex] = updatedVersion;

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
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: '缺少版本ID' },
        { status: 400 }
      );
    }

    // 查找版本
    const versionIndex = promptVersions.findIndex(v => v.id === id);
    if (versionIndex === -1) {
      return NextResponse.json(
        { error: '版本不存在' },
        { status: 404 }
      );
    }

    const version = promptVersions[versionIndex];

    // 不能删除系统预设版本
    if (version.isSystem) {
      return NextResponse.json(
        { error: '不能删除系统预设版本' },
        { status: 400 }
      );
    }

    // 删除版本
    promptVersions.splice(versionIndex, 1);

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