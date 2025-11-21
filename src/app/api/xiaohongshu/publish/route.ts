import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { extractFirstImage, extractAllImages } from "@/lib/utils/wechatFormatter";
import { cleanTextContent, extractTags, validateXiaohongshuContent } from "@/lib/utils/xiaohongshuFormatter";

/**
 * POST /api/xiaohongshu/publish
 * 发布文章到小红书平台
 */
export async function POST(request: NextRequest) {
  try {
    const { articleId } = await request.json();

    // 1. 验证必填参数
    if (!articleId) {
      return NextResponse.json(
        { success: false, error: "缺少文章ID" },
        { status: 400 }
      );
    }

    // 2. 获取API Key
    const apiKey = process.env.XIAOHONGSHU_PUBLISH_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: "小红书API密钥未配置，请在环境变量中设置 XIAOHONGSHU_PUBLISH_API_KEY"
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
        { success: false, error: "文章不存在" },
        { status: 404 }
      );
    }

    // 4. 验证内容是否适合发布
    const validation = validateXiaohongshuContent(article.content);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: validation.error,
        },
        { status: 400 }
      );
    }

    // 5. 图文分离：提取图片
    // 优先从 images 字段读取(小红书二创功能保存的格式)
    let coverImage: string | null = null;
    let allImages: string[] = [];

    if (article.images) {
      try {
        const parsedImages = JSON.parse(article.images);
        if (Array.isArray(parsedImages) && parsedImages.length > 0) {
          allImages = parsedImages;
          coverImage = parsedImages[0];
          console.log('📸 从 images 字段提取图片:', { count: allImages.length });
        }
      } catch (e) {
        console.warn('⚠️  解析 images JSON 失败，尝试从 content 提取');
      }
    }

    // 如果 images 字段为空,尝试从 content 中提取
    if (!coverImage) {
      coverImage = extractFirstImage(article.content);
      allImages = extractAllImages(article.content);
      console.log('📸 从 content 提取图片:', { count: allImages.length });
    }

    if (!coverImage) {
      return NextResponse.json(
        {
          success: false,
          error: "文章必须包含至少一张图片作为封面"
        },
        { status: 400 }
      );
    }

    // 6. 文本清洗：移除Markdown和HTML标记
    const cleanedContent = cleanTextContent(article.content);

    // 7. 提取标签
    const tags = extractTags(article.content);

    // 8. 构建请求参数
    const publishData = {
      title: article.title || undefined,
      content: cleanedContent,
      coverImage,
      images: allImages.slice(1), // 排除封面图，避免重复
      tags: tags.length > 0 ? tags : undefined,
      noteId: `article_${articleId}_${Date.now()}`,
    };

    console.log('📕 发布到小红书:', {
      articleId,
      title: publishData.title,
      contentLength: cleanedContent.length,
      imageCount: allImages.length,
      tags: publishData.tags,
    });

    // 9. 调用第三方发布API
    const response = await fetch(
      'https://note.limyai.com/api/openapi/publish_note',
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

    // 10. 处理API响应
    if (!response.ok || !result.success) {
      console.error('❌ 小红书发布API调用失败:', {
        status: response.status,
        result,
      });

      return NextResponse.json(
        {
          success: false,
          error: result.error || `API调用失败 (状态码: ${response.status})`,
        },
        { status: response.status || 500 }
      );
    }

    // 11. 保存发布记录到数据库
    await prisma.publishes.create({
      data: {
        id: crypto.randomUUID(),
        articleId,
        platform: 'XIAOHONGSHU',
        result: JSON.stringify(result),
      },
    });

    // 12. 更新文章状态
    const publishes = await prisma.publishes.findMany({
      where: { articleId },
    });

    const hasWechat = publishes.some((p) => p.platform === 'WECHAT');
    let newStatus = 'PUBLISHED_XHS';
    if (hasWechat) {
      newStatus = 'PUBLISHED_ALL';
    }

    await prisma.articles.update({
      where: { id: articleId },
      data: { status: newStatus },
    });

    console.log('✅ 小红书发布成功:', {
      noteId: result.data?.note_id,
      qrCodeUrl: result.data?.xiaohongshu_qr_image_url,
    });

    // 13. 返回成功结果（包含二维码URL）
    return NextResponse.json({
      success: true,
      data: {
        qrCodeUrl: result.data?.xiaohongshu_qr_image_url,
        publishUrl: result.data?.publish_url,
        noteId: result.data?.note_id || publishData.noteId,
        warnings: validation.warnings,
      },
    });

  } catch (error) {
    console.error("❌ 发布到小红书失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "发布失败，请稍后重试"
      },
      { status: 500 }
    );
  }
}
