/**
 * AI 提示词模板配置 v4.0 - 自然化写作引擎
 * 重构目标：解决AI率100%问题，实现真正的人类化写作
 * 核心理念：基于真实样本，而非规则约束
 */

// 用户写作风格DNA系统
export interface WritingStyleDNA {
  id: string;
  userId: string;
  name: string;
  characteristics: {
    sentenceLength: number; // 平均句长偏好
    paragraphStyle: 'short' | 'medium' | 'long' | 'mixed';
    emotionLevel: number; // 情感表达强度 1-10
    detailRichness: number; // 细节丰富度 1-10
    uncertaintyUsage: boolean; // 是否使用不确定性表达
    personalExperience: boolean; // 是否融入个人经历
    rhetoricalQuestions: boolean; // 是否使用反问句
    colloquialisms: string[]; // 个人口头禅
    thinkingPatterns: string[]; // 思维习惯表达
  };
  personalExperiences: PersonalExperience[];
  createdAt: Date;
  updatedAt: Date;
  usageStats: {
    totalUsage: number;
    avgAIScore: number;
    userRating: number;
  };
}

export interface PersonalExperience {
  id: string;
  category: 'work' | 'life' | 'study' | 'travel' | 'family' | 'hobby';
  time: string; // 具体时间
  location: string; // 具体地点
  event: string; // 事件描述
  emotion: string; // 当时感受
  lesson?: string; // 获得的感悟
  sensoryDetails: {
    visual?: string;
    auditory?: string;
    olfactory?: string;
    tactile?: string;
    taste?: string;
  };
}

// 自然化写作核心引擎
export class NaturalWritingEngine {
  private styleDNA: WritingStyleDNA;
  private experiencePool: PersonalExperience[];

  constructor(styleDNA: WritingStyleDNA) {
    this.styleDNA = styleDNA;
    this.experiencePool = styleDNA.personalExperiences;
  }

  // 生成自然化提示词
  generateNaturalPrompt(params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    platform: string;
    tone?: string;
  }): string {
    const platformStyle = this.getPlatformStyle(params.platform);
    const personalTouch = this.generatePersonalTouch();
    const thinkingStyle = this.generateThinkingStyle();

    return `请基于以下信息创作一篇关于"${params.keyword}"的文章。

## 写作背景
${personalTouch}

## 核心洞察
${params.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

## 写作要求
- **字数范围**：${params.wordCount}
- **发布平台**：${params.platform}
- **写作风格**：${platformStyle}

## 写作指导原则
${thinkingStyle}

## 内容创作要点
${this.generateContentGuidelines()}

## 结构建议
${this.generateStructureHints()}

## 注意事项
- 保持自然流畅的写作节奏
- 融入真实的生活体验和观察
- 避免过度完美的逻辑结构
- 允许适当的不确定性和思考过程
- 用具体细节支撑观点，而非抽象概念

请开始创作，记住要像在和朋友分享想法一样自然表达。`;
  }

  // 获取平台风格指导
  private getPlatformStyle(platform: string): string {
    const styles = {
      'xiaohongshu': '轻松亲切，像和闺蜜聊天，多用emoji和口语化表达',
      'wechat': '专业深度但不失亲和力，适合公众号的深度阅读场景',
      'zhihu': '理性分析为主，结合个人经验，逻辑清晰但不刻板',
      'weibo': '简洁有力，观点鲜明，适合快速阅读和传播',
      'story': '故事化叙述，情感丰富，有起承转合的完整结构'
    };
    return styles[platform as keyof typeof styles] || '自然流畅，贴近真实表达';
  }

  // 生成个人化触感
  private generatePersonalTouch(): string {
    if (this.experiencePool.length === 0) {
      return '从个人观察和体验出发，分享真实的想法和感受。';
    }

    const relevantExperiences = this.selectRelevantExperiences();
    if (relevantExperiences.length === 0) {
      return '结合自己的生活经历和专业观察，分享真实的思考过程。';
    }

    return `结合自己的相关经历：${relevantExperiences.map(exp =>
      `${exp.time}在${exp.location}${exp.event}的经历让我对这个问题有了更深的思考`
    ).join('；')}，想和大家分享一些真实的想法。`;
  }

  // 选择相关的个人经历
  private selectRelevantExperiences(): PersonalExperience[] {
    // 基于关键词和经历分类进行智能匹配
    // 这里简化实现，实际应该使用更复杂的匹配算法
    return this.experiencePool.slice(0, 2);
  }

  // 生成思维风格指导
  private generateThinkingStyle(): string {
    const dna = this.styleDNA.characteristics;
    const styles = [];

    if (dna.uncertaintyUsage) {
      styles.push('- 表达时保持适度的不确定性："我觉得可能是..."、"估计大概..."');
    }

    if (dna.personalExperience) {
      styles.push('- 融入个人经历和具体观察，用"我"的视角分享');
    }

    if (dna.rhetoricalQuestions) {
      styles.push('- 适当使用反问句："你发现没？"、"是不是？"');
    }

    if (dna.colloquialisms.length > 0) {
      styles.push(`- 自然使用个人表达习惯：${dna.colloquialisms.slice(0, 3).join('、')}`);
    }

    return styles.join('\n') || '- 保持自然真实的思考过程，允许适当的犹豫和修正';
  }

  // 生成内容指导原则
  private generateContentGuidelines(): string {
    const guidelines = [
      '**具体细节优先**：用具体的时间、地点、数字支撑观点',
      '**感官体验融入**：适当加入视觉、听觉等感官描述',
      '**情感真实流露**：表达真实的情绪和态度，避免中性化',
      '**思维过程可见**：展示思考的逻辑过程，包括犹豫和修正',
      '**语言自然流畅**：像日常对话一样写作，避免书面化堆砌'
    ];

    return guidelines.map((g, i) => `${i + 1}. ${g}`).join('\n');
  }

  // 生成结构提示
  private generateStructureHints(): string {
    return `文章结构不必过于规整，可以：
- 用疑问句或场景描述开头，避免套话
- 主体部分逻辑递进，但允许适当的思维跳跃
- 段落长度自然变化，避免机械对称
- 结尾可以用开放式问题或行动召唤，避免总结性套话`;
  }
}

