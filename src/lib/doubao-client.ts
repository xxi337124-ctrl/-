import sharp from "sharp";

/**
 * 豆包 SeeDream 4.0 API 客户端封装
 * 用于小红书二创的图片生成
 */

interface DoubaoConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

interface DoubaoImageGenerationRequest {
  model: string;
  prompt: string;
  image?: string; // base64 encoded image for image-to-image
  n?: number;
  size?: string;
  response_format?: "url" | "b64_json";
  watermark?: boolean; // 是否添加水印
}

interface DoubaoImageGenerationResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
  }>;
}

class DoubaoClient {
  private config: DoubaoConfig;

  constructor() {
    this.config = {
      apiKey: process.env.DOUBAO_API_KEY || "",
      baseUrl: process.env.DOUBAO_API_BASE || "https://ark.cn-beijing.volces.com/api/v3",
      model: process.env.DOUBAO_MODEL || "doubao-seedream-4-0-250828",
    };

    console.log("🔧 豆包 SeeDream 配置:");
    console.log(`  - Base URL: ${this.config.baseUrl}`);
    console.log(`  - Model: ${this.config.model}`);
    console.log(`  - API Key: ${this.config.apiKey ? '已配置' : '未配置'}`);

    if (!this.config.apiKey) {
      console.warn("⚠️ DOUBAO_API_KEY 未配置，豆包图片生成功能将无法使用");
    }
  }

  /**
   * 延迟函数
   */
  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 图片生成（图生图）- 使用豆包 SeeDream 4.0
   */
  async generateImage(
    prompt: string,
    referenceImageUrl: string,
    options: {
      maxRetries?: number;
      size?: string;
      n?: number;
    } = {}
  ): Promise<string> {
    const { maxRetries = 3, size = "1024x1024", n = 1 } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 1) {
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`豆包图片生成重试 ${attempt}/${maxRetries}，等待 ${waitTime}ms...`);
          await this.sleep(waitTime);
        }

        console.log(`🎨 使用豆包 SeeDream 4.0 生成图片（图生图模式）...`);
        console.log(`📝 提示词: ${prompt.slice(0, 100)}...`);
        console.log(`🖼️ 参考图片: ${referenceImageUrl.slice(0, 80)}...`);

        // 下载并转换参考图片为 JPEG 格式的 base64
        const base64Image = await this.imageUrlToBase64(referenceImageUrl);

        const requestBody: DoubaoImageGenerationRequest = {
          model: this.config.model,
          prompt: prompt,
          image: base64Image,
          n: n,
          size: size,
          response_format: "url",
          watermark: false, // 不添加水印
        };

        console.log(`📤 发送请求到豆包 API (尝试 ${attempt}/${maxRetries})...`);

        const response = await fetch(`${this.config.baseUrl}/images/generations`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.config.apiKey}`,
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`豆包 API 错误: ${response.status} - ${error.slice(0, 200)}`);
        }

        const data: DoubaoImageGenerationResponse = await response.json();

        // 添加详细的调试日志
        console.log(`📊 豆包 API 响应数据:`, JSON.stringify(data).slice(0, 500));

        if (!data.data || data.data.length === 0) {
          console.error('❌ 豆包 API 返回数据异常:', JSON.stringify(data).slice(0, 500));
          throw new Error("豆包 API 返回的数据为空");
        }

        if (!data.data[0]) {
          console.error('❌ data.data[0] 为 undefined:', JSON.stringify(data).slice(0, 500));
          throw new Error("豆包 API 返回数据格式错误: data.data[0] 不存在");
        }

        const imageUrl = data.data[0].url || data.data[0].b64_json;

        if (!imageUrl) {
          throw new Error("豆包 API 未返回图片URL或base64数据");
        }

        // 如果是base64，转换为data URL
        const finalUrl = imageUrl.startsWith("http")
          ? imageUrl
          : `data:image/png;base64,${imageUrl}`;

        console.log(`✅ 豆包图片生成成功: ${finalUrl.slice(0, 80)}...`);
        return finalUrl;
      } catch (error: any) {
        lastError = error;
        console.error(`❌ 豆包图片生成失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

        if (attempt === maxRetries) {
          throw lastError;
        }
      }
    }

    throw lastError || new Error("豆包图片生成失败");
  }

  /**
   * 批量生成图片
   */
  async generateImages(
    prompts: string[],
    referenceImageUrls: string[]
  ): Promise<string[]> {
    console.log(`🎨 开始使用豆包批量生成 ${prompts.length} 张图片...`);

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
        await this.sleep(3000);
      }
    }

    const successCount = generatedImages.filter((url) => url.length > 0).length;
    console.log(`\n📊 豆包批量图片生成完成: ${successCount}/${prompts.length} 成功`);

    return generatedImages;
  }

  /**
   * 将图片URL转换为JPEG格式的base64（支持任意输入格式）
   */
  private async imageUrlToBase64(imageUrl: string): Promise<string> {
    try {
      console.log(`\n========== 图片格式转换 ==========`);
      console.log(`📥 下载图片: ${imageUrl.slice(0, 100)}...`);

      // 下载图片
      const response = await fetch(imageUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.xiaohongshu.com/',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        },
      });

      console.log(`📡 下载状态: ${response.status}`);
      const contentType = response.headers.get('content-type') || 'unknown';
      console.log(`📋 原始格式: ${contentType}`);

      if (!response.ok) {
        throw new Error(`图片下载失败: ${response.status} ${response.statusText}`);
      }

      // 获取图片二进制数据
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      console.log(`📦 下载完成，大小: ${(buffer.length / 1024).toFixed(2)}KB`);

      // 使用 sharp 转换为 JPEG 格式
      console.log(`🔄 使用 Sharp 转换为 JPEG 格式...`);
      const jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 90 }) // 高质量 JPEG
        .toBuffer();

      console.log(`✅ 转换完成，JPEG 大小: ${(jpegBuffer.length / 1024).toFixed(2)}KB`);

      // 转换为 base64
      const base64 = jpegBuffer.toString("base64");

      // 按照豆包 API 要求的格式返回
      const dataUrl = `data:image/jpeg;base64,${base64}`;

      console.log(`✅ Base64 生成完成`);
      console.log(`==========================================\n`);

      return dataUrl;
    } catch (error: any) {
      console.error("❌ 图片转换失败:", error);
      console.error("❌ 错误详情:", error.message);
      throw new Error(`图片下载或转换失败: ${error.message}`);
    }
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
export const doubaoClient = new DoubaoClient();
