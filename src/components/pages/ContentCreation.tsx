"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import dynamic from "next/dynamic";
import EnhancedImage from "@/components/EnhancedImage";

// 动态导入富文本编辑器（避免 SSR 问题）
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center min-h-[500px] border-2 border-gray-200 rounded-xl">
      <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
    </div>
  ),
});

export default function ContentCreationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 模式判断：insight模式 或 direct模式
  const mode = searchParams.get("mode"); // 'direct' 或 null(默认insight模式)
  const fetchId = searchParams.get("fetchId");
  const articleIndex = searchParams.get("articleIndex");

  const [step, setStep] = useState(1); // 1=选洞察, 2=选方向, 3=参数, 4=生成, 5=预览编辑
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<string | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<number[]>([]);

  // direct模式：单篇文章数据
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  // 原文预览展开状态
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  const [creating, setCreating] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);

  // 参数
  const [length, setLength] = useState("medium");
  const [style, setStyle] = useState("professional");
  const [platform, setPlatform] = useState<"wechat" | "xiaohongshu">("wechat");
  const [imageStrategy, setImageStrategy] = useState("auto");

  // 生成结果
  const [generatedTitle, setGeneratedTitle] = useState("");
  const [generatedContent, setGeneratedContent] = useState("");
  const [editedTitle, setEditedTitle] = useState("");
  const [editedContent, setEditedContent] = useState("");
  const [generatedImages, setGeneratedImages] = useState<string[]>([]); // 存储生成的图片URL
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);

  // 洞察卡片展开状态 - 使用对象管理多个卡片的状态
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // 页面加载时检查是否有未完成的任务
  useEffect(() => {
    const savedTaskId = localStorage.getItem('contentCreation_taskId');
    const savedTaskPlatform = localStorage.getItem('contentCreation_platform');

    if (savedTaskId) {
      console.log('🔄 检测到未完成的创作任务:', savedTaskId);
      // 检查任务状态
      fetch(`/api/content-creation/${savedTaskId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.data.task) {
            const task = data.data.task;

            if (task.status === 'PROCESSING') {
              // 任务还在进行中,恢复状态
              setCurrentTaskId(savedTaskId);
              setCreating(true);
              setStep(4);
              if (savedTaskPlatform) {
                setPlatform(savedTaskPlatform as 'wechat' | 'xiaohongshu');
              }
              console.log('✅ 已恢复创作任务轮询');
            } else if (task.status === 'COMPLETED' && data.data.article) {
              // 任务已完成,直接显示结果
              const article = data.data.article;
              setGeneratedTitle(article.title);
              setGeneratedContent(article.content);
              setEditedTitle(article.title);
              setEditedContent(article.content);

              if (article.images) {
                try {
                  const images = typeof article.images === 'string'
                    ? JSON.parse(article.images)
                    : article.images;
                  const parsedImages = Array.isArray(images) ? images : [];
                  console.log('📸 直接模式-成功解析图片:', parsedImages.length, '张');
                  setGeneratedImages(parsedImages);
                } catch (e) {
                  console.error('❌ 直接模式-解析图片失败:', e);
                  setGeneratedImages([]);
                }
              } else {
                console.warn('⚠️ 直接模式-article.images 为空');
                setGeneratedImages([]);
              }

              if (savedTaskPlatform) {
                setPlatform(savedTaskPlatform as 'wechat' | 'xiaohongshu');
              }

              setStep(5);
              localStorage.removeItem('contentCreation_taskId');
              localStorage.removeItem('contentCreation_platform');
              console.log('✅ 创作任务已完成,显示结果');
            } else {
              // 任务失败或其他状态,清除
              localStorage.removeItem('contentCreation_taskId');
              localStorage.removeItem('contentCreation_platform');
            }
          } else {
            localStorage.removeItem('contentCreation_taskId');
            localStorage.removeItem('contentCreation_platform');
          }
        })
        .catch(error => {
          console.error('恢复任务失败:', error);
          localStorage.removeItem('contentCreation_taskId');
          localStorage.removeItem('contentCreation_platform');
        });
    }
  }, []);

  // direct模式：加载单篇文章数据
  useEffect(() => {
    if (mode === 'direct' && fetchId && articleIndex !== null) {
      loadArticleForDirect();
    }
  }, [mode, fetchId, articleIndex]);

  const loadArticleForDirect = async () => {
    if (!fetchId || articleIndex === null) return;

    setLoadingArticle(true);
    try {
      const response = await fetch(`/api/article-fetch/${fetchId}`);
      const data = await response.json();

      if (data.success && data.data.articles) {
        const article = data.data.articles[parseInt(articleIndex)];
        setSelectedArticle(article);
        setStep(3); // 直接跳到参数配置步骤
        console.log('✅ 加载文章成功:', article.title);
      } else {
        alert('加载文章失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('加载文章失败:', error);
      alert('加载文章失败，请重试');
    } finally {
      setLoadingArticle(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  useEffect(() => {
    // 检查URL参数自动选中洞察
    const insightId = searchParams.get("insight");
    if (insightId && insights.length > 0) {
      setSelectedInsight(insightId);
      setStep(2); // 自动进入第二步
    }
  }, [searchParams, insights]);

  // 轮询任务状态
  useEffect(() => {
    if (!currentTaskId) return;

    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 300; // 最多轮询5分钟 (300次 * 1秒)

    const pollTaskStatus = async () => {
      try {
        pollCount++;

        // 🔥 添加时间戳防止缓存
        const timestamp = Date.now();
        const response = await fetch(`/api/content-creation/${currentTaskId}?_t=${timestamp}`, {
          // 🔥 强制禁用缓存
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        });

        const data = await response.json();

        if (data.success && data.data.task) {
          const task = data.data.task;

          console.log(`🔄 [${pollCount}] 轮询状态:`, {
            status: task.status,
            progress: task.progress,
            message: task.progressMessage
          });

          setProgress(task.progressMessage || "处理中...");
          setProgressPercent(task.progress || 0);

          // 任务完成
          if (task.status === "COMPLETED" && data.data.article) {
            clearInterval(pollInterval);
            setCreating(false);
            setCurrentTaskId(null);

            // 清除localStorage中的任务ID
            localStorage.removeItem('contentCreation_taskId');
            localStorage.removeItem('contentCreation_platform');

            const article = data.data.article;
            console.log('✅ 任务完成,文章数据:', {
              title: article.title,
              contentLength: article.content?.length,
              imagesRaw: article.images
            });

            setGeneratedTitle(article.title);
            setGeneratedContent(article.content);
            setEditedTitle(article.title);
            setEditedContent(article.content);

            // 解析图片URL数组
            if (article.images) {
              try {
                const images = typeof article.images === 'string'
                  ? JSON.parse(article.images)
                  : article.images;
                const parsedImages = Array.isArray(images) ? images : [];
                console.log('📸 成功解析图片数组:', parsedImages.length, '张');
                console.log('📸 图片URLs:', parsedImages);
                setGeneratedImages(parsedImages);
              } catch (e) {
                console.error('❌ 解析图片数组失败:', e);
                setGeneratedImages([]);
              }
            } else {
              console.warn('⚠️ article.images 为空');
              setGeneratedImages([]);
            }

            setTimeout(() => {
              setStep(5); // 进入预览编辑步骤
            }, 500);
          }

          // 任务失败
          if (task.status === "FAILED") {
            clearInterval(pollInterval);
            setCreating(false);
            setCurrentTaskId(null);

            // 清除localStorage中的任务ID
            localStorage.removeItem('contentCreation_taskId');
            localStorage.removeItem('contentCreation_platform');

            alert(`创作失败: ${task.error || "未知错误"}`);
            setStep(3); // 回到参数设置
          }
        }

        // 防止无限轮询
        if (pollCount >= MAX_POLLS) {
          clearInterval(pollInterval);
          setCreating(false);
          setCurrentTaskId(null);
          localStorage.removeItem('contentCreation_taskId');
          localStorage.removeItem('contentCreation_platform');
          alert('创作超时,请重试');
          setStep(3);
        }
      } catch (error) {
        console.error("轮询任务状态失败:", error);
      }
    };

    // 🔥 立即执行一次,然后每1秒轮询
    pollTaskStatus();
    pollInterval = setInterval(pollTaskStatus, 1000); // 改为1秒轮询,更实时

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [currentTaskId]);

  const loadInsights = async () => {
    const response = await fetch("/api/insights");
    const data = await response.json();
    if (data.success) {
      setInsights(data.data);
    }
  };

  const handleNextStep = () => {
    if (step === 1 && selectedInsight) {
      setStep(2);
    } else if (step === 2 && selectedTopics.length > 0) {
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      handleCreate();
    }
  };

  const handleCreate = async () => {
    // direct模式验证
    if (mode === 'direct') {
      if (!fetchId || !selectedArticle) {
        alert('数据错误：缺少文章信息');
        return;
      }
    } else {
      // insight模式验证
      if (!selectedInsight || selectedTopics.length === 0) {
        alert('请选择洞察和主题');
        return;
      }
    }

    setCreating(true);
    setProgress("正在初始化AI创作引擎...");
    setProgressPercent(0);

    try {
      const requestBody = mode === 'direct'
        ? {
            // direct模式参数
            mode: 'direct',
            fetchId,
            articleIndex: parseInt(articleIndex || '0'),
            length,
            style: platform === "xiaohongshu" ? "casual" : style,
            platform,
            imageStrategy,
          }
        : {
            // insight模式参数（原有逻辑）
            insightId: selectedInsight,
            topicIndexes: selectedTopics,
            length,
            style: platform === "xiaohongshu" ? "casual" : style,
            platform,
            imageStrategy,
          };

      const response = await fetch("/api/content-creation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (data.success && data.data.taskId) {
        // 保存taskId并开始轮询
        setCurrentTaskId(data.data.taskId);
        setProgress("任务已创建,开始处理...");
        setProgressPercent(5);

        // 保存到localStorage,以便切换页面后恢复
        localStorage.setItem('contentCreation_taskId', data.data.taskId);
        localStorage.setItem('contentCreation_platform', platform);
        console.log('💾 已保存创作任务ID到localStorage:', data.data.taskId);
      } else {
        alert(`创作失败: ${data.error || "未知错误"}`);
        setCreating(false);
        setStep(3); // 回到参数设置
      }
    } catch (error) {
      console.error("创作失败:", error);
      alert("创作失败,请重试");
      setCreating(false);
      setStep(3);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editedTitle,
          content: editedContent,
          status: "DRAFT",
          wordCount: editedContent.replace(/<[^>]*>/g, "").length,
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert("保存成功!");
        router.push("/publish-management");
      } else {
        alert("保存失败");
      }
    } catch (error) {
      alert("保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerate = async () => {
    // 重新生成文章
    if (!selectedInsight || selectedTopics.length === 0) {
      alert("请先选择洞察和选题方向");
      return;
    }
    setStep(4);
    handleCreate();
  };

  const selectedInsightData = insights.find((i) => i.id === selectedInsight);
  const insightsList = selectedInsightData
    ? JSON.parse(selectedInsightData.insights)
    : [];

  const wordCount = editedContent.replace(/<[^>]*>/g, "").length;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-6 py-8">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-purple-900 to-pink-600 bg-clip-text text-transparent">
            AI 智能创作
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            基于数据洞察,AI自动生成高质量文章,配图智能匹配
          </p>
        </div>

        {/* 步骤指示器 */}
        {step < 5 && (
          <div className="flex items-center justify-center gap-3 mb-12">
            {[
              { num: 1, label: "选择洞察" },
              { num: 2, label: "选择方向" },
              { num: 3, label: "设置参数" },
              { num: 4, label: "AI创作" },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center">
                <div className={`flex items-center gap-2 ${step >= s.num ? 'opacity-100' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-lg transition-all ${
                    step > s.num ? 'bg-green-500 text-white' :
                    step === s.num ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white scale-110' :
                    'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s.num ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : s.num}
                  </div>
                  <span className="font-medium text-gray-700 hidden sm:inline">{s.label}</span>
                </div>
                {idx < 3 && <div className="w-8 sm:w-12 h-0.5 bg-gray-200 mx-1" />}
              </div>
            ))}
          </div>
        )}

        {/* 步骤1: 选择洞察报告 */}
        {step === 1 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-br from-purple-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-2xl">选择洞察报告</CardTitle>
                  <CardDescription className="text-base mt-1">从已有的分析报告中选择一个作为创作基础</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {insights.map((insight, index) => {
                  const insightList = JSON.parse(insight.insights);
                  const insightCount = insightList.length;
                  const isNew = new Date().getTime() - new Date(insight.createdAt).getTime() < 3 * 24 * 60 * 60 * 1000;
                  const isHot = insight.totalArticles > 100;
                  const isQuality = insight.totalArticles >= 50 && insight.totalArticles <= 100;
                  const expanded = expandedCards[insight.id] || false;

                  // 根据数据特征选择渐变色
                  let gradientClass = "from-blue-500/10 to-indigo-500/10 border-blue-200";
                  let badgeClass = "bg-blue-100 text-blue-700";
                  let badgeIcon = "💙";
                  let badgeText = "普通";

                  if (isHot) {
                    gradientClass = "from-red-500/10 to-orange-500/10 border-red-200";
                    badgeClass = "bg-red-100 text-red-700";
                    badgeIcon = "🔥";
                    badgeText = "热门";
                  } else if (isQuality) {
                    gradientClass = "from-purple-500/10 to-pink-500/10 border-purple-200";
                    badgeClass = "bg-purple-100 text-purple-700";
                    badgeIcon = "⭐";
                    badgeText = "优质";
                  } else if (isNew) {
                    gradientClass = "from-emerald-500/10 to-teal-500/10 border-emerald-200";
                    badgeClass = "bg-emerald-100 text-emerald-700";
                    badgeIcon = "💚";
                    badgeText = "新鲜";
                  }

                  return (
                    <div
                      key={insight.id}
                      className={`group relative rounded-2xl border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 cursor-pointer ${
                        selectedInsight === insight.id
                          ? 'border-purple-500 shadow-2xl ring-4 ring-purple-100'
                          : `${gradientClass} hover:border-purple-300`
                      }`}
                      style={{
                        animation: `fadeInUp 0.4s ease-out ${index * 0.1}s both`
                      }}
                    >
                      {/* 选中标记 */}
                      {selectedInsight === insight.id && (
                        <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}

                      {/* 卡片内容 */}
                      <div
                        className={`p-6 bg-gradient-to-br ${gradientClass.replace('/10', '/5')} rounded-2xl`}
                        onClick={() => {
                          setSelectedInsight(insight.id);
                          setSelectedTopics([]);
                        }}
                      >
                        {/* 头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-2xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                {insight.keyword}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                                {badgeIcon} {badgeText}
                              </span>
                            </div>

                            {/* 数据概览 */}
                            <div className="flex items-center gap-4 text-sm text-gray-600">
                              <span className="flex items-center gap-1.5 font-medium">
                                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                                </svg>
                                {insight.totalArticles} 篇文章
                              </span>
                              <span className="flex items-center gap-1.5">
                                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                                </svg>
                                {formatDate(insight.createdAt)}
                              </span>
                              <span className="flex items-center gap-1.5 text-purple-600 font-semibold">
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                {insightCount} 个洞察
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 热度条 */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>数据热度</span>
                            <span className="font-semibold">{Math.min(100, Math.round((insight.totalArticles / 200) * 100))}%</span>
                          </div>
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ${
                                isHot ? 'bg-gradient-to-r from-red-500 to-orange-500' :
                                isQuality ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                                isNew ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                                'bg-gradient-to-r from-blue-500 to-indigo-500'
                              }`}
                              style={{ width: `${Math.min(100, (insight.totalArticles / 200) * 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* 洞察预览 */}
                        <div className="bg-white/50 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedCards(prev => ({
                                ...prev,
                                [insight.id]: !prev[insight.id]
                              }));
                            }}
                            className="w-full flex items-center justify-between text-left group/expand"
                          >
                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                              💡 核心洞察预览
                              <span className="text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                {insightCount}个
                              </span>
                            </span>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform group-hover/expand:text-purple-500 ${expanded ? 'rotate-180' : ''}`}
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {/* 折叠内容 */}
                          <div
                            className={`overflow-hidden transition-all duration-300 ${
                              expanded ? 'max-h-96 mt-3' : 'max-h-0'
                            }`}
                          >
                            <div className="space-y-2 text-sm">
                              {insightList.slice(0, 5).map((item: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-purple-50/50 transition-colors">
                                  <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                    {idx + 1}
                                  </span>
                                  <p className="flex-1 text-gray-700 leading-relaxed">
                                    {item.length > 80 ? item.substring(0, 80) + '...' : item}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* 未展开时显示前2个 */}
                          {!expanded && (
                            <div className="mt-2 space-y-1.5 text-sm text-gray-600">
                              {insightList.slice(0, 2).map((item: string, idx: number) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <span className="text-purple-500 mt-1">•</span>
                                  <p className="flex-1 line-clamp-1">{item}</p>
                                </div>
                              ))}
                              {insightCount > 2 && (
                                <p className="text-xs text-purple-600 italic pl-4">
                                  还有 {insightCount - 2} 个洞察...
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {insights.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-500 text-lg mb-2 font-semibold">还没有洞察报告</p>
                    <p className="text-gray-400 text-sm">请先进入"选题"页面进行分析</p>
                  </div>
                )}
              </div>
              {selectedInsight && (
                <div className="mt-6 flex justify-end">
                  <Button onClick={handleNextStep} className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl hover:scale-105 transition-all">
                    下一步
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 步骤2: 选择选题方向 */}
        {step === 2 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-br from-indigo-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-2xl">选择选题方向</CardTitle>
                  <CardDescription className="text-base mt-1">可以选择多个选题组合创作,增加内容丰富度</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {insightsList.map((insight: string, index: number) => (
                  <label
                    key={index}
                    className={`group flex items-start gap-4 p-5 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
                      selectedTopics.includes(index)
                        ? 'border-indigo-500 bg-indigo-50/50 shadow-lg'
                        : 'border-gray-200 hover:border-indigo-200 hover:bg-indigo-50/30 hover:shadow-md'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTopics.includes(index)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTopics([...selectedTopics, index]);
                        } else {
                          setSelectedTopics(selectedTopics.filter((i) => i !== index));
                        }
                      }}
                      className="w-5 h-5 mt-0.5 text-indigo-500 rounded focus:ring-indigo-500"
                    />
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-indigo-400 to-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-sm shadow-md">
                          {index + 1}
                        </div>
                        <p className="flex-1 text-gray-700 leading-relaxed group-hover:text-indigo-700 transition-colors">{insight}</p>
                      </div>
                    </div>
                    {selectedTopics.includes(index) && (
                      <div className="flex-shrink-0">
                        <svg className="w-6 h-6 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </label>
                ))}
              </div>
              {selectedTopics.length > 0 && (
                <div className="mt-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="flex items-center gap-2 text-indigo-700">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">已选择 {selectedTopics.length} 个选题方向</span>
                  </div>
                </div>
              )}
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步
                </Button>
                {selectedTopics.length > 0 && (
                  <Button onClick={handleNextStep} className="bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600">
                    下一步
                    <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤3: 创作参数 */}
        {step === 3 && (
          <Card className="border-2 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-br from-emerald-50 to-white">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-2xl">创作参数设置</CardTitle>
                  <CardDescription className="text-base mt-1">自定义文章风格、长度和发布平台</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {/* direct模式：原文预览 */}
              {mode === 'direct' && selectedArticle && (
                <Card className="mb-6 border-2 border-blue-200 bg-blue-50/30">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                            <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                          </svg>
                          <CardTitle className="text-lg text-blue-900">原文预览</CardTitle>
                        </div>
                        <p className="text-sm text-gray-700 font-medium">{selectedArticle.title}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsPreviewExpanded(!isPreviewExpanded)}
                          className="border-blue-300 hover:bg-blue-100"
                        >
                          {isPreviewExpanded ? '收起预览' : '展开查看'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedArticle.url, '_blank')}
                          className="border-blue-300 hover:bg-blue-100"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          去小红书
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* 配图预览 */}
                    {selectedArticle.images && selectedArticle.images.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs text-gray-600 mb-2 font-semibold">原文配图 ({selectedArticle.images.length}张)：</p>
                        <div className="flex gap-2 flex-wrap">
                          {(isPreviewExpanded ? selectedArticle.images : selectedArticle.images.slice(0, 6)).map((img: string, i: number) => (
                            <div
                              key={i}
                              className="relative group cursor-pointer"
                              onClick={() => setSelectedImageIndex(i)}
                            >
                              <img
                                src={`${img}${img.includes("?") ? "&" : "?"}t=${Date.now()}`}
                                className="w-20 h-20 object-cover rounded border-2 border-blue-200 transition-all group-hover:border-blue-400 group-hover:scale-105"
                                alt={`原图${i+1}`}
                              />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded transition-all flex items-center justify-center">
                                <svg className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          ))}
                          {!isPreviewExpanded && selectedArticle.images.length > 6 && (
                            <div
                              className="w-20 h-20 rounded border-2 border-blue-200 bg-blue-100 flex items-center justify-center text-blue-700 text-sm font-bold cursor-pointer hover:bg-blue-200 transition-all"
                              onClick={() => setIsPreviewExpanded(true)}
                            >
                              +{selectedArticle.images.length - 6}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* 文章统计 */}
                    <div className="flex gap-4 text-sm text-gray-600 p-3 bg-white/80 rounded-lg border border-blue-200">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                        {selectedArticle.views || 0} 阅读
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        {selectedArticle.likes || 0} 点赞
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        {selectedArticle.images?.length || 0} 张配图
                      </span>
                    </div>

                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="text-xs text-amber-800 flex items-start gap-2">
                        <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        将基于此文章的配图进行<strong>图生图重绘</strong>，生成符合你设置风格的新配图
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                      </svg>
                      发布平台
                    </label>
                    <select
                      value={platform}
                      onChange={(e) => setPlatform(e.target.value as "wechat" | "xiaohongshu")}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium"
                    >
                      <option value="wechat">公众号 (正式专业风格)</option>
                      <option value="xiaohongshu">小红书 (活泼多表情)</option>
                    </select>
                    <p className="text-xs text-gray-500">
                      {platform === "wechat" ? "公众号文章偏向正式专业,没有过多表情符号" : "小红书文章风格活泼,包含丰富的表情符号"}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clipRule="evenodd" />
                      </svg>
                      文章长度
                    </label>
                    <select
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium"
                    >
                      <option value="mini">超短篇 (500-800字)</option>
                      <option value="short">短篇 (1000-1500字)</option>
                      <option value="medium">中等 (2000-3000字)</option>
                      <option value="long">长篇 (3000-5000字)</option>
                    </select>
                  </div>

                  {platform === "wechat" && (
                    <div className="space-y-3">
                      <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 2a1 1 0 00-.707 1.707L7 4.414v3.758a1 1 0 01-.293.707l-4 4C.817 14.769 2.156 18 4.828 18h10.343c2.673 0 4.012-3.231 2.122-5.121l-4-4A1 1 0 0113 8.172V4.414l.707-.707A1 1 0 0013 2H7zm2 6.172V4h2v4.172a3 3 0 00.879 2.12l1.027 1.028a4 4 0 00-2.171.102l-.47.156a4 4 0 01-2.53 0l-.563-.187a1.993 1.993 0 00-.114-.035l1.063-1.063A3 3 0 009 8.172z" clipRule="evenodd" />
                        </svg>
                        写作风格
                      </label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium"
                      >
                        <option value="professional">专业干货</option>
                        <option value="casual">轻松活泼</option>
                        <option value="storytelling">故事叙述</option>
                      </select>
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                      <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                      配图策略
                    </label>
                    <select
                      value={imageStrategy}
                      onChange={(e) => setImageStrategy(e.target.value)}
                      className="w-full h-12 px-4 rounded-xl border-2 border-gray-200 bg-white hover:border-emerald-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all text-base font-medium"
                    >
                      <option value="auto">段落智能插图</option>
                      <option value="minimal">极简配图</option>
                      <option value="rich">丰富配图</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  上一步
                </Button>
                <Button onClick={handleNextStep} className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600">
                  开始创作
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤4: 创作进度 */}
        {step === 4 && creating && (
          <Card className="border-2 border-purple-200 shadow-2xl">
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                <div className="flex items-center justify-center gap-4">
                  <div className="relative">
                    <div className="w-20 h-20 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <svg className="w-10 h-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xl font-bold text-gray-900 mb-2">{progress}</p>
                  <p className="text-sm text-gray-500">AI正在为您生成独特的内容...</p>
                </div>
                <div className="max-w-md mx-auto">
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-rose-500 rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                  <p className="text-center text-sm text-gray-500 mt-2">{progressPercent}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 步骤5: 预览编辑 */}
        {step === 5 && (
          <div className="space-y-6">
            {/* 操作栏 */}
            <Card className="border-2 shadow-lg">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Button
                      variant={previewMode ? "ghost" : "default"}
                      onClick={() => setPreviewMode(false)}
                      className={!previewMode ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      编辑
                    </Button>
                    <Button
                      variant={previewMode ? "default" : "ghost"}
                      onClick={() => setPreviewMode(true)}
                      className={previewMode ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      预览
                    </Button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-gray-500">
                      {wordCount} 字
                    </div>
                    <Button variant="outline" onClick={handleRegenerate}>
                      🔄 重新生成
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={saving}
                      className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
                    >
                      {saving ? "保存中..." : "保存并发布"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 内容区域 */}
            <Card className="border-2 shadow-lg">
              <CardContent className="pt-8 pb-8">
                {!previewMode ? (
                  <div className="space-y-6">
                    {/* 编辑标题 */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">文章标题</label>
                      <Input
                        value={editedTitle}
                        onChange={(e) => setEditedTitle(e.target.value)}
                        className="text-2xl font-bold border-2 h-auto py-3"
                        placeholder="输入文章标题..."
                      />
                    </div>

                    {/* 富文本编辑器 */}
                    <div>
                      <label className="text-sm font-semibold text-gray-700 mb-2 block">文章内容</label>
                      <RichTextEditor
                        content={editedContent}
                        onChange={setEditedContent}
                        placeholder="开始编辑文章内容..."
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {platform === "xiaohongshu" ? (
                      // 小红书格式: 文字和图片分开显示
                      <div className="max-w-3xl mx-auto space-y-8">
                        {/* 标题 */}
                        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📕</span>
                            <h3 className="text-sm font-bold text-red-900">小红书标题</h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                navigator.clipboard.writeText(editedTitle);
                                alert('标题已复制到剪贴板');
                              }}
                              className="ml-auto"
                            >
                              📋 复制标题
                            </Button>
                          </div>
                          <h1 className="text-2xl font-bold text-gray-900">{editedTitle || "无标题"}</h1>
                        </div>

                        {/* 文案 */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">📝</span>
                            <h3 className="text-sm font-bold text-blue-900">正文文案</h3>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const textContent = editedContent.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
                                navigator.clipboard.writeText(textContent);
                                alert('文案已复制到剪贴板');
                              }}
                              className="ml-auto"
                            >
                              📋 复制文案
                            </Button>
                          </div>
                          <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                            {editedContent.replace(/<[^>]*>/g, '').trim()}
                          </div>
                        </div>

                        {/* 配图 */}
                        {generatedImages.length > 0 && (
                          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-lg">🖼️</span>
                              <h3 className="text-sm font-bold text-purple-900">配图 ({generatedImages.length}张)</h3>
                              <span className="text-xs text-gray-500 ml-auto">点击图片可放大查看</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {generatedImages.map((img, index) => (
                                <div key={index} className="relative group">
                                  <img
                                    src={`${img}${img.includes("?") ? "&" : "?"}t=${Date.now()}`}
                                    alt={`配图${index + 1}`}
                                    className="w-full aspect-square object-cover rounded-lg border-2 border-purple-300 cursor-pointer hover:scale-105 transition-transform"
                                    onClick={() => window.open(img, '_blank')}
                                  />
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
                                    <span className="text-white opacity-0 group-hover:opacity-100 text-sm font-semibold">
                                      查看大图
                                    </span>
                                  </div>
                                  <div className="mt-2 text-center">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const link = document.createElement('a');
                                        link.href = img;
                                        link.download = `xiaohongshu_image_${index + 1}.jpg`;
                                        link.click();
                                      }}
                                      className="w-full"
                                    >
                                      💾 下载
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800">
                                💡 使用提示: 下载所有配图后,在小红书APP中选择图文笔记,上传这些配图,然后复制粘贴标题和文案即可发布
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 发布指南 */}
                        <div className="bg-gradient-to-br from-red-50 to-pink-50 border-2 border-red-200 rounded-xl p-6">
                          <h3 className="text-sm font-bold text-red-900 mb-3">📱 小红书发布流程</h3>
                          <ol className="space-y-2 text-sm text-gray-700">
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">1.</span>
                              <span>下载所有配图到手机相册</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">2.</span>
                              <span>打开小红书APP,点击底部"+"按钮</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">3.</span>
                              <span>选择"图文"模式,上传刚才下载的配图</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">4.</span>
                              <span>复制标题,粘贴到小红书标题栏</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">5.</span>
                              <span>复制正文,粘贴到小红书正文区域</span>
                            </li>
                            <li className="flex items-start gap-2">
                              <span className="font-bold text-red-600 min-w-[20px]">6.</span>
                              <span>添加话题标签,选择发布位置,点击发布</span>
                            </li>
                          </ol>
                        </div>
                      </div>
                    ) : (
                      // 公众号格式: 传统的富文本显示
                      <div className="max-w-3xl mx-auto">
                        <h1 className="text-4xl font-bold mb-6">{editedTitle || "无标题"}</h1>
                        <div className="h-px bg-gray-200 mb-8" />
                        <div
                          className="prose prose-lg max-w-none"
                          dangerouslySetInnerHTML={{ __html: editedContent || "<p>暂无内容</p>" }}
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* 图片查看器模态框 */}
      {selectedImageIndex !== null && selectedArticle?.images && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImageIndex(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* 关闭按钮 */}
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
              onClick={() => setSelectedImageIndex(null)}
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 上一张按钮 */}
            {selectedImageIndex > 0 && (
              <button
                className="absolute left-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex - 1);
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* 图片 */}
            <img
              src={selectedArticle.images[selectedImageIndex]}
              alt={`图片 ${selectedImageIndex + 1}`}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />

            {/* 下一张按钮 */}
            {selectedImageIndex < selectedArticle.images.length - 1 && (
              <button
                className="absolute right-4 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedImageIndex(selectedImageIndex + 1);
                }}
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}

            {/* 图片计数器 */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-black/50 rounded-full text-white text-sm">
              {selectedImageIndex + 1} / {selectedArticle.images.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
