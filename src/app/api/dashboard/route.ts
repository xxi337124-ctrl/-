import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // 获取今天和昨天的日期
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    // 今日分析数
    const todayInsights = await prisma.insights.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 昨日分析数
    const yesterdayInsights = await prisma.insights.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // 今日生成文章数
    const todayArticles = await prisma.articles.count({
      where: {
        createdAt: {
          gte: today,
        },
      },
    });

    // 昨日生成文章数
    const yesterdayArticles = await prisma.articles.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
      },
    });

    // 今日发布数
    const todayPublished = await prisma.articles.count({
      where: {
        createdAt: {
          gte: today,
        },
        status: {
          in: ["PUBLISHED_XHS", "PUBLISHED_WECHAT", "PUBLISHED_ALL"],
        },
      },
    });

    // 昨日发布数
    const yesterdayPublished = await prisma.articles.count({
      where: {
        createdAt: {
          gte: yesterday,
          lt: today,
        },
        status: {
          in: ["PUBLISHED_XHS", "PUBLISHED_WECHAT", "PUBLISHED_ALL"],
        },
      },
    });

    // 待审核数
    const pending = await prisma.articles.count({
      where: {
        status: "PENDING",
      },
    });

    // 计算趋势
    const analysisTrend = yesterdayInsights > 0
      ? `${todayInsights >= yesterdayInsights ? '+' : ''}${Math.round(((todayInsights - yesterdayInsights) / yesterdayInsights) * 100)}%`
      : "+0%";

    const articlesTrend = yesterdayArticles > 0
      ? `${todayArticles >= yesterdayArticles ? '+' : ''}${Math.round(((todayArticles - yesterdayArticles) / yesterdayArticles) * 100)}%`
      : "+0%";

    const publishedTrend = yesterdayPublished > 0
      ? `${todayPublished >= yesterdayPublished ? '+' : ''}${Math.round(((todayPublished - yesterdayPublished) / yesterdayPublished) * 100)}%`
      : "+0%";

    // 获取最近7天的数据用于图表
    const weekData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayName = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][date.getDay()];

      const analysis = await prisma.insights.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const creation = await prisma.articles.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      const publish = await prisma.articles.count({
        where: {
          createdAt: {
            gte: date,
            lt: nextDate,
          },
          status: {
            in: ["PUBLISHED_XHS", "PUBLISHED_WECHAT", "PUBLISHED_ALL"],
          },
        },
      });

      weekData.push({
        day: dayName,
        analysis,
        creation,
        publish,
      });
    }

    // 获取平台分布统计
    const xhsPublished = await prisma.articles.count({
      where: {
        status: {
          in: ["PUBLISHED_XHS", "PUBLISHED_ALL"],
        },
      },
    });

    const wechatPublished = await prisma.articles.count({
      where: {
        status: {
          in: ["PUBLISHED_WECHAT", "PUBLISHED_ALL"],
        },
      },
    });

    const totalPublished = xhsPublished + wechatPublished;

    const platformStats = {
      xiaohongshu: totalPublished > 0 ? Math.round((xhsPublished / totalPublished) * 100) : 50,
      wechat: totalPublished > 0 ? Math.round((wechatPublished / totalPublished) * 100) : 50,
    };

    // 获取最新文章
    const latestArticles = await prisma.articles.findMany({
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        title: true,
        wordCount: true,
        createdAt: true,
      },
    });

    // 获取热门关键词（从洞察中统计）
    const allInsights = await prisma.insights.findMany({
      where: {
        createdAt: {
          gte: weekAgo,
        },
      },
      select: {
        keyword: true,
      },
    });

    // 统计关键词频率
    const keywordMap = new Map<string, number>();
    allInsights.forEach(insight => {
      const count = keywordMap.get(insight.keyword) || 0;
      keywordMap.set(insight.keyword, count + 1);
    });

    const hotTopics = Array.from(keywordMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([keyword]) => keyword);

    // 如果没有热门话题，使用默认值
    const defaultTopics = ["AI工具", "效率提升", "副业赚钱", "营销技巧", "个人成长"];
    const topics = hotTopics.length > 0 ? hotTopics : defaultTopics;

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          todayAnalysis: todayInsights,
          todayAnalysisTrend: analysisTrend,
          articlesCreated: todayArticles,
          articlesCreatedTrend: articlesTrend,
          published: todayPublished,
          publishedTrend: publishedTrend,
          pending,
          pendingTrend: "+0%", // 待审核数量趋势暂时固定
        },
        weekData,
        platformStats,
        latestArticles: latestArticles.map(article => ({
          ...article,
          timeAgo: getTimeAgo(article.createdAt),
        })),
        hotTopics: topics,
      },
    });
  } catch (error) {
    console.error("获取仪表盘数据失败:", error);
    return NextResponse.json(
      { success: false, error: "获取数据失败" },
      { status: 500 }
    );
  }
}

// 计算相对时间
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));

  if (hours < 1) {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}分钟前`;
  } else if (hours < 24) {
    return `${hours}小时前`;
  } else {
    const days = Math.floor(hours / 24);
    return `${days}天前`;
  }
}
