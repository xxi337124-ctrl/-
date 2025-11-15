/**
 * 优化版AI提示词系统 v5.0
 * 基于真实用户体验的简洁高效提示词
 */

// 核心原则：简洁、真实、有效
export const enhancedPrompts = {
  /**
   * 通用文章生成 - 简洁自然版
   */
  generateNaturalArticle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
    platform: string;
    style?: string;
  }): string => {
    const { keyword, insights, wordCount, platform, style } = params;

    return `请创作一篇关于"${keyword}"的文章。

## 内容要求
• 字数：${wordCount}
• 平台：${platform}
• 风格：${style || '自然真实'}

## 核心观点（可选参考）
${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

## 写作指南（自然表达即可）
1. 像和朋友聊天一样自然
2. 分享真实想法和个人体验
3. 用具体例子说明观点
4. 句子长短交替，避免机械重复
5. 适当表达个人情绪和态度

## 开头建议
- 直接切入主题，避免套话
- 可以用疑问句或具体场景引入

## 内容结构（灵活安排）
- 引入：简洁有力，吸引注意
- 展开：分层论述，有理有据
- 总结：自然收尾，引发思考

## 避免内容
- 官话套话（"随着发展""综上所述"等）
- 过度修饰（"极其重要""十分关键"等）
- 抽象概念循环解释
- 完美对称的机械结构

## 输出格式
{\n  "title": "文章标题（简洁有力）",\n  "content": "HTML格式正文"\n}`;
  },

  /**
   * 小红书风格 - 真实分享版
   */
  xiaohongshuStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
  }): string => {
    const { keyword, insights, wordCount } = params;

    return `写一篇小红书分享笔记。

## 分享主题
${keyword}

## 我想表达的核心
${insights.map((insight, i) => `• ${insight}`).join('\n')}

## 笔记要求
• 字数：${wordCount}
• 语气：像和朋友分享好物/经验
• 内容：真实具体，有细节支撑

## 写作思路
1. 开头：直接说发现/体验
   - "最近试了下..."
   - "昨天在XX看到..."
   - "用了几天，来说说感受"

2. 中间：具体分享
   - 时间地点具体化
   - 价格/数字具体化
   - 真实体验描述
   - 优缺点都说

3. 结尾：自然互动
   - "有姐妹试过吗？"
   - "你们觉得怎么样？"

## 注意事项
- 少用"姐妹们必看"等营销语
- 避免"干货分享"等套话
- 不要过度emoji堆砌
- 保持真实分享感

## 输出格式
{\n  "title": "标题（简洁真实）",\n  "content": "HTML格式内容"\n}`;
  },

  /**
   * 公众号风格 - 深入浅出版
   */
  wechatStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
  }): string => {
    const { keyword, insights, wordCount } = params;

    return `创作一篇公众号文章。

## 文章主题
${keyword}

## 核心观点
${insights.map((insight, i) => `${i + 1}. ${insight}`).join('\n')}

## 写作要求
• 字数：${wordCount}
• 风格：专业但不艰涩
• 目标：让读者有所收获

## 文章结构（参考）
### 开头（引入）
- 现象描述或问题提出
- 引发读者共鸣或思考
- 明确文章要探讨的内容

### 主体（展开）
- 分2-4个小节论述
- 每节有小标题
- 观点+案例/数据支撑
- 逻辑清晰，层层递进

### 结尾（升华）
- 总结核心观点
- 给出实用建议
- 引发更深思考

## 写作技巧
1. 用具体案例说明抽象概念
2. 适当引用可靠数据
3. 语言通俗易懂
4. 保持客观理性态度

## 避免内容
- 过度专业的术语堆砌
- 没有依据的主观判断
- 过于绝对的表述
- 教科书式的说教

## 输出格式
{\n  "title": "文章标题（专业简洁）",\n  "content": "HTML格式正文"\n}`;
  },

  /**
   * 故事化叙述 - 生动有趣版
   */
  storytellingStyle: (params: {
    keyword: string;
    insights: string[];
    wordCount: string;
  }): string => {
    const { keyword, insights, wordCount } = params;

    return `用讲故事的方式聊聊${keyword}。

## 故事核心
${insights.map((insight, i) => `• ${insight}`).join('\n')}

## 故事要求
• 字数：${wordCount}
• 要素：有人物、有情节、有转折
• 目标：寓教于乐，自然传达观点

## 故事结构（灵活使用）
### 开头：设定场景
- 引出主人公
- 描述日常状态
- 埋下问题伏笔

### 发展：冲突出现
- 遇到问题或挑战
- 尝试解决的过程
- 关键转折点

### 高潮：顿悟时刻
- 重要领悟或改变
- 与${keyword}的价值关联

### 结局：圆满收尾
- 问题得到解决
- 主人公获得成长
- 自然提炼启示

## 写作要点
1. 人物要鲜活，有真实感
2. 情节要有起伏，避免平淡
3. 细节描写增强画面感
4. 对话推动情节发展
5. 启示要从故事中自然流露

## 注意事项
- 故事要可信，不能完全虚构
- 避免说教的口吻
- 保持叙事的连贯性
- 结尾不要过于刻意

## 输出格式
{\n  "title": "故事标题（吸引人）",  \n  "content": "HTML格式故事内容",
  "story_arc": "故事主线简述"
}`;
  }
};

