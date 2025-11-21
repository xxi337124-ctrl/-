"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiSave, FiTrash2, FiArrowLeft, FiEye, FiEdit2,
  FiSend, FiZap, FiClock, FiFileText, FiImage,
  FiMaximize2, FiMinimize2
} from "react-icons/fi";
import { StatusLabels } from "@/types";
import { Status } from "@prisma/client";
import { colors, animations } from "@/lib/design";

export default function ArticlePage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const router = useRouter();
  const resolvedParams = use(params);
  const [article, setArticle] = useState<any>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<Status>("DRAFT");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [aiHelping, setAiHelping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (resolvedParams.id !== "new") {
      loadArticle();
    }
  }, [resolvedParams.id]);

  const loadArticle = async () => {
    const response = await fetch(`/api/articles/${resolvedParams.id}`);
    const data = await response.json();
    if (data.success) {
      setArticle(data.data);
      setTitle(data.data.title);
      setContent(data.data.content);
      setStatus(data.data.status);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const url =
        resolvedParams.id === "new" ? "/api/articles" : `/api/articles/${resolvedParams.id}`;
      const method = resolvedParams.id === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          content,
          status,
          wordCount: content.replace(/<[^>]*>/g, "").length,
        }),
      });

      const data = await response.json();
      if (data.success) {
        if (resolvedParams.id === "new") {
          router.push(`/article/${data.data.id}`);
        } else {
          alert("保存成功!");
          loadArticle();
        }
      }
    } catch (error) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗？此操作不可恢复！")) return;

    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("删除成功");
        router.push("/?tab=publish-management");
      }
    } catch (error) {
      alert("删除失败");
    }
  };

  const handlePublish = () => {
    router.push("/?tab=publish-management");
  };

  const handleAIOptimizeTitle = async () => {
    setAiHelping(true);
    setTimeout(() => {
      alert("AI优化标题功能开发中");
      setAiHelping(false);
    }, 1000);
  };

  const handleAIPolishContent = async () => {
    setAiHelping(true);
    setTimeout(() => {
      alert("AI润色内容功能开发中");
      setAiHelping(false);
    }, 1000);
  };

  const wordCount = content.replace(/<[^>]*>/g, "").length;
  const statusColor = {
    DRAFT: "bg-gray-100 text-gray-700",
    PENDING: "bg-orange-100 text-orange-700",
    PUBLISHED_XHS: "bg-red-100 text-red-700",
    PUBLISHED_WECHAT: "bg-green-100 text-green-700",
    PUBLISHED_ALL: "bg-purple-100 text-purple-700",
  }[status] || "bg-gray-100 text-gray-700";

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      {/* 顶部导航栏 */}
      <motion.div
        {...animations.fadeIn}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm"
      >
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            {/* 左侧 - 返回按钮 */}
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-all"
            >
              <FiArrowLeft className="w-5 h-5" />
              <span className="font-medium">返回</span>
            </button>

            {/* 中间 - 状态和字数 */}
            <div className="flex items-center gap-4">
              <div className={`px-3 py-1.5 rounded-full text-sm font-medium ${statusColor}`}>
                {StatusLabels[status]}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FiFileText className="w-4 h-4" />
                <span className="font-medium">{wordCount}</span>
                <span>字</span>
              </div>
              {article && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <FiClock className="w-4 h-4" />
                  <span>{new Date(article.updatedAt).toLocaleString("zh-CN")}</span>
                </div>
              )}
            </div>

            {/* 右侧 - 操作按钮 */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPreviewMode(!previewMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                  previewMode
                    ? `bg-gradient-to-r ${colors.gradients.purple} text-white shadow-md`
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {previewMode ? (
                  <>
                    <FiEdit2 className="w-4 h-4" />
                    <span>编辑</span>
                  </>
                ) : (
                  <>
                    <FiEye className="w-4 h-4" />
                    <span>预览</span>
                  </>
                )}
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.gradients.blue} text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50`}
              >
                <FiSave className="w-4 h-4" />
                <span>{saving ? "保存中..." : "保存"}</span>
              </button>

              {resolvedParams.id !== "new" && (
                <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 hover:shadow-lg transition-all"
                >
                  <FiTrash2 className="w-4 h-4" />
                  <span>删除</span>
                </button>
              )}

              <button
                onClick={handlePublish}
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r ${colors.gradients.purple} text-white rounded-lg hover:shadow-lg transition-all`}
              >
                <FiSend className="w-4 h-4" />
                <span>发布</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* 主内容区域 */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {!previewMode ? (
            /* 编辑模式 */
            <motion.div
              key="edit"
              {...animations.fadeIn}
              className="space-y-6"
            >
              {/* 标题编辑卡片 */}
              <motion.div
                {...animations.slideUp}
                className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <input
                    type="text"
                    placeholder="在此输入文章标题..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 text-4xl font-bold text-gray-900 placeholder-gray-300 border-0 focus:outline-none focus:ring-0 bg-transparent"
                  />
                  <button
                    onClick={handleAIOptimizeTitle}
                    disabled={aiHelping}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:shadow-lg transition-all disabled:opacity-50 whitespace-nowrap"
                  >
                    <FiZap className="w-4 h-4" />
                    <span>AI优化</span>
                  </button>
                </div>

                {/* 文章元信息 */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700">文章状态:</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as Status)}
                      className={`px-3 py-1.5 rounded-lg border-2 border-gray-200 focus:border-purple-500 focus:outline-none ${statusColor}`}
                    >
                      {Object.entries(StatusLabels).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {article && (
                    <>
                      <div className="text-sm text-gray-500">
                        创建于 {new Date(article.createdAt).toLocaleString("zh-CN")}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>

              {/* AI工具栏 */}
              <motion.div
                {...animations.slideUp}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-2xl p-6 border border-purple-200/50"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                    <FiZap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">AI 写作助手</h3>
                    <p className="text-sm text-gray-600">让AI帮你优化内容，提升创作效率</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleAIPolishContent}
                    disabled={aiHelping}
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-purple-200 text-purple-700 rounded-lg hover:border-purple-400 hover:shadow-md transition-all disabled:opacity-50"
                  >
                    <FiZap className="w-4 h-4" />
                    <span className="font-medium">AI润色</span>
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    <FiZap className="w-4 h-4" />
                    <span className="font-medium">AI扩写</span>
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    <FiZap className="w-4 h-4" />
                    <span className="font-medium">AI缩写</span>
                  </button>
                  <button
                    disabled
                    className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-200 text-gray-400 rounded-lg cursor-not-allowed"
                  >
                    <FiImage className="w-4 h-4" />
                    <span className="font-medium">生成配图</span>
                  </button>
                </div>
              </motion.div>

              {/* 内容编辑器 */}
              <motion.div
                {...animations.slideUp}
                transition={{ delay: 0.2 }}
                className={`bg-white rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden ${
                  isFullscreen ? "fixed inset-4 z-50" : ""
                }`}
              >
                <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FiEdit2 className="w-4 h-4" />
                    <span className="font-medium">正文编辑器</span>
                    <span className="text-gray-400">支持 HTML 格式</span>
                  </div>
                  <button
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-2 hover:bg-gray-200 rounded-lg transition-all"
                  >
                    {isFullscreen ? (
                      <FiMinimize2 className="w-4 h-4 text-gray-600" />
                    ) : (
                      <FiMaximize2 className="w-4 h-4 text-gray-600" />
                    )}
                  </button>
                </div>

                <textarea
                  placeholder="开始创作你的内容... 支持 HTML 格式编写"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full p-8 focus:outline-none resize-none text-base leading-relaxed font-mono text-gray-800 ${
                    isFullscreen ? "h-[calc(100vh-200px)]" : "min-h-[600px]"
                  }`}
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
                  }}
                />
              </motion.div>

              {/* 底部提示 */}
              <motion.div
                {...animations.fadeIn}
                transition={{ delay: 0.3 }}
                className="flex items-center justify-between text-sm text-gray-500 px-4"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>自动保存已启用</span>
                </div>
                <div>
                  使用 HTML 格式编写，支持丰富的样式和排版
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* 预览模式 */
            <motion.div
              key="preview"
              {...animations.fadeIn}
              className="mx-auto max-w-4xl"
            >
              <motion.div
                {...animations.slideUp}
                className="bg-white rounded-2xl shadow-xl p-12 border border-gray-200/50"
              >
                {/* 文章头部 */}
                <div className="border-b border-gray-200 pb-8 mb-8">
                  <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
                    {title || "未命名文章"}
                  </h1>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <div className={`px-3 py-1.5 rounded-full ${statusColor} font-medium`}>
                      {StatusLabels[status]}
                    </div>
                    <div className="flex items-center gap-2">
                      <FiFileText className="w-4 h-4" />
                      <span className="font-medium">{wordCount} 字</span>
                    </div>
                    {article && (
                      <div className="flex items-center gap-2">
                        <FiClock className="w-4 h-4" />
                        <span>{new Date(article.updatedAt).toLocaleString("zh-CN")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 文章内容 */}
                <div
                  className="prose prose-lg prose-purple max-w-none prose-headings:font-bold prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-purple-600 prose-a:no-underline hover:prose-a:underline prose-strong:text-gray-900 prose-code:text-purple-600 prose-code:bg-purple-50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-img:rounded-xl prose-img:shadow-lg"
                  dangerouslySetInnerHTML={{
                    __html: content || `
                      <div class="text-center py-12 text-gray-400">
                        <p class="text-xl">暂无内容</p>
                        <p class="text-sm mt-2">开始编辑以查看预览</p>
                      </div>
                    `
                  }}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
