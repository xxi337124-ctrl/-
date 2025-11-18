"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiClock, FiHeart, FiEye, FiFileText, FiRefreshCw, FiTrash2, FiChevronDown, FiChevronUp, FiStar } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";
import { formatDate, formatNumber } from "@/lib/utils";

interface PublishRecord {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  status: string;
  images: string;
  tags: string;
  createdAt: string;
  updatedAt: string;
  publishes: Array<{
    id: string;
    platform: string;
    publishedAt: string;
    result: string;
  }>;
}

export default function HistoryPage() {
  const [records, setRecords] = useState<PublishRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "xiaohongshu" | "wechat" | "both">("all");
  const [sortBy, setSortBy] = useState<"time" | "wordCount">("time");
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
      // 只获取已发布的文章
      params.append("status", "PUBLISHED");
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/articles?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      const data = await response.json();

      if (data.success) {
        let filteredRecords = data.data;

        // 按平台筛选
        if (filter !== "all") {
          filteredRecords = filteredRecords.filter((record: PublishRecord) => {
            if (filter === "xiaohongshu") {
              return record.publishes.some(p => p.platform === "xiaohongshu");
            } else if (filter === "wechat") {
              return record.publishes.some(p => p.platform === "wechat");
            } else if (filter === "both") {
              const platforms = record.publishes.map(p => p.platform);
              return platforms.includes("xiaohongshu") && platforms.includes("wechat");
            }
            return true;
          });
        }

        // 排序
        if (sortBy === "wordCount") {
          filteredRecords.sort((a: PublishRecord, b: PublishRecord) => b.wordCount - a.wordCount);
        }

        setRecords(filteredRecords);
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
        const response = await fetch(`/api/articles/${id}`);
        const data = await response.json();
        if (data.success) {
          setRecords(records.map(r => r.id === id ? data.data : r));
        }
      } catch (error) {
        console.error("获取详情失败:", error);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("确定要删除这篇文章吗?此操作不可恢复。")) {
      return;
    }

    try {
      const response = await fetch(`/api/articles/${id}`, {
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

  // 统计数据
  const stats = {
    total: records.length,
    xiaohongshu: records.filter(r => r.publishes.some(p => p.platform === "xiaohongshu")).length,
    wechat: records.filter(r => r.publishes.some(p => p.platform === "wechat")).length,
    totalWords: records.reduce((sum, r) => sum + r.wordCount, 0),
  };

  return (
    <PageContainer
      title="历史记录"
      description="查看和管理所有已发布的文章"
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
            title="总发布"
            value={stats.total}
            icon={<FiFileText />}
            color="blue"
            description="已发布文章总数"
          />
          <StatCard
            title="小红书"
            value={stats.xiaohongshu}
            icon={<FiFileText />}
            color="pink"
            description="小红书平台"
          />
          <StatCard
            title="公众号"
            value={stats.wechat}
            icon={<FiFileText />}
            color="green"
            description="微信公众号平台"
          />
          <StatCard
            title="总字数"
            value={formatNumber(stats.totalWords)}
            icon={<FiStar />}
            color="orange"
            description="累计创作字数"
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
                { id: "xiaohongshu", label: "小红书", icon: "📕" },
                { id: "wechat", label: "公众号", icon: "📄" },
                { id: "both", label: "多平台", icon: "🔗" },
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
                onClick={() => setSortBy("wordCount")}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  sortBy === "wordCount"
                    ? `bg-gradient-to-r ${colors.gradients.purple} text-white`
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                按字数
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
                  placeholder="搜索标题..."
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
      <Section title="发布记录" description={`共 ${records.length} 篇文章`}>
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
            <h3 className="text-2xl font-bold text-gray-900 mb-3">还没有发布记录</h3>
            <p className="text-gray-600 mb-8">从发布管理发布文章后将显示在这里</p>
          </motion.div>
        ) : (
          // 记录列表
          <div className="space-y-6">
            <AnimatePresence>
              {records.map((record, index) => {
                const images = JSON.parse(record.images || '[]');
                const tags = JSON.parse(record.tags || '[]');
                const platforms = record.publishes.map(p => p.platform);

                return (
                  <motion.div
                    key={record.id}
                    {...animations.listItemEntrance(index)}
                  >
                    <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 hover:border-purple-200 hover:shadow-xl transition-all">
                      {/* 记录头部 */}
                      <div className="flex items-start gap-6">
                        {/* 首图或图标 */}
                        <div className="flex-shrink-0">
                          {images.length > 0 ? (
                            <img
                              src={images[0]}
                              alt={record.title}
                              className="w-24 h-24 rounded-2xl object-cover"
                            />
                          ) : (
                            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center">
                              <FiFileText className="w-12 h-12 text-purple-600" />
                            </div>
                          )}
                        </div>

                        {/* 记录内容 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-gray-900 line-clamp-1">
                              {record.title}
                            </h3>
                            {platforms.map(platform => (
                              <span
                                key={platform}
                                className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${
                                  platform === 'xiaohongshu'
                                    ? 'bg-gradient-to-r from-rose-400 to-pink-400 text-white'
                                    : 'bg-gradient-to-r from-green-400 to-emerald-400 text-white'
                                }`}
                              >
                                {platform === 'xiaohongshu' ? '📕 小红书' : '📄 公众号'}
                              </span>
                            ))}
                          </div>

                          {/* 统计信息 */}
                          <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                            <span className="flex items-center gap-1.5">
                              <FiFileText className="w-4 h-4" />
                              <span className="font-semibold">{record.wordCount}</span> 字
                            </span>
                            {images.length > 0 && (
                              <span className="flex items-center gap-1.5">
                                <FiStar className="w-4 h-4" />
                                <span className="font-semibold">{images.length}</span> 张配图
                              </span>
                            )}
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
                          <div className="space-y-6">
                            {/* 文章内容 */}
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-sm">📄</span>
                                </span>
                                文章内容
                              </h4>
                              <div
                                className="prose prose-sm max-w-none p-4 bg-gray-50 rounded-lg max-h-96 overflow-y-auto"
                                dangerouslySetInnerHTML={{ __html: record.content }}
                              />
                            </div>

                            {/* 配图展示 */}
                            {images.length > 0 && (
                              <div>
                                <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                  <span className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                                    <span className="text-white text-sm">🖼️</span>
                                  </span>
                                  配图 ({images.length} 张)
                                </h4>
                                <div className="grid grid-cols-3 gap-4">
                                  {images.map((img: string, i: number) => (
                                    <div key={i} className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                                      <img
                                        src={img}
                                        alt={`配图 ${i + 1}`}
                                        className="w-full h-full object-cover hover:scale-110 transition-transform cursor-pointer"
                                        onClick={() => window.open(img, '_blank')}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* 发布记录 */}
                            <div>
                              <h4 className="font-bold text-lg text-gray-900 mb-4 flex items-center gap-2">
                                <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                                  <span className="text-white text-sm">📤</span>
                                </span>
                                发布记录
                              </h4>
                              <div className="space-y-3">
                                {record.publishes.map((publish, i) => (
                                  <div key={i} className="p-4 bg-emerald-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium text-gray-900">
                                        {publish.platform === 'xiaohongshu' ? '📕 小红书' : '📄 公众号'}
                                      </span>
                                      <span className="text-sm text-gray-600">
                                        {formatDate(publish.publishedAt)}
                                      </span>
                                    </div>
                                    {publish.result && (
                                      <p className="text-sm text-gray-600">{publish.result}</p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Section>
    </PageContainer>
  );
}
