import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  extractFirstImage,
  extractAllImages,
  generateSummary,
  validateNewspicContent
} from "@/lib/utils/wechatFormatter";

/**
 * POST /api/wechat/publish
 * 发布文章到微信公众号草稿箱
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      articleId,
      wechatAppid,
      articleType = 'news',
      author,
      coverImage,
      coverImageSource = 'auto',
    } = body;

    // 1. 验证必填参数
    if (!articleId || !wechatAppid) {
      return NextResponse.json(
        {
          success: false,
          error: "缺少必填参数: articleId 或 wechatAppid"
        },
        { status: 400 }
      );
    }

    // 2. 获取API Key
    const apiKey = process.env.WECHAT_PUBLISH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "公众号API密钥未配置"
        },
        { status: 500 }
      );
    }

    // 3. 查询文章详情
    const article = await prisma.articles.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        {
          success: false,
          error: "文章不存在"
        },
        { status: 404 }
      );
    }

    // 4. 处理封面图
    let finalCoverImage = coverImage;

    if (!finalCoverImage && coverImageSource === 'auto') {
      // 自动提取第一张图片作为封面
      finalCoverImage = extractFirstImage(article.content);
    }

    // 5. 如果是小绿书模式，验证内容
    if (articleType === 'newspic') {
      const validation = validateNewspicContent(article.content);
      if (!validation.valid) {
        return NextResponse.json(
          {
            success: false,
            error: validation.error,
            code: 'INVALID_NEWSPIC_CONTENT'
          },
          { status: 400 }
        );
      }
    }

    // 6. 生成摘要
    const summary = generateSummary(article.content);

    // 7. 构建发布请求体
    const publishData = {
      wechatAppid,
      title: article.title,
      content: article.content,
      summary,
      coverImage: finalCoverImage,
      author: author || undefined,
      contentFormat: 'markdown',
      articleType,
    };

    console.log('发布到公众号:', {
      articleId,
      wechatAppid,
      articleType,
      title: article.title,
    });

    // 8. 调用外部发布API
    const response = await fetch(
      'https://wx.limyai.com/api/openapi/wechat-publish',
      {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData),
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error('公众号发布API调用失败:', result);
      return NextResponse.json(
        {
          success: false,
          error: result.error || '发布失败',
          code: result.code || 'PUBLISH_ERROR',
        },
        { status: response.status || 500 }
      );
    }

    // 9. 保存发布记录到数据库
    await prisma.publishes.create({
      data: {
        id: crypto.randomUUID(),
        articleId,
        platform: 'WECHAT',
        wechatAppid,
        articleType,
        author: author || null,
        publicationId: result.data?.publicationId || null,
        mediaId: result.data?.mediaId || null,
        result: JSON.stringify(result),
      },
    });

    // 10. 更新文章状态
    const publishes = await prisma.publishes.findMany({
      where: { articleId },
    });

    const hasXHS = publishes.some((p) => p.platform === 'XIAOHONGSHU');
    const hasWechat = publishes.some((p) => p.platform === 'WECHAT');

    let newStatus = 'PUBLISHED_WECHAT';
    if (hasXHS && hasWechat) {
      newStatus = 'PUBLISHED_ALL';
    }

    await prisma.articles.update({
      where: { id: articleId },
      data: { status: newStatus },
    });

    console.log('发布成功:', result.data);

    // 11. 返回成功结果
    return NextResponse.json({
      success: true,
      data: result.data,
    });

  } catch (error) {
    console.error("发布到公众号失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "发布失败"
      },
      { status: 500 }
    );
  }
}
