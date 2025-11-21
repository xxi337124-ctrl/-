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

// ==================== 公众号发布相关类型 ====================

// 公众号账号信息
export interface WechatAccount {
  name: string;              // 公众号名称
  wechatAppid: string;       // 公众号AppID
  username: string;          // 公众号原始ID
  avatar: string;            // 公众号头像URL
  type: 'subscription' | 'service';  // 公众号类型
  verified: boolean;         // 是否认证
  status: 'active' | 'revoked';      // 状态
  lastAuthTime?: string;     // 最后授权时间
  createdAt?: string;        // 创建时间
}

// 公众号发布配置
export interface WechatPublishConfig {
  wechatAppid: string;                          // 选中的公众号AppID
  articleType: 'news' | 'newspic';              // 发布类型
  author?: string;                              // 作者名称
  coverImage?: string;                          // 封面图URL
  coverImageSource?: 'auto' | 'custom' | 'none'; // 封面图来源
}

// 公众号发布请求参数
export interface WechatPublishRequest {
  articleId: string;                            // 文章ID
  wechatAppid: string;                          // 公众号AppID
  title: string;                                // 文章标题
  content: string;                              // 文章内容
  summary?: string;                             // 文章摘要
  coverImage?: string;                          // 封面图URL
  author?: string;                              // 作者名称
  contentFormat?: 'markdown' | 'html';          // 内容格式
  articleType?: 'news' | 'newspic';             // 文章类型
}

// 公众号发布响应
export interface WechatPublishResponse {
  success: boolean;
  data?: {
    publicationId: string;    // 发布ID
    materialId: string;       // 素材ID
    mediaId: string;          // 媒体ID
    status: string;           // 状态
    message: string;          // 消息
  };
  error?: string;
  code?: string;              // 错误码
}
