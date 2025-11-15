"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiHeart, FiEye, FiFileText, FiRefreshCw, FiTrash2, FiChevronDown, FiChevronUp, FiStar } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";
import { formatDate, formatNumber } from "@/lib/utils";

interface InsightRecord {
  id: string;
  keyword: string;
  totalArticles: number;
  topLikedArticles: string;
  topInteractiveArticles: string;
  wordCloud: string;
  insights: string;
  createdAt: string;
  viewCount: number;
  isFavorite: boolean;
  lastViewedAt: string;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<InsightRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "favorites" | "7days" | "30days">("all");
  const [sortBy, setSortBy] = useState<"time" | "views">("time");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadRecords();
    // 自动刷新 - 每30秒刷新一次
    const interval = setInterval(() => {
      loadRecords(true);
    }, 30000);
    return () => clearInterval(interval);
  }, [filter, sortBy]);

  const loadRecords = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("filter", filter);
      if (sortBy) params.append("sortBy", sortBy);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/insights?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRecords();
  };

  const handleToggleExpand = async (id: string) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
      try {
        const response = await fetch(`/api/insights/${id}`);
        const data = await response.json();
        if (data.success) {
          setRecords(records.map(r => r.id === id ? data.data : r));
        }
      } catch (error) {
        console.error("获取详情失败:", error);
      }
    }
  };

  const handleToggleFavorite = async (id: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFavorite: !currentStatus }),
      });

      const data = await response.json();
      if (data.success) {
        setRecords(records.map(r => r.id === id ? { ...r, isFavorite: !currentStatus } : r));
      }
    } catch (error) {
      console.error("更新收藏状态失败:", error);
      alert("操作失败,请稍后重试");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这条记录吗?此操作不可恢复。")) {
      return;
    }

    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();
      if (data.success) {
        setRecords(records.filter(r => r.id !== id));
        if (expandedId === id) {
          setExpandedId(null);
        }
      }
    } catch (error) {
      console.error("删除失败:", error);
      alert("删除失败,请稍后重试");
    }
  };

  const handleReanalyze = async (keyword: string) => {
    if (!confirm(`确定要重新分析"${keyword}"吗?`)) {
      return;
    }

    try {
      const response = await fetch("/api/topic-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword }),
      });

      const data = await response.json();
      if (data.success) {
        alert("重新分析成功!");
        loadRecords();
      } else {
        alert(`分析失败: ${data.error || "未知错误"}`);
      }
    } catch (error) {
      console.error("重新分析失败:", error);
      alert("分析失败,请稍后重试");
    }
  };

  // 统计数据
  const stats = {
    total: records.length,
    favorites: records.filter(r => r.isFavorite).length,
    totalViews: records.reduce((sum, r) => sum + r.viewCount, 0),
    totalArticles: records.reduce((sum, r) => sum + r.totalArticles, 0),
  };

  return (
    <PageContainer
      title="历史记录"
      description="查看和管理所有的选题分析历史"
      actions={
        <div className="flex items-center gap-3">
          <button
            onClick={() => loadRecords()}
            className={`px-4 py-2 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-all flex items-center gap-2 text-gray-600 hover:text-purple-600`}
          >
            <FiRefreshCw className="w-4 h-4" />
            <span className="text-sm">最后更新: {formatDate(lastRefresh.toString())}</span>
          </button>
        </div>
      }
    >
      {/* 统计卡片 */}
      <Section>
        <GridLayout columns={4} gap={6}>
          <StatCard
            title="总记录"
            value={stats.total}
            icon={<FiFileText />}
            color="blue"
            description="全部分析记录"
          />
          <StatCard
            title="收藏数"
            value={stats.favorites}
            icon={<FiHeart />}
            color="pink"
            description="重要记录标记"
          />
          <StatCard
            title="总查看"
            value={stats.totalViews}
            icon={<FiEye />}
            color="green"
            description="累计查看次数"
          />
          <StatCard
            title="总文章"
            value={stats.totalArticles}
            icon={<FiStar />}
            color="orange"
            description="分析文章总数"
          />
        </GridLayout>
      </Section>

      {/* 筛选和搜索 */}
      <Section>
        <motion.div
          {...animations.fadeIn}
          className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
        >
          <div className="flex flex-col md:flex-row items-center gap-4">
            {/* 筛选按钮 */}
            <div className="flex gap-2 flex-wrap">
              {[
                { id: "all", label: "全部", icon: "📋" },
                { id: "favorites", label: "收藏", icon: "❤️" },
                { id: "7days", label: "近7天", icon: "📅" },
                { id: "30days", label: "近30天", icon: "📆" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id as any)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                    filter === item.id
                      ? `bg-gradient-to-r ${colors.gradients.purple} text-white shadow-md`
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>

            {/* 分隔线 */}
            <div className="h-6 w-px bg-gray-200 hidden md:block" />

            {/* 排序按钮 */}
            <div className="flex gap-2">
              <button
                onClick={() => setSortBy("time")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === "time"
                    ? `bg-gradient-to-r ${colors.gradients.purple} text-white`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                按时间
              </button>
              <button
                onClick={() => setSortBy("views")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === "views"
                    ? `bg-gradient-to-r ${colors.gradients.purple} text-white`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                按查看
              </button>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="搜索关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* 历史记录列表 */}
      <Section title="分析记录" description={`共 ${records.length} 条记录`}>
        {loading ? (
          // 加载状态
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : records.length === 0 ? (
          // 空状态
          <motion.div
            {...animations.fadeIn}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📋</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">还没有历史记录</h3>
            <p className="text-gray-600 mb-8">开始第一次选题分析吧</p>
          </motion.div>
        ) : (
          // 记录列表
          <div className="space-y-6">
            <AnimatePresence>
              {records.map((record, index) => (
                <motion.div
                  key={record.id}
                  {...animations.listItemEntrance(index)}
                >
                  <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:border-purple-200 hover:shadow-xl transition-all">
                    {/* 记录头部 */}
                    <div className="flex items-start gap-6">
                      {/* 时间轴图标 */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                          <FiClock className="w-8 h-8 text-purple-600" />
                        </div>
                      </div>

                      {/* 记录内容 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900">
                            {record.keyword}
                          </h3>
                          {record.isFavorite && (
                            <span className="px-2 py-1 bg-gradient-to-r from-rose-400 to-pink-400 text-white text-xs rounded-full flex items-center gap-1">
                              <FiHeart className="w-3 h-3" />
                              收藏
                            </span>
                          )}
                        </div>

                        {/* 统计信息 */}
                        <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                          <span className="flex items-center gap-1.5">
                            <FiFileText className="w-4 h-4" />
                            <span className="font-semibold">{record.totalArticles}</span> 篇文章
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FiStar className="w-4 h-4" />
                            <span className="font-semibold">{JSON.parse(record.insights).length}</span> 个洞察
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FiEye className="w-4 h-4 text-purple-500" />
                            <span className="font-semibold">{record.viewCount}</span> 次查看
                          </span>
                          <span className="flex items-center gap-1.5">
                            <FiClock className="w-4 h-4" />
                            {formatDate(record.createdAt)}
                          </span>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleExpand(record.id)}
                            className="px-4 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors flex items-center gap-2"
                          >
                            {expandedId === record.id ? <FiChevronUp /> : <FiChevronDown />}
                            {expandedId === record.id ? "收起" : "查看详情"}
                          </button>
                          <button
                            onClick={() => handleReanalyze(record.keyword)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center gap-2"
                          >
                            <FiRefreshCw className="w-4 h-4" />
                            重新分析
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(record.id, record.isFavorite)}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                              record.isFavorite
                                ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                                : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                            }`}
                          >
                            <FiHeart className={`w-4 h-4 ${record.isFavorite ? "fill-current" : ""}`} />
                            {record.isFavorite ? "取消收藏" : "收藏"}
                          </button>
                          <button
                            onClick={() => handleDelete(record.id)}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            删除
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 展开的详细信息 */}
                    {expandedId === record.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-6 pt-6 border-t-2 border-gray-100"
                      >
                        <GridLayout columns={2} gap={6}>
                          {/* 点赞量 TOP5 */}
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">👍</span>
                              </span>
                              点赞量 TOP5
                            </h4>
                            <div className="space-y-3">
                              {JSON.parse(record.topLikedArticles).map((article: any, i: number) => (
                                <div key={i} className="p-3 bg-rose-50 rounded-lg">
                                  <p className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">{article.title}</p>
                                  <div className="flex items-center gap-3 text-xs text-gray-500">
                                    <span>👍 {formatNumber(article.likes)}</span>
                                    <span>👁️ {formatNumber(article.views)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 互动率 TOP5 */}
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">🔥</span>
                              </span>
                              互动率 TOP5
                            </h4>
                            <div className="space-y-3">
                              {JSON.parse(record.topInteractiveArticles).map((article: any, i: number) => (
                                <div key={i} className="p-3 bg-purple-50 rounded-lg">
                                  <p className="font-medium text-gray-900 text-sm mb-2 line-clamp-1">{article.title}</p>
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                                      <div
                                        className={`h-full bg-gradient-to-r ${colors.gradients.purple} rounded-full`}
                                        style={{ width: `${Math.min(article.interactionRate * 5, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-xs font-bold text-purple-600">
                                      {article.interactionRate.toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 高频词云 */}
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">💬</span>
                              </span>
                              高频词云
                            </h4>
                            <div className="flex flex-wrap gap-2 p-4 bg-blue-50 rounded-lg">
                              {JSON.parse(record.wordCloud).slice(0, 15).map((word: any, i: number) => (
                                <span
                                  key={i}
                                  className={`px-3 py-1 bg-gradient-to-br ${colors.gradients.blue} text-white rounded-lg text-sm font-medium`}
                                >
                                  {word.word}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* 选题洞察 */}
                          <div>
                            <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                              <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                <span className="text-white text-sm">💡</span>
                              </span>
                              选题洞察
                            </h4>
                            <div className="space-y-2">
                              {JSON.parse(record.insights).map((insight: string, i: number) => (
                                <div key={i} className="p-3 bg-emerald-50 rounded-lg flex items-start gap-3">
                                  <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                    {i + 1}
                                  </span>
                                  <p className="flex-1 text-gray-700 text-sm leading-relaxed">{insight}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </GridLayout>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
