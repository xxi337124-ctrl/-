/**
 * 提示词配置管理
 * 允许用户选择不同的提示词版本和风格
 */

import { enhancedPrompts } from './enhanced-prompts';
import { articlePrompts } from './prompts';
import { naturalArticlePrompts } from './natural-prompts';

export interface PromptConfig {
  id: string;
  name: string;
  description: string;
  version: string;
  category: 'article' | 'insight' | 'image';
  style: 'natural' | 'professional' | 'casual' | 'storytelling';
  prompts: any;
  isActive: boolean;
  performance?: {
    avgQualityScore: number;
    aiDetectionRate: number;
    userSatisfaction: number;
    usageCount: number;
  };
}

// 所有可用的提示词配置
export const promptConfigs: PromptConfig[] = [
  // 基础版本
  {
    id: 'v1_original',
    name: '原始版本',
    description: '项目最初的提示词版本，规则详细但复杂',
    version: 'v1.0',
    category: 'article',
    style: 'professional',
    prompts: articlePrompts,
    isActive: false,
  },

  // 自然化版本
  {
    id: 'v2_natural',
    name: '自然化版本',
    description: '周行优化的自然化提示词，去AI化效果好',
    version: 'v2.0',
    category: 'article',
    style: 'natural',
    prompts: naturalArticlePrompts,
    isActive: false,
  },

  // 新版本 - 简洁高效
  {
    id: 'v3_enhanced',
    name: '增强版本',
    description: '最新优化的简洁高效提示词，平衡自然度和效果',
    version: 'v3.0',
    category: 'article',
    style: 'natural',
    prompts: enhancedPrompts,
    isActive: true, // 默认启用新版本
  },
];

// 获取当前激活的提示词配置
export function getActivePromptConfig(): PromptConfig {
  const activeConfig = promptConfigs.find(config => config.isActive);
  return activeConfig || promptConfigs[promptConfigs.length - 1]; // 默认返回最新版本
}

// 根据ID获取提示词配置
export function getPromptConfigById(id: string): PromptConfig | undefined {
  return promptConfigs.find(config => config.id === id);
}

// 获取指定类别的提示词配置
export function getPromptConfigsByCategory(category: 'article' | 'insight' | 'image'): PromptConfig[] {
  return promptConfigs.filter(config => config.category === category);
}

// 激活指定的提示词配置
export async function activatePromptConfig(id: string): Promise<void> {
  // 先禁用所有配置
  promptConfigs.forEach(config => {
    config.isActive = false;
  });

  // 激活指定的配置
  const targetConfig = promptConfigs.find(config => config.id === id);
  if (targetConfig) {
    targetConfig.isActive = true;

    // 这里可以添加数据库更新逻辑
    console.log(`已激活提示词配置: ${targetConfig.name} (${targetConfig.version})`);
  } else {
    throw new Error(`未找到ID为 ${id} 的提示词配置`);
  }
}

// 获取提示词使用建议
export function getPromptRecommendation(
  platform: string,
  style: string,
  userPreference?: string
): PromptConfig {
  // 根据平台、风格和用户偏好推荐最佳配置

  if (userPreference) {
    const preferredConfig = promptConfigs.find(config =>
      config.id === userPreference || config.style === userPreference
    );
    if (preferredConfig) return preferredConfig;
  }

  // 平台适配推荐
  if (platform === 'xiaohongshu') {
    // 小红书推荐自然化版本
    return promptConfigs.find(config =>
      config.style === 'natural' && config.category === 'article'
    ) || getActivePromptConfig();
  }

  if (platform === 'wechat') {
    // 公众号推荐专业版本
    return promptConfigs.find(config =>
      config.category === 'article' && (config.style === 'professional' || config.style === 'natural')
    ) || getActivePromptConfig();
  }

  // 默认返回激活的配置
  return getActivePromptConfig();
}

// A/B测试支持
export function getABTestPromptConfigs(): PromptConfig[] {
  // 返回适合A/B测试的配置组合
  return [
    promptConfigs.find(config => config.id === 'v2_natural')!,
    promptConfigs.find(config => config.id === 'v3_enhanced')!,
  ];
}

// 性能对比分析
export function comparePromptPerformance(configs: PromptConfig[]): any {
  // 对比不同提示词配置的性能指标
  return configs.map(config => ({
    id: config.id,
    name: config.name,
    avgQualityScore: config.performance?.avgQualityScore || 0,
    aiDetectionRate: config.performance?.aiDetectionRate || 0,
    userSatisfaction: config.performance?.userSatisfaction || 0,
    usageCount: config.performance?.usageCount || 0,
  }));
}

// 导出当前激活的提示词
export function getCurrentPrompts() {
  const activeConfig = getActivePromptConfig();
  return activeConfig.prompts;
}

// 提示词版本管理
export class PromptVersionManager {
  private static instance: PromptVersionManager;
  private currentConfig: PromptConfig;

  private constructor() {
    this.currentConfig = getActivePromptConfig();
  }

  public static getInstance(): PromptVersionManager {
    if (!PromptVersionManager.instance) {
      PromptVersionManager.instance = new PromptVersionManager();
    }
    return PromptVersionManager.instance;
  }

  public getCurrentPrompts() {
    return this.currentConfig.prompts;
  }

  public switchConfig(configId: string): void {
    const newConfig = getPromptConfigById(configId);
    if (newConfig) {
      this.currentConfig = newConfig;
      activatePromptConfig(configId);
    }
  }

  public getConfigInfo() {
    return {
      id: this.currentConfig.id,
      name: this.currentConfig.name,
      version: this.currentConfig.version,
      description: this.currentConfig.description,
    };
  }
}