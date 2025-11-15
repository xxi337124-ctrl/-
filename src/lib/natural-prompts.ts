/**
 * 自然化写作提示词系统 v4.0
 * 解决AI率100%问题的核心重构
 *
 * 关键改进：
 * 1. 移除"不是AI"等自我声明悖论
 * 2. 从47条规则简化为8条自然原则
 * 3. 基于真实样本而非规则约束
 * 4. 引入个人风格DNA概念
 */

// 自然化文章生成核心函数
export const naturalArticlePrompts = {
  /**
   * 基础文章生成 - 自然化版本
   * 移除所有反AI检测的硬性规则，采用自然写作指导
   */
  generateNaturalArticle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    platform: string;
    userStyle?: UserWritingStyle;
  }): string => {
    const { keyword, insights, wordCount, platform, userStyle } = params;

    // 构建个人化开场
    const personalOpening = userStyle
      ? `结合${userStyle.name}的写作风格和个人体验`
      : `基于真实观察和个人思考`;

    // 平台适配的自然化指导
    const platformGuidance = getNaturalPlatformGuidance(platform);

    return `请${personalOpening}，创作一篇关于"${keyword}"的文章。

## 写作灵感来源
${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

## 基本要求
• 字数控制在${wordCount}左右
• ${platformGuidance}

## 自然写作原则（遵循8个核心原则）

### 1. 真实体验优先 🎯
用具体的生活场景、个人观察或真实经历开场，避免抽象概念。

### 2. 具体细节支撑 📍
多用具体的时间、地点、数字、感官描述，少用抽象形容词。

### 3. 思维过程可见 💭
适当展示思考过程，包括犹豫、质疑、修正，让逻辑更人性化。

### 4. 情感自然流露 ❤️
表达真实的情绪和态度，避免中性化、模板化的情感描述。

### 5. 语言节奏变化 🎵
句子长短自然交替，段落长度有变化，避免机械化的对称结构。

### 6. 个人视角表达 👤
用"我"的视角分享，融入个人判断和偏好，避免绝对化表述。

### 7. 适度不确定性 🤔
允许使用"可能"、"大概"、"我觉得"等表达不确定性的词汇。

### 8. 自然过渡连接 🔗
用自然的连接词（其实、不过、说实话）而非机械的逻辑词（首先、其次、最后）。

## 写作建议结构
不强制要求，但可以参考：
• 开头：用具体场景或疑问引入
• 主体：分层展开观点，结合具体例子
• 结尾：引发思考或行动召唤，避免总结性套话

## 写作心态提醒
想象你在和朋友聊天，分享一个你最近发现的有意思的事情。不需要完美，只需要真实和自然。

开始写作吧！📝`;
  },

  /**
   * 小红书风格 - 自然化版本
   */
  generateXiaohongshuStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userStyle?: UserWritingStyle;
  }): string => {
    const { keyword, insights, wordCount, userStyle } = params;

    return `写一篇小红书风格的生活分享笔记 📒

🌟 分享主题：${keyword}

💡 想传达的核心观点：
${insights.map((insight, i) => `• ${insight}`).join('\n')}

✨ 写作氛围：
• 字数：${wordCount}
• 语气：像闺蜜聊天一样亲切自然
• 开头：用emoji吸引注意，直接切入主题
• 称呼：多用"姐妹们"、"宝子们"、"姐妹们看过来"
• 内容：分享真实体验，用具体细节支撑

📝 写作小贴士：
1. 从最近的真实体验说起
2. 用具体场景和细节让内容更可信
3. 自然表达真实感受，不刻意夸张
4. 适当加入emoji表情增加亲和力
5. 结尾用互动话题引发讨论

💬 举个开头例子：
"姐妹们！最近我发现一个超有意思的事情..."
"宝子们，今天必须来聊聊这个话题..."

记住要像和闺蜜聊天一样自然，分享真实感受！开始写吧～`;
  },

  /**
   * 公众号风格 - 自然化版本
   */
  generateWechatStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userStyle?: UserWritingStyle;
  }): string => {
    const { keyword, insights, wordCount, userStyle } = params;

    return `创作一篇公众号深度文章

📚 文章主题：${keyword}

🎯 核心洞察：
${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

📝 写作要求：
• 字数：${wordCount}
• 风格：专业有深度，但不失温度
• 开头：用具体现象、数据或故事切入
• 论证：结合具体案例，避免空泛论述
• 语言：深入浅出，避免过度学术化
• 结尾：引发思考或提供实用建议

💭 写作思路：
1. 从最近观察到的具体现象说起
2. 结合个人经历或身边案例
3. 用通俗易懂的语言解释复杂问题
4. 适当引用可靠的数据或研究
5. 提供有实操价值的建议

🌟 写作提醒：
想象你在给一个聪明的朋友解释一个复杂问题，既要讲清楚原理，又要让对方听得津津有味。

开始创作，让你的专业见解通过温暖的文字传达给读者！`;
  },

  /**
   * 故事化叙述 - 自然化版本
   */
  generateStoryStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    userStyle?: UserWritingStyle;
  }): string => {
    const { keyword, insights, wordCount, userStyle } = params;

    return `用讲故事的方式聊聊${keyword}

🎭 故事要传达的核心：
${insights.map((insight, i) => `• ${insight}`).join('\n')}

📖 故事要求：
• 字数：${wordCount}
• 结构：有开头、发展、转折、结局
• 人物：有具体的角色和情感变化
• 情节：有冲突、有解决、有启发
• 细节：用感官描写增强代入感
• 主题：寓教于乐，传达深层思考

✨ 创作建议：
1. 从一个具体的人物和场景开始
2. 设置一个读者能共鸣的冲突
3. 通过对话推动情节发展
4. 用细节描写让故事更真实
5. 结尾自然升华主题

🌟 写作心态：
想象你在给朋友讲一个最近发生的真实故事，要有情感、有细节、有启发。

开始编织你的故事吧！让读者在故事中发现生活的智慧。`;
  }
};

