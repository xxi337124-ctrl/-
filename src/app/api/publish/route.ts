import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Platform, Status } from "@prisma/client";

// 模拟小红书发布API
async function publishToXiaohongshu(article: any): Promise<{ success: boolean; url?: string; error?: string }> {
  // TODO: 实际使用时替换为真实的小红书API调用
  // const response = await fetch(`${process.env.XHS_API_BASE}/publish`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.PUBLISH_XHS_API_KEY}` },
  //   body: JSON.stringify({ title: article.title, content: article.content }),
  // });

  // 模拟发布成功
  return {
    success: true,
    url: `https://xiaohongshu.com/article/${article.id}`,
  };
}

// 模拟公众号发布API
async function publishToWechat(article: any): Promise<{ success: boolean; url?: string; error?: string }> {
  // TODO: 实际使用时替换为真实的公众号API调用
  // const response = await fetch(`${process.env.WECHAT_PUBLISH_API_BASE}/publish`, {
  //   method: "POST",
  //   headers: { Authorization: `Bearer ${process.env.PUBLISH_WECHAT_API_KEY}` },
  //   body: JSON.stringify({ title: article.title, content: article.content }),
  // });

  // 模拟发布成功
  return {
    success: true,
    url: `https://mp.weixin.qq.com/article/${article.id}`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { articleId, platform } = await request.json();

    // 1. 获取文章
    const article = await prisma.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      return NextResponse.json(
        { success: false, error: "文章不存在" },
        { status: 404 }
      );
    }

    // 2. 发布到指定平台
    let result;
    let platformEnum: Platform;
    let newStatus: Status;

    if (platform === "xiaohongshu") {
      result = await publishToXiaohongshu(article);
      platformEnum = Platform.XIAOHONGSHU;
      newStatus = Status.PUBLISHED_XHS;
    } else if (platform === "wechat") {
      result = await publishToWechat(article);
      platformEnum = Platform.WECHAT;
      newStatus = Status.PUBLISHED_WECHAT;
    } else {
      return NextResponse.json(
        { success: false, error: "不支持的平台" },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || "发布失败" },
        { status: 500 }
      );
    }

    // 3. 保存发布记录
    await prisma.publish.create({
      data: {
        articleId: article.id,
        platform: platformEnum,
        result: JSON.stringify(result),
      },
    });

    // 4. 更新文章状态
    const publishes = await prisma.publish.findMany({
      where: { articleId: article.id },
    });

    const hasXHS = publishes.some((p) => p.platform === Platform.XIAOHONGSHU);
    const hasWechat = publishes.some((p) => p.platform === Platform.WECHAT);

    if (hasXHS && hasWechat) {
      newStatus = Status.PUBLISHED_ALL;
    }

    await prisma.article.update({
      where: { id: article.id },
      data: { status: newStatus },
    });

    return NextResponse.json({
      success: true,
      data: {
        url: result.url,
      },
    });
  } catch (error) {
    console.error("发布失败:", error);
    return NextResponse.json(
      { success: false, error: "发布失败" },
      { status: 500 }
    );
  }
}
