import { NextResponse } from "next/server";

/**
 * GET /api/wechat/accounts
 * 获取授权的公众号列表
 */
export async function GET() {
  try {
    const apiKey = process.env.WECHAT_PUBLISH_API_KEY;

    console.log('🔑 检查公众号API配置...');

    if (!apiKey) {
      console.error('❌ 公众号API密钥未配置');
      return NextResponse.json(
        {
          success: false,
          error: "公众号API密钥未配置，请在.env文件中设置 WECHAT_PUBLISH_API_KEY"
        },
        { status: 500 }
      );
    }

    console.log('📡 调用公众号列表API:', 'https://wx.limyai.com/api/openapi/wechat-accounts');

    // 调用外部API获取公众号列表
    const response = await fetch(
      'https://wx.limyai.com/api/openapi/wechat-accounts',
      {
        method: 'POST',
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 公众号列表API调用失败:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return NextResponse.json(
        {
          success: false,
          error: `API调用失败 (${response.status}): ${errorText || response.statusText}`,
          details: {
            status: response.status,
            message: '请检查API密钥是否正确，或前往 https://wx.limyai.com 授权公众号'
          }
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    console.log('✅ 成功获取公众号列表:', {
      total: data.data?.total || 0,
      accounts: data.data?.accounts?.length || 0,
    });

    return NextResponse.json(data);

  } catch (error) {
    console.error("❌ 获取公众号列表失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "获取公众号列表失败",
        details: {
          message: '网络错误或服务异常，请稍后重试'
        }
      },
      { status: 500 }
    );
  }
}
