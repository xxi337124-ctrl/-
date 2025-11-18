"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiEdit2, FiEye, FiSend, FiClock, FiFileText, FiTrendingUp } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { ContentCard, StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";
import { formatDate } from "@/lib/utils";
import { StatusLabels } from "@/types";
import { Status } from "@prisma/client";

export default function PublishManagementPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadArticles();
  }, [filter]);

  const loadArticles = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      // 发布管理：all表示所有草稿+已发布，DRAFT只显示草稿，PUBLISHED只显示已发布
      if (filter === "all") {
        // 不添加status参数，显示所有文章
      } else {
        params.append("status", filter);
      }
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/articles?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setArticles(data.data);
      }
    } catch (error) {
      console.error("加载文章失败:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (articleId: string, platform: "xiaohongshu" | "wechat") => {
    if (!confirm(`确定要发布到${platform === "xiaohongshu" ? "小红书" : "公众号"}吗?`)) {
      return;
    }

    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, platform }),
      });

      const data = await response.json();
      if (data.success) {
        alert("发布成功!");
        loadArticles();
      } else {
        alert(`发布失败: ${data.error}`);
      }
    } catch (error) {
      alert("发布失败,请稍后重试");
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "DRAFT":
        return "bg-gray-100 text-gray-600";
      case "PENDING":
        return "bg-orange-100 text-orange-600";
      case "PUBLISHED_XHS":
      case "PUBLISHED_WECHAT":
      case "PUBLISHED_ALL":
        return "bg-green-100 text-green-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getPlatformIcon = (platform: string) => {
    return platform === "XIAOHONGSHU" ? "📕" : "💬";
  };

  // 统计数据
  const stats = {
    total: articles.length,
    draft: articles.filter(a => a.status === 'DRAFT').length,
    published: articles.filter(a => a.status.includes('PUBLISHED')).length,
    multiPlatform: articles.filter(a => a.status === 'PUBLISHED_ALL').length,
  };

  return (
    <PageContainer
      title="发布管理中心"
      description="统一管理您的所有文章，一键发布到多个平台"
      actions={
        <Link href="/content-creation">
          <button className={`px-6 py-3 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2`}>
            <FiSend className="w-5 h-5" />
            新建创作
          </button>
        </Link>
      }
    >
      {/* 统计卡片 */}
      <Section>
        <GridLayout columns={4} gap={6}>
          <StatCard
            title="全部文章"
            value={stats.total}
            icon={<FiFileText />}
            color="blue"
            description="所有待发布和已发布"
          />
          <StatCard
            title="草稿箱"
            value={stats.draft}
            icon={<FiEdit2 />}
            color="orange"
            description="待发布文章"
          />
          <StatCard
            title="已发布"
            value={stats.published}
            icon={<FiTrendingUp />}
            color="green"
            description="已发布文章总数"
          />
          <StatCard
            title="多平台发布"
            value={stats.multiPlatform}
            icon={<FiSend />}
            color="purple"
            description="全平台覆盖"
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
                { id: "DRAFT", label: "草稿", icon: "✏️" },
                { id: "PUBLISHED", label: "已发布", icon: "✅" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setFilter(item.id)}
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
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="搜索文章标题..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadArticles()}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all outline-none"
                />
              </div>
            </div>
          </div>
        </motion.div>
      </Section>

      {/* 文章网格 */}
      <Section title="文章列表" description={`共 ${articles.length} 篇文章`}>
        {isLoading ? (
          // 加载状态
          <GridLayout columns={3} gap={6}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </GridLayout>
        ) : articles.length === 0 ? (
          // 空状态
          <motion.div
            {...animations.fadeIn}
            className="text-center py-20"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">📝</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">还没有文章</h3>
            <p className="text-gray-600 mb-8">开始创作您的第一篇文章吧</p>
            <Link href="/content-creation">
              <button className={`px-8 py-4 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-2 mx-auto`}>
                <FiSend className="w-5 h-5" />
                开始创作
              </button>
            </Link>
          </motion.div>
        ) : (
          // 文章卡片网格
          <GridLayout columns={3} gap={6}>
            <AnimatePresence>
              {articles.map((article, index) => (
                <motion.div
                  key={article.id}
                  {...animations.listItemEntrance(index)}
                >
                  <ContentCard
                    title={article.title || "无标题"}
                    description={article.content?.slice(0, 100) + "..." || "暂无内容"}
                    icon="📄"
                    badge={StatusLabels[article.status as Status]}
                    badgeColor={getStatusColor(article.status)}
                    timestamp={new Date(article.createdAt)}
                    tags={article.publishes?.map((pub: any) =>
                      pub.platform === "XIAOHONGSHU" ? "小红书" : "公众号"
                    ) || []}
                    variant="elevated"
                    hoverEffect={true}
                    clickable={true}
                    onClick={() => window.location.href = `/article/${article.id}`}
                    footer={
                      <div className="flex items-center gap-2 text-sm">
                        <FiFileText className="w-4 h-4" />
                        <span>{article.wordCount || 0} 字</span>
                      </div>
                    }
                    actions={
                      <div className="flex items-center gap-2">
                        <Link href={`/article/${article.id}`}>
                          <button className="p-2 hover:bg-purple-50 rounded-lg transition-colors" title="编辑">
                            <FiEdit2 className="w-4 h-4 text-purple-600" />
                          </button>
                        </Link>

                        {article.status === "DRAFT" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(article.id, "xiaohongshu");
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-pink-400 text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1"
                              title="发布到小红书"
                            >
                              📕
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(article.id, "wechat");
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-green-400 to-emerald-400 text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1"
                              title="发布到公众号"
                            >
                              💬
                            </button>
                          </>
                        )}

                        {(article.status === "PUBLISHED_XHS" ||
                          article.status === "PUBLISHED_WECHAT" ||
                          article.status === "PUBLISHED_ALL") && (
                          <button className="p-2 hover:bg-blue-50 rounded-lg transition-colors" title="查看">
                            <FiEye className="w-4 h-4 text-blue-600" />
                          </button>
                        )}
                      </div>
                    }
                  >
                    {/* 发布平台标签 */}
                    {article.publishes && article.publishes.length > 0 && (
                      <div className="flex items-center gap-2 mb-4">
                        {article.publishes.map((pub: any) => (
                          <span
                            key={pub.id}
                            className="px-2 py-1 bg-white bg-opacity-20 rounded-full text-xs flex items-center gap-1"
                          >
                            {getPlatformIcon(pub.platform)}
                            <span>{pub.platform === "XIAOHONGSHU" ? "小红书" : "公众号"}</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </ContentCard>
                </motion.div>
              ))}
            </AnimatePresence>
          </GridLayout>
        )}
      </Section>

      {/* 分页 */}
      {articles.length > 0 && (
        <motion.div
          {...animations.fadeIn}
          className="flex items-center justify-center gap-2 mt-12"
        >
          <button
            disabled
            className="p-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className={`px-4 py-2 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-lg shadow-md font-medium`}>
            1
          </button>
          <button
            disabled
            className="p-2 rounded-lg bg-gray-100 text-gray-400 cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </motion.div>
      )}
    </PageContainer>
  );
}
