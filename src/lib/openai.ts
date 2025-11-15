/**
 * OpenRouter API 客户端封装
 * 提供统一的 AI 调用接口,支持错误处理和成本估算
 */

interface OpenAIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

interface OpenAIConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

class OpenRouterClient {
  private config: OpenAIConfig;

  constructor() {
    this.config = {
      apiKey: process.env.OPENAI_API_KEY || "",
      baseUrl: process.env.OPENAI_API_BASE || "https://openrouter.ai/api/v1",
      model: process.env.OPENAI_MODEL || "google/gemini-2.0-flash-exp:free",
    };

    // 启动时输出配置信息(隐藏API Key)
    console.log("🔧 OpenRouter 配置:");
    console.log(`  - API Base: ${this.config.baseUrl}`);
    console.log(`  - Model: ${this.config.model}`);
    console.log(`  - API Key: ${this.config.apiKey ? '已配置 (sk-...)' : '未配置'}`);

    if (!this.config.apiKey) {
      console.warn("⚠️ OPENAI_API_KEY 未配置,AI功能将无法使用");
    }
  }

  /**
   * 延迟函数
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 调用 OpenRouter API (带重试逻辑)
   */
  async chat(
    messages: OpenAIMessage[],
    options: {
      temperature?: number;
      maxTokens?: number;
      timeout?: number;
      maxRetries?: number;
    } = {}
  ): Promise<{ content: string; usage: OpenAIResponse["usage"] }> {
    const {
      temperature = 0.7,
      maxTokens = 4096,
      timeout = 60000, // 60秒超时
      maxRetries = 3, // 最多重试3次
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // 如果是重试,先等待一段时间 (指数退避)
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // 最多等10秒
          console.log(`重试第 ${attempt}/${maxRetries} 次,等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        console.log(`🌐 调用API (尝试 ${attempt}/${maxRetries}):`, {
          url: `${this.config.baseUrl}/chat/completions`,
          model: this.config.model,
          messageCount: messages.length,
          temperature,
          maxTokens,
        });

        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "Content Factory",
          },
          body: JSON.stringify({
            model: this.config.model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.text();
          console.error(`❌ API返回错误状态 ${response.status}:`, error.slice(0, 200));

          // 如果是429(速率限制)或502(网关错误),可以重试
          if (response.status === 429 || response.status === 502) {
            lastError = new Error(`OpenRouter API 错误: ${response.status} - ${error.slice(0, 100)}`);
            console.error(`尝试 ${attempt}/${maxRetries} 失败:`, lastError.message);
            continue; // 重试
          }

          // 其他错误直接抛出
          throw new Error(`OpenRouter API 错误: ${response.status} - ${error.slice(0, 100)}`);
        }

        // 检查响应的Content-Type
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          console.error("❌ API返回的不是JSON:", text.slice(0, 200));
          throw new Error(`API返回格式错误: ${contentType || 'unknown'}`);
        }

        const data: OpenAIResponse = await response.json();

        if (!data.choices || data.choices.length === 0) {
          throw new Error("API 返回为空");
        }

        const content = data.choices[0].message.content;

        // 调试:输出完整的API响应
        console.log("=== API响应详情 ===");
        console.log("内容长度:", content.length);
        console.log("finish_reason:", data.choices[0].finish_reason);
        console.log("usage:", JSON.stringify(data.usage));

        // 检查内容是否为空或被截断
        if (!content || content.trim().length === 0) {
          console.error("API返回的内容为空");
          throw new Error("API 返回的内容为空");
        }

        // 如果finish_reason是length,说明输出被截断了
        if (data.choices[0].finish_reason === 'length') {
          console.error("⚠️ API输出因达到token限制被截断!");
          throw new Error("API输出被截断,需要增加maxTokens");
        }

        // 如果内容看起来被截断了(以不完整的JSON结尾),也抛出错误以触发重试
        if (content.trim().endsWith(',') || content.trim().endsWith('{') || content.trim().endsWith('[')) {
          console.warn("检测到内容可能被截断,将重试...");
          throw new Error("内容可能被截断");
        }

        return {
          content,
          usage: data.usage,
        };
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          lastError = new Error("AI 请求超时,请稍后重试");
          if (attempt < maxRetries) continue; // 超时也可以重试
          throw lastError;
        }

        // 如果不是可重试的错误,直接抛出
        if (!lastError) {
          throw error;
        }

        // 最后一次重试也失败了
        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    // 所有重试都失败了
    throw lastError || new Error("API 调用失败");
  }

  /**
   * 便捷方法:生成 JSON 结构化输出
   */
  async generateJSON<T>(
    prompt: string,
    options: {
      systemPrompt?: string;
      timeout?: number;
      maxTokens?: number;
      maxRetries?: number;
    } = {}
  ): Promise<T> {
    const {
      systemPrompt = "你是一个专业的数据分析助手,始终以JSON格式返回结果。",
      ...chatOptions
    } = options;

    const { content } = await this.chat(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt },
      ],
      chatOptions
    );

    // 尝试提取 JSON (支持数组和对象)
    const jsonMatch =
      content.match(/```json\n?([\s\S]*?)\n?```/) ||
      content.match(/\[[\s\S]*\]/) ||
      content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      console.error("❌ AI返回的完整内容:", content);
      console.error("❌ 内容长度:", content.length);
      throw new Error("AI 未返回有效的 JSON 格式");
    }

    const jsonStr = jsonMatch[1] || jsonMatch[0];

    try {
      const parsed = JSON.parse(jsonStr.trim());
      console.log("✅ JSON解析成功");
      return parsed;
    } catch (error) {
      console.error("❌ JSON 解析失败,原始JSON字符串:");
      console.error(jsonStr);
      console.error("❌ JSON字符串长度:", jsonStr.length);
      console.error("❌ 最后100个字符:", jsonStr.slice(-100));
      console.error("❌ AI返回的完整内容:");
      console.error(content);

      // 尝试修复不完整的JSON数组(如果以逗号结尾)
      if (jsonStr.trim().endsWith(',')) {
        console.log("🔧 尝试修复不完整的JSON数组...");
        const fixedJson = jsonStr.trim().slice(0, -1) + ']';
        try {
          const fixed = JSON.parse(fixedJson);
          console.log("✅ JSON修复成功!");
          return fixed;
        } catch (fixError) {
          console.error("❌ JSON修复失败");
        }
      }

      throw new Error("AI 返回的 JSON 格式错误");
    }
  }

  /**
   * 估算成本 (美元)
   * Gemini 2.0 Flash 是免费的,返回 0
   */
  estimateCost(inputTokens: number, outputTokens: number): number {
    // Gemini 2.0 Flash Exp 免费版
    if (this.config.model.includes("gemini-2.0-flash-exp:free")) {
      return 0;
    }

    // 其他模型的成本计算(示例)
    const inputCostPer1M = 3; // $3/1M tokens
    const outputCostPer1M = 15; // $15/1M tokens

    return (inputTokens * inputCostPer1M + outputTokens * outputCostPer1M) / 1000000;
  }

  /**
   * 粗略估算 token 数量 (1 token ≈ 4 字符)
   */
  estimateTokens(text: string): number {
    // 中文字符按 1.5 倍计算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const otherChars = text.length - chineseChars;

    return Math.ceil((chineseChars * 1.5 + otherChars) / 4);
  }

  /**
   * 获取模型名称
   */
  getModelName(): string {
    return this.config.model;
  }
}

// 导出单例
export const openRouterClient = new OpenRouterClient();

// 导出别名,兼容旧代码
export const openaiClient = openRouterClient;
