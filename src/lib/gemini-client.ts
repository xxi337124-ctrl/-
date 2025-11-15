/**
 * Google Gemini API 客户端封装（通过 OpenRouter）
 * 支持文案二创（Gemini 2.5 Pro）和图片分析（Gemini 2.5 Pro vision）
 * 以及图片生成（Gemini 2.5 Flash Image）
 */

interface GeminiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  imageApiKey: string;
  imageModel: string;
}

interface ImageAnalysisResult {
  description: string;
  suggestedPrompt: string;
  keyElements: string[];
  style: string;
  mood: string;
}

class GeminiClient {
  private config: GeminiConfig;

  constructor() {
    this.config = {
      apiKey: process.env.GEMINI_API_KEY || "",
      baseUrl: process.env.GEMINI_API_BASE || "https://openrouter.ai/api/v1",
      model: process.env.GEMINI_MODEL || "google/gemini-2.5-pro",
      imageApiKey: process.env.GEMINI_IMAGE_API_KEY || process.env.GEMINI_API_KEY || "",
      imageModel: process.env.GEMINI_IMAGE_MODEL || "google/gemini-2.5-flash-image",
    };

    console.log("🔧 Gemini 配置:");
    console.log(`  - Base URL: ${this.config.baseUrl}`);
    console.log(`  - Text/Analysis Model: ${this.config.model}`);
    console.log(`  - Image Model: ${this.config.imageModel}`);
    console.log(`  - API Key: ${this.config.apiKey ? '已配置' : '未配置'}`);
    console.log(`  - Image API Key: ${this.config.imageApiKey ? '已配置' : '未配置'}`);

    if (!this.config.apiKey) {
      console.warn("⚠️ GEMINI_API_KEY 未配置，Gemini 功能将无法使用");
    }
  }

