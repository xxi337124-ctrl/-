import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, images, originalNote } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '标题和内容不能为空' },
        { status: 400 }
      );
    }

    // 计算字数
    const wordCount = content.replace(/\s/g, '').length;

    // 创建文章记录
    const article = await prisma.articles.create({
      data: {
        title,
        content,
        wordCount,
        status: 'DRAFT',
        images: JSON.stringify(images || []),
        tags: JSON.stringify({
          type: 'xiaohongshu-rewrite',
          originalTitle: originalNote?.title,
          originalAuthor: originalNote?.author,
          originalUrl: originalNote?.url,
        }),
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        articleId: article.id,
        message: '保存成功',
      },
    });
  } catch (error: any) {
    console.error('保存草稿失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || '保存失败，请稍后重试',
      },
      { status: 500 }
    );
  }
}
