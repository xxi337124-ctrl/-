import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { openaiClient } from "@/lib/openai";

// 内容质量评估接口
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "未授权访问" }, { status: 401 });
    }

    const body = await request.json();
    const { content, evaluationType = "comprehensive" } = body;

    if (!content) {
      return NextResponse.json(
        { error: "缺少内容文本" },
        { status: 400 }
      );
    }

    // 根据评估类型选择不同的评估方法
    let evaluation;
    switch (evaluationType) {
      case "naturalness":
        evaluation = await evaluateNaturalness(content);
        break;
      case "ai-detection":
        evaluation = await evaluateAIDetection(content);
        break;
      case "readability":
        evaluation = await evaluateReadability(content);
        break;
      case "engagement":
        evaluation = await evaluateEngagement(content);
        break;
      default:
        evaluation = await evaluateComprehensive(content);
    }

    return NextResponse.json({
      success: true,
      data: evaluation
    });

  } catch (error) {
    console.error("内容质量评估失败:", error);
    return NextResponse.json(
      { error: "评估失败" },
      { status: 500 }
    );
  }
}

// 自然度评估
async function evaluateNaturalness(content: string): Promise<any> {
  const prompt = `评估这段内容的自然度和人性化程度：

${content.slice(0, 1500)}

请从以下维度评分（1-10分）并提供简要理由：
1. 语言自然度 - 是否像真人说话
2. 表达真实性 - 是否有真实情感和思考过程
3. 结构灵活度 - 是否避免机械化的文章结构
4. 内容可信度 - 是否具体可信，有真实细节
5. 整体可读性 - 是否流畅易读

输出JSON格式：
{
  "naturalness": {"score": 8, "reason": "语言自然流畅"},
  "authenticity": {"score": 7, "reason": "有一定真实感"},
  "flexibility": {"score": 6, "reason": "结构略显规整"},
  "credibility": {"score": 8, "reason": "内容具体可信"},
  "readability": {"score": 9, "reason": "阅读体验良好"},
  "totalScore": 7.6,
  "suggestions": ["建议1", "建议2"]
}`;

  try {
    const result = await openaiClient.generateJSON(prompt, {
      systemPrompt: "你是内容质量评估专家，请客观公正地评估内容质量。",
      timeout: 30000,
      maxRetries: 2,
    });

    return {
      type: "naturalness",
      result,
      recommendations: generateNaturalnessRecommendations(result)
    };
  } catch (error) {
    console.error("自然度评估失败:", error);
    return {
      type: "naturalness",
      error: "评估失败",
      fallback: calculateBasicNaturalness(content)
    };
  }
}

// AI检测评估
async function evaluateAIDetection(content: string): Promise<any> {
  const prompt = `检测这段内容的AI痕迹：

${content.slice(0, 1500)}

请识别以下AI特征（每个特征给出严重程度和具体例子）：
1. AI套话 - 如"随着...发展","综上所述"等
2. 对比句式 - 如"不是...而是...","不在于...而在于..."
3. 书面化词汇 - 如"彰显","赋能","诸如"等
4. 抽象概念 - 如"维度","层面","生态"等
5. 结构模式化 - 如严格的"首先...其次...最后"

输出JSON格式：
{
  "aiPatterns": [
    {
      "type": "套话",
      "severity": "high",
      "examples": ["随着技术的发展"],
      "suggestion": "改为具体的时间描述"
    }
  ],
  "aiScore": 25, // 0-100，越高AI痕迹越重
  "humanProbability": 75, // 0-100，人类写作概率
  "improvements": ["改进建议1", "改进建议2"]
}`;

  try {
    const result = await openaiClient.generateJSON<{ aiScore: number; confidence: string; reasons: string[] }>(prompt, {
      systemPrompt: "你是AI内容检测专家，专门识别AI生成内容的特征。",
      timeout: 30000,
      maxRetries: 2,
    });

    return {
      type: "ai-detection",
      result,
      riskLevel: getRiskLevel(result.aiScore)
    };
  } catch (error) {
    console.error("AI检测评估失败:", error);
    return {
      type: "ai-detection",
      error: "评估失败",
      fallback: calculateBasicAIDetection(content)
    };
  }
}

