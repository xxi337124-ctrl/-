/**
 * 多引擎AI检测系统集成
 * 支持多个AI检测服务，提供统一的检测接口
 */

export interface AIDetectionResult {
  engine: string;
  aiScore: number; // 0-1，AI生成的可能性
  humanScore: number; // 0-1，人类写作的可能性
  confidence: number; // 0-1，检测结果的置信度
  details?: {
    [key: string]: any;
  };
  timestamp: string;
}

export interface AIDetectionEngine {
  name: string;
  displayName: string;
  description: string;
  detect(text: string): Promise<AIDetectionResult>;
  isAvailable(): boolean;
  getQuotaInfo(): Promise<QuotaInfo>;
}

export interface QuotaInfo {
  used: number;
  limit: number;
  remaining: number;
  resetTime?: string;
}

export interface MultiEngineResult {
  results: AIDetectionResult[];
  consensus: {
    averageAIScore: number;
    averageHumanScore: number;
    confidence: number;
    agreement: number; // 0-1，各引擎结果的一致性
  };
  recommendations: string[];
  bestEngine?: string;
}

// GPTZero检测引擎
export class GPTZeroEngine implements AIDetectionEngine {
  name = 'gptzero';
  displayName = 'GPTZero';
  description = '专门检测AI生成文本的流行工具';

