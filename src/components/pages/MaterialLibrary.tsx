"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiSearch, FiClock, FiFileText, FiTrendingUp, FiBookmark, FiRefreshCw, FiTrash, FiTrash2 } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { ContentCard, StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";
import { formatDate } from "@/lib/utils";

interface MaterialArticle {
  title: string;
  content: string; // 小红书和公众号都使用 content
  images?: string[]; // 小红书使用 images 数组
  url: string;
  likes?: number;  // 小红书
  comments?: number; // 小红书
  author?: string | { name?: string; avatar?: string; userId?: string }; // 小红书作者 - 可能是字符串或对象
  authorAvatar?: string; // 小红书作者头像
  publishTime?: string;
  platform?: string;
}

interface Material {
  id: string;
  keyword: string;
  searchType: string;
  totalArticles: number;
  articles: MaterialArticle[];
  createdAt: string;
}

export default function MaterialLibraryPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "xiaohongshu" | "wechat">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewArticle, setPreviewArticle] = useState<MaterialArticle | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  useEffect(() => {
    loadMaterials();
    // 自动刷新 - 每10秒刷新一次
    const interval = setInterval(() => {
      loadMaterials(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  const loadMaterials = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await fetch("/api/materials", {
        cache: "no-store",
        headers: {
          "Cache-Control": "no-cache",
          "Pragma": "no-cache",
        },
      });
      const data = await response.json();

      if (data.success) {
        let filteredMaterials = data.data;

        // 按平台筛选
        if (filter !== "all") {
          filteredMaterials = filteredMaterials.filter((m: Material) => {
            if (filter === "xiaohongshu") {
              return m.searchType.includes("xiaohongshu");
            } else if (filter === "wechat") {
              return m.searchType.includes("wechat");
            }
            return true;
          });
        }

        // 按关键词搜索
        if (searchQuery) {
          filteredMaterials = filteredMaterials.filter((m: Material) =>
            m.keyword.toLowerCase().includes(searchQuery.toLowerCase())
          );
        }

        setMaterials(filteredMaterials);
      }
    } catch (error) {
      console.error("加载素材库失败:", error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const handleSearch = () => {
    loadMaterials();
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const openPreviewModal = (article: MaterialArticle) => {
    setPreviewArticle(article);
    setShowPreviewModal(true);
  };

  const closePreviewModal = () => {
    setShowPreviewModal(false);
    setPreviewArticle(null);
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm("确定要删除这个素材吗?")) return;

    try {
      const response = await fetch(`/api/materials/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("素材已删除");
        loadMaterials(); // 重新加载列表
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error("删除素材失败:", error);
      alert("删除失败");
    }
  };

  const handleCleanupOldMaterials = async () => {
    // 删除3天前的所有素材
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    if (!confirm(`确定要清理 ${threeDaysAgo.toLocaleDateString()} 之前的旧素材吗？这些素材的图片链接可能已过期。`)) {
      return;
    }

    try {
      // 先查询有多少条旧素材
      const checkResponse = await fetch(`/api/materials/cleanup?beforeDate=${threeDaysAgo.toISOString()}`);
      const checkData = await checkResponse.json();

      if (!checkData.success) {
        alert(`查询失败: ${checkData.error}`);
        return;
      }

      if (checkData.count === 0) {
        alert("没有找到需要清理的旧素材");
        return;
      }

      if (!confirm(`找到 ${checkData.count} 条旧素材记录，确定要删除吗？`)) {
        return;
      }

      // 执行清理
      const response = await fetch("/api/materials/cleanup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ beforeDate: threeDaysAgo.toISOString() }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`成功清理了 ${data.deletedCount} 条旧素材记录`);
        loadMaterials(); // 重新加载列表
      } else {
        alert(`清理失败: ${data.error}`);
      }
    } catch (error) {
      console.error("清理旧素材失败:", error);
      alert("清理失败");
    }
  };

  const getPlatformName = (searchType: string) => {
    if (searchType.includes("xiaohongshu")) return "小红书";
    if (searchType.includes("wechat")) return "公众号";
    return "未知平台";
  };

  // 处理小红书图片URL,通过代理避免403错误
  const getProxiedImageUrl = (url: string) => {
    if (!url) return url;

    // 检查是否是小红书CDN的图片
    if (url.includes("xhscdn.com") || url.includes("xiaohongshu.com")) {
      return `/api/proxy-image?url=${encodeURIComponent(url)}`;
    }

    return url;
  };

  const getPlatformIcon = (searchType: string) => {
    if (searchType.includes("xiaohongshu")) return "📕";
    if (searchType.includes("wechat")) return "💬";
    return "📄";
  };

  // 统计数据
  const stats = {
    total: materials.reduce((sum, m) => sum + m.totalArticles, 0),
    collections: materials.length,
    xiaohongshu: materials.filter(m => m.searchType.includes("xiaohongshu")).reduce((sum, m) => sum + m.totalArticles, 0),
    wechat: materials.filter(m => m.searchType.includes("wechat")).reduce((sum, m) => sum + m.totalArticles, 0),
  };

  return (
    <PageContainer
      title="素材库"
      description="管理和浏览所有收集的创作素材"
      actions={
        <Link href="/topic-analysis">
          <button className={`px-6 py-3 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}>
            <FiSearch className="w-5 h-5" />
            搜索新素材
          </button>
        </Link>
      }
    >
      {/* 统计卡片 */}
      <Section>
        <GridLayout columns={4} gap={6}>
          <StatCard
            title="素材总数"
            value={stats.total}
            icon={<FiFileText />}
            color="blue"
            description="所有收集的文章"
          />
          <StatCard
            title="搜索记录"
            value={stats.collections}
            icon={<FiBookmark />}
            color="purple"
            description="搜索次数"
          />
          <StatCard
            title="小红书素材"
            value={stats.xiaohongshu}
            icon={<FiTrendingUp />}
            color="red"
            description="小红书文章"
          />
          <StatCard
            title="公众号素材"
            value={stats.wechat}
            icon={<FiTrendingUp />}
            color="green"
            description="公众号文章"
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
                { id: "wechat", label: "公众号", icon: "💬" },
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

            {/* 搜索框 */}
            <div className="flex-1 w-full md:w-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <FiSearch className="w-5 h-5" />
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

            {/* 刷新按钮 */}
            <button
              onClick={() => loadMaterials()}
              className="px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-purple-500 transition-all flex items-center gap-2 text-gray-600 hover:text-purple-600"
            >
              <FiRefreshCw className="w-4 h-4" />
              <span className="text-sm">刷新</span>
            </button>

            {/* 清理旧数据按钮 */}
            <button
              onClick={handleCleanupOldMaterials}
              className="px-4 py-3 bg-white border-2 border-red-200 rounded-xl hover:border-red-500 transition-all flex items-center gap-2 text-red-600 hover:text-red-700"
              title="清理3天前的旧素材"
            >
              <FiTrash2 className="w-4 h-4" />
              <span className="text-sm">清理旧数据</span>
            </button>
          </div>
        </motion.div>
      </Section>

      {/* 素材网格 */}
      <Section title="素材合集" description={`共 ${materials.length} 个搜索结果`}>
        {loading ? (
          // 加载状态
          <GridLayout columns={3} gap={6}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </GridLayout>
        ) : materials.length === 0 ? (
          // 空状态
          <motion.div {...animations.fadeIn} className="text-center py-20">
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">还没有素材</h3>
            <p className="text-gray-600 mb-8">去搜索一些优质内容吧</p>
            <Link href="/topic-analysis">
              <button className={`px-8 py-4 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto`}>
                <FiSearch className="w-5 h-5" />
                开始搜索
              </button>
            </Link>
          </motion.div>
        ) : (
          // 素材卡片网格
          <GridLayout columns={3} gap={6}>
            <AnimatePresence>
              {materials.map((material, index) => (
                <motion.div key={material.id} {...animations.listItemEntrance(index)}>
                  <ContentCard
                    title={material.keyword}
                    description={`${material.totalArticles} 篇文章 · ${getPlatformName(material.searchType)}`}
                    icon={getPlatformIcon(material.searchType)}
                    badge={getPlatformName(material.searchType)}
                    badgeColor={
                      material.searchType.includes("xiaohongshu")
                        ? "bg-red-100 text-red-600"
                        : "bg-green-100 text-green-600"
                    }
                    timestamp={new Date(material.createdAt)}
                    variant="elevated"
                    hoverEffect={true}
                    clickable={true}
                    onClick={() => toggleExpand(material.id)}
                    footer={
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <FiFileText className="w-4 h-4" />
                            <span>{material.totalArticles} 篇</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FiClock className="w-4 h-4" />
                            <span>{formatDate(new Date(material.createdAt))}</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteMaterial(material.id);
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-all hover:scale-110"
                          title="删除素材"
                        >
                          <FiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    }
                  >
                    {/* 展开显示文章列表 */}
                    {expandedId === material.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-3"
                      >
                        {material.articles.map((article, idx) => {
                          // 获取封面图:小红书使用 images[0],公众号可能没有
                          const coverImage = article.images && Array.isArray(article.images) && article.images.length > 0 ? article.images[0] : '';
                          const proxiedCoverImage = coverImage ? getProxiedImageUrl(coverImage) : '';

                          return (
                          <div
                            key={idx}
                            className="p-4 bg-white bg-opacity-70 rounded-xl hover:bg-opacity-90 transition-all border border-gray-200"
                          >
                            <div className="flex gap-4">
                              {proxiedCoverImage && (
                                <img
                                  src={proxiedCoverImage}
                                  alt={article.title || '文章'}
                                  className="w-24 h-24 rounded-lg object-cover flex-shrink-0"
                                  onError={(e) => {
                                    // 如果代理也失败,隐藏图片
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-base text-gray-900 mb-2">
                                  {article.title || '无标题'}
                                </h4>
                                <p className="text-sm text-gray-700 mb-3 line-clamp-3">
                                  {article.content || ''}
                                </p>

                                {/* 互动数据 */}
                                <div className="flex items-center gap-4 mb-3 text-sm text-gray-500">
                                  {article.likes && (
                                    <span className="flex items-center gap-1">
                                      ❤️ {article.likes}
                                    </span>
                                  )}
                                  {article.comments && (
                                    <span className="flex items-center gap-1">
                                      💬 {article.comments}
                                    </span>
                                  )}
                                  {article.author && (
                                    <span className="flex items-center gap-1">
                                      👤 {typeof article.author === 'object' ? (article.author as any).name || (article.author as any).userId : article.author}
                                    </span>
                                  )}
                                </div>

                                {/* 操作按钮 */}
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => openPreviewModal(article)}
                                    className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1"
                                  >
                                    🔗 查看原文
                                  </button>
                                  <Link
                                    href={
                                      material.searchType.includes('wechat')
                                        ? `/?tab=topic-analysis&content=${encodeURIComponent((article.title || '') + '\n\n' + (article.content || ''))}`
                                        : `/?tab=xiaohongshu-rewrite${
                                            article.images && Array.isArray(article.images) && article.images.length > 0
                                              ? `&images=${encodeURIComponent(JSON.stringify(article.images))}`
                                              : ''
                                          }&content=${encodeURIComponent((article.title || '') + '\n\n' + (article.content || ''))}`
                                    }
                                  >
                                    <button className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1">
                                      {material.searchType.includes('wechat') ? '✨ 公众号二创' : '✨ 小红书二创'}
                                    </button>
                                  </Link>
                                  <button
                                    onClick={() => {
                                      // 复制内容到剪贴板
                                      const textToCopy = (article.title || '') + '\n\n' + (article.content || '');
                                      navigator.clipboard.writeText(textToCopy);
                                      alert('内容已复制到剪贴板！');
                                    }}
                                    className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-all flex items-center gap-1"
                                  >
                                    📋 复制文案
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                        })}
                      </motion.div>
                    )}
                  </ContentCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </GridLayout>
        )}
      </Section>

      {/* 文章预览模态框 */}
      <AnimatePresence>
        {showPreviewModal && previewArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closePreviewModal}
            className="fixed inset-0 bg-black bg-opacity-60 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex-1 pr-4">
                    <h2 className="text-2xl font-bold mb-2">{previewArticle.title || '无标题'}</h2>
                    <div className="flex items-center gap-4 text-sm text-white text-opacity-90">
                      {previewArticle.author && (
                        <span className="flex items-center gap-1">
                          👤 {typeof previewArticle.author === 'object' ? (previewArticle.author as any).name || (previewArticle.author as any).userId : previewArticle.author}
                        </span>
                      )}
                      {previewArticle.likes && previewArticle.likes > 0 && (
                        <span className="flex items-center gap-1">
                          ❤️ {previewArticle.likes}
                        </span>
                      )}
                      {previewArticle.comments && previewArticle.comments > 0 && (
                        <span className="flex items-center gap-1">
                          💬 {previewArticle.comments}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={closePreviewModal}
                    className="flex-shrink-0 w-10 h-10 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full flex items-center justify-center transition-all"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto max-h-[calc(90vh-180px)] p-6">
                {/* Images Gallery */}
                {previewArticle.images && Array.isArray(previewArticle.images) && previewArticle.images.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      🖼️ 图片 ({previewArticle.images.length})
                    </h3>
                    <div className={`grid gap-4 ${
                      previewArticle.images.length === 1 ? 'grid-cols-1' :
                      previewArticle.images.length === 2 ? 'grid-cols-2' :
                      'grid-cols-2 md:grid-cols-3'
                    }`}>
                      {previewArticle.images.map((img, idx) => {
                        const proxiedImg = getProxiedImageUrl(img || '');
                        return (
                        <div key={idx} className="relative group">
                          <img
                            src={proxiedImg}
                            alt={`${previewArticle.title || '文章'} - 图片 ${idx + 1}`}
                            className="w-full h-auto rounded-xl object-cover shadow-md hover:shadow-xl transition-shadow"
                            onError={(e) => {
                              // 如果加载失败,显示占位符
                              e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                            }}
                          />
                          <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                            {idx + 1}/{previewArticle.images?.length || 0}
                          </div>
                        </div>
                      )})}
                    </div>
                  </div>
                )}

                {/* Content */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    📝 内容
                  </h3>
                  <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {previewArticle.content || '无内容'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageContainer>
  );
}
