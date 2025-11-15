"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { StatusLabels } from "@/types";
import { Status } from "@prisma/client";

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
          loadArticle(); // 重新加载以获取更新时间
        }
      }
    } catch (error) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("确定要删除这篇文章吗?")) return;

    try {
      const response = await fetch(`/api/articles/${resolvedParams.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("删除成功");
        router.push("/publish-management");
      }
    } catch (error) {
      alert("删除失败");
    }
  };

  const handlePublish = () => {
    // 跳转到发布管理页面
    router.push("/publish-management");
  };

  const handleAIOptimizeTitle = async () => {
    setAiHelping(true);
    // TODO: 调用AI优化标题
    // 这里可以集成 contentOptimizationPrompts.rewriteTitle
    setTimeout(() => {
      alert("AI优化标题功能开发中");
      setAiHelping(false);
    }, 1000);
  };

  const handleAIPolishContent = async () => {
    setAiHelping(true);
    // TODO: 调用AI润色内容
    // 这里可以集成 contentOptimizationPrompts.polishContent
    setTimeout(() => {
      alert("AI润色内容功能开发中");
      setAiHelping(false);
    }, 1000);
  };

  const wordCount = content.replace(/<[^>]*>/g, "").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 头部操作栏 */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b bg-white px-6 py-4 rounded-lg shadow-sm">
          <Button variant="ghost" onClick={() => router.back()}>
            ← 返回列表
          </Button>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? "编辑" : "预览"}
            </Button>
            <Button variant="secondary" onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存"}
            </Button>
            {resolvedParams.id !== "new" && (
              <Button variant="destructive" onClick={handleDelete}>
                删除
              </Button>
            )}
            <Button onClick={handlePublish}>发布</Button>
          </div>
        </div>

        {!previewMode ? (
          <>
            {/* 编辑模式 */}
            <div className="bg-white rounded-lg shadow-sm p-8">
              {/* 文章标题 */}
              <div className="mb-6 relative">
                <Input
                  placeholder="文章标题"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-3xl font-semibold border-0 px-0 focus-visible:ring-0 h-auto py-2"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAIOptimizeTitle}
                  disabled={aiHelping}
                  className="absolute right-0 top-2"
                >
                  ✨ AI优化标题
                </Button>
              </div>

              {/* 文章元信息 */}
              <div className="flex items-center gap-4 mb-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <span>状态:</span>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Status)}
                    className="border border-input rounded px-2 py-1"
                  >
                    {Object.entries(StatusLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <span>{wordCount} 字</span>
                {article && (
                  <>
                    <span>创建: {new Date(article.createdAt).toLocaleString("zh-CN")}</span>
                    <span>更新: {new Date(article.updatedAt).toLocaleString("zh-CN")}</span>
                  </>
                )}
              </div>

              <div className="h-px bg-border mb-8" />

              {/* AI辅助工具栏 */}
              <div className="mb-4 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAIPolishContent}
                  disabled={aiHelping}
                >
                  ✨ AI润色
                </Button>
                <Button variant="outline" size="sm" disabled>
                  ✨ AI扩写
                </Button>
                <Button variant="outline" size="sm" disabled>
                  ✨ AI缩写
                </Button>
              </div>

              {/* 文章内容编辑器 */}
              <Card className="p-6">
                <textarea
                  placeholder="开始输入内容... 支持HTML格式"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full min-h-[600px] border-0 focus:outline-none resize-none text-base leading-relaxed font-mono"
                />
              </Card>

              {/* 底部操作栏 */}
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  提示: 内容使用HTML格式编写
                </div>
                <div className="flex gap-3">
                  <Button variant="secondary" onClick={handleSave} disabled={saving}>
                    {saving ? "保存中..." : "保存草稿"}
                  </Button>
                  <Button onClick={handlePublish}>发布到平台</Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* 预览模式 */}
            <div className="bg-white rounded-lg shadow-sm p-12">
              <div className="max-w-3xl mx-auto">
                <h1 className="text-4xl font-bold mb-4">{title || "未命名文章"}</h1>

                <div className="flex items-center gap-4 mb-8 text-sm text-gray-500 pb-4 border-b">
                  <Badge>{StatusLabels[status]}</Badge>
                  <span>{wordCount} 字</span>
                  {article && (
                    <span>{new Date(article.updatedAt).toLocaleString("zh-CN")}</span>
                  )}
                </div>

                <div
                  className="prose prose-lg max-w-none"
                  dangerouslySetInnerHTML={{ __html: content || "<p>暂无内容</p>" }}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
