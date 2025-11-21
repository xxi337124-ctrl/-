import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
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

    // 检查是否已存在相同标题的草稿（去重）
    const existingDraft = await prisma.articles.findFirst({
      where: {
        title,
        status: 'DRAFT',
      },
    });

    let article;

    if (existingDraft) {
      // 更新已存在的草稿
      article = await prisma.articles.update({
        where: { id: existingDraft.id },
        data: {
          content,
          wordCount,
          images: JSON.stringify(images || []),
          tags: JSON.stringify({
            type: 'xiaohongshu-rewrite',
            originalTitle: originalNote?.title,
            originalAuthor: originalNote?.author,
            originalUrl: originalNote?.url,
          }),
          updatedAt: new Date(),
        },
      });

      console.log('✅ 更新已存在的草稿:', article.id);

      return NextResponse.json({
        success: true,
        data: {
          articleId: article.id,
          message: '草稿已更新',
          isUpdate: true,
        },
      });
    } else {
      // 创建新草稿
      article = await prisma.articles.create({
        data: {
          id: randomUUID(),
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
          updatedAt: new Date(),
        },
      });

      console.log('✅ 创建新草稿:', article.id);

      return NextResponse.json({
        success: true,
        data: {
          articleId: article.id,
          message: '保存成功',
          isUpdate: false,
        },
      });
    }
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