// 用户写作风格接口
export interface UserWritingStyle {
  id: string;
  name: string;
  characteristics: {
    sentencePreference: 'short' | 'medium' | 'long' | 'mixed';
    emotionLevel: number; // 1-10
    detailRichness: number; // 1-10
    personalTouch: boolean;
    colloquialLevel: number; // 1-10
    uncertaintyUsage: boolean;
    rhetoricalStyle: 'frequent' | 'moderate' | 'rare';
  };
  personalExperiences: PersonalExperience[];
  commonPhrases: string[]; // 个人常用表达
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalExperience {
  id: string;
  category: 'work' | 'life' | 'study' | 'relationship' | 'travel' | 'other';
  title: string;
  description: string;
  timeContext: string; // "去年夏天", "上周三下午"
  locationContext?: string;
  emotionalTone: string;
  applicableTopics: string[]; // 适用于哪些主题的关键词
}

// 平台适配的自然化指导
function getNaturalPlatformGuidance(platform: string): string {
  const guidance = {
    'xiaohongshu': '像闺蜜分享生活经验一样亲切自然，适当使用emoji',
    'wechat': '专业有深度的同时保持温度和亲和力',
    'zhihu': '理性分析结合个人经验，逻辑清晰但不刻板',
    'weibo': '简洁有力，观点鲜明，适合快速阅读',
    'douyin': '节奏明快，金句频出，适合短视频文案',
    'story': '故事化叙述，情感丰富，有起承转合'
  };

  return guidance[platform as keyof typeof guidance] || '自然流畅，贴近真实表达';
}

// 反AI检测的自然化版本 - 基于特征而非规则
export const naturalAIDetection = {
  /**
   * 分析文本的自然化程度
   * 从基于规则转向基于特征分析
   */
  analyzeNaturalness: (text: string): {
    naturalnessScore: number; // 0-100，越高越自然
    humanProbability: number;
    keyCharacteristics: {
      personalExpression: number;
      concreteDetails: number;
      emotionalAuthenticity: number;
      naturalFlow: number;
      sentenceVariety: number;
    };
    improvementSuggestions: string[];
  } => {
    // 基础统计
    const characters = text.length;
    const sentences = text.split(/[。！？.!?]/).filter(s => s.trim()).length;
    const words = text.split(/\s+/).length;

    // 个人化表达检测
    const personalMarkers = (text.match(/我|我的|自己|个人|我觉得|我发现/g) || []).length;
    const personalScore = Math.min(100, (personalMarkers / (words / 100)) * 20);

    // 具体细节检测
    const concreteMarkers = (text.match(/\d+|[年月日时分]|地点|看到|听到|感觉|发现/g) || []).length;
    const concreteScore = Math.min(100, (concreteMarkers / (words / 100)) * 15);

    // 情感真实性检测
    const emotionMarkers = (text.match(/感觉|觉得|认为|希望|担心|开心|失望|激动/g) || []).length;
    const emotionScore = Math.min(100, (emotionMarkers / (words / 100)) * 25);

    // 自然流畅度检测
    const naturalTransitions = (text.match(/其实|不过|说实话|你发现没|怎么说呢/g) || []).length;
    const uncertaintyMarkers = (text.match(/可能|大概|估计|也许|我觉得/g) || []).length;
    const flowScore = Math.min(100, ((naturalTransitions + uncertaintyMarkers) / (words / 100)) * 30);

    // 句子变化性检测
    const sentenceLengths = text.split(/[。！？.!?]/).filter(s => s.trim()).map(s => s.trim().length);
    const varietyScore = calculateSentenceVariety(sentenceLengths);

    // 综合评分
    const totalScore = (personalScore + concreteScore + emotionScore + flowScore + varietyScore * 20) / 5;

    return {
      naturalnessScore: Math.round(totalScore),
      humanProbability: totalScore / 100,
      keyCharacteristics: {
        personalExpression: Math.round(personalScore),
        concreteDetails: Math.round(concreteScore),
        emotionalAuthenticity: Math.round(emotionScore),
        naturalFlow: Math.round(flowScore),
        sentenceVariety: Math.round(varietyScore * 100)
      },
      improvementSuggestions: generateImprovementSuggestions({
        personalScore, concreteScore, emotionScore, flowScore, varietyScore
      })
    };
  }
};

// 辅助函数
function calculateSentenceVariety(lengths: number[]): number {
  if (lengths.length <= 1) return 0;

  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  const variance = lengths.reduce((acc, len) => acc + Math.pow(len - avg, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  return Math.min(1, stdDev / avg);
}

function generateImprovementSuggestions(scores: {
  personalScore: number;
  concreteScore: number;
  emotionScore: number;
  flowScore: number;
  varietyScore: number;
}): string[] {
  const suggestions = [];

  if (scores.personalScore < 50) {
    suggestions.push('增加个人化表达，多用"我"的视角分享');
  }

  if (scores.concreteScore < 50) {
    suggestions.push('加入更多具体的时间、地点、数字等细节');
  }

  if (scores.emotionScore < 50) {
    suggestions.push('表达真实的情绪和态度，避免过于中性');
  }

  if (scores.flowScore < 50) {
    suggestions.push('使用更自然的连接词，如"其实"、"说实话"等');
  }

  if (scores.varietyScore < 0.5) {
    suggestions.push('增加句子长度的变化，避免过于规整');
  }

  if (suggestions.length === 0) {
    suggestions.push('整体表达自然流畅，继续保持真实的写作风格');
  }

  return suggestions;
}

// 提示词版本管理
export interface PromptVersion {
  id: string;
  name: string;
  version: string;
  content: string;
  platform: string;
  style: string;
  performance: {
    aiDetectionScore: number;
    userRating: number;
    usageCount: number;
    lastUsed: Date;
  };
  createdAt: Date;
  isActive: boolean;
}

export class PromptVersionManager {
  private versions: Map<string, PromptVersion[]> = new Map();

  addVersion(version: PromptVersion): void {
    const key = `${version.platform}-${version.style}`;
    if (!this.versions.has(key)) {
      this.versions.set(key, []);
    }
    this.versions.get(key)!.push(version);
  }

  getBestVersion(platform: string, style: string): PromptVersion | null {
    const versions = this.versions.get(`${platform}-${style}`) || [];
    if (versions.length === 0) return null;

    return versions.reduce((best, current) => {
      const currentScore = current.performance.aiDetectionScore * 0.6 +
                          current.performance.userRating * 0.4;
      const bestScore = best.performance.aiDetectionScore * 0.6 +
                       best.performance.userRating * 0.4;
      return currentScore > bestScore ? current : best;
    });
  }

  getVersionHistory(platform: string, style: string): PromptVersion[] {
    return this.versions.get(`${platform}-${style}`) || [];
  }
}