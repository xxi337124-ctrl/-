/**
 * 增强版图片生成系统测试脚本
 * 测试提示词修改、批量处理、小红书集成等功能
 */

import "dotenv/config";
import * as tsconfigPaths from "tsconfig-paths";

tsconfigPaths.register({
  baseUrl: ".",
  paths: {
    "@/*": ["src/*"],
  },
});

interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  details?: any;
}

class EnhancedImageGenerationTester {
  private results: TestResult[] = [];
  private baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  async runAllTests() {
    console.log("🚀 开始增强版图片生成系统测试...\n");

    const tests = [
      this.testPromptModifier,
      this.testSingleImageGeneration,
      this.testBatchImageGeneration,
      this.testXiaohongshuProcessing,
      this.testErrorHandling,
      this.testPerformance
    ];

    for (const test of tests) {
      try {
        console.log(`📋 运行测试: ${test.name}`);
        await test.call(this);
        console.log(`✅ ${test.name} 完成\n`);
      } catch (error) {
        console.error(`❌ ${test.name} 失败:`, error);
      }
    }

    this.generateTestReport();
  }

  /**
   * 测试提示词修改系统
   */
  private async testPromptModifier() {
    const startTime = Date.now();

    try {
      const { generateModifiedPrompt, generateUniqueModifications, getModificationStats } = await import("../src/lib/image-prompt-modifier");

      // 测试单个提示词生成
      const singleResult = generateModifiedPrompt("美食摄影");
      console.log("   📄 单个提示词生成:");
      console.log(`      修改项: ${singleResult.modifications.join(', ')}`);
      console.log(`      最终提示词长度: ${singleResult.finalPrompt.length} 字符`);

      // 测试批量生成
      const batchResults = generateUniqueModifications(5);
      console.log(`   📊 批量生成 ${batchResults.length} 个不同组合`);

      // 验证唯一性
      const combinations = batchResults.map(r => r.modifications.join('|'));
      const uniqueCombinations = new Set(combinations);
      console.log(`   🔍 唯一组合数: ${uniqueCombinations.size}/${combinations.length}`);

      // 统计信息
      const stats = getModificationStats(batchResults);
      console.log("   📈 修改项统计:");
      Object.entries(stats).forEach(([modification, count]) => {
        console.log(`      ${modification}: ${count} 次`);
      });

      const success = batchResults.length === 5 && uniqueCombinations.size === 5;

      this.results.push({
        testName: "提示词修改系统",
        success,
        duration: Date.now() - startTime,
        details: { generatedCount: batchResults.length, uniqueCount: uniqueCombinations.size }
      });

    } catch (error) {
      this.results.push({
        testName: "提示词修改系统",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '未知错误'
      });
    }
  }