// 可读性评估
async function evaluateReadability(content: string): Promise<any> {
  const sentences = content.split(/[。！？；]/g).filter(s => s.trim().length > 5);
  const words = content.split(/\s+/).length;
  const characters = content.length;

  const prompt = `评估这段内容的可读性：

基础数据：
- 总字数：${characters}
- 句子数：${sentences.length}
- 平均句长：${Math.round(characters / sentences.length)}字
- 段落数：${content.split('\n\n').length}

请从以下维度评估：
1. 句子长度适宜度
2. 段落结构清晰度
3. 语言难度等级
4. 逻辑连贯性
5. 整体易读性

输出JSON格式：
{
  "sentenceLength": {"score": 8, "description": "句子长度适中"},
  "paragraphStructure": {"score": 7, "description": "段落结构较清晰"},
  "languageDifficulty": {"score": 6, "description": "语言难度中等"},
  "coherence": {"score": 8, "description": "逻辑连贯性好"},
  "overallReadability": {"score": 7, "description": "整体易读性良好"},
  "readingLevel": "中级",
  "targetAudience": "一般读者",
  "suggestions": ["建议1", "建议2"]
}`;

  try {
    const result = await openaiClient.generateJSON<any>(prompt, {
      systemPrompt: "你是可读性评估专家，请基于提供的统计数据进行评估。",
      timeout: 20000,
      maxRetries: 2,
    });

    return {
      type: "readability",
      result: {
        ...result,
        statistics: {
          totalCharacters: characters,
          totalSentences: sentences.length,
          avgSentenceLength: Math.round(characters / sentences.length),
          totalParagraphs: content.split('\n\n').length,
          totalWords: words
        }
      }
    };
  } catch (error) {
    console.error("可读性评估失败:", error);
    return {
      type: "readability",
      error: "评估失败",
      fallback: calculateBasicReadability(content, sentences, words, characters)
    };
  }
}

// 互动性评估
async function evaluateEngagement(content: string): Promise<any> {
  const prompt = `评估这段内容的互动潜力：

${content.slice(0, 1000)}

请从以下维度评估内容的互动潜力（1-10分）：
1. 话题争议性 - 是否容易引发讨论
2. 情感共鸣度 - 是否能引起读者情感共鸣
3. 实用价值 - 对读者的实用价值
4. 分享意愿 - 读者分享的可能性
5. 评论引导 - 是否能引导读者评论

还要评估：
- 适合的发布平台
- 最佳发布时间
- 目标受众群体
- 预期互动率

输出JSON格式：
{
  "controversy": {"score": 6, "reason": "有一定讨论空间"},
  "emotionalResonance": {"score": 7, "reason": "能引起部分读者共鸣"},
  "practicalValue": {"score": 8, "reason": "实用价值较高"},
  "shareWillingness": {"score": 7, "reason": "有一定分享价值"},
  "commentGuidance": {"score": 6, "reason": "可以引导部分评论"},
  "suitablePlatforms": ["小红书", "公众号"],
  "bestPublishTime": "晚上8-10点",
  "targetAudience": "职场人士",
  "expectedEngagement": "中等",
  "totalScore": 6.8
}`;

  try {
    const result = await openaiClient.generateJSON(prompt, {
      systemPrompt: "你是内容营销专家，专门评估内容的互动潜力。",
      timeout: 25000,
      maxRetries: 2,
    });

    return {
      type: "engagement",
      result
    };
  } catch (error) {
    console.error("互动性评估失败:", error);
    return {
      type: "engagement",
      error: "评估失败",
      fallback: calculateBasicEngagement(content)
    };
  }
}