// 平台专用提示词模板
export const platformPrompts = {
  // 小红书风格 - 生活化分享
  xiaohongshu: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userDNA?: WritingStyleDNA;
  }) => {
    const basePrompt = `写一篇小红书风格的分享笔记📒

主题：${params.keyword}

💡 核心观点：
${params.insights.map((insight, i) => `▪️ ${insight}`).join('\n')}

✨ 写作要求：
• 字数：${params.wordCount}
• 风格：亲切自然，像闺蜜聊天
• 开头要有emoji吸引注意
• 多用"姐妹们"、"宝子们"等称呼
• 分享真实的使用体验或观察
• 适当添加emoji表情：✨💡🔥💪👍
• 结尾要有互动："有同样感受的姐妹吗？"、"你们怎么看？"

🎯 内容要点：
1. 从个人真实体验出发
2. 用具体细节支撑观点
3. 语言轻松活泼，避免说教
4. 适当表达真实情感
5. 结尾引导互动讨论

开始写吧～记得要像和朋友聊天一样自然哦！`;

    if (params.userDNA) {
      const engine = new NaturalWritingEngine(params.userDNA);
      return engine.generateNaturalPrompt({
        ...params,
        platform: 'xiaohongshu',
        tone: 'casual friendly'
      });
    }

    return basePrompt;
  },

  // 公众号风格 - 深度思考
  wechat: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userDNA?: WritingStyleDNA;
  }) => {
    const basePrompt = `创作一篇公众号深度文章

主题：${params.keyword}

🎯 核心洞察：
${params.insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

📖 写作要求：
• 字数：${params.wordCount}
• 风格：专业深度，逻辑清晰
• 结构：引言-分析-结论，但避免刻板
• 开头：用具体场景或数据切入
• 论证：用具体案例和数据支撑
• 语言：专业但不晦涩，深入浅出
• 结尾：引发思考或提供行动指南

💡 写作指导：
1. 从具体现象或问题切入
2. 结合行业观察和深度思考
3. 用数据和案例增强说服力
4. 语言简洁有力，避免堆砌术语
5. 体现个人独特的洞察和观点

开始创作，记住要保持思考的深度和表达的温度。`;

    if (params.userDNA) {
      const engine = new NaturalWritingEngine(params.userDNA);
      return engine.generateNaturalPrompt({
        ...params,
        platform: 'wechat',
        tone: 'professional thoughtful'
      });
    }

    return basePrompt;
  },

  // 故事化叙述
  story: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userDNA?: WritingStyleDNA;
  }) => {
    const basePrompt = `用故事化的方式讲述${params.keyword}

🎭 故事核心：
${params.insights.map((insight, i) => `• ${insight}`).join('\n')}

📚 写作要求：
• 字数：${params.wordCount}
• 结构：三幕式结构（开端-发展-结局）
• 人物：有具体的角色和情感变化
• 情节：有冲突、转折、解决
• 细节：用感官细节增强代入感
• 主题：寓教于乐，传达深层思考

🎨 创作要点：
1. 用具体的人物和场景开场
2. 设置冲突引发读者兴趣
3. 通过对话推动情节发展
4. 用细节描写增强真实感
5. 结尾升华主题，留下思考

开始讲故事吧，让读者在故事中自然接受你的观点！`;

    if (params.userDNA) {
      const engine = new NaturalWritingEngine(params.userDNA);
      return engine.generateNaturalPrompt({
        ...params,
        platform: 'story',
        tone: 'narrative engaging'
      });
    }

    return basePrompt;
  }
};

