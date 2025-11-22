"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { FiEdit2, FiEye, FiSend, FiClock, FiFileText, FiTrendingUp, FiTrash } from "react-icons/fi";
import { PageContainer, GridLayout, Section } from "@/components/common/Layout";
import { ContentCard, StatCard } from "@/components/common/Card";
import { colors, animations } from "@/lib/design";
import { formatDate } from "@/lib/utils";
import { StatusLabels, Status } from "@/types";
import WechatPublishModal from "./PublishManagement/WechatPublishModal";
import XiaohongshuQRModal from "./PublishManagement/XiaohongshuQRModal";

export default function PublishManagementPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("DRAFT"); // 默认显示草稿（待发布的作品）
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  // 公众号发布弹窗状态
  const [showWechatModal, setShowWechatModal] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);

  // 小红书发布弹窗状态
  const [showXiaohongshuModal, setShowXiaohongshuModal] = useState(false);
  const [xiaohongshuPublishData, setXiaohongshuPublishData] = useState<{
    qrCodeUrl: string;
    publishUrl?: string;
    noteId?: string;
    warnings?: string[];
  } | null>(null);

  // 文章预览弹窗状态
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<any>(null);

  useEffect(() => {
    loadArticles();
  }, [filter]);

  useEffect(() => {
    // 实时更新：每5秒自动刷新一次
    const interval = setInterval(() => {
      loadArticles();
    }, 5000);
    return () => clearInterval(interval);
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

  const handlePublish = async (articleId: string, article: any, platform: "xiaohongshu" | "wechat") => {
    // 如果是公众号发布，打开配置弹窗
    if (platform === "wechat") {
      setSelectedArticle(article);
      setShowWechatModal(true);
      return;
    }

    // 小红书发布：调用新的 Xiaohongshu API
    if (platform === "xiaohongshu") {
      if (!confirm(`确定要发布到小红书吗？`)) {
        return;
      }

      try {
        const response = await fetch("/api/xiaohongshu/publish", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId }),
        });

        const data = await response.json();

        console.log('📕 小红书发布API响应:', data);

        if (data.success) {
          // 显示二维码弹窗
          console.log('✅ 小红书发布成功');
          console.log('🔍 qrCodeUrl:', data.data?.qrCodeUrl);
          console.log('🔍 完整data.data:', data.data);

          if (!data.data?.qrCodeUrl) {
            console.error('❌ qrCodeUrl为空！');
            alert('发布成功，但未获取到二维码URL，请检查后端日志');
            loadArticles();
            return;
          }

          setXiaohongshuPublishData({
            qrCodeUrl: data.data.qrCodeUrl,
            publishUrl: data.data.publishUrl,
            noteId: data.data.noteId,
            warnings: data.data.warnings,
          });
          setShowXiaohongshuModal(true);
          console.log('📱 已设置showXiaohongshuModal = true');
          loadArticles(); // 刷新文章列表
        } else {
          alert(`发布失败: ${data.error}`);
        }
      } catch (error) {
        console.error('发布到小红书失败:', error);
        alert("发布失败，请稍后重试");
      }
      return;
    }
  };

  const handleDeleteArticle = async (articleId: string) => {
    if (!confirm("确定要删除这篇文章吗？删除后无法恢复。")) return;

    try {
      const response = await fetch(`/api/articles/${articleId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        alert("文章已删除");
        loadArticles(); // 重新加载列表
      } else {
        alert(`删除失败: ${data.error}`);
      }
    } catch (error) {
      console.error("删除文章失败:", error);
      alert("删除失败");
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
        <Link href="/?tab=smart-creation">
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
            <Link href="/?tab=smart-creation">
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

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteArticle(article.id);
                          }}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="删除"
                        >
                          <FiTrash className="w-4 h-4 text-red-500" />
                        </button>

                        {article.status === "DRAFT" && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(article.id, article, "xiaohongshu");
                              }}
                              className="px-3 py-1.5 bg-gradient-to-r from-red-400 to-pink-400 text-white text-xs rounded-lg hover:shadow-md transition-all flex items-center gap-1"
                              title="发布到小红书"
                            >
                              📕
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePublish(article.id, article, "wechat");
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
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPreviewArticle(article);
                              setShowPreviewModal(true);
                            }}
                            className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
                            title="查看"
                          >
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

      {/* 公众号发布弹窗 */}
      {showWechatModal && selectedArticle && (
        <WechatPublishModal
          article={selectedArticle}
          onClose={() => {
            setShowWechatModal(false);
            setSelectedArticle(null);
          }}
          onSuccess={() => {
            setShowWechatModal(false);
            setSelectedArticle(null);
            loadArticles();
          }}
        />
      )}

      {/* 小红书发布弹窗 */}
      {showXiaohongshuModal && xiaohongshuPublishData && (
        <XiaohongshuQRModal
          qrCodeUrl={xiaohongshuPublishData.qrCodeUrl}
          publishUrl={xiaohongshuPublishData.publishUrl}
          noteId={xiaohongshuPublishData.noteId}
          warnings={xiaohongshuPublishData.warnings}
          onClose={() => {
            setShowXiaohongshuModal(false);
            setXiaohongshuPublishData(null);
          }}
        />
      )}

      {/* 文章预览弹窗 */}
      {showPreviewModal && previewArticle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <motion.div
            {...animations.fadeIn}
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          >
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">{previewArticle.title}</h2>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              {/* 文章信息 */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">状态：</span>
                    <span className={`ml-2 px-2 py-1 rounded ${getStatusColor(previewArticle.status)}`}>
                      {StatusLabels[previewArticle.status as Status]}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">字数：</span>
                    <span className="ml-2 font-medium">{previewArticle.wordCount} 字</span>
                  </div>
                  <div>
                    <span className="text-gray-600">创建时间：</span>
                    <span className="ml-2">{new Date(previewArticle.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  {previewArticle.publishes && previewArticle.publishes.length > 0 && (
                    <div>
                      <span className="text-gray-600">发布平台：</span>
                      {previewArticle.publishes.map((pub: any) => (
                        <span key={pub.id} className="ml-2">
                          {pub.platform === "XIAOHONGSHU" ? "📕 小红书" : "💬 公众号"}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* 文章内容 */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">文章内容</h3>
                <div className="p-4 bg-white border border-gray-200 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {previewArticle.content}
                  </p>
                </div>
              </div>

              {/* 文章图片 */}
              {(() => {
                // 调试信息
                console.log('预览文章数据:', {
                  id: previewArticle.id,
                  title: previewArticle.title,
                  images: previewArticle.images,
                  imagesType: typeof previewArticle.images,
                });

                if (!previewArticle.images) {
                  console.log('❌ 没有图片数据');
                  return (
                    <div className="mb-6 p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                      该文章暂无图片
                    </div>
                  );
                }

                try {
                  // 解析图片数据
                  const imageUrls = JSON.parse(previewArticle.images);
                  console.log('✅ 解析后的图片URL:', imageUrls);

                  if (Array.isArray(imageUrls) && imageUrls.length > 0) {
                    return (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          文章图片 ({imageUrls.length} 张)
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {imageUrls.map((url: string, index: number) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                              <img
                                src={url}
                                alt={`图片 ${index + 1}`}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                onLoad={() => console.log(`✅ 图片 ${index + 1} 加载成功:`, url.substring(0, 50))}
                                onError={(e) => {
                                  console.error(`❌ 图片 ${index + 1} 加载失败:`, url);
                                  const target = e.target as HTMLImageElement;
                                  target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3E图片加载失败%3C/text%3E%3C/svg%3E';
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    console.log('⚠️ 图片数组为空或格式不对:', imageUrls);
                    return (
                      <div className="mb-6 p-4 bg-yellow-50 rounded-lg text-center text-yellow-700">
                        图片数据格式异常（数组为空或格式不对）
                      </div>
                    );
                  }
                } catch (e) {
                  console.error('❌ 解析图片JSON失败:', e, '原始数据:', previewArticle.images);
                  return (
                    <div className="mb-6 p-4 bg-red-50 rounded-lg">
                      <p className="text-red-700 mb-2">图片数据解析失败</p>
                      <p className="text-sm text-gray-600">原始数据: {previewArticle.images.substring(0, 100)}...</p>
                    </div>
                  );
                }
              })()}

              {/* 操作按钮 */}
              <div className="flex gap-3">
                <Link href={`/article/${previewArticle.id}`} className="flex-1">
                  <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center justify-center gap-2">
                    <FiEdit2 className="w-5 h-5" />
                    编辑文章
                  </button>
                </Link>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  关闭
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </PageContainer>
  );
}
