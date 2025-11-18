/**
 * SiliconFlow API 客户端封装
 * 用于调用可灵(Kolors)模型生成文章配图
 */

interface SiliconFlowConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface ImageGenerationRequest {
  model: string;
  prompt: string;
  image_size?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
  batch_size?: number;
  num_inference_steps?: number;
}

interface ImageGenerationResponse {
  images: Array<{
    url: string;
    seed: number;
  }>;
  timings: {
    inference: number;
  };
  seed: number;
}

class SiliconFlowClient {
  private config: SiliconFlowConfig;

  constructor() {
    this.config = {
      apiKey: process.env.SILICONFLOW_API_KEY || "",
      baseUrl: process.env.SILICONFLOW_API_BASE || "https://api.siliconflow.cn/v1",
      model: process.env.SILICONFLOW_MODEL || "Kwai-Kolors/Kolors",
    };

    if (!this.config.apiKey) {
      console.warn("⚠️ SILICONFLOW_API_KEY 未配置,图片生成功能将无法使用");
    }
  }

  /**
   * 延迟函数
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 生成单张图片
   */
  async generateImage(
    prompt: string,
    options: {
      imageSize?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
      maxRetries?: number;
      timeout?: number;
    } = {}
  ): Promise<string> {
    const {
      imageSize = "1024x576",
      maxRetries = 3,
      timeout = 30000, // 30秒超时
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        // 如果是重试,先等待
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`图片生成重试 ${attempt}/${maxRetries},等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        const response = await fetch(`${this.config.baseUrl}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify({
            model: this.config.model,
            prompt,
            image_size: imageSize,
            num_inference_steps: 20, // 生成质量参数
          } as ImageGenerationRequest),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.text();

          // 429 或 502 可以重试
          if (response.status === 429 || response.status === 502) {
            lastError = new Error(`SiliconFlow API 错误: ${response.status} - ${error}`);
            console.error(`尝试 ${attempt}/${maxRetries} 失败:`, lastError.message);
            continue;
          }

          throw new Error(`SiliconFlow API 错误: ${response.status} - ${error}`);
        }

        const data: ImageGenerationResponse = await response.json();

        if (!data.images || data.images.length === 0) {
          throw new Error("API 返回的图片列表为空");
        }

        console.log(`✅ 图片生成成功 (耗时: ${data.timings.inference}s)`);
        return data.images[0].url;
      } catch (error: any) {
        clearTimeout(timeoutId);

        if (error.name === "AbortError") {
          lastError = new Error("图片生成超时");
          if (attempt < maxRetries) continue;
          throw lastError;
        }

        if (!lastError) {
          throw error;
        }

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("图片生成失败");
  }

  /**
   * 并行生成多张图片
   */
  async generateMultipleImages(
    prompts: string[],
    options: {
      imageSize?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
    } = {}
  ): Promise<string[]> {
    console.log(`🎨 开始生成 ${prompts.length} 张图片...`);

    const results = await Promise.allSettled(
      prompts.map(prompt => this.generateImage(prompt, options))
    );

    const successfulImages = results
      .filter((r): r is PromiseFulfilledResult<string> => r.status === "fulfilled")
      .map(r => r.value);

    const failedCount = results.length - successfulImages.length;

    if (failedCount > 0) {
      console.warn(`⚠️ ${failedCount}/${prompts.length} 张图片生成失败`);
    } else {
      console.log(`✅ 所有图片生成成功 (${successfulImages.length}/${prompts.length})`);
    }

    return successfulImages;
  }

  /**
   * 检查配置是否可用
   */
  isConfigured(): boolean {
    return !!this.config.apiKey;
  }

  /**
   * 获取模型名称
   */
  getModelName(): string {
    return this.config.model;
  }

  /**
   * 图生图：直接上传原图到 apicore.ai /images/edits
   */
  async imageToImage(
    originalImageUrl: string,
    prompt: string,
    options: {
      strength?: number;
      imageSize?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
      maxRetries?: number;
    } = {}
  ): Promise<string> {
    const { imageSize = "1024x1024", maxRetries = 3 } = options;

    console.log(`\n🖼️ ===== 开始图生图 =====`);
    console.log(`原图URL: ${originalImageUrl}`);

    try {
      const { prisma } = await import("@/lib/prisma");
      const settings = await prisma.prompt_settings.findUnique({ where: { userId: "default" } });

      const imageModel = settings?.imageModel || "gpt-4o-image";
      const positivePrompt = settings?.imagePositivePrompt || prompt;
      const negativePrompt = settings?.imageNegativePrompt || "";
      const denoisingStrength = settings?.denoisingStrength ?? 0.35;
      const cfgScale = settings?.cfgScale ?? 7.5;
      const samplerName = settings?.samplerName || "DPM++ 2M Karras";
      const steps = settings?.steps ?? 25;
      const seed = settings?.seed ?? -1;

      console.log(`📝 图生图参数:`, {
        model: imageModel,
        originalImage: originalImageUrl.slice(0, 80),
        prompt: positivePrompt.slice(0, 100),
        negativePrompt: negativePrompt.slice(0, 80),
        size: imageSize,
        denoisingStrength,
        cfgScale,
        samplerName,
        steps,
        seed,
      });

      console.log(`📥 下载小红书原图...`);
      const imageBlob = await this.downloadImageWithHeaders(originalImageUrl);
      console.log(`✅ 图片下载成功: ${imageBlob.size} bytes`);

      const apicoreKey = process.env.APICORE_API_KEY || process.env.SILICONFLOW_API_KEY;
      if (!apicoreKey) {
        throw new Error("APICORE_API_KEY 未配置");
      }

      console.log(`🔑 API密钥: ${apicoreKey.slice(0, 10)}***`);

      const advancedParams = {
        negative_prompt: negativePrompt,
        denoising_strength: denoisingStrength,
        cfg_scale: cfgScale,
        sampler_name: samplerName,
        steps,
        seed,
      };

      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          if (attempt > 1) {
            const waitTime = Math.min(1000 * attempt, 4000);
            console.warn(`🔁 第 ${attempt} 次尝试, 等待 ${waitTime}ms...`);
            await this.sleep(waitTime);
          }

          console.log(`📤 发送到 apicore.ai/v1/images/edits (第 ${attempt}/${maxRetries} 次)...`);

          const formData = new FormData();
          formData.append("image", imageBlob, "source.jpg");
          formData.append("model", imageModel);
          formData.append("prompt", positivePrompt);
          formData.append("n", "1");
          formData.append("size", imageSize);
          formData.append("response_format", "url");
          formData.append("user", JSON.stringify(advancedParams));

          const response = await fetch("https://api.apicore.ai/v1/images/edits", {
            method: "POST",
            headers: { Authorization: `Bearer ${apicoreKey}` },
            body: formData,
          });

          console.log(`📡 API响应状态: ${response.status} ${response.statusText}`);

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`图生图API错误: ${response.status} - ${errorText}`);
          }