// 反AI检测的自然化版本
export const naturalAIDetection = {
  // 自然语言特征检测 - 不再用硬规则
  analyzeNaturalFeatures: (text: string): {
    score: number; // 0-100，越低越自然
    humanProbability: number;
    characteristics: {
      sentenceVariety: number;
      personalTouch: number;
      emotionalExpression: number;
      concreteDetails: number;
      naturalFlow: number;
    };
    suggestions: string[];
  } => {
    // 简化的自然度评估算法
    const words = text.split(/\s+/).length;
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim()).length;
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim()).length;

    // 计算基础指标
    const avgSentenceLength = words / sentences;
    const sentenceLengthVariety = calculateSentenceVariety(text);
    const personalReferences = (text.match(/我|我的|自己|个人/g) || []).length;
    const emotionalWords = (text.match(/感觉|觉得|认为|想|希望|担心/g) || []).length;
    const concreteDetails = (text.match(/\d+|时间|地点|看到|听到|感觉/g) || []).length;

    // 自然度评分 (0-100)
    let naturalScore = 50; // 基础分

    // 句子长度变化加分
    if (sentenceLengthVariety > 0.7) naturalScore += 15;
    else if (sentenceLengthVariety > 0.5) naturalScore += 10;

    // 个人化表达加分
    if (personalReferences > words * 0.02) naturalScore += 10;

    // 情感表达加分
    if (emotionalWords > words * 0.01) naturalScore += 10;

    // 具体细节加分
    if (concreteDetails > words * 0.03) naturalScore += 15;

    // 限制在0-100范围
    naturalScore = Math.min(100, Math.max(0, naturalScore));

    return {
      score: 100 - naturalScore,
      humanProbability: naturalScore / 100,
      characteristics: {
        sentenceVariety: sentenceLengthVariety,
        personalTouch: Math.min(100, (personalReferences / words) * 500),
        emotionalExpression: Math.min(100, (emotionalWords / words) * 1000),
        concreteDetails: Math.min(100, (concreteDetails / words) * 300),
        naturalFlow: calculateFlowScore(text)
      },
      suggestions: generateNaturalSuggestions(naturalScore, text)
    };
  }
};

// 辅助函数
function calculateSentenceVariety(text: string): number {
  const sentences = text.split(/[。！？.!?]/).filter(s => s.trim());
  const lengths = sentences.map(s => s.trim().length);
  if (lengths.length <= 1) return 0;

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  // 归一化到0-1
  return Math.min(1, stdDev / avg);
}

function calculateFlowScore(text: string): number {
  // 简化的流畅度评分
  const hasTransitionWords = /(然后|接着|不过|但是|其实|说实话|你发现没)/g.test(text);
  const hasNaturalPauses = /(嗯|这个|那个|怎么说呢)/g.test(text);
  const hasSelfCorrections = /(不对|等等|让我想想)/g.test(text);

  let score = 50;
  if (hasTransitionWords) score += 15;
  if (hasNaturalPauses) score += 10;
  if (hasSelfCorrections) score += 10;

  return Math.min(100, score);
}

function generateNaturalSuggestions(score: number, text: string): string[] {
  const suggestions = [];

  if (score < 60) {
    suggestions.push('尝试加入更多个人化表达，如"我觉得"、"我发现"等');
  }

  if (text.length > 200 && !text.includes('我')) {
    suggestions.push('适当增加第一人称视角，让内容更有个人色彩');
  }

  if (!/[。！？.!?]/.test(text.slice(0, 50))) {
    suggestions.push('适当使用短句和停顿，增加语言的节奏感');
  }

  const avgSentenceLength = text.length / (text.split(/[。！？.!?]/).length || 1);
  if (avgSentenceLength > 80) {
    suggestions.push('适当缩短句子长度，增加句子间的变化');
  }

  if (suggestions.length === 0) {
    suggestions.push('整体表达自然流畅，继续保持个人化的写作风格');
  }

  return suggestions;
}

// 提示词版本管理系统
export interface PromptVersion {
  id: string;
  name: string;
  version: string;
  content: string;
  metadata: {
    platform: string;
    style: string;
    aiScore: number;
    userRating: number;
    usageCount: number;
    lastUsed: Date;
  };
  createdBy: string;
  createdAt: Date;
  isActive: boolean;
}

export class PromptVersionManager {
  private versions: Map<string, PromptVersion[]> = new Map();

  addVersion(platform: string, version: PromptVersion): void {
    if (!this.versions.has(platform)) {
      this.versions.set(platform, []);
    }
    this.versions.get(platform)!.push(version);
  }

  getVersions(platform: string): PromptVersion[] {
    return this.versions.get(platform) || [];
  }

  getBestVersion(platform: string): PromptVersion | null {
    const versions = this.getVersions(platform);
    if (versions.length === 0) return null;

    // 基于AI分数和用户评分选择最佳版本
    return versions.reduce((best, current) => {
      const currentScore = current.metadata.aiScore * 0.6 + current.metadata.userRating * 0.4;
      const bestScore = best.metadata.aiScore * 0.6 + best.metadata.userRating * 0.4;
      return currentScore > bestScore ? current : best;
    });
  }

  compareVersions(version1Id: string, version2Id: string): {
    aiScoreDiff: number;
    usageDiff: number;
    ratingDiff: number;
    suggestions: string[];
  } {
    // 版本对比分析逻辑
    return {
      aiScoreDiff: 0,
      usageDiff: 0,
      ratingDiff: 0,
      suggestions: []
    };
  }
}