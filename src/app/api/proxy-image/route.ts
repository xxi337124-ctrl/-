import { NextRequest, NextResponse } from "next/server";

/**
 * 图片代理API - 用于解决小红书图片403问题
 * 通过服务端转发图片请求,添加必要的请求头
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { error: "缺少图片URL参数" },
        { status: 400 }
      );
    }

    // 自动将http转换为https
    if (imageUrl.startsWith("http://")) {
      imageUrl = imageUrl.replace("http://", "https://");
    }

    // 验证URL是否来自小红书CDN
    const allowedDomains = [
      "sns-webpic-qc.xhscdn.com",
      "ci.xiaohongshu.com",
      "sns-img-qc.xhscdn.com",
    ];

    const urlObj = new URL(imageUrl);
    if (!allowedDomains.some((domain) => urlObj.hostname.includes(domain))) {
      return NextResponse.json(
        { error: "不支持的图片域名" },
        { status: 403 }
      );
    }

    // 发起图片请求,添加必要的请求头
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://www.xiaohongshu.com/",
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      // 设置超时和重试
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error(`图片请求失败: ${imageUrl}, 状态: ${response.status}`);
      return NextResponse.json(
        { error: "图片请求失败", status: response.status },
        { status: response.status }
      );
    }

    // 获取图片数据
    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // 返回图片,添加缓存头
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable", // 缓存1天
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    console.error("图片代理错误:", error);

    // 超时错误
    if (error.name === "TimeoutError") {
      return NextResponse.json(
        { error: "图片请求超时" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "服务器错误", message: error.message },
      { status: 500 }
    );
  }
}
