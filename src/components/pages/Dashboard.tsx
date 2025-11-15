"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    todayAnalysis: 0,
    todayAnalysisTrend: "+0%",
    articlesCreated: 0,
    articlesCreatedTrend: "+0%",
    published: 0,
    publishedTrend: "+0%",
    pending: 0,
    pendingTrend: "+0%",
  });

  const [weekData, setWeekData] = useState([
    { day: "周一", analysis: 0, creation: 0, publish: 0 },
    { day: "周二", analysis: 0, creation: 0, publish: 0 },
    { day: "周三", analysis: 0, creation: 0, publish: 0 },
    { day: "周四", analysis: 0, creation: 0, publish: 0 },
    { day: "周五", analysis: 0, creation: 0, publish: 0 },
    { day: "周六", analysis: 0, creation: 0, publish: 0 },
    { day: "周日", analysis: 0, creation: 0, publish: 0 },
  ]);

  const [platformStats, setPlatformStats] = useState({
    xiaohongshu: 50,
    wechat: 50,
  });

  const [latestArticles, setLatestArticles] = useState<any[]>([]);
  const [hotTopics, setHotTopics] = useState<string[]>(["AI工具", "效率提升", "副业赚钱", "营销技巧", "个人成长"]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (!mounted) return;

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/dashboard");

        if (!mounted) return;

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!mounted) return;

        if (data.success) {
          setStats(data.data.stats);
          setWeekData(data.data.weekData);
          setPlatformStats(data.data.platformStats);
          setLatestArticles(data.data.latestArticles || []);
          setHotTopics(data.data.hotTopics || ["AI工具", "效率提升", "副业赚钱", "营销技巧", "个人成长"]);
        } else {
          throw new Error(data.error || "未知错误");
        }
      } catch (error) {
        console.error("加载仪表盘数据失败:", error);
        if (mounted) {
          setError(error instanceof Error ? error.message : "加载数据失败");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 via-white to-indigo-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">仪表盘</h1>
          <p className="text-sm text-gray-500">欢迎回来! 这是您的内容工厂数据概览</p>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <span className="text-red-700 text-sm font-medium">加载失败: {error}</span>
            </div>
          </div>
        )}

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {/* 今日分析 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">今日分析</p>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.todayAnalysis}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600 font-medium">{stats.todayAnalysisTrend}</span>
                    <span className="text-gray-400">vs 昨日</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 生成文章 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">生成文章</p>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.articlesCreated}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600 font-medium">{stats.articlesCreatedTrend}</span>
                    <span className="text-gray-400">vs 昨日</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 已发布 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">已发布</p>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.published}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-green-600 font-medium">{stats.publishedTrend}</span>
                    <span className="text-gray-400">vs 昨日</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 待审核 */}
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-2">待审核</p>
                  <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.pending}</h3>
                  <div className="flex items-center gap-1 text-sm">
                    <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-red-600 font-medium">{stats.pendingTrend}</span>
                    <span className="text-gray-400">vs 昨日</span>
                  </div>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 图表区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* 内容生产趋势 */}
          <Card className="lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">内容生产趋势</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-80 relative">
                {/* 简化的SVG折线图 */}
                <svg className="w-full h-full" viewBox="0 0 700 300">
                  {/* 网格线 */}
                  <line x1="50" y1="250" x2="650" y2="250" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="200" x2="650" y2="200" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="150" x2="650" y2="150" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="100" x2="650" y2="100" stroke="#e5e7eb" strokeWidth="1" />
                  <line x1="50" y1="50" x2="650" y2="50" stroke="#e5e7eb" strokeWidth="1" />

                  {/* 分析线 (蓝色) */}
                  <polyline
                    points="50,220 150,200 250,170 350,140 450,100 550,120 650,110"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                  />

                  {/* 创作线 (绿色) */}
                  <polyline
                    points="50,240 150,225 250,200 350,175 450,150 550,160 650,155"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3"
                  />

                  {/* 发布线 (紫色) */}
                  <polyline
                    points="50,250 150,240 250,230 350,215 450,200 550,205 650,200"
                    fill="none"
                    stroke="#8b5cf6"
                    strokeWidth="3"
                  />

                  {/* X轴标签 */}
                  {weekData.map((item, i) => (
                    <text key={i} x={50 + i * 100} y="280" textAnchor="middle" className="text-xs fill-gray-500">
                      {item.day}
                    </text>
                  ))}
                </svg>

                {/* 图例 */}
                <div className="flex items-center justify-center gap-6 mt-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span className="text-sm text-gray-600">分析</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-sm text-gray-600">创作</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                    <span className="text-sm text-gray-600">发布</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 发布平台分布 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">发布平台分布</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center h-80">
                {/* 环形图 */}
                <div className="relative w-64 h-64">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="40"
                      strokeDasharray={`${platformStats.xiaohongshu * 4.4} 440`}
                      transform="rotate(-90 100 100)"
                    />
                    <circle
                      cx="100"
                      cy="100"
                      r="70"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="40"
                      strokeDasharray={`${platformStats.wechat * 4.4} 440`}
                      strokeDashoffset={`-${platformStats.xiaohongshu * 4.4}`}
                      transform="rotate(-90 100 100)"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-4xl font-bold text-gray-900">100%</div>
                      <div className="text-sm text-gray-500">覆盖率</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 平台列表 */}
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                    <span className="text-gray-700">小红书</span>
                  </div>
                  <span className="font-bold text-gray-900">{platformStats.xiaohongshu}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                    <span className="text-gray-700">公众号</span>
                  </div>
                  <span className="font-bold text-gray-900">{platformStats.wechat}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最新文章和热门话题 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 最新文章 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">最新文章</CardTitle>
                <a href="/publish-management" className="text-sm text-indigo-500 hover:text-indigo-600 flex items-center gap-1">
                  查看全部
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </a>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center text-gray-500 py-8">加载中...</div>
                ) : latestArticles.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">暂无文章</div>
                ) : (
                  latestArticles.map((article) => (
                    <div key={article.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">{article.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">{article.timeAgo} · {article.wordCount}字</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* 热门话题 */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-xl">热门话题</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {loading ? (
                  <div className="text-center text-gray-500 py-8">加载中...</div>
                ) : (
                  hotTopics.map((topic, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 text-white rounded-md flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </span>
                        <span className="text-gray-700">{topic}</span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">热</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
