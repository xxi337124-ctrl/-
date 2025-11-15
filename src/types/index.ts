import { Status, Platform } from "@prisma/client";

// 文章数据类型
export interface ArticleData {
  title: string;
  content: string;
  likes: number;
  views: number;
  reads: number;
  url?: string;
}

// 洞察报告类型
export interface InsightReport {
  topLikedArticles: ArticleData[];
  topInteractiveArticles: (ArticleData & { interactionRate: number })[];
  wordCloud: { word: string; count: number }[];
  insights: string[];
}

// AI文章摘要类型
export interface ArticleSummary {
  articleUrl: string;
  title: string;
  summary: string;
  keyPoints: string[];
  keywords: string[];
  highlights: string[];
}

// 结构化洞察类型
export interface StructuredInsight {
  title: string;
  description: string;
  reasoning: string;
  targetAudience: string;
  contentAngle: string;
  suggestedTitles: string[];
  relatedArticles: string[];
  confidenceScore: number;
  tags: string[];
}

// AI增强洞察报告类型
export interface EnhancedInsightReport extends InsightReport {
  articleSummaries: ArticleSummary[];
  structuredInsights: StructuredInsight[];
  analysisMetadata: {
    totalArticlesAnalyzed: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    totalTokensUsed: number;
    estimatedCost: number;
    modelUsed: string;
    analysisTime: number;
  };
}

// 文章状态映射
export const StatusLabels: Record<Status, string> = {
  DRAFT: "草稿",
  PENDING: "待审核",
  PUBLISHED_XHS: "已发布-小红书",
  PUBLISHED_WECHAT: "已发布-公众号",
  PUBLISHED_ALL: "已发布-全平台",
};

// 平台映射
export const PlatformLabels: Record<Platform, string> = {
  XIAOHONGSHU: "小红书",
  WECHAT: "公众号",
};

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}