// 综合评估
async function evaluateComprehensive(content: string): Promise<any> {
  const [
    naturalness,
    aiDetection,
    readability,
    engagement
  ] = await Promise.all([
    evaluateNaturalness(content),
    evaluateAIDetection(content),
    evaluateReadability(content),
    evaluateEngagement(content)
  ]);

  // 计算综合评分
  const totalScore = (
    (naturalness.result?.totalScore || 0) +
    (readability.result?.overallReadability?.score || 0) +
    (engagement.result?.totalScore || 0)
  ) / 3;

  const aiRisk = aiDetection.result?.aiScore || 0;

  return {
    type: "comprehensive",
    overallScore: Math.round(totalScore * 10) / 10,
    aiRiskLevel: getRiskLevel(aiRisk),
    evaluations: {
      naturalness,
      aiDetection,
      readability,
      engagement
    },
    summary: generateSummary(totalScore, aiRisk),
    recommendations: generateRecommendations(totalScore, aiRisk, {
      naturalness,
      aiDetection,
      readability,
      engagement
    })
  };
}

// 辅助函数：生成自然度改进建议
function generateNaturalnessRecommendations(result: any): string[] {
  const suggestions = [];

  if (result.naturalness?.score < 7) {
    suggestions.push("增加更多口语化表达，如'其实'、'说实话'等");
  }

  if (result.authenticity?.score < 7) {
    suggestions.push("加入更多个人真实体验和情感表达");
  }

  if (result.flexibility?.score < 7) {
    suggestions.push("打破规整的文章结构，允许段落长度不一致");
  }

  if (result.credibility?.score < 7) {
    suggestions.push("增加具体的时间、地点、数字等真实细节");
  }

  if (suggestions.length === 0) {
    suggestions.push("内容自然度良好，继续保持真实自然的写作风格");
  }

  return suggestions;
}

// 辅助函数：计算基础自然度评分
function calculateBasicNaturalness(content: string): any {
  const personalMarkers = (content.match(/我|我的|自己|个人|我觉得|我发现/g) || []).length;
  const uncertaintyMarkers = (content.match(/可能|大概|估计|也许|我觉得/g) || []).length;
  const naturalTransitions = (content.match(/其实|不过|说实话|你发现没|怎么说呢/g) || []).length;

  const totalWords = content.split(/\s+/).length;
  const personalScore = Math.min(10, (personalMarkers / (totalWords / 100)) * 2);
  const uncertaintyScore = Math.min(10, (uncertaintyMarkers / (totalWords / 100)) * 3);
  const transitionScore = Math.min(10, (naturalTransitions / (totalWords / 100)) * 4);

  const totalScore = (personalScore + uncertaintyScore + transitionScore) / 3;

  return {
    type: "basic-naturalness",
    totalScore: Math.round(totalScore * 10) / 10,
    details: {
      personalExpression: Math.round(personalScore * 10) / 10,
      uncertaintyUsage: Math.round(uncertaintyScore * 10) / 10,
      naturalTransitions: Math.round(transitionScore * 10) / 10
    },
    message: "基于基础指标的自然度评分"
  };
}

// 辅助函数：计算基础AI检测评分
function calculateBasicAIDetection(content: string): any {
  const aiPatterns = [
    { pattern: /随着.*?的发展/g, weight: 3 },
    { pattern: /在当今时代/g, weight: 3 },
    { pattern: /综上所述/g, weight: 3 },
    { pattern: /不是.*?而是/g, weight: 2 },
    { pattern: /不在于.*?而在于/g, weight: 2 },
    { pattern: /彰显/g, weight: 2 },
    { pattern: /赋能/g, weight: 2 },
    { pattern: /维度/g, weight: 1 },
    { pattern: /层面/g, weight: 1 },
    { pattern: /首先.*?其次.*?最后/g, weight: 2 }
  ];

  let aiScore = 0;
  const foundPatterns: any[] = [];

  aiPatterns.forEach(({ pattern, weight }) => {
    const matches = content.match(pattern);
    if (matches) {
      aiScore += matches.length * weight;
      foundPatterns.push({
        pattern: pattern.source,
        count: matches.length,
        severity: weight >= 3 ? 'high' : weight >= 2 ? 'medium' : 'low'
      });
    }
  });

  const maxPossibleScore = 50;
  const normalizedScore = Math.min(100, (aiScore / maxPossibleScore) * 100);
  const humanProbability = Math.max(0, 100 - normalizedScore);

  return {
    type: "basic-ai-detection",
    aiScore: Math.round(normalizedScore),
    humanProbability: Math.round(humanProbability),
    foundPatterns,
    message: "基于基础AI特征的检测评分"
  };
}