  private apiKey: string;
  private baseURL = 'https://api.gptzero.me/v2/predict';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async detect(text: string): Promise<AIDetectionResult> {
    try {
      const response = await fetch(`${this.baseURL}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          document: text,
          version: '2024-01-01',
        }),
      });

      if (!response.ok) {
        throw new Error(`GPTZero API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        engine: this.name,
        aiScore: data.documents[0].predicted_class === 'AI' ? data.documents[0].confidence : 1 - data.documents[0].confidence,
        humanScore: data.documents[0].predicted_class === 'Human' ? data.documents[0].confidence : 1 - data.documents[0].confidence,
        confidence: data.documents[0].confidence,
        details: {
          predicted_class: data.documents[0].predicted_class,
          sentence_scores: data.documents[0].sentence_scores,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('GPTZero检测失败:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getQuotaInfo(): Promise<QuotaInfo> {
    // GPTZero的配额信息需要通过其他API获取
    return {
      used: 0,
      limit: 1000,
      remaining: 1000,
    };
  }
}

// CrossPlag检测引擎
export class CrossPlagEngine implements AIDetectionEngine {
  name = 'crossplag';
  displayName = 'CrossPlag';
  description = '基于机器学习的AI内容检测工具';

  private apiKey: string;
  private baseURL = 'https://api.crossplag.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async detect(text: string): Promise<AIDetectionResult> {
    try {
      const response = await fetch(`${this.baseURL}/ai-content-detection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          text,
          language: 'zh',
        }),
      });

      if (!response.ok) {
        throw new Error(`CrossPlag API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        engine: this.name,
        aiScore: data.ai_score / 100,
        humanScore: 1 - (data.ai_score / 100),
        confidence: data.confidence / 100,
        details: {
          ai_score: data.ai_score,
          confidence: data.confidence,
          language: data.language,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('CrossPlag检测失败:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getQuotaInfo(): Promise<QuotaInfo> {
    return {
      used: 0,
      limit: 500,
      remaining: 500,
    };
  }
}

// Sapling检测引擎
export class SaplingEngine implements AIDetectionEngine {
  name = 'sapling';
  displayName = 'Sapling AI Detector';
  description = '专业的AI内容检测服务';

  private apiKey: string;
  private baseURL = 'https://api.sapling.ai/api/v1/aidetect';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async detect(text: string): Promise<AIDetectionResult> {
    try {
      const response = await fetch(this.baseURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          key: this.apiKey,
          text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Sapling API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        engine: this.name,
        aiScore: data.score,
        humanScore: 1 - data.score,
        confidence: data.score,
        details: {
          score: data.score,
          sentence_scores: data.sentence_scores,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Sapling检测失败:', error);
      throw error;
    }
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async getQuotaInfo(): Promise<QuotaInfo> {
    return {
      used: 0,
      limit: 2000,
      remaining: 2000,
    };
  }
}

// 本地检测引擎（基于规则）
export class LocalRuleEngine implements AIDetectionEngine {
  name = 'local';
  displayName = '本地规则检测';
  description = '基于语言特征的本地AI检测算法';

  async detect(text: string): Promise<AIDetectionResult> {
    try {
      // 基于我们自然化写作的特征进行反向检测
      const features = this.analyzeFeatures(text);

      // 计算AI可能性（反向计算）
      const aiScore = this.calculateAIScore(features);

      return {
        engine: this.name,
        aiScore,
        humanScore: 1 - aiScore,
        confidence: 0.8,
        details: {
          features,
          aiScore,
          detectionMethod: 'rule-based',
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('本地检测失败:', error);
      throw error;
    }
  }

  private analyzeFeatures(text: string): any {
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim()).length;

    // AI特征检测
    const aiMarkers = {
      // 过度使用连接词
      transitionWords: (text.match(/(首先|其次|最后|综上所述|总而言之)/g) || []).length,
      // 抽象概念
      abstractConcepts: (text.match(/(维度|层面|视角|格局|生态)/g) || []).length,
      // 书面化表达
      formalExpressions: (text.match(/(彰显|凸显|赋能|助力|赋予)/g) || []).length,
      // 缺乏个人化
      personalReferences: (text.match(/(我|我的|自己)/g) || []).length,
      // 缺乏具体细节
      concreteDetails: (text.match(/(\d+|[年月日时分]|具体|实际)/g) || []).length,
      // 情感表达
      emotionalWords: (text.match(/(感觉|觉得|认为|希望)/g) || []).length,
      // 不确定性表达
      uncertaintyWords: (text.match(/(可能|大概|估计|也许)/g) || []).length,
    };

    // 句子长度一致性
    const sentenceLengths = text.split(/[。！？.!?]/).filter(s => s.trim()).map(s => s.trim().length);
    const avgLength = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const lengthVariance = sentenceLengths.reduce((acc, len) => acc + Math.pow(len - avgLength, 2), 0) / sentenceLengths.length;
    const lengthConsistency = Math.sqrt(lengthVariance) / avgLength;

    return {
      ...aiMarkers,
      sentenceCount: sentences,
      wordCount: words,
      avgSentenceLength: avgLength,
      lengthConsistency,
    };
  }

  private calculateAIScore(features: any): number {
    let score = 0.5; // 基础分

    // 过度结构化 +0.2
    if (features.transitionWords > features.sentenceCount * 0.1) score += 0.2;

    // 抽象概念过多 +0.15
    if (features.abstractConcepts > features.wordCount * 0.02) score += 0.15;

    // 书面化表达 +0.1
    if (features.formalExpressions > features.wordCount * 0.01) score += 0.1;

    // 缺乏个人化 +0.2
    if (features.personalReferences < features.wordCount * 0.01) score += 0.2;

    // 缺乏具体细节 +0.15
    if (features.concreteDetails < features.wordCount * 0.02) score += 0.15;

    // 缺乏情感表达 +0.1
    if (features.emotionalWords < features.wordCount * 0.005) score += 0.1;

    // 过度一致的句子长度 +0.1
    if (features.lengthConsistency < 0.3) score += 0.1;

    return Math.min(1, Math.max(0, score));
  }

  isAvailable(): boolean {
    return true; // 本地引擎总是可用
  }

  async getQuotaInfo(): Promise<QuotaInfo> {
    return {
      used: 0,
      limit: -1, // 无限制
      remaining: -1,
    };
  }
}

// 多引擎检测管理器
export class MultiEngineAIDetector {
  private engines: Map<string, AIDetectionEngine> = new Map();
  private resultsCache: Map<string, MultiEngineResult> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5分钟缓存

  constructor() {
    this.initializeEngines();
  }

  private initializeEngines() {
    // 添加本地规则引擎（默认启用）
    this.engines.set('local', new LocalRuleEngine());

    // 添加外部API引擎（需要配置API密钥）
    if (process.env.GPTZERO_API_KEY) {
      this.engines.set('gptzero', new GPTZeroEngine(process.env.GPTZERO_API_KEY));
    }

    if (process.env.CROSSPLAG_API_KEY) {
      this.engines.set('crossplag', new CrossPlagEngine(process.env.CROSSPLAG_API_KEY));
    }

    if (process.env.SAPLING_API_KEY) {
      this.engines.set('sapling', new SaplingEngine(process.env.SAPLING_API_KEY));
    }
  }

  /**
   * 执行多引擎AI检测
   */
  async detect(text: string, options: {
    engines?: string[];
    useCache?: boolean;
    timeout?: number;
  } = {}): Promise<MultiEngineResult> {
    const { engines = Array.from(this.engines.keys()), useCache = true, timeout = 30000 } = options;

    // 检查缓存
    const cacheKey = this.generateCacheKey(text, engines);
    if (useCache && this.resultsCache.has(cacheKey)) {
      const cached = this.resultsCache.get(cacheKey)!;
      if (Date.now() - new Date(cached.results[0]?.timestamp).getTime() < this.cacheTimeout) {
        return cached;
      }
    }

    // 执行检测
    const results = await this.runDetection(text, engines, timeout);

    // 计算共识结果
    const consensus = this.calculateConsensus(results);

    // 生成建议
    const recommendations = this.generateRecommendations(results, consensus);

    // 找出最佳引擎
    const bestEngine = this.findBestEngine(results);

    const multiResult: MultiEngineResult = {
      results,
      consensus,
      recommendations,
      bestEngine: bestEngine?.engine,
    };

    // 缓存结果
    if (useCache) {
      this.resultsCache.set(cacheKey, multiResult);
    }

    return multiResult;
  }

  private async runDetection(text: string, engineNames: string[], timeout: number): Promise<AIDetectionResult[]> {
    const promises = engineNames.map(async (engineName) => {
      const engine = this.engines.get(engineName);
      if (!engine || !engine.isAvailable()) {
        return null;
      }

      try {
        // 设置超时
        const result = await Promise.race([
          engine.detect(text),
          new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error(`Engine ${engineName} timeout`)), timeout / engineNames.length)
          )
        ]);

        return result;
      } catch (error) {
        console.error(`Engine ${engineName} detection failed:`, error);
        return {
          engine: engineName,
          aiScore: 0,
          humanScore: 0,
          confidence: 0,
          details: { error: error instanceof Error ? error.message : 'Unknown error' },
          timestamp: new Date().toISOString(),
        };
      }
    });

    const results = await Promise.all(promises);
    return results.filter((result): result is AIDetectionResult => result !== null);
  }

  private calculateConsensus(results: AIDetectionResult[]): MultiEngineResult['consensus'] {
    if (results.length === 0) {
      return {
        averageAIScore: 0,
        averageHumanScore: 0,
        confidence: 0,
        agreement: 0,
      };
    }

    const validResults = results.filter(r => r.confidence > 0);

    const averageAIScore = validResults.reduce((sum, r) => sum + r.aiScore, 0) / validResults.length;
    const averageHumanScore = validResults.reduce((sum, r) => sum + r.humanScore, 0) / validResults.length;

    // 计算一致性（标准差的反向）
    const aiScores = validResults.map(r => r.aiScore);
    const avgAI = averageAIScore;
    const variance = aiScores.reduce((sum, score) => sum + Math.pow(score - avgAI, 2), 0) / aiScores.length;
    const agreement = Math.max(0, 1 - Math.sqrt(variance) * 2); // 标准化到0-1

    // 计算整体置信度
    const avgConfidence = validResults.reduce((sum, r) => sum + r.confidence, 0) / validResults.length;

    return {
      averageAIScore: Number(averageAIScore.toFixed(3)),
      averageHumanScore: Number(averageHumanScore.toFixed(3)),
      confidence: Number(avgConfidence.toFixed(3)),
      agreement: Number(agreement.toFixed(3)),
    };
  }

  private generateRecommendations(results: AIDetectionResult[], consensus: MultiEngineResult['consensus']): string[] {
    const recommendations = [];

    // 基于共识结果生成建议
    if (consensus.averageAIScore > 0.7) {
      recommendations.push('内容AI特征明显，建议增加更多个人化表达和具体细节');
    } else if (consensus.averageAIScore < 0.3) {
      recommendations.push('内容自然度很好，保持当前的写作风格');
    } else {
      recommendations.push('内容有一定AI特征，可以适当调整表达方式');
    }

    // 基于一致性生成建议
    if (consensus.agreement < 0.5) {
      recommendations.push('各检测引擎结果差异较大，建议人工复核');
    }

    // 基于置信度生成建议
    if (consensus.confidence < 0.6) {
      recommendations.push('检测置信度较低，结果仅供参考');
    }

    // 基于具体引擎结果生成针对性建议
    const localResult = results.find(r => r.engine === 'local');
    if (localResult && localResult.details?.features) {
      const features = localResult.details.features;

      if (features.transitionWords > features.sentenceCount * 0.1) {
        recommendations.push('减少使用"首先"、"其次"、"最后"等机械化连接词');
      }

      if (features.abstractConcepts > features.wordCount * 0.02) {
        recommendations.push('减少抽象概念的使用，多用具体例子');
      }

      if (features.personalReferences < features.wordCount * 0.01) {
        recommendations.push('增加个人化表达，如"我觉得"、"我发现"等');
      }
    }

    return recommendations;
  }

  private findBestEngine(results: AIDetectionResult[]): AIDetectionResult | null {
    if (results.length === 0) return null;

    // 选择置信度最高的引擎
    return results.reduce((best, current) =>
      current.confidence > best.confidence ? current : best
    );
  }

  private generateCacheKey(text: string, engines: string[]): string {
    const crypto = require('crypto');
    const textHash = crypto.createHash('md5').update(text).digest('hex');
    const enginesHash = crypto.createHash('md5').update(engines.sort().join(',')).digest('hex');
    return `${textHash}-${enginesHash}`;
  }

  /**
   * 获取可用的检测引擎
   */
  getAvailableEngines(): AIDetectionEngine[] {
    return Array.from(this.engines.values()).filter(engine => engine.isAvailable());
  }

  /**
   * 获取引擎信息
   */
  getEngineInfo(engineName: string): AIDetectionEngine | undefined {
    return this.engines.get(engineName);
  }

  /**
   * 添加自定义引擎
   */
  addEngine(engine: AIDetectionEngine): void {
    this.engines.set(engine.name, engine);
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.resultsCache.clear();
  }
}

// 创建全局实例
export const aiDetector = new MultiEngineAIDetector();

// 便捷函数
export async function detectAIContent(text: string, options?: {
  engines?: string[];
  useCache?: boolean;
}): Promise<MultiEngineResult> {
  return aiDetector.detect(text, options);
}

export function getAvailableDetectionEngines(): AIDetectionEngine[] {
  return aiDetector.getAvailableEngines();
}

export function formatDetectionResult(result: MultiEngineResult): string {
  const { consensus, recommendations } = result;

  return `
AI检测综合分析结果：

综合评分：
- AI可能性：${(consensus.averageAIScore * 100).toFixed(1)}%
- 人类可能性：${(consensus.averageHumanScore * 100).toFixed(1)}%
- 检测置信度：${(consensus.confidence * 100).toFixed(1)}%
- 引擎一致性：${(consensus.agreement * 100).toFixed(1)}%

改进建议：
${recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n')}
  `.trim();
}