/**
 * AI洞察分析提示词优化
 */
export const insightPrompts = {
  /**
   * 文章分析 - 简洁有效版
   */
  analyzeArticle: (article: {
    title: string;
    content: string;
    likes: number;
    views: number;
  }): string => {
    return `分析这篇文章：

标题：${article.title}
内容：${article.content.slice(0, 800)}${article.content.length > 800 ? '...' : ''}
数据：点赞${article.likes} | 阅读${article.views}

请提取：
1. 核心观点（一句话概括）
2. 关键要点（3-5个）
3. 亮点/金句（如有）
4. 适合借鉴的角度

要求：简洁明了，不要过度解读。

输出格式：
{\n  "summary": "核心观点",\n  "keyPoints": ["要点1", "要点2"],\n  "highlights": ["亮点1"],\n  "angles": ["可借鉴角度"]
}`;
  },

  /**
   * 洞察生成 - 实用导向版
   */
  generateInsights: (summaries: any[], keyword: string): string => {
    const summaryText = summaries.map((s, i) =>
      `${i + 1}. ${s.title}\n${s.summary}`
    ).join('\n');

    return `基于"${keyword}"的${summaries.length}篇热门文章，生成3个选题建议：

文章摘要：
${summaryText}

## 选题要求
1. 结合热点，有讨论价值
2. 角度新颖，避免重复
3. 有实用性，读者有收获
4. 考虑时效性和可持续性

## 输出格式
[
  {
    "title": "选题标题（简洁有力）",
    "description": "选题描述（50字内）",
    "angle": "切入角度",
    "value": "读者价值",
    "suggestedTitles": ["标题建议1", "标题建议2"]
  }
]

注意：每个选题要有差异化，避免同质化。`;
  }
};

/**
 * 内容质量评估提示词
 */
export const qualityPrompts = {
  /**
   * 自然度评估
   */
  evaluateNaturalness: (content: string): string => {
    return `评估这段内容的自然度：

${content.slice(0, 1000)}

从以下维度评分（1-10分）：
1. 语言自然度 - 是否像真人说话
2. 表达真实性 - 是否有真实情感
3. 结构灵活度 - 是否避免机械模式
4. 内容可信度 - 是否具体可信
5. 整体可读性 - 是否流畅易读

每项给出分数和简要理由。

输出格式：
{\n  "naturalness": {\n    "score": 8,\n    "reason": "语言自然流畅"\n  },\n  "authenticity": {\n    "score": 7,\n    "reason": "有一定真实感"\n  },\n  "flexibility": {\n    "score": 6,\n    "reason": "结构略显规整"\n  },\n  "credibility": {\n    "score": 8,\n    "reason": "内容具体可信"\n  },\n  "readability": {\n    "score": 9,\n    "reason": "阅读体验良好"\n  },\n  "totalScore": 7.6,\n  "suggestions": ["建议1", "建议2"]
}`;
  }
};

/**
 * 图片生成提示词优化
 */
export const imagePrompts = {
  /**
   * 根据文章内容生成配图提示词
   */
  generateForArticle: (params: {
    articleTitle: string;
    articleContent: string;
    imageCount: number;
    platform: string;
  }): string => {
    const { articleTitle, articleContent, imageCount, platform } = params;

    return `为这篇文章生成${imageCount}个配图提示词：

标题：${articleTitle}
内容摘要：${articleContent.slice(0, 500)}...
平台：${platform}

## 提示词要求
1. 内容与文章主题紧密相关
2. 视觉风格适合${platform}平台
3. 具体形象，避免抽象
4. 使用英文描述
5. 包含：主体+风格+光线+构图+质量

## 风格参考
${platform === 'xiaohongshu'
  ? '小红书：清新明亮，生活化，色彩柔和，构图简洁'
  : '公众号：专业简洁，商务感，配色沉稳，信息图表风格'}

## 输出格式
[
  "第一个配图的详细英文提示词",
  "第二个配图的详细英文提示词",
  "第三个配图的详细英文提示词"
]

注意：每个提示词30-80个单词，避免人脸特写和敏感内容。`;
  }
};