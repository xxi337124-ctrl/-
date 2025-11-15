import { NextRequest, NextResponse } from "next/server";
import { promptConfigs, getPromptConfigById, activatePromptConfig, getABTestPromptConfigs } from "@/lib/prompt-config";
import { auth } from "@/lib/auth";

// 获取所有提示词配置
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const style = searchParams.get("style");

    let configs = [...promptConfigs];

    // 按类别筛选
    if (category) {
      configs = configs.filter(config => config.category === category);
    }

    // 按风格筛选
    if (style) {
      configs = configs.filter(config => config.style === style);
    }

    // 添加使用统计（模拟数据）
    const configsWithStats = configs.map(config => ({
      ...config,
      stats: {
        totalUses: Math.floor(Math.random() * 1000) + 100,
        avgRating: (Math.random() * 2 + 3).toFixed(1),
        successRate: Math.floor(Math.random() * 20) + 75,
      }
    }));

    return NextResponse.json({
      success: true,
      data: {
        configs: configsWithStats,
        activeConfigId: configs.find(c => c.isActive)?.id,
        categories: [...new Set(configs.map(c => c.category))],
        styles: [...new Set(configs.map(c => c.style))],
      }
    });
  } catch (error) {
    console.error("获取提示词配置失败:", error);
    return NextResponse.json(
      { error: "获取提示词配置失败" },
      { status: 500 }
    );
  }
}

// 激活指定的提示词配置
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await request.json();
    const { configId, action } = body;

    if (!configId) {
      return NextResponse.json(
        { error: "缺少配置ID" },
        { status: 400 }
      );
    }

    const config = getPromptConfigById(configId);
    if (!config) {
      return NextResponse.json(
        { error: "未找到指定的提示词配置" },
        { status: 404 }
      );
    }

    switch (action) {
      case "activate":
        await activatePromptConfig(configId);
        return NextResponse.json({
          success: true,
          message: `已激活提示词配置: ${config.name}`,
          data: { configId, configName: config.name }
        });

      case "test":
        // 启动A/B测试
        const testConfigs = getABTestPromptConfigs();
        return NextResponse.json({
          success: true,
          data: {
            testConfigs,
            message: "A/B测试配置已准备就绪"
          }
        });

      case "compare":
        // 对比不同配置的性能
        const compareConfigs = promptConfigs.filter(c =>
          body.configIds?.includes(c.id) || [configId].includes(c.id)
        );

        return NextResponse.json({
          success: true,
          data: {
            comparison: compareConfigs.map(config => ({
              id: config.id,
              name: config.name,
              description: config.description,
              isActive: config.isActive,
              performance: {
                avgQualityScore: Math.floor(Math.random() * 20) + 75,
                aiDetectionRate: Math.floor(Math.random() * 30) + 10,
                userSatisfaction: Math.floor(Math.random() * 15) + 80,
                usageCount: Math.floor(Math.random() * 500) + 50,
              }
            }))
          }
        });

      default:
        return NextResponse.json(
          { error: "不支持的操作类型" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("操作提示词配置失败:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "操作失败" },
      { status: 500 }
    );
  }
}

// 获取提示词配置详情
export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const configId = searchParams.get("id");

    if (!configId) {
      return NextResponse.json(
        { error: "缺少配置ID" },
        { status: 400 }
      );
    }

    const config = getPromptConfigById(configId);
    if (!config) {
      return NextResponse.json(
        { error: "未找到指定的提示词配置" },
        { status: 404 }
      );
    }

    // 返回详细的配置信息和示例
    return NextResponse.json({
      success: true,
      data: {
        config: {
          ...config,
          examplePrompt: getExamplePrompt(config),
          usageTips: getUsageTips(config),
          bestPractices: getBestPractices(config),
        }
      }
    });
  } catch (error) {
    console.error("获取提示词配置详情失败:", error);
    return NextResponse.json(
      { error: "获取详情失败" },
      { status: 500 }
    );
  }
}

// 辅助函数：获取示例提示词
function getExamplePrompt(config: any): string {
  const testParams = {
    keyword: "AI工具",
    insights: ["AI工具正在改变工作方式", "选择合适的工具很重要"],
    wordCount: "1000-1500字"
  };

  try {
    if (config.id === 'v3_enhanced') {
      // 新版本的示例
      return `请创作一篇关于"AI工具"的文章。

## 内容要求
• 字数：1000-1500字
• 平台：公众号
• 风格：自然真实

## 核心观点（可选参考）
1. AI工具正在改变工作方式
2. 选择合适的工具很重要

## 写作指南（自然表达即可）
1. 像和朋友聊天一样自然
2. 分享真实想法和个人体验
3. 用具体例子说明观点
4. 句子长短交替，避免机械重复
5. 适当表达个人情绪和态度`;
    } else if (config.id === 'v2_natural') {
      // 自然化版本示例
      return `基于真实观察和个人思考，创作一篇关于"AI工具"的文章。

写作灵感来源：
1. AI工具正在改变工作方式
2. 选择合适的工具很重要

基本要求：
• 字数控制在1000-1500字左右
• 像闺蜜分享生活经验一样亲切自然

自然写作原则：
1. 真实体验优先
2. 具体细节支撑
3. 思维过程可见`;
    } else {
      // 原始版本示例（简化版）
      return `创作一篇关于"AI工具"的文章，包含以下观点：AI工具正在改变工作方式、选择合适的工具很重要，字数1000-1500字。`;
    }
  } catch (error) {
    return "示例提示词生成失败";
  }
}

// 辅助函数：获取使用建议
function getUsageTips(config: any): string[] {
  const tips = {
    'v3_enhanced': [
      "适合追求自然真实表达的内容",
      "对AI痕迹敏感的场景特别有效",
      "建议用于小红书、公众号等平台",
      "可以根据具体需求微调提示词"
    ],
    'v2_natural': [
      "适合需要深度去AI化的内容",
      "对反AI检测要求高的场景",
      "适合专业度要求较高的文章",
      "规则较多，需要严格按照要求执行"
    ],
    'v1_original': [
      "适合对内容结构要求严格的场景",
      "适合新手用户快速上手",
      "规则明确，易于理解和执行",
      "可能在某些平台AI检测率较高"
    ]
  };

  return tips[config.id as keyof typeof tips] || ["请根据实际需求调整使用方式"];
}

// 辅助函数：获取最佳实践
function getBestPractices(config: any): string[] {
  const practices = {
    'v3_enhanced': [
      "在提示词中加入具体的场景描述",
      "提供真实的个人体验或观察",
      "避免过度抽象的概念表达",
      "适当使用口语化表达方式"
    ],
    'v2_natural': [
      "严格按照8个自然原则执行",
      "注意避免所有列出的AI套话",
      "多使用个人视角和具体细节",
      "保持语言的不完美感"
    ],
    'v1_original': [
      "按照结构化要求组织内容",
      "注意字数控制和格式要求",
      "使用合适的连接词和过渡",
      "确保内容的逻辑性和完整性"
    ]
  };

  return practices[config.id as keyof typeof practices] || ["建议进行A/B测试找到最适合的配置"];
}