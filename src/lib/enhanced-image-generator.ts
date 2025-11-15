/**
 * 增强版图片生成服务
 * 集成提示词修改系统和批量处理
 */

import { siliconFlowClient } from './siliconflow';
import {
  generateBatchModifiedPrompts,
  generateUniqueModifications,
  ModificationResult,
  getModificationStats
} from './image-prompt-modifier';
import { downloadImageAsBase64 } from './image-utils';

export interface EnhancedImageGenerationOptions {
  usePromptModifications?: boolean;
  waitForCompletion?: boolean;
  timeoutPerImage?: number;
  maxRetries?: number;
  imageSize?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
  enableFallback?: boolean;
  progressCallback?: (progress: GenerationProgress) => void;
}

export interface GenerationProgress {
  total: number;
  completed: number;
  failed: number;
  currentImage: number;
  status: 'downloading' | 'generating' | 'completed' | 'failed';
  message: string;
}

export interface ImageGenerationResult {
  originalUrl: string;
  generatedUrl: string;
  prompt: string;
  modifications: string[];
  success: boolean;
  error?: string;
  generationTime?: number;
}

export interface BatchGenerationResult {
  results: ImageGenerationResult[];
  totalTime: number;
  successCount: number;
  failureCount: number;
  modificationStats: Record<string, number>;
}

/**
 * 增强版图片生成器
 */
export class EnhancedImageGenerator {
  private client = siliconFlowClient;

  /**
   * 单张图片生成（带提示词修改）
   */
  async generateEnhancedImage(
    originalImageUrl: string,
    basePrompt?: string,
    options: EnhancedImageGenerationOptions = {}
  ): Promise<ImageGenerationResult> {
    const {
      usePromptModifications = true,
      waitForCompletion = true,
      timeoutPerImage = 60000,
      maxRetries = 3,
      imageSize = "1024x1024",
      progressCallback
    } = options;

    const startTime = Date.now();

    try {
      progressCallback?.({
        total: 1,
        completed: 0,
        failed: 0,
        currentImage: 1,
        status: 'downloading',
        message: '正在下载原图...'
      });

      // 下载原图
      const base64Image = await downloadImageAsBase64(originalImageUrl);

      progressCallback?.({
        total: 1,
        completed: 0,
        failed: 0,
        currentImage: 1,
        status: 'generating',
        message: '正在生成修改版图片...'
      });

      let finalPrompt = basePrompt || "";
      let modifications: string[] = [];

      // 如果使用提示词修改
      if (usePromptModifications) {
        const modificationResult = generateUniqueModifications(1)[0];
        finalPrompt = modificationResult.finalPrompt;
        modifications = modificationResult.modifications;
      }

      // 生成图片
      let generatedUrl: string;

      if (waitForCompletion) {
        // 等待完成的模式
        generatedUrl = await this.waitForImageGeneration(
          base64Image,
          finalPrompt,
          {
            timeout: timeoutPerImage,
            maxRetries,
            imageSize
          }
        );
      } else {
        // 直接调用模式
        generatedUrl = await this.client.imageToImage(originalImageUrl, finalPrompt, {
          imageSize,
          maxRetries
        });
      }

      const generationTime = Date.now() - startTime;

      progressCallback?.({
        total: 1,
        completed: 1,
        failed: 0,
        currentImage: 1,
        status: 'completed',
        message: '图片生成完成！'
      });

      return {
        originalUrl: originalImageUrl,
        generatedUrl,
        prompt: finalPrompt,
        modifications,
        success: true,
        generationTime
      };

    } catch (error) {
      const generationTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : '未知错误';

      progressCallback?.({
        total: 1,
        completed: 0,
        failed: 1,
        currentImage: 1,
        status: 'failed',
        message: `生成失败: ${errorMessage}`
      });

      return {
        originalUrl: originalImageUrl,
        generatedUrl: '',
        prompt: basePrompt || '',
        modifications: [],
        success: false,
        error: errorMessage,
        generationTime
      };
    }
  }