  /**
   * 延迟函数
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 文案二创优化 - 使用 Gemini 2.5 Pro（通过 OpenRouter）
   */
  async optimizeContent(
    originalContent: string,
    options: {
      platform?: "xiaohongshu" | "wechat" | "universal";
      style?: string;
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const { platform = "xiaohongshu", style = "轻松活泼", maxRetries = 3 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`文案优化重试 ${attempt}/${maxRetries}，等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        const prompt = this.buildContentOptimizationPrompt(originalContent, platform, style);

        console.log(`📝 发送文案优化请求到 Gemini 2.5 Pro (尝试 ${attempt}/${maxRetries})...`);

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
            messages: [
              {
                role: "user",
                content: prompt,
              },
            ],
            temperature: 0.7,
            max_tokens: 4096,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API 错误: ${response.status} - ${error.slice(0, 100)}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";

        if (!text || text.trim().length === 0) {
          throw new Error("Gemini 返回的内容为空");
        }

        console.log(`✅ 文案优化成功 (长度: ${text.length})`);
        return text.trim();
      } catch (error: any) {
        lastError = error;
        console.error(`❌ 文案优化失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("文案优化失败");
  }

  /**
   * 图片分析 - 使用 Gemini 2.5 Pro vision（通过 OpenRouter）
   * 根据用户在设置中配置的提示词模板进行分析
   */
  async analyzeImage(
    imageUrl: string,
    customPrompt?: string,
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<ImageAnalysisResult> {
    const { maxRetries = 3 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`图片分析重试 ${attempt}/${maxRetries}，等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        console.log(`🖼️ 分析图片: ${imageUrl.slice(0, 80)}...`);

        const prompt = customPrompt || this.buildDefaultImageAnalysisPrompt();

        console.log(`🔍 发送图片分析请求到 Gemini 2.5 Pro (尝试 ${attempt}/${maxRetries})...`);
        console.log(`📝 使用提示词: ${prompt.slice(0, 100)}...`);

        // 使用 OpenRouter 的 vision 格式
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
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageUrl,
                    },
                  },
                ],
              },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini API 错误: ${response.status} - ${error.slice(0, 100)}`);
        }

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "";

        if (!text || text.trim().length === 0) {
          throw new Error("Gemini 返回的图片分析为空");
        }

        console.log(`✅ 图片分析成功 (长度: ${text.length})`);

        // 解析返回的分析结果
        const analysisResult = this.parseImageAnalysis(text);
        return analysisResult;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ 图片分析失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("图片分析失败");
  }

  /**
   * 批量分析图片
   */
  async analyzeImages(
    imageUrls: string[],
    customPrompt?: string
  ): Promise<ImageAnalysisResult[]> {
    console.log(`🎨 开始批量分析 ${imageUrls.length} 张图片...`);

    const results: ImageAnalysisResult[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`\n[图片 ${i + 1}/${imageUrls.length}] 开始分析...`);

      try {
        const analysis = await this.analyzeImage(imageUrl, customPrompt);
        results.push(analysis);
        console.log(`✅ [图片 ${i + 1}] 分析成功`);
      } catch (error) {
        console.error(`❌ [图片 ${i + 1}] 分析失败:`, error);
        // 添加一个空结果，保持数组长度一致
        results.push({
          description: "",
          suggestedPrompt: "",
          keyElements: [],
          style: "unknown",
          mood: "neutral",
        });
      }

      // 在每张图片之间添加延迟，避免 API 过载
      if (i < imageUrls.length - 1) {
        await this.sleep(2000);
      }
    }

    const successCount = results.filter((r) => r.description.length > 0).length;
    console.log(`\n📊 批量图片分析完成: ${successCount}/${imageUrls.length} 成功`);

    return results;
  }

  /**
   * 构建文案优化提示词
   */
  private buildContentOptimizationPrompt(
    content: string,
    platform: string,
    style: string
  ): string {
    const platformGuides: Record<string, string> = {
      xiaohongshu: `
小红书平台特点：
- 用户年轻化，喜欢真实、亲切的分享
- 句子简短有力，适合快速浏览
- 适当使用表情符号增加亲和力（但不过度）
- 强调实用性和分享价值
`,
      wechat: `
微信公众号平台特点：
- 适合深度阅读，结构清晰
- 语言专业正式但不失亲和力
- 段落分明，逻辑严谨
- 使用数据和案例支撑观点
`,
      universal: `
通用平台特点：
- 平衡专业性和易读性
- 语言自然流畅
- 结合实际案例
- 适合多平台传播
`,
    };

    return `你是一位专业的内容创作者，擅长${platform}平台的内容创作。

请帮我优化以下文案，使其更适合${platform}平台发布。

${platformGuides[platform] || platformGuides.universal}

风格要求：${style}

原始文案：
${content}

请直接返回优化后的文案，不需要任何解释说明。`;
  }

  /**
   * 构建默认的图片分析提示词（针对图生图二创优化）
   */
  private buildDefaultImageAnalysisPrompt(): string {
    return `请仔细分析这张图片，为图生图（image-to-image）生成提供详细的英文提示词。

分析要点：
1. **主体对象**：准确识别图片的核心主体（人物、物品、场景等）
2. **构图布局**：描述主体位置、视角、景深关系
3. **色彩与光线**：主色调、光线方向、明暗对比
4. **细节与质感**：材质、纹理、表面特征
5. **风格与氛围**：整体艺术风格、情绪氛围

生成的英文提示词要求：
- 使用专业的图片生成关键词（如：high quality, detailed, soft lighting, natural colors等）
- 按照重要性排序，最重要的特征放在前面
- 包含足够的细节以保持原图风格，但不要过于具体以保留创作空间
- 适合 image-to-image 模型（如 Stable Diffusion, MidJourney, DALL-E 等）

请以 JSON 格式返回结果：
{
  "description": "图片的详细中文描述",
  "suggestedPrompt": "详细的英文提示词，至少50-100个词，包含主体、构图、色彩、风格等要素",
  "keyElements": ["关键元素1", "关键元素2", "关键元素3"],
  "style": "艺术风格描述（如：摄影写实、水彩插画、扁平设计等）",
  "mood": "氛围情绪（如：温馨治愈、活力清新、优雅高级等）"
}`;
  }

  /**
   * 解析图片分析结果
   */
  private parseImageAnalysis(text: string): ImageAnalysisResult {
    try {
      // 尝试提取 JSON
      const jsonMatch =
        text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const jsonStr = jsonMatch[1] || jsonMatch[0];
        const parsed = JSON.parse(jsonStr);

        return {
          description: parsed.description || "",
          suggestedPrompt: parsed.suggestedPrompt || "",
          keyElements: parsed.keyElements || [],
          style: parsed.style || "unknown",
          mood: parsed.mood || "neutral",
        };
      }

      // 如果没有找到 JSON，尝试从文本中提取信息
      return {
        description: text,
        suggestedPrompt: text,
        keyElements: [],
        style: "unknown",
        mood: "neutral",
      };
    } catch (error) {
      console.error("解析图片分析结果失败:", error);
      return {
        description: text,
        suggestedPrompt: text,
        keyElements: [],
        style: "unknown",
        mood: "neutral",
      };
    }
  }

  /**
   * 图片分析 - 只返回提示词（用于小红书二创流程）
   */
  async analyzeImageForPrompt(
    imageUrl: string,
    customPrompt?: string,
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const { maxRetries = 3 } = options;
    
    try {
      const analysis = await this.analyzeImage(imageUrl, customPrompt, { maxRetries });
      return analysis.suggestedPrompt || "";
    } catch (error) {
      console.error("图片分析失败:", error);
      throw error;
    }
  }

  /**
   * 批量分析图片 - 只返回提示词数组
   */
  async analyzeImagesForPrompts(
    imageUrls: string[],
    customPrompt?: string
  ): Promise<string[]> {
    console.log(`🎨 开始批量分析 ${imageUrls.length} 张图片（仅提取提示词）...`);

    const prompts: string[] = [];

    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      console.log(`\n[图片 ${i + 1}/${imageUrls.length}] 开始分析...`);

      try {
        const prompt = await this.analyzeImageForPrompt(imageUrl, customPrompt);
        prompts.push(prompt);
        console.log(`✅ [图片 ${i + 1}] 分析成功，提示词长度: ${prompt.length}`);
      } catch (error) {
        console.error(`❌ [图片 ${i + 1}] 分析失败:`, error);
        prompts.push(""); // 添加空字符串，保持数组长度一致
      }

      // 在每张图片之间添加延迟，避免 API 过载
      if (i < imageUrls.length - 1) {
        await this.sleep(2000);
      }
    }

