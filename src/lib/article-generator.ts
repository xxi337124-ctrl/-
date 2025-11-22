/**
 * 文章生成器
 * 集成新的自然化写作引擎和原有的提示词系统
 */

import { openaiClient } from './openai';
import {
  articlePrompts as oldPrompts,
  imagePrompts,
  getStyleGuide,
  getWordCount,
  getPlatformName
} from './prompts';
import {
  naturalArticlePrompts,
  UserWritingStyle
} from './natural-prompts';
import { detectAIContent } from './ai-detection-engines';
import { prisma } from './prisma';

export interface ArticleGenerationParams {
  insights: string[];
  keyword: string;
  length: string;
  style: string;
  platform?: string;
  userStyle?: UserWritingStyle;
  useNaturalEngine?: boolean;
  enableAIDetection?: boolean;
}

export interface GeneratedArticle {
  title: string;
  content: string;
  tags?: string[];
  aiDetectionScore?: number;
  generationTime?: number;
  tokenUsage?: number;
}

/**
 * 兼容模式的文章生成器
 * 支持新旧两种提示词系统
 */
export class ArticleGenerator {
  private generationStats = {
    totalGenerations: 0,
    avgDetectionScore: 0,
    avgGenerationTime: 0
  };

  /**
   * 生成文章主函数
   */
  async generateArticle(params: ArticleGenerationParams): Promise<GeneratedArticle> {
    const startTime = Date.now();

    try {
      // 1. 构建提示词
      const prompt = this.buildPrompt(params);

      // 2. 调用AI生成
      const generatedContent = await this.callAIAPI(prompt, params);

      // 3. 提取标题和内容
      const { title, content } = this.extractTitleAndContent(generatedContent);

      // 4. 生成标签
      const tags = this.generateTags(content, params.keyword);

      // 5. AI检测（可选）
      let aiDetectionScore;
      if (params.enableAIDetection) {
        const detectionResult = await detectAIContent(content);
        aiDetectionScore = detectionResult.consensus.averageHumanScore;
      }

      const generationTime = Date.now() - startTime;

      // 6. 更新统计
      this.updateStats(aiDetectionScore, generationTime);

      return {
        title,
        content,
        tags,
        aiDetectionScore,
        generationTime,
        tokenUsage: this.estimateTokenUsage(prompt, content)
      };

    } catch (error) {
      console.error('文章生成失败:', error);
      throw new Error(`文章生成失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }

  /**
   * 构建提示词
   */
  private buildPrompt(params: ArticleGenerationParams): string {
    const { keyword, insights, length, style, platform, userStyle, useNaturalEngine = true } = params;
    const wordCount = getWordCount(length);
    const actualPlatform = platform || getPlatformName(style);

    // 根据配置选择提示词引擎
    if (useNaturalEngine) {
      // 使用新的自然化写作引擎
      return this.buildNaturalPrompt({
        keyword,
        insights,
        wordCount,
        platform: actualPlatform,
        style,
        userStyle
      });
    } else {
      // 使用传统提示词系统
      return this.buildTraditionalPrompt({
        keyword,
        insights,
        wordCount,
        style
      });
    }
  }

  /**
   * 构建自然化提示词
   */
  private buildNaturalPrompt(params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    platform: string;
    style: string;
    userStyle?: UserWritingStyle;
  }): string {
    const { keyword, insights, wordCount, platform, style, userStyle } = params;

    switch (style) {
      case 'xiaohongshu':
      case 'casual':
        return naturalArticlePrompts.generateXiaohongshuStyle({
          keyword,
          insights,
          wordCount,
          userStyle
        });

      case 'wechat':
      case 'professional':
        return naturalArticlePrompts.generateWechatStyle({
          keyword,
          insights,
          wordCount,
          userStyle
        });

      case 'storytelling':
      case 'story':
        return naturalArticlePrompts.generateStoryStyle({
          keyword,
          insights,
          wordCount,
          userStyle
        });

      default:
        return naturalArticlePrompts.generateNaturalArticle({
          keyword,
          insights,
          wordCount,
          platform,
          userStyle
        });
    }
  }

  /**
   * 构建传统提示词（兼容旧系统）
   */
  private buildTraditionalPrompt(params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    style: string;
  }): string {
    const { keyword, insights, wordCount, style } = params;
    const styleGuide = getStyleGuide(style);
    const platform = getPlatformName(style);

    // 调用原有的提示词函数
    switch (style) {
      case 'xiaohongshu':
      case 'casual':
        return oldPrompts.xiaohongshu({
          keyword,
          insights,
          wordCount
        });

      case 'wechat':
      case 'professional':
        return oldPrompts.wechat({
          keyword,
          insights,
          wordCount
        });

      case 'storytelling':
        return oldPrompts.storytelling({
          keyword,
          insights,
          wordCount
        });

      default:
        return oldPrompts.generateArticle({
          keyword,
          insights,
          wordCount,
          styleGuide,
          platform
        });
    }
  }

  /**
   * 调用AI API生成内容
   */
  private async callAIAPI(prompt: string, params: ArticleGenerationParams): Promise<string> {
    try {
      // 使用OpenRouter Client
      const response = await openaiClient.chat([
        {
          role: "system",
          content: "你是一个专业的内容创作者，请根据用户的要求创作高质量的文章。"
        },
        {
          role: "user",
          content: prompt
        }
      ], {
        temperature: 0.7,
        maxTokens: 4000
      });

      return response.content || '';

    } catch (error) {
      console.error('AI API调用失败:', error);
      throw new Error('AI服务调用失败，请稍后重试');
    }
  }

  /**
   * 提取标题和内容
   */
  private extractTitleAndContent(generatedContent: string): { title: string; content: string } {
    // 尝试从内容中提取标题（通常是第一行或第一段）
    const lines = generatedContent.split('\n').filter(line => line.trim());
    let title = '';
    let content = generatedContent;

    // 查找可能的标题行（通常较短且是首行）
    if (lines.length > 0) {
      const firstLine = lines[0].trim();
      if (firstLine.length < 100 && !firstLine.includes('。')) {
        title = firstLine.replace(/^#+\s*/, ''); // 移除Markdown标题符号
        content = lines.slice(1).join('\n').trim();
      }
    }

    // 如果没有找到合适的标题，生成一个基于内容的标题
    if (!title) {
      title = this.generateTitleFromContent(content);
    }

    return { title, content };
  }

  /**
   * 从内容生成标题
   */
  private generateTitleFromContent(content: string): string {
    // 提取前几个句子作为标题候选
    const sentences = content.split(/[。！？.!?]/).filter(s => s.trim().length > 10);

    if (sentences.length > 0) {
      // 使用第一个较长的句子，截取前50个字符
      const candidate = sentences[0].trim();
      return candidate.length > 50 ? candidate.substring(0, 47) + '...' : candidate;
    }

    return '无标题';
  }

  /**
   * 生成标签
   */
  private generateTags(content: string, keyword: string): string[] {
    const tags = [keyword];

    // 简单的关键词提取逻辑
    const words = content.split(/\s+/);
    const wordFreq: { [key: string]: number } = {};

    words.forEach(word => {
      // 清理标点符号
      const cleanWord = word.replace(/[，。！？；：""''（）【】《》]/g, '');
      if (cleanWord.length >= 2 && cleanWord.length <= 8) {
        wordFreq[cleanWord] = (wordFreq[cleanWord] || 0) + 1;
      }
    });

    // 选择频率较高但不是太常见的词作为标签
    const candidates = Object.entries(wordFreq)
      .filter(([word, freq]) => freq >= 2 && word !== keyword)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([word]) => word);

    return [...tags, ...candidates];
  }

  /**
   * 估算token使用量
   */
  private estimateTokenUsage(prompt: string, content: string): number {
    const totalChars = prompt.length + content.length;
    // 粗略估算：1个token约等于4个字符（中文可能更少）
    return Math.ceil(totalChars / 3);
  }

  /**
   * 更新统计信息
   */
  private updateStats(aiDetectionScore: number | undefined, generationTime: number): void {
    this.generationStats.totalGenerations++;

    if (aiDetectionScore !== undefined) {
      this.generationStats.avgDetectionScore =
        (this.generationStats.avgDetectionScore * (this.generationStats.totalGenerations - 1) + aiDetectionScore) /
        this.generationStats.totalGenerations;
    }

    this.generationStats.avgGenerationTime =
      (this.generationStats.avgGenerationTime * (this.generationStats.totalGenerations - 1) + generationTime) /
      this.generationStats.totalGenerations;
  }

  /**
   * 获取生成统计
   */
  getStats() {
    return { ...this.generationStats };
  }
}

// 创建全局实例
export const articleGenerator = new ArticleGenerator();

/**
 * 便捷函数：生成文章
 */
export async function generateArticleContent(params: ArticleGenerationParams): Promise<GeneratedArticle> {
  return articleGenerator.generateArticle(params);
}

/**
 * 便捷函数：获取用户写作风格
 * TODO: 需要在 Prisma schema 中定义 writingStyleDNA 模型后启用
 */
export async function getUserWritingStyle(userId: string): Promise<UserWritingStyle | null> {
  // try {
  //   const userStyle = await prisma.writingStyleDNA.findUnique({
  //     where: { userId },
  //     include: {
  //       personalExperiences: true
  //     }
  //   });
  //   if (!userStyle) return null;
  //   return {
  //     id: userStyle.id,
  //     name: userStyle.name,
  //     characteristics: userStyle.characteristics,
  //     personalExperiences: userStyle.personalExperiences,
  //     commonPhrases: userStyle.commonPhrases,
  //     createdAt: userStyle.createdAt,
  //     updatedAt: userStyle.updatedAt
  //   };
  // } catch (error) {
  //   console.error('获取用户写作风格失败:', error);
  //   return null;
  // }
  console.warn('getUserWritingStyle: writingStyleDNA model not defined in Prisma schema');
  return null;
}

/**
 * 便捷函数：保存用户写作风格
 * TODO: 需要在 Prisma schema 中定义 writingStyleDNA 模型后启用
 */
export async function saveUserWritingStyle(userId: string, style: Partial<UserWritingStyle>): Promise<UserWritingStyle> {
  // try {
  //   const result = await prisma.writingStyleDNA.upsert({
  //     where: { userId },
  //     update: {
  //       name: style.name,
  //       characteristics: style.characteristics,
  //       commonPhrases: style.commonPhrases,
  //       updatedAt: new Date()
  //     },
  //     create: {
  //       userId,
  //       name: style.name || '我的写作风格',
  //       characteristics: style.characteristics || {},
  //       commonPhrases: style.commonPhrases || [],
  //       description: '用户自定义写作风格'
  //     },
  //     include: {
  //       personalExperiences: true
  //     }
  //   });
  //   return {
  //     id: result.id,
  //     name: result.name,
  //     characteristics: result.characteristics,
  //     personalExperiences: result.personalExperiences,
  //     commonPhrases: result.commonPhrases,
  //     createdAt: result.createdAt,
  //     updatedAt: result.updatedAt
  //   };
  // } catch (error) {
  //   console.error('保存用户写作风格失败:', error);
  //   throw new Error('保存写作风格失败');
  // }
  console.warn('saveUserWritingStyle: writingStyleDNA model not defined in Prisma schema');
  throw new Error('写作风格功能暂未启用');
}

/**
 * 批量生成文章（用于A/B测试）
 */
export async function batchGenerateArticles(
  params: ArticleGenerationParams[],
  onProgress?: (progress: number) => void
): Promise<GeneratedArticle[]> {
  const results: GeneratedArticle[] = [];

  for (let i = 0; i < params.length; i++) {
    try {
      const article = await generateArticleContent(params[i]);
      results.push(article);

      if (onProgress) {
        onProgress((i + 1) / params.length);
      }
    } catch (error) {
      console.error(`批量生成失败 (第${i + 1}个):`, error);
      // 继续处理其他文章
      results.push({
        title: '生成失败',
        content: '文章生成失败，请检查提示词配置',
        tags: []
      });
    }
  }

  return results;
}

/**
 * 获取生成统计信息
 */
export function getGenerationStats() {
  return articleGenerator.getStats();
}

/**
 * 优化提示词建议
 */
export async function getPromptOptimizationSuggestions(
  currentPrompt: string,
  aiScore: number,
  targetScore: number
): Promise<string[]> {
  const suggestions = [];

  if (aiScore > targetScore) {
    if (aiScore > 0.7) {
      suggestions.push('增加个人化表达，如"我觉得"、"我发现"等');
      suggestions.push('加入更多具体的时间和地点描述');
      suggestions.push('表达真实的情绪和态度');
    } else if (aiScore > 0.5) {
      suggestions.push('适当增加不确定性表达，如"可能"、"大概"');
      suggestions.push('使用更自然的连接词');
    }
  }

  // 基于当前提示词内容的具体建议
  if (currentPrompt.includes('不是AI') || currentPrompt.includes('像人一样')) {
    suggestions.push('移除"不是AI"等自我声明，避免检测悖论');
  }

  if (currentPrompt.includes('首先') || currentPrompt.includes('其次')) {
    suggestions.push('减少机械化的连接词，使用更自然的过渡');
  }

  return suggestions;
}

/**
 * 分析提示词效果
 */
export async function analyzePromptEffectiveness(
  promptContent: string,
  generationResults: GeneratedArticle[]
): Promise<{
  avgDetectionScore: number;
  avgGenerationTime: number;
  totalUsage: number;
  effectiveness: number;
  suggestions: string[];
}> {
  const avgDetectionScore = generationResults.reduce((sum, result) =>
    sum + (result.aiDetectionScore || 0), 0) / generationResults.length;

  const avgGenerationTime = generationResults.reduce((sum, result) =>
    sum + (result.generationTime || 0), 0) / generationResults.length;

  const totalUsage = generationResults.length;

  // 效果评分 (0-100)
  const effectiveness = Math.round(
    (avgDetectionScore * 0.6 + (avgGenerationTime < 5000 ? 1 : 0.5) * 0.4) * 100
  );

  const suggestions = await getPromptOptimizationSuggestions(
    promptContent,
    avgDetectionScore,
    0.8 // 目标分数
  );

  return {
    avgDetectionScore,
    avgGenerationTime,
    totalUsage,
    effectiveness,
    suggestions
  };
}