  /**
   * 测试单张图片生成
   */
  private async testSingleImageGeneration() {
    const startTime = Date.now();

    try {
      // 测试增强版API
      const response = await fetch(`${this.baseUrl}/api/enhanced-image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: ["https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac"],
          usePromptModifications: true,
          waitForCompletion: true,
          timeoutPerImage: 30000,
          maxRetries: 2,
          imageSize: "1024x1024",
          enableFallback: true
        })
      });

      const data = await response.json();

      if (data.success && data.data.results.length > 0) {
        const result = data.data.results[0];
        console.log("   🖼️ 图片生成结果:");
        console.log(`      成功状态: ${result.success}`);
        console.log(`      修改项数: ${result.modifications.length}`);
        console.log(`      生成时间: ${result.generationTime}ms`);
        console.log(`      图片URL: ${result.generatedUrl?.slice(0, 50)}...`);

        this.results.push({
          testName: "单张图片生成",
          success: result.success,
          duration: Date.now() - startTime,
          details: {
            generatedUrl: result.generatedUrl,
            modificationCount: result.modifications.length,
            generationTime: result.generationTime
          }
        });
      } else {
        throw new Error(data.message || '图片生成失败');
      }

    } catch (error) {
      this.results.push({
        testName: "单张图片生成",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'API调用失败'
      });
    }
  }

  /**
   * 测试批量图片生成
   */
  private async testBatchImageGeneration() {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/enhanced-image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [
            "https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac",
            "https://images.unsplash.com/photo-1486427944299-aa1a5e0def7d",
            "https://images.unsplash.com/photo-1514432324607-a09d9b4aefaa"
          ],
          usePromptModifications: true,
          waitForCompletion: true,
          timeoutPerImage: 30000,
          maxRetries: 2,
          imageSize: "1024x1024",
          enableFallback: true
        })
      });

      const data = await response.json();

      if (data.success) {
        const { results, statistics } = data.data;
        console.log("   📊 批量生成统计:");
        console.log(`      总计图片: ${statistics.total}`);
        console.log(`      成功: ${statistics.success}`);
        console.log(`      失败: ${statistics.failed}`);
        console.log(`      总耗时: ${statistics.totalTime}ms`);
        console.log(`      平均耗时: ${statistics.averageTime}ms`);

        // 验证修改项多样性
        const allModifications = results.flatMap((r: any) => r.modifications);
        const uniqueModifications = new Set(allModifications);
        console.log(`   🎨 修改项多样性: ${uniqueModifications.size} 种不同修改`);

        this.results.push({
          testName: "批量图片生成",
          success: statistics.success > 0,
          duration: Date.now() - startTime,
          details: {
            totalImages: statistics.total,
            successCount: statistics.success,
            failureCount: statistics.failed,
            totalTime: statistics.totalTime,
            modificationDiversity: uniqueModifications.size
          }
        });
      } else {
        throw new Error(data.message || '批量生成失败');
      }

    } catch (error) {
      this.results.push({
        testName: "批量图片生成",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'API调用失败'
      });
    }
  }

  /**
   * 测试小红书处理
   */
  private async testXiaohongshuProcessing() {
    const startTime = Date.now();

    try {
      const response = await fetch(`${this.baseUrl}/api/xiaohongshu-enhanced`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          useMockData: true,
          generateVariations: true,
          variationCount: 2,
          useContentAnalysis: true,
          preserveStyle: true,
          targetPlatform: 'xiaohongshu'
        })
      });

      const data = await response.json();

      if (data.success) {
        const { results, statistics } = data.data;
        console.log("   📱 小红书处理结果:");
        console.log(`      处理帖子: ${statistics.totalPosts}`);
        console.log(`      原图数量: ${statistics.totalOriginalImages}`);
        console.log(`      生成变体: ${statistics.totalVariations}`);
        console.log(`      成功变体: ${statistics.successfulVariations}`);
        console.log(`      整体成功率: ${statistics.overallSuccessRate}%`);

        // 显示第一个帖子的详细结果
        if (results.length > 0) {
          const firstPost = results[0];
          console.log(`   📝 第一个帖子:"${firstPost.originalPost.title.slice(0, 30)}..."`);
          console.log(`      原图: ${firstPost.originalPost.images.length} 张`);
          console.log(`      生成图片集: ${firstPost.generatedImages.length} 组`);
          console.log(`      处理时间: ${firstPost.processingTime}ms`);

          if (firstPost.contentAnalysis) {
            console.log(`      内容分析: 主题=${firstPost.contentAnalysis.mainTheme}, 风格=${firstPost.contentAnalysis.style}`);
          }
        }

        this.results.push({
          testName: "小红书处理",
          success: statistics.overallSuccessRate > 0,
          duration: Date.now() - startTime,
          details: {
            totalPosts: statistics.totalPosts,
            totalOriginalImages: statistics.totalOriginalImages,
            totalVariations: statistics.totalVariations,
            successfulVariations: statistics.successfulVariations,
            overallSuccessRate: statistics.overallSuccessRate
          }
        });
      } else {
        throw new Error(data.message || '小红书处理失败');
      }

    } catch (error) {
      this.results.push({
        testName: "小红书处理",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'API调用失败'
      });
    }
  }

  /**
   * 测试错误处理
   */
  private async testErrorHandling() {
    const startTime = Date.now();

    try {
      // 测试无效输入
      const response = await fetch(`${this.baseUrl}/api/enhanced-image-generation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: [], // 空数组
          usePromptModifications: true
        })
      });

      const data = await response.json();

      if (!data.success && response.status === 400) {
        console.log("   ⚠️ 错误处理测试:");
        console.log(`      状态码: ${response.status}`);
        console.log(`      错误信息: ${data.error}`);

        this.results.push({
          testName: "错误处理",
          success: true,
          duration: Date.now() - startTime,
          details: {
            statusCode: response.status,
            errorMessage: data.error
          }
        });
      } else {
        throw new Error('错误处理未按预期工作');
      }

    } catch (error) {
      this.results.push({
        testName: "错误处理",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '测试失败'
      });
    }
  }

  /**
   * 性能测试
   */
  private async testPerformance() {
    const startTime = Date.now();

    try {
      console.log("   ⏱️ 性能基准测试:");

      // 测试提示词生成性能
      const { generateUniqueModifications } = await import("../src/lib/image-prompt-modifier");

      const iterationCount = 100;
      const promptStart = Date.now();

      for (let i = 0; i < iterationCount; i++) {
        generateUniqueModifications(10);
      }

      const promptDuration = Date.now() - promptStart;
      const avgPromptTime = promptDuration / iterationCount;

      console.log(`      提示词生成 ${iterationCount} 次: ${promptDuration}ms`);
      console.log(`      平均每次: ${avgPromptTime.toFixed(2)}ms`);

      // 测试API响应时间
      const apiStart = Date.now();
      const response = await fetch(`${this.baseUrl}/api/enhanced-image-generation`, {
        method: 'GET'
      });
      const apiInfoTime = Date.now() - apiStart;

      console.log(`      API信息响应时间: ${apiInfoTime}ms`);

      this.results.push({
        testName: "性能测试",
        success: true,
        duration: Date.now() - startTime,
        details: {
          promptGenerationTime: promptDuration,
          averagePromptTime: avgPromptTime,
          apiResponseTime: apiInfoTime,
          iterations: iterationCount
        }
      });

    } catch (error) {
      this.results.push({
        testName: "性能测试",
        success: false,
        duration: Date.now() - startTime,
        error: error instanceof Error ? error.message : '性能测试失败'
      });
    }
  }

  /**
   * 生成测试报告
   */
  private generateTestReport() {
    console.log("\n" + "=".repeat(50));
    console.log("📊 增强版图片生成系统测试报告");
    console.log("=".repeat(50));

    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`\n📈 总体统计:`);
    console.log(`   总测试数: ${totalTests}`);
    console.log(`   通过: ${passedTests}`);
    console.log(`   失败: ${failedTests}`);
    console.log(`   成功率: ${totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0}%`);
    console.log(`   总耗时: ${totalDuration}ms`);
    console.log(`   平均耗时: ${totalTests > 0 ? Math.round(totalDuration / totalTests) : 0}ms`);

    console.log(`\n📋 详细结果:`);
    this.results.forEach((result, index) => {
      const status = result.success ? '✅' : '❌';
      console.log(`   ${index + 1}. ${status} ${result.testName}`);
      console.log(`      耗时: ${result.duration}ms`);

      if (result.success && result.details) {
        console.log(`      详情: ${JSON.stringify(result.details)}`);
      } else if (!result.success && result.error) {
        console.log(`      错误: ${result.error}`);
      }
      console.log('');
    });

    // 功能验证总结
    console.log("🔍 功能验证总结:");
    console.log(`   ✨ 提示词修改系统: ${this.getTestResult('提示词修改系统')}`);
    console.log(`   🖼️ 单张图片生成: ${this.getTestResult('单张图片生成')}`);
    console.log(`   📊 批量图片生成: ${this.getTestResult('批量图片生成')}`);
    console.log(`   📱 小红书处理: ${this.getTestResult('小红书处理')}`);
    console.log(`   ⚠️ 错误处理: ${this.getTestResult('错误处理')}`);
    console.log(`   ⏱️ 性能表现: ${this.getTestResult('性能测试')}`);

    console.log("\n" + "=".repeat(50));

    // 最终状态
    if (passedTests === totalTests) {
      console.log("🎉 所有测试通过！系统运行正常。");
    } else {
      console.log(`⚠️  ${failedTests} 个测试失败，请检查相关问题。`);
    }
  }

  private getTestResult(testName: string): string {
    const result = this.results.find(r => r.testName === testName);
    if (!result) return '未测试';
    return result.success ? '通过' : '失败';
  }
}

// 运行测试
async function main() {
  console.log("🧪 增强版图片生成系统 - 综合测试");
  console.log("测试时间:", new Date().toLocaleString());
  console.log("API地址:", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  console.log("=" .repeat(60) + "\n");

  const tester = new EnhancedImageGenerationTester();
  await tester.runAllTests();
}

main().catch(console.error);