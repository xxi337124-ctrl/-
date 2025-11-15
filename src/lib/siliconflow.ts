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
}

// 导出单例
export const siliconFlowClient = new SiliconFlowClient();