          const data = await response.json();
          console.log('🔍 API完整响应:', JSON.stringify(data, null, 2));

          if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
            throw new Error(`API返回格式不正确: ${JSON.stringify(data)}`);
          }

          const imageUrl = data.data[0].url;
          if (!imageUrl) {
            throw new Error("生成的图片URL为空");
          }

          console.log(`✅ 图生图成功: ${imageUrl.slice(0, 60)}...`);
          console.log('===== 图生图结束 =====\n');
          return imageUrl;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          lastError = err;
          console.error(`⚠ 图生图失败 (第 ${attempt}/${maxRetries} 次): ${err.message}`);
        }
      }

      throw lastError || new Error("图生图失败");
    } catch (error) {
      console.error(`\n⚠ ===== 图生图失败 =====`);
      console.error(error);
      console.error('===== 错误结束 =====\n');
      throw error;
    }
  }

  /**
   * 下载图片(带请求头,绕过防盗链)
   */
  private async downloadImageWithHeaders(url: string): Promise<Blob> {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Referer': 'https://www.xiaohongshu.com/',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      throw new Error(`下载原图失败: ${response.status}`);
    }

    return await response.blob();
  }

  /**
  /**
  /**
   * 批量图生图（并行处理 + 降级策略）
   */
  async batchImageToImage(
    images: Array<{ url: string; prompt: string }>,
    options: { strength?: number; imageSize?: string } = {}
  ): Promise<string[]> {
    console.log(`\n🎨 ===== 批量图生图开始 =====`);
    console.log(`总数: ${images.length}张`);
    console.log(`图片列表:`);
    images.forEach((img, i) => {
      console.log(`  ${i + 1}. ${img.url.slice(0, 80)}...`);
    });
    console.log(`===========================\n`);

    const results = await Promise.allSettled(
      images.map(({ url, prompt }, index) => {
        console.log(`\n[图片 ${index + 1}/${images.length}] 开始处理...`);
        return this.imageToImage(url, prompt, options as any);
      })
    );

    const newImages: string[] = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < results.length; i++) {
      const result = results[i];

      if (result.status === 'fulfilled') {
        newImages.push(result.value);
        successCount++;
        console.log(`✅ [图片 ${i + 1}] 成功`);
      } else {
        failCount++;
        console.error(`\n❌ [图片 ${i + 1}] 失败`);
        console.error(`失败原因:`, result.reason);
        console.warn(`⚠️ 第${i + 1}张图生图失败，尝试降级策略`);

        try {
          // 降级策略1: 使用Unsplash免费图库
          const fallbackImage = await this.fetchUnsplashImage(images[i].prompt);
          newImages.push(fallbackImage);
          console.log(`✅ 使用Unsplash图库替代`);
        } catch (unsplashError) {
          console.error(`Unsplash降级也失败:`, unsplashError);
          // 降级策略2: 使用占位图
          const placeholder = this.getPlaceholderImage();
          newImages.push(placeholder);
          console.log(`⚠️ 使用占位图`);
        }
      }
    }

    console.log(`\n📊 ===== 批量图生图完成 =====`);
    console.log(`成功: ${successCount}/${images.length}`);
    console.log(`失败: ${failCount}/${images.length}`);
    console.log(`===========================\n`);
    return newImages;
  }

  /**
   * Unsplash免费图库（降级方案）
   */
  private async fetchUnsplashImage(query: string): Promise<string> {
    const unsplashKey = process.env.UNSPLASH_ACCESS_KEY;

    if (!unsplashKey) {
      throw new Error('Unsplash API Key未配置');
    }

    // 提取关键词（去掉风格描述）
    const keywords = query.split(',')[0].trim();

    const response = await fetch(
      `https://api.unsplash.com/photos/random?query=${encodeURIComponent(keywords)}&client_id=${unsplashKey}`,
      { signal: AbortSignal.timeout(5000) }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API错误: ${response.status}`);
    }

    const data = await response.json();
    return data.urls.regular;
  }

  /**
   * 获取占位图（最终降级）
   */
  private getPlaceholderImage(): string {
    return 'https://placehold.co/1024x576/e2e8f0/64748b?text=Image+Generation+Failed';
  }
}

// 导出单例
export const siliconFlowClient = new SiliconFlowClient();