  /**
   * 批量图片生成（小红书多图处理）
   */
  async generateEnhancedBatchImages(
    imageUrls: string[],
    basePrompts?: string[],
    options: EnhancedImageGenerationOptions = {}
  ): Promise<BatchGenerationResult> {
    const {
      usePromptModifications = true,
      waitForCompletion = true,
      timeoutPerImage = 60000,
      maxRetries = 3,
      imageSize = "1024x1024",
      enableFallback = true,
      progressCallback
    } = options;

    const startTime = Date.now();
    const results: ImageGenerationResult[] = [];

    console.log(`🎨 开始批量生成 ${imageUrls.length} 张图片...`);

    // 生成修改提示词
    const modificationResults = usePromptModifications
      ? generateUniqueModifications(imageUrls.length)
      : Array(imageUrls.length).fill(null).map(() => ({
          modifications: [],
          finalPrompt: basePrompts?.[0] || ""
        }));

    // 逐张处理，确保顺序和稳定性
    for (let i = 0; i < imageUrls.length; i++) {
      const imageUrl = imageUrls[i];
      const basePrompt = basePrompts?.[i];
      const modificationResult = modificationResults[i];

      try {
        progressCallback?.({
          total: imageUrls.length,
          completed: i,
          failed: results.filter(r => !r.success).length,
          currentImage: i + 1,
          status: 'generating',
          message: `正在处理第 ${i + 1}/${imageUrls.length} 张图片...`
        });

        const result = await this.generateEnhancedImage(
          imageUrl,
          modificationResult.finalPrompt,
          {
            usePromptModifications: false, // 已经处理过提示词
            waitForCompletion,
            timeoutPerImage,
            maxRetries,
            imageSize,
            progressCallback: (progress) => {
              // 转换进度信息
              progressCallback?.({
                total: imageUrls.length,
                completed: i,
                failed: results.filter(r => !r.success).length,
                currentImage: i + 1,
                status: progress.status,
                message: `第 ${i + 1} 张: ${progress.message}`
              });
            }
          }
        );

        // 添加修改信息
        result.modifications = modificationResult.modifications;
        result.prompt = modificationResult.finalPrompt;

        results.push(result);

        console.log(`✅ 第 ${i + 1} 张图片处理完成`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '未知错误';

        console.error(`❌ 第 ${i + 1} 张图片处理失败: ${errorMessage}`);

        // 失败处理
        results.push({
          originalUrl: imageUrl,
          generatedUrl: '',
          prompt: modificationResult.finalPrompt,
          modifications: modificationResult.modifications,
          success: false,
          error: errorMessage
        });

        if (enableFallback) {
          console.log(`🔄 尝试降级策略...`);
          // 这里可以添加降级逻辑，比如使用占位图或其他图库
        }
      }

      // 在图片之间添加小延迟，避免API过载
      if (i < imageUrls.length - 1) {
        await this.sleep(2000);
      }
    }

    const totalTime = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const modificationStats = getModificationStats(results);

    progressCallback?.({
      total: imageUrls.length,
      completed: successCount,
      failed: failureCount,
      currentImage: imageUrls.length,
      status: 'completed',
      message: `批量生成完成！成功: ${successCount}, 失败: ${failureCount}`
    });

    console.log(`📊 批量生成完成 - 总计: ${imageUrls.length}, 成功: ${successCount}, 失败: ${failureCount}, 耗时: ${totalTime}ms`);

    return {
      results,
      totalTime,
      successCount,
      failureCount,
      modificationStats
    };
  }

  /**
   * 等待图片生成完成（轮询机制）
   */
  private async waitForImageGeneration(
    base64Image: string,
    prompt: string,
    options: {
      timeout: number;
      maxRetries: number;
      imageSize?: "1024x1024" | "512x512" | "1024x576" | "576x1024";
    }
  ): Promise<string> {
    const { timeout, maxRetries, imageSize = "1024x1024" } = options;
    const startTime = Date.now();
    const checkInterval = 5000; // 5秒检查一次

    console.log(`⏳ 开始等待图片生成，超时时间: ${timeout}ms`);

    while (Date.now() - startTime < timeout) {
      try {
        // 这里应该调用实际的图片生成API
        // 为了演示，使用现有的imageToImage方法
        const result = await this.client.imageToImage(
          `data:image/jpeg;base64,${base64Image}`,
          prompt,
          { imageSize, maxRetries: 1 }
        );

        if (result) {
          console.log(`✅ 图片生成成功！`);
          return result;
        }
      } catch (error) {
        console.log(`🔄 生成中... (${Math.floor((Date.now() - startTime) / 1000)}s)`);
      }

      // 等待一段时间后重试
      await this.sleep(checkInterval);
    }

    throw new Error(`图片生成超时 (${timeout}ms)`);
  }

  /**
   * 延迟函数
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 获取生成结果报告
   */
  generateReport(result: BatchGenerationResult): string {
    const { results, totalTime, successCount, failureCount, modificationStats } = result;

    let report = `📊 图片生成报告\n`;
    report += `===================\n`;
    report += `总计处理: ${results.length} 张图片\n`;
    report += `成功: ${successCount} 张\n`;
    report += `失败: ${failureCount} 张\n`;
    report += `总耗时: ${totalTime}ms\n`;
    report += `平均耗时: ${Math.round(totalTime / results.length)}ms\n\n`;

    if (Object.keys(modificationStats).length > 0) {
      report += `修改统计:\n`;
      Object.entries(modificationStats).forEach(([modification, count]) => {
        report += `  - ${modification}: ${count} 次\n`;
      });
      report += '\n';
    }

    report += `详细结果:\n`;
    results.forEach((result, index) => {
      report += `  ${index + 1}. ${result.success ? '✅' : '❌'} ${result.originalUrl.slice(-20)}\n`;
      if (result.success) {
        report += `     生成URL: ${result.generatedUrl.slice(-20)}\n`;
        report += `     修改: ${result.modifications.join(', ')}\n`;
      } else {
        report += `     错误: ${result.error}\n`;
      }
    });

    return report;
  }
}

// 导出单例
export const enhancedImageGenerator = new EnhancedImageGenerator();