// 辅助函数：计算基础可读性评分
function calculateBasicReadability(content: string, sentences: string[], words: number, characters: number): any {
  const avgSentenceLength = characters / sentences.length;
  const avgWordsPerSentence = words / sentences.length;

  // 简单的可读性评分算法
  let readabilityScore = 10;

  // 句子长度扣分
  if (avgSentenceLength > 80) readabilityScore -= 3;
  else if (avgSentenceLength > 60) readabilityScore -= 2;
  else if (avgSentenceLength > 40) readabilityScore -= 1;

  // 段落结构评分
  const paragraphs = content.split('\n\n').length;
  if (paragraphs < 3) readabilityScore -= 2;

  return {
    type: "basic-readability",
    overallReadability: Math.max(0, readabilityScore),
    statistics: {
      totalCharacters: characters,
      totalSentences: sentences.length,
      avgSentenceLength: Math.round(avgSentenceLength),
      totalParagraphs: paragraphs,
      totalWords: words,
      avgWordsPerSentence: Math.round(avgWordsPerSentence)
    },
    message: "基于基础统计的可读性评分"
  };
}

// 辅助函数：计算基础互动性评分
function calculateBasicEngagement(content: string): any {
  // 简单的互动性指标
  const questionMarks = (content.match(/？/g) || []).length;
  const exclamationMarks = (content.match(/！/g) || []).length;
  const personalPronouns = (content.match(/你|您|大家|朋友们/g) || []).length;
  const callToAction = (content.match(/试试|看看|想想|分享|评论/g) || []).length;

  const totalWords = content.split(/\s+/).length;

  let engagementScore = 5; // 基础分

  // 加分项
  if (questionMarks > 0) engagementScore += 1;
  if (exclamationMarks > 2) engagementScore += 1;
  if (personalPronouns > 5) engagementScore += 1;
  if (callToAction > 3) engagementScore += 1;

  return {
    type: "basic-engagement",
    totalScore: Math.min(10, engagementScore),
    details: {
      questionCount: questionMarks,
      exclamationCount: exclamationMarks,
      personalPronounCount: personalPronouns,
      callToActionCount: callToAction
    },
    message: "基于基础互动指标的评分"
  };
}

// 辅助函数：获取风险等级
function getRiskLevel(aiScore: number): string {
  if (aiScore >= 70) return "高风险";
  if (aiScore >= 40) return "中风险";
  if (aiScore >= 20) return "低风险";
  return "极低风险";
}

// 辅助函数：生成总结
function generateSummary(totalScore: number, aiRisk: number): string {
  if (totalScore >= 8 && aiRisk < 30) {
    return "内容质量优秀，自然度高，AI风险低，适合发布";
  } else if (totalScore >= 7 && aiRisk < 50) {
    return "内容质量良好，稍作优化即可发布";
  } else if (totalScore >= 6 && aiRisk < 70) {
    return "内容质量中等，需要一定优化";
  } else {
    return "内容需要较大改进，建议重新创作";
  }
}

// 辅助函数：生成改进建议
function generateRecommendations(totalScore: number, aiRisk: number, evaluations: any): string[] {
  const recommendations = [];

  if (totalScore < 7) {
    recommendations.push("整体内容质量有待提升，建议重点优化");
  }

  if (aiRisk >= 50) {
    recommendations.push("AI检测风险较高，需要深度去AI化处理");
  }

  if (evaluations.naturalness.result?.totalScore < 7) {
    recommendations.push("增加更多真实个人体验和口语化表达");
  }

  if (evaluations.readability.result?.overallReadability?.score < 7) {
    recommendations.push("优化句子结构和段落组织，提升可读性");
  }

  if (evaluations.engagement.result?.totalScore < 7) {
    recommendations.push("增加互动元素，提升读者参与度");
  }

  if (recommendations.length === 0) {
    recommendations.push("内容质量良好，可以发布");
  }

  return recommendations;
}