import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/debug/config
 * 诊断工具：检查所有API配置是否正确加载
 */
export async function GET(request: NextRequest) {
  const config = {
    // OpenAI/OpenRouter API
    openai: {
      apiKey: process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.slice(0, 10)}...` : "未配置",
      baseUrl: process.env.OPENAI_API_BASE || "未配置",
      model: process.env.OPENAI_MODEL || "未配置",
      isConfigured: !!process.env.OPENAI_API_KEY,
    },

    // Gemini API
    gemini: {
      apiKey: process.env.GEMINI_API_KEY ? `${process.env.GEMINI_API_KEY.slice(0, 10)}...` : "未配置",
      baseUrl: process.env.GEMINI_API_BASE || "未配置",
      model: process.env.GEMINI_MODEL || "未配置",
      isConfigured: !!process.env.GEMINI_API_KEY,
    },

    // Gemini Image API
    geminiImage: {
      apiKey: process.env.GEMINI_IMAGE_API_KEY ? `${process.env.GEMINI_IMAGE_API_KEY.slice(0, 10)}...` : "未配置",
      baseUrl: process.env.GEMINI_IMAGE_API_BASE || "未配置",
      model: process.env.GEMINI_IMAGE_MODEL || "未配置",
      isConfigured: !!process.env.GEMINI_IMAGE_API_KEY,
    },

    // SiliconFlow API
    siliconflow: {
      apiKey: process.env.SILICONFLOW_API_KEY ? `${process.env.SILICONFLOW_API_KEY.slice(0, 10)}...` : "未配置",
      baseUrl: process.env.SILICONFLOW_API_BASE || "未配置",
      model: process.env.SILICONFLOW_MODEL || "未配置",
      isConfigured: !!process.env.SILICONFLOW_API_KEY,
    },

    // Apicore API
    apicore: {
      apiKey: process.env.APICORE_API_KEY ? `${process.env.APICORE_API_KEY.slice(0, 10)}...` : "未配置",
      isConfigured: !!process.env.APICORE_API_KEY,
    },

    // 豆包 API
    doubao: {
      apiKey: process.env.DOUBAO_API_KEY ? `${process.env.DOUBAO_API_KEY.slice(0, 10)}...` : "未配置",
      baseUrl: process.env.DOUBAO_API_BASE || "未配置",
      model: process.env.DOUBAO_MODEL || "未配置",
      isConfigured: !!process.env.DOUBAO_API_KEY,
    },

    // 公众号API
    wechat: {
      apiKey: process.env.WECHAT_API_KEY ? `${process.env.WECHAT_API_KEY}` : "未配置",
      baseUrl: process.env.WECHAT_API_BASE || "未配置",
      isConfigured: !!process.env.WECHAT_API_KEY,
    },

    // 小红书/Dajiala API
    dajiala: {
      apiKey: process.env.DAJIALA_API_KEY ? `${process.env.DAJIALA_API_KEY}` : "未配置",
      isConfigured: !!process.env.DAJIALA_API_KEY,
    },

    // Unsplash API
    unsplash: {
      accessKey: process.env.UNSPLASH_ACCESS_KEY ? `${process.env.UNSPLASH_ACCESS_KEY.slice(0, 10)}...` : "未配置",
      isConfigured: !!process.env.UNSPLASH_ACCESS_KEY,
    },

    // 数据库
    database: {
      url: process.env.DATABASE_URL ? "已配置" : "未配置",
      isConfigured: !!process.env.DATABASE_URL,
    },
  };

  // 统计配置状态
  const summary = {
    totalConfigs: Object.keys(config).length,
    configuredCount: Object.values(config).filter((c: any) => c.isConfigured).length,
    unconfiguredCount: Object.values(config).filter((c: any) => !c.isConfigured).length,
  };

  return NextResponse.json({
    success: true,
    summary,
    config,
    timestamp: new Date().toISOString(),
  });
}
