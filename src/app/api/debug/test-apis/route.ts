import { NextRequest, NextResponse } from "next/server";
import { openRouterClient } from "@/lib/openai";
import { geminiClient } from "@/lib/gemini-client";
import { siliconFlowClient } from "@/lib/siliconflow";
import { searchXhsByKeyword } from "@/lib/xiaohongshu-client";

/**
 * GET /api/debug/test-apis
 * 测试所有关键API是否能正常工作
 */
export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    tests: [],
  };

  // 1. 测试 OpenRouter API (用于文案生成和洞察)
  console.log("🧪 测试 OpenRouter API...");
  try {
    const response = await openRouterClient.chat(
      [{ role: "user", content: "你好，请回复'测试成功'" }],
      { maxTokens: 500, timeout: 10000 }
    );
    results.tests.push({
      name: "OpenRouter API (文案生成/洞察)",
      status: "success",
      message: "API 工作正常",
      details: {
        model: openRouterClient.getModelName(),
        responseLength: response.content.length,
      },
    });
    console.log("✅ OpenRouter API 测试成功");
  } catch (error: any) {
    results.tests.push({
      name: "OpenRouter API (文案生成/洞察)",
      status: "failed",
      message: error.message,
    });
    console.error("❌ OpenRouter API 测试失败:", error.message);
  }

  // 2. 测试 Gemini API (用于图片分析)
  console.log("🧪 测试 Gemini API...");
  try {
    const isConfigured = geminiClient.isConfigured();
    if (!isConfigured) {
      throw new Error("Gemini API Key 未配置");
    }
    results.tests.push({
      name: "Gemini API (图片分析)",
      status: "success",
      message: "API 配置正常",
      details: {
        model: geminiClient.getModelName(),
        imageModel: geminiClient.getImageModelName(),
      },
    });
    console.log("✅ Gemini API 配置检查成功");
  } catch (error: any) {
    results.tests.push({
      name: "Gemini API (图片分析)",
      status: "failed",
      message: error.message,
    });
    console.error("❌ Gemini API 检查失败:", error.message);
  }

  // 3. 测试 SiliconFlow API (用于图片生成)
  console.log("🧪 测试 SiliconFlow API...");
  try {
    const isConfigured = siliconFlowClient.isConfigured();
    if (!isConfigured) {
      throw new Error("SiliconFlow API Key 未配置");
    }
    results.tests.push({
      name: "SiliconFlow API (图片生成)",
      status: "success",
      message: "API 配置正常",
      details: {
        model: siliconFlowClient.getModelName(),
      },
    });
    console.log("✅ SiliconFlow API 配置检查成功");
  } catch (error: any) {
    results.tests.push({
      name: "SiliconFlow API (图片生成)",
      status: "failed",
      message: error.message,
    });
    console.error("❌ SiliconFlow API 检查失败:", error.message);
  }

  // 4. 测试小红书搜索 API
  console.log("🧪 测试小红书搜索 API...");
  try {
    const articles = await searchXhsByKeyword("测试", 1, {
      sort: "general",
      note_type: "image",
      note_time: "不限",
      note_range: "不限",
    });

    if (articles.length === 0) {
      // 返回空结果不一定是错误，可能关键词没有结果
      results.tests.push({
        name: "小红书搜索 API",
        status: "warning",
        message: "API 工作正常，但返回空结果（可能关键词无结果）",
        details: {
          articleCount: 0,
        },
      });
      console.log("⚠️ 小红书 API 返回空结果");
    } else {
      results.tests.push({
        name: "小红书搜索 API",
        status: "success",
        message: "API 工作正常",
        details: {
          articleCount: articles.length,
          sampleTitle: articles[0]?.title || "",
        },
      });
      console.log("✅ 小红书搜索 API 测试成功");
    }
  } catch (error: any) {
    results.tests.push({
      name: "小红书搜索 API",
      status: "failed",
      message: error.message,
    });
    console.error("❌ 小红书搜索 API 测试失败:", error.message);
  }

  // 5. 测试公众号搜索 API
  console.log("🧪 测试公众号搜索 API...");
  try {
    const apiKey = process.env.WECHAT_API_KEY || process.env.DAJIALA_API_KEY;
    if (!apiKey) {
      throw new Error("公众号 API Key 未配置");
    }

    const response = await fetch("https://www.dajiala.com/fbmain/monitor/v3/kw_search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kw: "测试",
        sort_type: 1,
        mode: 1,
        period: 7,
        page: 1,
        key: apiKey,
        any_kw: "",
        ex_kw: "",
        verifycode: "",
        type: 1,
      }),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`API 返回错误: ${response.status}`);
    }

    const data = await response.json();

    if (data.code === 200 || data.msg === "成功") {
      results.tests.push({
        name: "公众号搜索 API",
        status: "success",
        message: "API 工作正常",
        details: {
          articleCount: data.data?.length || 0,
        },
      });
      console.log("✅ 公众号搜索 API 测试成功");
    } else {
      throw new Error(`API 返回错误: ${data.msg}`);
    }
  } catch (error: any) {
    results.tests.push({
      name: "公众号搜索 API",
      status: "failed",
      message: error.message,
    });
    console.error("❌ 公众号搜索 API 测试失败:", error.message);
  }

  // 统计结果
  const successCount = results.tests.filter((t: any) => t.status === "success").length;
  const failedCount = results.tests.filter((t: any) => t.status === "failed").length;
  const warningCount = results.tests.filter((t: any) => t.status === "warning").length;

  results.summary = {
    total: results.tests.length,
    success: successCount,
    failed: failedCount,
    warning: warningCount,
    allPassed: failedCount === 0,
  };

  console.log("\n📊 API 测试结果汇总:");
  console.log(`总计: ${results.tests.length}`);
  console.log(`成功: ${successCount}`);
  console.log(`失败: ${failedCount}`);
  console.log(`警告: ${warningCount}`);

  return NextResponse.json(results);
}
