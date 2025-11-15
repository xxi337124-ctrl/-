/**
 * 增强版图片生成系统配置
 */

export interface EnhancedImageConfig {
  // 提示词修改系统配置
  promptModification: {
    enabled: boolean;
    fixedTemplate: string;
    modificationOptions: string[];
    defaultVariationCount: number;
    ensureUniqueness: boolean;
  };

  // 批量处理配置
  batchProcessing: {
    enabled: boolean;
    maxConcurrent: number;
    delayBetweenBatches: number;
    enableDegradation: boolean;
    degradationStrategies: string[];
  };

  // 等待机制配置
  waitingMechanism: {
    enabled: boolean;
    checkInterval: number;
    maxWaitTime: number;
    timeoutPerImage: number;
    retryAttempts: number;
  };

  // 小红书特定配置
  xiaohongshu: {
    enabled: boolean;
    contentAnalysis: boolean;
    preserveOriginalStyle: boolean;
    platformOptimizations: {
      xiaohongshu: boolean;
      wechat: boolean;
      universal: boolean;
    };
    maxImagesPerPost: number;
  };

  // 性能优化配置
  performance: {
    enableCaching: boolean;
    cacheTimeout: number;
    enableCompression: boolean;
    maxImageSize: string;
    qualitySettings: {
      high: number;
      medium: number;
      low: number;
    };
  };

  // API配置
  api: {
    timeout: number;
    maxRequestSize: string;
    rateLimiting: {
      enabled: boolean;
      requestsPerMinute: number;
      burstSize: number;
    };
  };
}

/**
 * 默认配置
 */
export const defaultConfig: EnhancedImageConfig = {
  promptModification: {
    enabled: true,
    fixedTemplate: `[Main dish] as in reference photo, maintaining overall composition, apply THREE random modifications from this list:
1) remove/add one garnish type completely
2) change container color/style while keeping shape
3) add/remove a sauce drizzle pattern
4) place 2-3 new condiment elements (sesame seeds/scallions/chili flakes)
5) remove/add one side ingredient
6) change one topping to different type (cilantro to basil, peanuts to sesame)
7) add wooden chopsticks/spoon as prop
8) include small sauce dish on side, keep base dish structure and angle identical, visible changes required`,
    modificationOptions: [
      'removeAddGarnish',
      'changeContainerColor',
      'addRemoveSaucePattern',
      'addCondimentElements',
      'removeAddSideIngredient',
      'changeToppingType',
      'addWoodenProps',
      'includeSmallSauceDish'
    ],
    defaultVariationCount: 3,
    ensureUniqueness: true
  },

  batchProcessing: {
    enabled: true,
    maxConcurrent: 3,
    delayBetweenBatches: 2000,
    enableDegradation: true,
    degradationStrategies: [
      'UnsplashFallback',
      'PlaceholderImage',
      'OriginalImage'
    ]
  },

  waitingMechanism: {
    enabled: true,
    checkInterval: 5000,
    maxWaitTime: 120000,
    timeoutPerImage: 60000,
    retryAttempts: 3
  },

  xiaohongshu: {
    enabled: true,
    contentAnalysis: true,
    preserveOriginalStyle: true,
    platformOptimizations: {
      xiaohongshu: true,
      wechat: true,
      universal: true
    },
    maxImagesPerPost: 20
  },

  performance: {
    enableCaching: true,
    cacheTimeout: 3600000, // 1小时
    enableCompression: true,
    maxImageSize: "1024x1024",
    qualitySettings: {
      high: 0.9,
      medium: 0.7,
      low: 0.5
    }
  },

  api: {
    timeout: 120000,
    maxRequestSize: "10MB",
    rateLimiting: {
      enabled: true,
      requestsPerMinute: 60,
      burstSize: 10
    }
  }
};

/**
 * 环境特定的配置覆盖
 */
export function getConfig(): EnhancedImageConfig {
  const env = process.env.NODE_ENV || 'development';

  let envConfig: Partial<EnhancedImageConfig> = {};

  switch (env) {
    case 'production':
      envConfig = {
        performance: {
          ...defaultConfig.performance,
          enableCaching: true,
          cacheTimeout: 7200000, // 2小时
        },
        api: {
          ...defaultConfig.api,
          rateLimiting: {
            enabled: true,
            requestsPerMinute: 30,
            burstSize: 5
          }
        }
      };
      break;

    case 'development':
      envConfig = {
        performance: {
          ...defaultConfig.performance,
          enableCaching: false,
        },
        api: {
          ...defaultConfig.api,
          rateLimiting: {
            enabled: false,
            requestsPerMinute: 1000,
            burstSize: 100
          }
        }
      };
      break;

    case 'test':
      envConfig = {
        waitingMechanism: {
          ...defaultConfig.waitingMechanism,
          timeoutPerImage: 10000,
          maxWaitTime: 30000
        },
        performance: {
          ...defaultConfig.performance,
          enableCaching: false
        }
      };
      break;
  }

  return deepMerge(defaultConfig, envConfig);
}

/**
 * 深合并对象
 */
function deepMerge(target: any, source: any): any {
  const result = { ...target };

  for (const key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

/**
 * 配置验证
 */
export function validateConfig(config: EnhancedImageConfig): string[] {
  const errors: string[] = [];

  // 验证提示词修改配置
  if (config.promptModification.enabled) {
    if (!config.promptModification.fixedTemplate || config.promptModification.fixedTemplate.trim() === '') {
      errors.push('固定提示词模板不能为空');
    }

    if (config.promptModification.defaultVariationCount < 1 || config.promptModification.defaultVariationCount > 10) {
      errors.push('变体数量必须在1-10之间');
    }
  }

  // 验证批量处理配置
  if (config.batchProcessing.enabled) {
    if (config.batchProcessing.maxConcurrent < 1 || config.batchProcessing.maxConcurrent > 10) {
      errors.push('最大并发数必须在1-10之间');
    }

    if (config.batchProcessing.delayBetweenBatches < 0) {
      errors.push('批次间延迟不能为负数');
    }
  }

  // 验证等待机制配置
  if (config.waitingMechanism.enabled) {
    if (config.waitingMechanism.timeoutPerImage < 1000) {
      errors.push('图片超时时间必须大于1秒');
    }

    if (config.waitingMechanism.maxWaitTime < config.waitingMechanism.timeoutPerImage) {
      errors.push('最大等待时间必须大于单图超时时间');
    }
  }

  // 验证小红书配置
  if (config.xiaohongshu.enabled) {
    if (config.xiaohongshu.maxImagesPerPost < 1 || config.xiaohongshu.maxImagesPerPost > 50) {
      errors.push('每帖子最大图片数必须在1-50之间');
    }
  }

  // 验证API配置
  if (config.api.rateLimiting.enabled) {
    if (config.api.rateLimiting.requestsPerMinute < 1) {
      errors.push('每分钟请求数必须大于0');
    }

    if (config.api.rateLimiting.burstSize < 1) {
      errors.push('突发请求数必须大于0');
    }
  }

  return errors;
}