import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// GET - 获取文章列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};

    // 状态筛选逻辑
    if (status && status !== "all") {
      if (status === "PUBLISHED") {
        // 历史记录：获取所有已发布的文章（包含PUBLISHED关键字的状态）
        where.status = {
          contains: "PUBLISHED"
        };
      } else if (status === "DRAFT") {
        // 发布管理：只获取草稿状态的文章
        where.status = "DRAFT";
      } else {
        where.status = status;
      }
    }

    if (search) {
      where.title = { contains: search };
    }

    const articles = await prisma.articles.findMany({
      where,
      include: {
        publishes: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      success: true,
      data: articles,
    });
  } catch (error) {
    console.error("获取文章列表失败:", error);
    return NextResponse.json(
      { success: false, error: "获取失败" },
      { status: 500 }
    );
  }
}

// POST - 创建新文章
export async function POST(request: NextRequest) {
  try {
    const { title, content, status, wordCount, insightId, images, tags, metadata } = await request.json();

    console.log('📥 收到创建文章请求:', {
      title: title?.substring(0, 50),
      contentLength: content?.length || 0,
      imagesCount: images?.length || 0,
      tagsCount: tags?.length || 0,
      hasMetadata: !!metadata,
    });

    // 准备要保存的数据
    let tagsJson = JSON.stringify(tags || []);
    let imagesJson = JSON.stringify(images || []);

    // 检查 tags 数据大小（避免SQLite TEXT字段限制）
    if (tagsJson.length > 100000) { // 100KB限制
      console.warn(`⚠️ 标签数据过大 (${Math.round(tagsJson.length / 1024)}KB)，正在截断...`);
      tagsJson = JSON.stringify((tags || []).slice(0, 10)); // 只保留前10个标签
    }

    // 检查 images 数据大小（避免SQLite TEXT字段限制）
    if (imagesJson.length > 500000) { // 500KB限制
      console.warn(`⚠️ 图片数据过大 (${Math.round(imagesJson.length / 1024)}KB)，正在截断...`);
      imagesJson = JSON.stringify((images || []).slice(0, 20)); // 只保留前20张图片
      console.log(`✅ 图片数据已截断到 ${Math.round(imagesJson.length / 1024)}KB`);
    }

    // 检查 content 大小
    let finalContent = content || "";
    if (finalContent.length > 1000000) { // 1MB限制
      console.warn(`⚠️ 内容过大 (${Math.round(finalContent.length / 1024)}KB)，正在截断...`);
      finalContent = finalContent.substring(0, 1000000);
    }

    console.log('💾 准备保存文章到数据库:', {
      tagsSize: `${Math.round(tagsJson.length / 1024)}KB`,
      imagesSize: `${Math.round(imagesJson.length / 1024)}KB`,
      contentSize: `${Math.round(finalContent.length / 1024)}KB`,
    });

    const article = await prisma.articles.create({
      data: {
        id: randomUUID(),
        title: title || "无标题",
        content: finalContent,
        status: status || "DRAFT",
        wordCount: wordCount || 0,
        tags: tagsJson,
        images: imagesJson,
        insightId,
        updatedAt: new Date(),
      },
    });

    console.log('✅ 文章创建成功:', article.id);

    return NextResponse.json({
      success: true,
      data: article,
    });
  } catch (error: any) {
    console.error("❌ 创建文章失败:", error);
    console.error("❌ 错误详情:", {
      name: error.name,
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { success: false, error: error.message || "创建失败" },
      { status: 500 }
    );
  }
}
