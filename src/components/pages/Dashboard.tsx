"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiTrendingUp, FiFileText, FiSend, FiClock, FiBarChart2, FiPieChart, FiActivity } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";

interface DashboardStats {
  todayAnalysis: number;
  todayAnalysisTrend: string;
  articlesCreated: number;
  articlesCreatedTrend: string;
  published: number;
  publishedTrend: string;
  pending: number;
  pendingTrend: string;
}

interface WeekDataItem {
  day: string;
  analysis: number;
  creation: number;
  publish: number;
}

interface PlatformStats {
  xiaohongshu: number;
  wechat: number;
}

interface LatestArticle {
  id: string;
  title: string;
  timeAgo: string;
  wordCount: number;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    todayAnalysis: 0,
    todayAnalysisTrend: "+0%",
    articlesCreated: 0,
    articlesCreatedTrend: "+0%",
    published: 0,
    publishedTrend: "+0%",
    pending: 0,
    pendingTrend: "+0%",
  });

  const [weekData, setWeekData] = useState<WeekDataItem[]>([
    { day: "周一", analysis: 0, creation: 0, publish: 0 },
    { day: "周二", analysis: 0, creation: 0, publish: 0 },
    { day: "周三", analysis: 0, creation: 0, publish: 0 },
    { day: "周四", analysis: 0, creation: 0, publish: 0 },
    { day: "周五", analysis: 0, creation: 0, publish: 0 },
    { day: "周六", analysis: 0, creation: 0, publish: 0 },
    { day: "周日", analysis: 0, creation: 0, publish: 0 },
  ]);

  const [platformStats, setPlatformStats] = useState<PlatformStats>({
    xiaohongshu: 50,
    wechat: 50,
  });

  const [latestArticles, setLatestArticles] = useState<LatestArticle[]>([]);
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

  // 解析趋势数据
  const parseTrend = (trendString: string) => {
    const value = parseFloat(trendString.replace(/[^0-9.-]/g, ""));
    const isPositive = trendString.includes("+");
    return { value: Math.abs(value), isPositive };
  };

  return (
    <PageContainer
      title="数据概览中心"
      description="实时监控您的内容工厂数据表现"
      actions={
        <Link href="/?tab=smart-creation">
          <button className={`px-6 py-3 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}>
            <FiSend className="w-5 h-5" />
            新建创作
          </button>
        </Link>
      }
    >
      {/* 错误提示 */}
      {error && (
        <motion.div
          {...animations.fadeIn}
          className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl"
        >
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span className="text-red-700 text-sm font-medium">加载失败: {error}</span>
          </div>
        </motion.div>
      )}

      {/* 统计卡片 */}
      <Section>
        <GridLayout columns={4} gap={6}>
          <StatCard
            title="今日分析"
            value={stats.todayAnalysis}
            icon={<FiBarChart2 />}
            color="blue"
            trend={parseTrend(stats.todayAnalysisTrend)}
            description="vs 昨日"
          />
          <StatCard
            title="生成文章"
            value={stats.articlesCreated}
            icon={<FiFileText />}
            color="green"
            trend={parseTrend(stats.articlesCreatedTrend)}
            description="vs 昨日"
          />
          <StatCard
            title="已发布"
            value={stats.published}
            icon={<FiSend />}
            color="purple"
            trend={parseTrend(stats.publishedTrend)}
            description="vs 昨日"
          />
          <StatCard
            title="待审核"
            value={stats.pending}
            icon={<FiClock />}
            color="orange"
            trend={parseTrend(stats.pendingTrend)}
            description="vs 昨日"
          />
        </GridLayout>
      </Section>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* 内容生产趋势 */}
        <motion.div
          {...animations.fadeIn}
          className="lg:col-span-2 bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradients.purple} rounded-lg flex items-center justify-center`}>
                <FiActivity className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">内容生产趋势</h3>
            </div>
            <p className="text-sm text-gray-500">过去7天的数据变化</p>
          </div>

          <div className="h-80 relative">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
              </div>
            ) : (
              <>
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
              </>
            )}
          </div>
        </motion.div>

        {/* 发布平台分布 */}
        <motion.div
          {...animations.fadeIn}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradients.pink} rounded-lg flex items-center justify-center`}>
                <FiPieChart className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">平台分布</h3>
            </div>
            <p className="text-sm text-gray-500">内容发布占比</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full"></div>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center h-64">
                {/* 环形图 */}
                <div className="relative w-48 h-48">
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
                      <div className="text-3xl font-bold text-gray-900">100%</div>
                      <div className="text-xs text-gray-500">覆盖率</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 平台列表 */}
              <div className="space-y-3 mt-4">
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-red-400 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">📕</span>
                    </div>
                    <span className="text-gray-700 font-medium">小红书</span>
                  </div>
                  <span className="font-bold text-gray-900">{platformStats.xiaohongshu}%</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg flex items-center justify-center">
                      <span className="text-white text-sm">💬</span>
                    </div>
                    <span className="text-gray-700 font-medium">公众号</span>
                  </div>
                  <span className="font-bold text-gray-900">{platformStats.wechat}%</span>
                </div>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* 最新文章和热门话题 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 最新文章 */}
        <motion.div
          {...animations.fadeIn}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradients.blue} rounded-lg flex items-center justify-center`}>
                <FiFileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">最新文章</h3>
                <p className="text-sm text-gray-500">最近创作的内容</p>
              </div>
            </div>
            <Link href="/publish-management">
              <button className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1 font-medium">
                查看全部
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
              </div>
            ) : latestArticles.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-3xl">📝</span>
                </div>
                <p className="text-gray-500 text-sm">暂无文章</p>
              </div>
            ) : (
              <AnimatePresence>
                {latestArticles.map((article, index) => (
                  <motion.div
                    key={article.id}
                    {...animations.listItemEntrance(index)}
                  >
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-purple-50 transition-all duration-300 cursor-pointer group">
                      <div className={`w-12 h-12 bg-gradient-to-br ${colors.gradients.purple} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                        <FiFileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {article.timeAgo} · {article.wordCount}字
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* 热门话题 */}
        <motion.div
          {...animations.fadeIn}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className={`w-10 h-10 bg-gradient-to-br ${colors.gradients.orange} rounded-lg flex items-center justify-center`}>
              <FiTrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">热门话题</h3>
              <p className="text-sm text-gray-500">当前热度最高</p>
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <div className="text-center text-gray-500 py-8">
                <div className="animate-spin w-6 h-6 border-4 border-purple-200 border-t-purple-600 rounded-full mx-auto"></div>
              </div>
            ) : (
              <AnimatePresence>
                {hotTopics.map((topic, i) => (
                  <motion.div
                    key={i}
                    {...animations.listItemEntrance(i)}
                  >
                    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50 transition-all duration-300 cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 bg-gradient-to-br ${colors.gradients.orange} text-white rounded-lg flex items-center justify-center text-sm font-bold group-hover:scale-110 transition-transform`}>
                          {i + 1}
                        </span>
                        <span className="text-gray-700 font-medium group-hover:text-orange-600 transition-colors">
                          {topic}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-orange-500">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-medium">热</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </motion.div>
      </div>
    </PageContainer>
  );
}