    const successCount = prompts.filter((p) => p.length > 0).length;
    console.log(`\n📊 批量图片分析完成: ${successCount}/${imageUrls.length} 成功`);

    return prompts;
  }

  /**
   * 使用 Gemini 2.5 Flash Image 生成图片
   * 输入：提示词 + 参考图片URL
   * 输出：生成的图片URL
   */
  async generateImage(
    prompt: string,
    referenceImageUrl: string,
    options: {
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const { maxRetries = 3 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`图片生成重试 ${attempt}/${maxRetries}，等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        console.log(`🎨 使用 Gemini 2.5 Flash Image 生成图片...`);
        console.log(`📝 提示词: ${prompt.slice(0, 100)}...`);
        console.log(`🖼️ 参考图片: ${referenceImageUrl.slice(0, 80)}...`);

        // 使用 OpenRouter 调用 Gemini 2.5 Flash Image
        const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.imageApiKey}`,
            "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
            "X-Title": "Content Factory",
          },
          body: JSON.stringify({
            model: this.config.imageModel,
            messages: [
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: prompt,
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: referenceImageUrl,
                    },
                  },
                ],
              },
            ],
            temperature: 0.7,
            max_tokens: 2048,
          }),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Gemini Image API 错误: ${response.status} - ${error.slice(0, 100)}`);
        }

        const data = await response.json();
        
        // Gemini 2.5 Flash Image 可能返回图片URL或base64
        // 需要根据实际API响应格式解析
        const imageUrl = this.parseImageGenerationResponse(data);
        
        if (!imageUrl) {
          throw new Error("Gemini 返回的图片URL为空");
        }

        console.log(`✅ 图片生成成功: ${imageUrl.slice(0, 80)}...`);
        return imageUrl;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ 图片生成失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("图片生成失败");
  }

  /**
   * 解析图片生成响应
   */
  private parseImageGenerationResponse(data: any): string | null {
    // 尝试多种可能的响应格式
    if (data.choices?.[0]?.message?.content) {
      const content = data.choices[0].message.content;
      
      // 如果是URL
      if (content.startsWith("http://") || content.startsWith("https://")) {
        return content;
      }
      
      // 如果是base64，需要转换为URL（可能需要上传到存储服务）
      if (content.startsWith("data:image")) {
        // 这里可能需要将base64转换为URL
        // 暂时返回base64 data URL
        return content;
      }
      
      // 尝试从JSON中提取
      try {
        const parsed = JSON.parse(content);
        return parsed.imageUrl || parsed.url || null;
      } catch {
        // 不是JSON，可能是纯文本URL
        return content;
      }
    }
    
    // 尝试直接从响应中获取
    if (data.imageUrl) return data.imageUrl;
    if (data.url) return data.url;
    if (data.image) return data.image;
    
    return null;
  }

  /**
   * 批量生成图片
   */
  async generateImages(
    prompts: string[],
    referenceImageUrls: string[]
  ): Promise<string[]> {
    console.log(`🎨 开始批量生成 ${prompts.length} 张图片...`);

    if (prompts.length !== referenceImageUrls.length) {
      throw new Error("提示词和参考图片数量不匹配");
    }

    const generatedImages: string[] = [];

    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      const referenceImage = referenceImageUrls[i];
      
      console.log(`\n[图片 ${i + 1}/${prompts.length}] 开始生成...`);

      try {
        const imageUrl = await this.generateImage(prompt, referenceImage);
        generatedImages.push(imageUrl);
        console.log(`✅ [图片 ${i + 1}] 生成成功`);
      } catch (error) {
        console.error(`❌ [图片 ${i + 1}] 生成失败:`, error);
        generatedImages.push(""); // 添加空字符串，保持数组长度一致
      }

      // 在每张图片之间添加延迟，避免 API 过载
      if (i < prompts.length - 1) {
        await this.sleep(3000); // 图片生成可能需要更长时间
      }
    }

    const successCount = generatedImages.filter((url) => url.length > 0).length;
    console.log(`\n📊 批量图片生成完成: ${successCount}/${prompts.length} 成功`);

    return generatedImages;
  }

  /**
   * 检查配置是否可用
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * 检查图片生成配置是否可用
   */
  isImageGenerationConfigured(): boolean {
    return !!this.config.imageApiKey;
  }

  /**
   * 获取模型名称
   */
  getModelName(): string {
    return this.config.model;
  }

  /**
   * 获取图片生成模型名称
   */
  getImageModelName(): string {
    return this.config.imageModel;
  }
}

// 导出单例
export const geminiClient = new GeminiClient();
