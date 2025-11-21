import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/ai/rewrite
 * AI二创改写文章
 */
export async function POST(request: NextRequest) {
  try {
    const { title, content, platform } = await request.json();

    if (!content) {
      return NextResponse.json(
        { success: false, error: "缺少内容" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;
    const apiBase = process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1";
    const model = process.env.OPENAI_MODEL || "google/gemini-2.5-pro";

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "API密钥未配置" },
        { status: 500 }
      );
    }

    const systemPrompt = platform === 'wechat'
      ? `你是一位专业的公众号内容创作者。请对以下文章进行二创改写:
- 保留原文的核心观点和信息
- 使用全新的表达方式和文章结构
- 适合公众号发布的风格(专业、正式、有深度)
- 添加合适的标题、小标题
- 确保内容原创,避免抄袭

请直接输出改写后的完整文章,不要添加任何解释或说明。`
      : `你是一位专业的内容创作者。请对以下文章进行二创改写:
- 保留原文的核心观点和信息
- 使用全新的表达方式和文章结构
- 确保内容原创,避免抄袭

请直接输出改写后的完整文章,不要添加任何解释或说明。`;

    const userPrompt = `原文标题: ${title || '无标题'}

原文内容:
${content.slice(0, 5000)}

请进行二创改写:`;

    console.log('🔄 开始AI二创改写...');

    const response = await fetch(`${apiBase}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://content-factory.local',
        'X-Title': 'Content Factory AI Rewrite',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API调用失败:', response.status, errorText);
      return NextResponse.json(
        { success: false, error: `AI服务调用失败: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const rewrittenContent = data.choices?.[0]?.message?.content;

    if (!rewrittenContent) {
      return NextResponse.json(
        { success: false, error: "AI未返回有效内容" },
        { status: 500 }
      );
    }

    console.log('✅ AI二创改写完成');

    return NextResponse.json({
      success: true,
      data: {
        content: rewrittenContent,
        title: title,
      },
    });

  } catch (error) {
    console.error("AI二创失败:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "二创失败，请稍后重试"
      },
      { status: 500 }
    );
  }
}
