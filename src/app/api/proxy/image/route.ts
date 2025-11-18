import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/proxy/image?url=...
 * 图片代理：解决小红书等平台的防盗链403问题
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get("url");

    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: "缺少url参数" },
        { status: 400 }
      );
    }

    // 获取图片
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Referer": "https://www.xiaohongshu.com/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `图片加载失败: ${response.status}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") || "image/jpeg";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("图片代理失败:", error);
    return NextResponse.json(
      { success: false, error: "图片代理失败" },
      { status: 500 }
    );
  }
}
