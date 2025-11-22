"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import type { InsightReport, EnhancedInsightReport } from "@/types";
import { motion, AnimatePresence } from "framer-motion";

export default function TopicAnalysisPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const platform = 'wechat'; // 固定为公众号平台
  const [searchType, setSearchType] = useState<'keyword' | 'account'>('keyword');
  const [loading, setLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState<{ text: string; completed: boolean }[]>([]);
  const [report, setReport] = useState<EnhancedInsightReport | null>(null);
  const [insights, setInsights] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [allArticles, setAllArticles] = useState<any[]>([]); // 存储所有文章数据
  const [currentInsightId, setCurrentInsightId] = useState<string | null>(null); // 当前显示的洞察ID
  const [rewriteContent, setRewriteContent] = useState<string>("");
  const [rewriting, setRewriting] = useState(false);
  const [rewritingArticleIndex, setRewritingArticleIndex] = useState<number | null>(null); // 正在二创的文章索引
  const rewriteAreaRef = useRef<HTMLDivElement>(null); // 二创区域引用

  // 页面加载时获取最近的分析记录
  useEffect(() => {
    loadRecentInsights();
  }, []);

  const handleAnalysis = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    setReport(null); // 清空之前的报告
    setAllArticles([]); // 清空之前的文章列表

    // 初始化进度步骤 - 简化版本，只显示抓取文章
    const steps = [
      {
        text: searchType === 'keyword'
          ? `正在抓取公众号文章...`
          : `正在获取公众号最新文章...`,
        completed: false
      },
      { text: "文章抓取完成", completed: false },
    ];
    setProgressSteps(steps);

    try {
      // 模拟进度更新
      const progressTimer1 = setTimeout(() => {
        setProgressSteps(prev => {
          if (prev.length > 0) {
            const updated = [...prev];
            updated[0] = { ...updated[0], completed: true };
            return updated;
          }
          return prev;
        });
      }, 500);

      const response = await fetch("/api/topic-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform,
          searchType,
          query: keyword,
          skipInsights: true  // 跳过AI洞察分析，直接返回文章
        }),
      });

      const data = await response.json();

      // 清除定时器
      clearTimeout(progressTimer1);

      if (data.success) {
        // 完成所有步骤
        setProgressSteps(prev => {
          return prev.map(step => ({ ...step, completed: true }));
        });

        // 直接设置文章列表，不显示洞察报告
        setAllArticles(data.data.articles || []);
        setCurrentInsightId(null);
      } else {
        alert(`抓取失败: ${data.error || "未知错误"}`);
        setProgressSteps([]); // 清空进度
      }
    } catch (error) {
      console.error("抓取失败:", error);
      alert("抓取失败,请检查网络连接后重试");
      setProgressSteps([]); // 清空进度
    } finally {
      setLoading(false);
    }
  };

  const loadRecentInsights = async () => {
    const response = await fetch("/api/insights");
    const data = await response.json();
    if (data.success) {
      // 数据去重 - 根据 keyword 去重,保留最新的
      const uniqueInsightsMap = new Map();
      data.data.forEach((insight: any) => {
        const existing = uniqueInsightsMap.get(insight.keyword);
        if (!existing || new Date(insight.createdAt) > new Date(existing.createdAt)) {
          uniqueInsightsMap.set(insight.keyword, insight);
        }
      });
      const uniqueInsights = Array.from(uniqueInsightsMap.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setInsights(uniqueInsights);

      // 不再自动加载最近的记录,让用户点击卡片查看
    }
  };

  // 删除历史记录
  const handleDeleteInsight = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('确定要删除这条分析记录吗?')) {
      return;
    }

    try {
      const response = await fetch(`/api/insights/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // 如果删除的是当前显示的记录,清空报告
        if (currentInsightId === id) {
          setReport(null);
          setCurrentInsightId(null);
          setKeyword('');
        }

        // 重新加载历史记录
        loadRecentInsights();
      } else {
        alert('删除失败: ' + (data.error || '未知错误'));
      }
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败,请稍后重试');
    }
  };

  // 公众号文章AI二创改写
  const handleRewriteArticle = async (article: any, index: number) => {
    setSelectedArticle(article);
    setRewritingArticleIndex(index);
    setRewriting(true);
    setRewriteContent("");

    // 滚动到二创区域
    setTimeout(() => {
      rewriteAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);

    try {
      // 调用AI二创API
      const response = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: article.title,
          content: article.content || article.title,
          platform: 'wechat',
        }),
      });

      const data = await response.json();

      if (data.success && data.data?.content) {
        setRewriteContent(data.data.content);
      } else {
        throw new Error(data.error || '二创失败');
      }
    } catch (error) {
      console.error("二创失败:", error);
      alert("二创失败，请稍后重试");
      setRewritingArticleIndex(null);
    } finally {
      setRewriting(false);
    }
  };

  const handleSaveRewriteToArticles = async () => {
    if (!rewriteContent) {
      alert('请先生成二创内容');
      return;
    }

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedArticle?.title || '公众号二创内容',
          content: rewriteContent,
          status: 'DRAFT',
          wordCount: rewriteContent.length,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 已保存到文章库！可在发布管理中查看');
        setRewriteContent("");
        setSelectedArticle(null);
        setRewritingArticleIndex(null);
      } else {
        alert(`保存失败: ${data.error}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 保存未二创的文章到素材库
  const handleSaveToMaterials = async () => {
    if (allArticles.length === 0) {
      alert('没有文章可保存');
      return;
    }

    if (!confirm(`确定要将这 ${allArticles.length} 篇文章保存到素材库吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword,
          searchType: `wechat_${searchType}`,
          articles: allArticles,
          totalArticles: allArticles.length,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ 成功保存 ${allArticles.length} 篇文章到素材库！可在素材库中查看`);
      } else {
        alert(`保存失败: ${data.error}`);
      }
    } catch (error) {
      console.error('保存素材失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  // 保存报告为图片 (TODO: 实现图片生成)
  const handleSaveReport = () => {
    alert('保存报告功能开发中\n将生成美观的分享图片');
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            公众号文章采集
          </h1>
          <p className="text-sm text-gray-500">
            输入关键词或公众号名称，快速获取文章列表，一键AI二创
          </p>
        </div>

        {/* 搜索框 */}
        <Card className="mb-6 border-0 shadow-sm">
          <CardContent className="pt-6 pb-6">
            {/* 搜索类型切换 */}
            <div className="flex gap-3 mb-4">
              <Button
                variant={searchType === 'keyword' ? 'default' : 'outline'}
                onClick={() => setSearchType('keyword')}
                className="flex-1 h-11 text-base font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
                关键词搜索
              </Button>
              <Button
                variant={searchType === 'account' ? 'default' : 'outline'}
                onClick={() => setSearchType('account')}
                className="flex-1 h-11 text-base font-medium"
              >
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                  <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                </svg>
                公众号搜索
              </Button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1 relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <Input
                  placeholder={
                    searchType === 'keyword'
                      ? "输入关键词,例如:AI、ChatGPT、私域运营、内容营销"
                      : "输入公众号名称,例如:36氪、人人都是产品经理"
                  }
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAnalysis()}
                  className="flex-1 h-12 pl-12 text-base border-gray-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition-all"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleAnalysis}
                disabled={loading || !keyword.trim()}
                className="h-12 px-8 text-base bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    分析中
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    开始分析
                  </span>
                )}
              </Button>
            </div>

            {/* 热门关键词/示例公众号 */}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-gray-500">
                {searchType === 'keyword' ? '热门关键词:' : '示例公众号:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {(searchType === 'keyword'
                  ? ["AI创作", "私域运营", "内容营销", "用户增长", "产品设计"]
                  : ["36氪", "人人都是产品经理", "晚点LatePost", "虎嗅", "新榜"]
                ).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setKeyword(tag)}
                    className="px-3 py-1.5 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* 提示信息 */}
            {keyword.trim() && !loading && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-green-900">
                  <span className="font-semibold">快速抓取</span>
                  {" "}·{" "}
                  获取公众号文章列表，可直接二创
                </div>
              </div>
            )}

            {/* 部分失败警告 */}
            {report?.analysisMetadata && report.analysisMetadata.failedAnalyses > 0 && (
              <div className="mt-4 flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-200 rounded-lg">
                <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div className="text-sm text-amber-800">
                  <span className="font-medium">部分文章分析失败:</span>
                  {" "}成功分析 {report.analysisMetadata.successfulAnalyses}/{report.analysisMetadata.totalArticlesAnalyzed} 篇文章,
                  {" "}{report.analysisMetadata.failedAnalyses} 篇失败已跳过。
                  洞察结果基于成功分析的文章生成。
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 分析进度 */}
        {loading && progressSteps.length > 0 && (
          <Card className="mb-6 border-0 shadow-sm">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">分析进度</h3>
                  <span className="text-sm text-gray-500">
                    {progressSteps.filter(s => s.completed).length} / {progressSteps.length}
                  </span>
                </div>

                {/* 进度条 */}
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500 ease-out rounded-full"
                    style={{
                      width: `${(progressSteps.filter(s => s.completed).length / progressSteps.length) * 100}%`,
                    }}
                  />
                </div>

                {/* 进度步骤 */}
                <div className="space-y-2">
                  {progressSteps.map((step, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                        step.completed
                          ? 'bg-green-50 border border-green-200'
                          : index === progressSteps.findIndex(s => !s.completed)
                          ? 'bg-blue-50 border border-blue-200'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      {step.completed ? (
                        <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      ) : index === progressSteps.findIndex(s => !s.completed) ? (
                        <svg className="w-5 h-5 text-blue-600 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0"></div>
                      )}
                      <span
                        className={`text-sm ${
                          step.completed
                            ? 'text-green-800 font-medium'
                            : index === progressSteps.findIndex(s => !s.completed)
                            ? 'text-blue-800 font-medium'
                            : 'text-gray-500'
                        }`}
                      >
                        {step.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 文章列表 - 当有文章但没有洞察报告时显示 */}
        {!report && allArticles.length > 0 && (
          <div className="space-y-6">
            {/* 标题栏 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{keyword} - 文章列表</h2>
                  <p className="text-sm text-gray-500 mt-1">共找到 {allArticles.length} 篇文章，可直接二创</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSaveToMaterials}
                  variant="outline"
                  className="h-10 px-4 border-green-300 text-green-700 hover:bg-green-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  存入素材库
                </Button>
                <button
                  onClick={() => {
                    setAllArticles([]);
                    setKeyword('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  关闭
                </button>
              </div>
            </div>

            {/* 文章卡片网格 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allArticles.map((article, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    className={`group hover:shadow-lg transition-all duration-300 ${
                      rewritingArticleIndex === index ? 'border-green-500 border-2 shadow-lg' : 'hover:border-green-300'
                    }`}
                  >
                    <CardContent className="p-5">
                      {/* 文章序号标签 */}
                      <div className="flex items-start justify-between mb-3">
                        <div className={`px-2 py-1 rounded text-xs font-semibold ${
                          rewritingArticleIndex === index
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          #{index + 1}
                        </div>
                        {rewritingArticleIndex === index && (
                          <div className="flex items-center gap-1 text-xs text-green-600 font-medium">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            二创中...
                          </div>
                        )}
                      </div>

                      {/* 文章标题 */}
                      <div className="mb-3">
                        <h3
                          className="font-semibold text-gray-900 mb-2 line-clamp-2 cursor-pointer hover:text-green-600 transition-colors"
                          onClick={() => window.open(article.url, '_blank')}
                        >
                          {article.title}
                        </h3>
                        {article.content && (
                          <p className="text-sm text-gray-600 line-clamp-3">
                            {article.content}
                          </p>
                        )}
                      </div>

                      {/* 数据统计 */}
                      <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
                        {article.views > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                            </svg>
                            {formatNumber(article.views)}
                          </span>
                        )}
                        {article.likes > 0 && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            {formatNumber(article.likes)}
                          </span>
                        )}
                        {article.publishTime && (
                          <span className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                            </svg>
                            {formatDate(article.publishTime)}
                          </span>
                        )}
                      </div>

                      {/* 操作按钮 */}
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleRewriteArticle(article, index)}
                          disabled={rewriting}
                          className="flex-1 h-9 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {rewritingArticleIndex === index ? '二创中...' : 'AI二创'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(article.url, '_blank')}
                          className="h-9 px-3 border-gray-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* 洞察报告 */}
        {report && (
          <div className="space-y-6">
            {/* 标题栏with关闭按钮 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{keyword} - 洞察详情</h2>
                  <p className="text-sm text-gray-500 mt-1">点击下方历史记录查看其他洞察</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setReport(null);
                  setCurrentInsightId(null);
                  setAllArticles([]);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                关闭详情
              </button>
            </div>

            {/* 数据概览卡片 */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">分析文章数</p>
                      <p className="text-3xl font-bold text-gray-900">{allArticles.length || 0}</p>
                    </div>
                    <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">平均阅读量</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {allArticles.length > 0
                          ? formatNumber(Math.round(allArticles.reduce((sum, a) => sum + a.views, 0) / allArticles.length))
                          : 0
                        }
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">平均点赞数</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {allArticles.length > 0
                          ? Math.round(allArticles.reduce((sum, a) => sum + a.likes, 0) / allArticles.length)
                          : 0
                        }
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">平均互动率</p>
                      <p className="text-3xl font-bold text-gray-900">
                        {allArticles.length > 0
                          ? (allArticles.reduce((sum, a) => {
                              const rate = a.views > 0 ? (a.likes / a.views) * 100 : 0;
                              return sum + rate;
                            }, 0) / allArticles.length).toFixed(1)
                          : 0
                        }%
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                      <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                      </svg>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 点赞量TOP5 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">点赞量TOP5</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {report.topLikedArticles.map((article, index) => (
                      <div
                        key={index}
                        className="pb-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded transition-colors"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-semibold text-sm ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-orange-400 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">{article.title}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                {formatNumber(article.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {formatNumber(article.likes)}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                </svg>
                                {((article.likes / article.views) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* 互动率TOP5 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">互动率TOP5</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3">
                    {report.topInteractiveArticles.map((article, index) => (
                      <div
                        key={index}
                        className="pb-3 border-b border-gray-100 last:border-0 cursor-pointer hover:bg-gray-50 -mx-3 px-3 py-2 rounded transition-colors"
                        onClick={() => window.open(article.url, '_blank')}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`flex-shrink-0 w-6 h-6 rounded flex items-center justify-center font-semibold text-sm ${
                            index === 0 ? 'bg-purple-500 text-white' :
                            index === 1 ? 'bg-purple-400 text-white' :
                            index === 2 ? 'bg-purple-300 text-white' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            #{index + 1}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900 mb-2 line-clamp-2 hover:text-purple-600 transition-colors">{article.title}</div>
                            <div className="flex items-center gap-3 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                </svg>
                                {formatNumber(article.views)}
                              </span>
                              <span className="flex items-center gap-1">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                                </svg>
                                {formatNumber(article.likes)}
                              </span>
                              <span className="flex items-center gap-1 text-purple-600 font-semibold">
                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                                </svg>
                                {article.interactionRate.toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* 高频词云和发布时间分布 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 高频词云 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                        <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">高频词云</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    {report.wordCloud.slice(0, 30).map((word, index) => {
                      const colors = [
                        'bg-blue-100 text-blue-700 hover:bg-blue-200',
                        'bg-indigo-100 text-indigo-700 hover:bg-indigo-200',
                        'bg-purple-100 text-purple-700 hover:bg-purple-200',
                        'bg-pink-100 text-pink-700 hover:bg-pink-200',
                        'bg-green-100 text-green-700 hover:bg-green-200',
                      ];
                      const colorClass = colors[index % colors.length];
                      return (
                        <span
                          key={index}
                          className={`px-3 py-1.5 ${colorClass} rounded-md text-sm font-medium transition-colors cursor-pointer`}
                        >
                          {word.word}
                          <span className="ml-1.5 text-xs opacity-70">({word.count})</span>
                        </span>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* 发布时间分布 */}
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">发布时间分布</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {(() => {
                    // 计算发布时间分布 - 使用所有文章
                    const timeDistribution: { [key: string]: number } = {
                      '08:00-10:00': 0,
                      '10:00-12:00': 0,
                      '14:00-16:00': 0,
                      '18:00-20:00': 0,
                      '20:00-22:00': 0,
                    };

                    allArticles.forEach(article => {
                      if (article.publishTime) {
                        const hour = new Date(article.publishTime).getHours();
                        if (hour >= 8 && hour < 10) timeDistribution['08:00-10:00']++;
                        else if (hour >= 10 && hour < 12) timeDistribution['10:00-12:00']++;
                        else if (hour >= 14 && hour < 16) timeDistribution['14:00-16:00']++;
                        else if (hour >= 18 && hour < 20) timeDistribution['18:00-20:00']++;
                        else if (hour >= 20 && hour < 22) timeDistribution['20:00-22:00']++;
                      }
                    });

                    const maxCount = Math.max(...Object.values(timeDistribution), 1); // 至少为1避免除0

                    return (
                      <div className="space-y-3">
                        {Object.entries(timeDistribution).map(([time, count]) => (
                          <div key={time} className="flex items-center gap-3">
                            <span className="text-xs text-gray-600 w-24">{time}</span>
                            <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                              <div
                                className="h-full bg-orange-500 flex items-center justify-end pr-2 transition-all duration-500"
                                style={{ width: `${(count / maxCount) * 100}%` }}
                              >
                                {count > 0 && <span className="text-xs text-white font-semibold">{count}</span>}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>

            {/* AI文章摘要 */}
            {report.articleSummaries && report.articleSummaries.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <CardTitle className="text-lg font-semibold">AI文章摘要</CardTitle>
                        <p className="text-xs text-gray-500 mt-0.5">AI深度分析 TOP {report.articleSummaries.length} 篇热门文章</p>
                      </div>
                    </div>
                    {report.analysisMetadata && (
                      <div className="text-xs text-gray-500">
                        耗时 {(report.analysisMetadata.analysisTime / 1000).toFixed(1)}s · {report.analysisMetadata.modelUsed.split('/')[1]}
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    {report.articleSummaries.map((summary, index) => (
                      <div key={index} className="p-4 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md transition-all">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-shrink-0 w-7 h-7 bg-indigo-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900 mb-1 line-clamp-2 cursor-pointer hover:text-indigo-600" onClick={() => window.open(summary.articleUrl, '_blank')}>
                              {summary.title}
                            </h4>
                            <p className="text-sm text-gray-600 leading-relaxed">{summary.summary}</p>
                          </div>
                        </div>

                        {/* 关键点 */}
                        {summary.keyPoints.length > 0 && (
                          <div className="mb-3 pl-10">
                            <div className="text-xs font-semibold text-gray-500 mb-2">关键要点</div>
                            <div className="space-y-1.5">
                              {summary.keyPoints.map((point, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                  <svg className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                  </svg>
                                  <span>{point}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 标签行 */}
                        <div className="flex flex-wrap gap-2 pl-10">
                          {/* 关键词 */}
                          {summary.keywords.map((kw, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded">
                              #{kw}
                            </span>
                          ))}
                          {/* 亮点 */}
                          {summary.highlights.map((hl, i) => (
                            <span key={i} className="px-2 py-1 text-xs bg-amber-50 text-amber-700 rounded flex items-center gap-1">
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              {hl}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* AI选题洞察 - 结构化版本 */}
            {report.structuredInsights && report.structuredInsights.length > 0 ? (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">AI结构化选题洞察</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5">基于文章分析生成的专业选题建议</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-4 mb-6">
                    {report.structuredInsights.map((insight, index) => (
                      <div key={index} className="p-5 border-2 border-gray-200 rounded-xl hover:border-green-300 hover:shadow-lg transition-all bg-white">
                        {/* 头部 */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-lg flex items-center justify-center font-bold shadow-md">
                              {index + 1}
                            </div>
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-gray-900 mb-1">{insight.title}</h3>
                              <p className="text-sm text-gray-600 leading-relaxed">{insight.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
                            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-sm font-semibold text-green-700">{insight.confidenceScore}</span>
                          </div>
                        </div>

                        {/* 分析推理 */}
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <div className="text-xs font-semibold text-gray-500 mb-1.5">💡 分析推理</div>
                          <p className="text-sm text-gray-700 leading-relaxed">{insight.reasoning}</p>
                        </div>

                        {/* 受众和角度 */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="text-xs font-semibold text-blue-600 mb-1">目标受众</div>
                            <div className="text-sm text-gray-800">{insight.targetAudience}</div>
                          </div>
                          <div className="p-3 bg-purple-50 rounded-lg">
                            <div className="text-xs font-semibold text-purple-600 mb-1">内容切入角度</div>
                            <div className="text-sm text-gray-800">{insight.contentAngle}</div>
                          </div>
                        </div>

                        {/* 建议标题 */}
                        {insight.suggestedTitles.length > 0 && (
                          <div className="mb-4">
                            <div className="text-xs font-semibold text-gray-500 mb-2">📝 建议标题</div>
                            <div className="space-y-2">
                              {insight.suggestedTitles.map((title, i) => (
                                <div key={i} className="flex items-start gap-2 text-sm text-gray-700 p-2 bg-amber-50 rounded hover:bg-amber-100 transition-colors cursor-pointer">
                                  <span className="flex-shrink-0 w-5 h-5 bg-amber-500 text-white rounded flex items-center justify-center text-xs font-bold">
                                    {i + 1}
                                  </span>
                                  <span className="flex-1">{title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 标签 */}
                        <div className="flex flex-wrap gap-2">
                          {insight.tags.map((tag, i) => (
                            <span key={i} className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        if (!allArticles || allArticles.length === 0) {
                          alert('暂无文章可供二创');
                          return;
                        }
                        // 使用第一篇文章作为示例
                        handleRewriteArticle(allArticles[0], 0);
                      }}
                      className="flex-1 h-11 text-sm bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      AI二创改写
                    </Button>
                    <Button
                      onClick={handleSaveReport}
                      variant="outline"
                      className="h-11 px-5 text-sm border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      保存报告
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              /* AI选题洞察 - 旧版本(兼容) */
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <CardTitle className="text-lg font-semibold">AI选题洞察</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="space-y-3 mb-6">
                    {report.insights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded flex items-center justify-center font-semibold text-xs">
                          {index + 1}
                        </div>
                        <p className="flex-1 text-sm text-gray-700 leading-relaxed pt-0.5">{insight}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        if (!allArticles || allArticles.length === 0) {
                          alert('暂无文章可供二创');
                          return;
                        }
                        // 使用第一篇文章作为示例
                        handleRewriteArticle(allArticles[0], 0);
                      }}
                      className="flex-1 h-11 text-sm bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      AI二创改写
                    </Button>
                    <Button
                      onClick={handleSaveReport}
                      variant="outline"
                      className="h-11 px-5 text-sm border-gray-300 hover:bg-gray-50 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      保存报告
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* AI二创改写区域 */}
        {selectedArticle && (rewriting || rewriteContent) && (
          <div ref={rewriteAreaRef}>
            <Card className="mb-6 border-0 shadow-lg">
              <CardHeader className="pb-4 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold">公众号文章AI二创 #{rewritingArticleIndex !== null ? rewritingArticleIndex + 1 : '?'}</CardTitle>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">原文: {selectedArticle.title}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedArticle(null);
                      setRewriteContent("");
                      setRewriting(false);
                      setRewritingArticleIndex(null);
                    }}
                    className="px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </CardHeader>
            <CardContent className="pt-6">
              {rewriting ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <svg className="animate-spin h-12 w-12 text-green-600 mb-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <p className="text-gray-600 font-medium">AI正在二创改写中...</p>
                  <p className="text-sm text-gray-500 mt-2">保留核心观点，全新表达方式</p>
                </div>
              ) : rewriteContent ? (
                <div>
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre-wrap text-sm text-gray-800 font-sans leading-relaxed">
                      {rewriteContent}
                    </pre>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleSaveRewriteToArticles}
                      className="flex-1 h-11 bg-green-600 hover:bg-green-700 transition-colors"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      保存到文章库
                    </Button>
                    <Button
                      onClick={() => {
                        setRewriteContent("");
                        setSelectedArticle(null);
                        setRewritingArticleIndex(null);
                      }}
                      variant="outline"
                      className="h-11 px-6 border-gray-300 hover:bg-gray-50"
                    >
                      取消
                    </Button>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
          </div>
        )}

        {/* 历史分析记录 */}
        {!report && insights.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">历史分析</h2>
              </div>
              <span className="text-sm text-gray-500">共 {insights.length} 条记录</span>
            </div>

            {/* 网格布局 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {insights.map((insight) => (
                <Card
                  key={insight.id}
                  className="group cursor-pointer hover:shadow-lg hover:border-indigo-300 transition-all duration-300 overflow-hidden"
                  onClick={() => {
                    // 加载这条记录的详情
                    setKeyword(insight.keyword);
                    const enhancedReport: EnhancedInsightReport = {
                      topLikedArticles: JSON.parse(insight.topLikedArticles),
                      topInteractiveArticles: JSON.parse(insight.topInteractiveArticles),
                      wordCloud: JSON.parse(insight.wordCloud),
                      insights: JSON.parse(insight.insights),
                      articleSummaries: insight.articleSummaries ? JSON.parse(insight.articleSummaries) : [],
                      structuredInsights: insight.structuredInsights ? JSON.parse(insight.structuredInsights) : [],
                      analysisMetadata: insight.analysisMetadata ? JSON.parse(insight.analysisMetadata) : null,
                    };
                    setReport(enhancedReport);
                    setCurrentInsightId(insight.id);

                    // 加载文章数据
                    const topLiked = JSON.parse(insight.topLikedArticles);
                    const topInteractive = JSON.parse(insight.topInteractiveArticles);

                    // 合并并去重文章
                    const articlesMap = new Map();
                    [...topLiked, ...topInteractive].forEach((article: any) => {
                      if (article.url && !articlesMap.has(article.url)) {
                        articlesMap.set(article.url, article);
                      }
                    });

                    setAllArticles(Array.from(articlesMap.values()));

                    // 滚动到顶部查看详情
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <CardContent className="p-5">
                    {/* 头部 */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-base text-gray-900 mb-1 truncate group-hover:text-indigo-600 transition-colors">
                            {insight.keyword}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {formatDate(insight.createdAt)}
                          </p>
                        </div>
                      </div>
                      {/* 删除按钮 */}
                      <button
                        onClick={(e) => handleDeleteInsight(insight.id, e)}
                        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除记录"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>

                    {/* 统计数据 */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-xs text-blue-900 font-medium">文章数</span>
                        </div>
                        <p className="text-xl font-bold text-blue-600 mt-1">{insight.totalArticles}</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-green-900 font-medium">洞察数</span>
                        </div>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          {insight.structuredInsights ? JSON.parse(insight.structuredInsights).length : 3}
                        </p>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 h-9 bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={(e) => {
                          e.stopPropagation();
                          // 触发查看详情逻辑
                          setKeyword(insight.keyword);
                          const enhancedReport: EnhancedInsightReport = {
                            topLikedArticles: JSON.parse(insight.topLikedArticles),
                            topInteractiveArticles: JSON.parse(insight.topInteractiveArticles),
                            wordCloud: JSON.parse(insight.wordCloud),
                            insights: JSON.parse(insight.insights),
                            articleSummaries: insight.articleSummaries ? JSON.parse(insight.articleSummaries) : [],
                            structuredInsights: insight.structuredInsights ? JSON.parse(insight.structuredInsights) : [],
                            analysisMetadata: insight.analysisMetadata ? JSON.parse(insight.analysisMetadata) : null,
                          };
                          setReport(enhancedReport);
                          setCurrentInsightId(insight.id);

                          // 加载文章数据
                          const topLiked = JSON.parse(insight.topLikedArticles);
                          const topInteractive = JSON.parse(insight.topInteractiveArticles);

                          // 合并并去重文章
                          const articlesMap = new Map();
                          [...topLiked, ...topInteractive].forEach((article: any) => {
                            if (article.url && !articlesMap.has(article.url)) {
                              articlesMap.set(article.url, article);
                            }
                          });

                          setAllArticles(Array.from(articlesMap.values()));

                          // 滚动到顶部查看详情
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                      >
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        查看
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
