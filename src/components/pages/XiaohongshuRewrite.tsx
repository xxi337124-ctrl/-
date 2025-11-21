"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";

// 搜索历史记录类型
interface SearchHistory {
  id: string;
  keyword: string;
  searchType: 'keyword' | 'account';
  notes: any[];
  timestamp: number;
  isExpanded: boolean; // 是否展开
}

export default function XiaohongshuRewritePage() {
  const [keyword, setKeyword] = useState("");
  const [searchType, setSearchType] = useState<'keyword' | 'account'>('keyword');
  const [loading, setLoading] = useState(false);
  const [progressSteps, setProgressSteps] = useState<{ text: string; completed: boolean }[]>([]);

  // 修改：使用搜索历史数组，而不是单个notes
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);

  const [selectedNote, setSelectedNote] = useState<any>(null);
  const [rewriteContent, setRewriteContent] = useState<string>("");
  const [recreatedImages, setRecreatedImages] = useState<any[]>([]);
  const [rewriting, setRewriting] = useState(false);

  // 从 localStorage 恢复状态
  useEffect(() => {
    const savedData = localStorage.getItem('xiaohongshu_rewrite_state');
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        console.log('🔄 恢复之前的创作状态:', parsed);

        if (parsed.searchHistory && parsed.searchHistory.length > 0) {
          setSearchHistory(parsed.searchHistory);
        }
        if (parsed.selectedNote) {
          setSelectedNote(parsed.selectedNote);
        }
        if (parsed.rewriteContent) {
          setRewriteContent(parsed.rewriteContent);
        }
        if (parsed.recreatedImages) {
          setRecreatedImages(parsed.recreatedImages);
        }
        if (parsed.keyword) {
          setKeyword(parsed.keyword);
        }
      } catch (e) {
        console.error('❌ 恢复状态失败', e);
        localStorage.removeItem('xiaohongshu_rewrite_state');
      }
    }
  }, []);

  // 保存状态到 localStorage
  useEffect(() => {
    // 只在有实际内容时才保存
    if (!searchHistory.length && !selectedNote && !rewriteContent) {
      return;
    }

    const stateToSave = {
      searchHistory,
      selectedNote,
      rewriteContent,
      recreatedImages,
      keyword,
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem('xiaohongshu_rewrite_state', JSON.stringify(stateToSave));
      console.log('💾 已保存创作状态到localStorage');
    } catch (e) {
      console.error('❌ 保存状态失败:', e);
    }
  }, [searchHistory, selectedNote, rewriteContent, recreatedImages, keyword]);

  const handleSearch = async () => {
    if (!keyword.trim()) return;

    setLoading(true);
    // 不清空notes和selectedNote，保留历史

    // 初始化进度步骤
    const steps = [
      {
        text: searchType === 'keyword'
          ? `正在搜索小红书笔记...`
          : `正在获取账号最新笔记...`,
        completed: false
      },
      { text: "生成搜索结果...", completed: false },
    ];
    setProgressSteps(steps);

    try {
      const response = await fetch('/api/xiaohongshu/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: keyword,
          searchType,
          limit: 10
        }),
      });

      const data = await response.json();

      if (data.success) {
        setProgressSteps(prev => prev.map((step) => ({ ...step, completed: true })));

        // 将旧的搜索结果折叠（设置 isExpanded = false）
        setSearchHistory(prev => prev.map(h => ({ ...h, isExpanded: false })));

        // 添加新的搜索结果（完整展示）
        const newHistory: SearchHistory = {
          id: Date.now().toString(),
          keyword,
          searchType,
          notes: data.data.notes,
          timestamp: Date.now(),
          isExpanded: true, // 新结果默认展开
        };

        setSearchHistory(prev => [newHistory, ...prev]); // 新结果放在最前面

        console.log(`✅ 搜索成功，找到 ${data.data.notes.length} 条笔记`);

        // 自动保存原始笔记到素材库（不阻塞UI）
        fetch('/api/materials', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            keyword,
            searchType,
            articles: data.data.notes,
          }),
        }).then(res => res.json()).then(result => {
          if (result.success) {
            if (result.data.isExisting) {
              console.log('📦 素材库中已存在该关键词的内容');
            } else {
              console.log(`✅ 已保存 ${data.data.notes.length} 条笔记到素材库`);
            }
          }
        }).catch(err => {
          console.error('保存到素材库失败:', err);
        });
      } else {
        alert(`搜索失败: ${data.error}`);
        setProgressSteps([]);
      }
    } catch (error: any) {
      console.error("搜索失败:", error);
      alert(`搜索失败: ${error.message || '请检查网络连接后重试'}`);
      setProgressSteps([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRewrite = async (note: any) => {
    setSelectedNote(note);
    setRewriting(true);
    setRewriteContent("");
    setRecreatedImages([]);

    // 计算预估时间：文案改写8秒 + 图片数量 * 15秒
    const imageCount = note.images?.length || 1;
    const estimatedMinutes = Math.ceil((8 + imageCount * 15) / 60);

    // 显示预警
    const confirmStart = confirm(
      `⏱️ AI二创预计需要 ${estimatedMinutes} 分钟\n\n` +
      `将处理 ${imageCount} 张图片\n` +
      `请保持页面打开，不要关闭或刷新\n\n` +
      `是否继续？`
    );

    if (!confirmStart) {
      setRewriting(false);
      return;
    }

    try {
      console.log('🎨 开始AI二创...', note);
      console.log(`⏱️ 预计需要 ${estimatedMinutes} 分钟`);

      // 添加超时控制 (15分钟)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        console.error('❌ 请求超时（15分钟）');
      }, 15 * 60 * 1000);

      // 调用小红书二创API (文案 + 图片)
      const response = await fetch('/api/xiaohongshu/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteId: note.id,
          title: note.title,
          content: note.content,
          images: note.images || [note.coverImage],
        }),
        signal: controller.signal, // 添加超时信号
      });

      clearTimeout(timeoutId); // 清除超时定时器

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setRewriteContent(data.data.rewrittenText);
        setRecreatedImages(data.data.recreatedImages || []);
        console.log('✅ AI二创完成');
        alert(`✅ AI二创完成！\n\n文案：${data.data.rewrittenText.length}字\n图片：${data.data.recreatedImages.length}张`);
      } else {
        alert(`二创失败: ${data.error}`);
      }
    } catch (error: any) {
      console.error("二创失败:", error);

      if (error.name === 'AbortError') {
        alert(`❌ 请求超时（超过15分钟）\n\n可能原因：\n1. 网络连接不稳定\n2. API服务器响应过慢\n3. 图片数量过多\n\n建议：减少图片数量或稍后重试`);
      } else {
        alert(`二创失败: ${error.message || '请稍后重试'}`);
      }
    } finally {
      setRewriting(false);
    }
  };

  // 展开/折叠搜索历史
  const toggleExpand = (historyId: string) => {
    setSearchHistory(prev =>
      prev.map(h =>
        h.id === historyId
          ? { ...h, isExpanded: true }   // 展开当前
          : { ...h, isExpanded: false }  // 折叠其他
      )
    );
  };

  const handleSaveToArticles = async () => {
    if (!rewriteContent) {
      alert('请先生成二创内容');
      return;
    }

    try {
      // 提取重绘图片的URL
      const imageUrls = recreatedImages.map(img => img.newUrl);

      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: selectedNote?.title || '小红书二创内容',
          content: rewriteContent,
          status: 'DRAFT',
          wordCount: rewriteContent.length,
          images: imageUrls, // 使用 images 字段存储图片URL数组
          tags: selectedNote?.tags || [],
          metadata: {
            source: 'xiaohongshu_rewrite',
            originalNoteId: selectedNote?.id,
            recreatedImagesCount: recreatedImages.length,
          }
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert('✅ 二创内容已保存到【发布管理】！');
        console.log('✅ 已保存到发布管理（DRAFT状态）:', data.data);
      } else {
        alert(`保存失败: ${data.error}`);
      }
    } catch (error) {
      console.error('保存失败:', error);
      alert('保存失败，请稍后重试');
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* 头部 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            📕 小红书二创工作台
          </h1>
          <p className="text-sm text-gray-500">
            搜索小红书爆款笔记，AI智能二创改写，生成原创内容
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
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                </svg>
                账号搜索
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
                      ? "输入关键词，例如：穿搭、美妆、美食、旅行"
                      : "输入小红书账号名称"
                  }
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="flex-1 h-12 pl-12 text-base border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all"
                  disabled={loading}
                />
              </div>
              <Button
                onClick={handleSearch}
                disabled={loading || !keyword.trim()}
                className="h-12 px-8 text-base bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    搜索中
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    开始搜索
                  </span>
                )}
              </Button>
            </div>

            {/* 热门关键词 */}
            <div className="mt-4 flex items-center gap-3 text-sm">
              <span className="text-gray-500">
                {searchType === 'keyword' ? '热门标签:' : '示例账号:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {(searchType === 'keyword'
                  ? ["穿搭分享", "美妆教程", "美食探店", "旅行攻略", "健身减肥"]
                  : ["小红书", "薯队长", "美妆博主", "穿搭达人", "美食探店"]
                ).map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setKeyword(tag)}
                    className="px-3 py-1.5 text-pink-600 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors font-medium"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 进度条 */}
        {loading && progressSteps.length > 0 && (
          <Card className="mb-6 border-0 shadow-sm bg-gradient-to-r from-pink-50 to-rose-50">
            <CardContent className="pt-6 pb-6">
              <div className="space-y-3">
                {progressSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      step.completed ? 'bg-green-500' : 'bg-gray-300'
                    }`}>
                      {step.completed ? (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      ) : (
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      )}
                    </div>
                    <span className="text-sm font-medium text-gray-700">{step.text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 搜索历史记录 */}
        {!loading && searchHistory.length > 0 && (
          <div className="space-y-6 mb-6">
            {searchHistory.map((history) => (
              <div key={history.id}>
                {history.isExpanded ? (
                  /* 展开状态：完整的左右分栏布局 */
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左侧：笔记列表 */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                          <span>🔥</span>
                          <span>{history.keyword}</span>
                          <span className="text-sm font-normal text-gray-500">
                            ({history.notes.length}条笔记)
                          </span>
                        </h2>
                        {searchHistory.length > 1 && (
                          <button
                            onClick={() => setSearchHistory(prev => prev.map(h => ({ ...h, isExpanded: false })))}
                            className="text-xs text-gray-500 hover:text-pink-500 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            折叠
                          </button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {history.notes.map((note) => (
                          <Card
                            key={note.id}
                            className={`cursor-pointer transition-all border-2 ${
                              selectedNote?.id === note.id
                                ? 'border-pink-500 shadow-lg'
                                : 'border-gray-200 hover:border-pink-300 hover:shadow-md'
                            }`}
                            onClick={() => setSelectedNote(note)}
                          >
                            <CardContent className="p-4">
                              <div className="flex gap-3">
                                {/* 封面图片 */}
                                {note.coverImage && (
                                  <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-gray-100">
                                    <img
                                      src={note.coverImage}
                                      alt={note.title}
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  </div>
                                )}

                                {/* 内容区域 */}
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                                    {note.title}
                                  </h3>
                                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                    {note.content}
                                  </p>
                                  <div className="flex items-center gap-4 text-xs text-gray-500">
                                    <span className="flex items-center gap-1">
                                      ❤️ {formatNumber(note.likes)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      💬 {formatNumber(note.comments)}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      ⭐ {formatNumber(note.collects)}
                                    </span>
                                    <span className="ml-auto truncate">
                                      @{note.author?.name || note.author}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* 右侧：笔记预览 */}
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>👁️</span>
                        <span>笔记预览</span>
                      </h2>
                      {selectedNote ? (
                        <div className="space-y-4">
                          {/* 原始笔记预览 */}
                          <Card className="border-2 border-pink-200">
                            <CardHeader className="pb-3 bg-gradient-to-r from-pink-50 to-rose-50">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <CardTitle className="text-base mb-2">
                                    {selectedNote.title}
                                  </CardTitle>
                                  <CardDescription className="text-xs flex items-center gap-2">
                                    <span>@{selectedNote.author?.name || selectedNote.author}</span>
                                    <span>·</span>
                                    <span>❤️ {formatNumber(selectedNote.likes)}</span>
                                    <span>💬 {formatNumber(selectedNote.comments)}</span>
                                  </CardDescription>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="pt-4">
                              {/* 笔记图片 - 显示所有图片 */}
                              {selectedNote.images && selectedNote.images.length > 0 && (
                                <div className="mb-4">
                                  <h4 className="text-xs font-semibold text-gray-500 mb-2">
                                    📸 图片 ({selectedNote.images.length}张)
                                  </h4>
                                  <div className="grid grid-cols-3 gap-2 max-h-96 overflow-y-auto">
                                    {selectedNote.images.map((img: string, index: number) => (
                                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                        <img
                                          src={img}
                                          alt={`图片 ${index + 1}`}
                                          className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                          onError={(e) => {
                                            e.currentTarget.src = selectedNote.coverImage || 'https://via.placeholder.com/400x400?text=加载失败';
                                          }}
                                        />
                                        <div className="absolute bottom-0 right-0 bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded-tl">
                                          {index + 1}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* 笔记文案 */}
                              <div className="mb-4">
                                <h4 className="text-xs font-semibold text-gray-500 mb-2">📝 原文案</h4>
                                <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg max-h-48 overflow-y-auto">
                                  <p className="whitespace-pre-wrap">{selectedNote.content}</p>
                                </div>
                              </div>

                              {/* 二创按钮 */}
                              {!rewriteContent && !rewriting && (
                                <Button
                                  onClick={() => handleRewrite(selectedNote)}
                                  className="w-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
                                >
                                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                  </svg>
                                  开始AI二创
                                </Button>
                              )}
                            </CardContent>
                          </Card>

                          {/* AI二创进度 */}
                          {rewriting && (
                            <Card className="border-2 border-purple-200 bg-purple-50">
                              <CardContent className="pt-6 pb-6">
                                <div className="text-center">
                                  <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-4"></div>
                                  <p className="text-gray-700 font-medium">AI正在创作中，请稍候...</p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    正在改写文案并重绘 {selectedNote.images?.length || 0} 张图片
                                  </p>
                                  <p className="text-xs text-orange-600 mt-2 font-semibold">
                                    ⏱️ 预计需要 {Math.ceil((selectedNote.images?.length || 0) * 15 / 60)} 分钟
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    （每张图片间隔15秒避免API限流）
                                  </p>
                                </div>
                              </CardContent>
                            </Card>
                          )}

                          {/* AI二创结果 */}
                          {rewriteContent && !rewriting && (
                            <Card className="border-2 border-green-200">
                              <CardHeader className="pb-3 bg-gradient-to-r from-green-50 to-emerald-50">
                                <CardTitle className="text-base flex items-center gap-2">
                                  <span>✨</span>
                                  <span>AI二创结果</span>
                                </CardTitle>
                              </CardHeader>
                              <CardContent className="pt-4">
                                {/* 二创后的文案 */}
                                <div className="mb-4">
                                  <h4 className="text-xs font-semibold text-gray-500 mb-2">✍️ 二创文案</h4>
                                  <div className="text-sm text-gray-700 p-3 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap">{rewriteContent}</pre>
                                  </div>
                                </div>

                                {/* 重绘后的图片 */}
                                {recreatedImages.length > 0 && (
                                  <div className="mb-4">
                                    <h4 className="text-xs font-semibold text-gray-500 mb-2">🎨 重绘图片</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                      {recreatedImages.map((img, index) => (
                                        <div key={index} className="space-y-1">
                                          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-100">
                                            <img
                                              src={img.newUrl}
                                              alt={`重绘图片 ${index + 1}`}
                                              className="w-full h-full object-cover"
                                              onError={(e) => {
                                                e.currentTarget.src = img.originalUrl;
                                              }}
                                            />
                                          </div>
                                          {img.analysis && (
                                            <p className="text-xs text-gray-500 line-clamp-1">
                                              {img.analysis.description || '暂无描述'}
                                            </p>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                {/* 操作按钮 */}
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleRewrite(selectedNote)}
                                    variant="outline"
                                    size="sm"
                                    className="flex-1"
                                  >
                                    🔄 重新生成
                                  </Button>
                                  <Button
                                    onClick={handleSaveToArticles}
                                    size="sm"
                                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                                  >
                                    💾 保存到发布管理
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      ) : (
                        <Card className="border-2 border-dashed border-gray-300">
                          <CardContent className="py-20 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                              </svg>
                            </div>
                            <p className="text-gray-500">
                              👈 请先在左侧选择一篇笔记
                            </p>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                ) : (
                  /* 折叠状态：小卡片样式 */
                  <Card
                    className="border border-gray-200 hover:border-pink-300 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => toggleExpand(history.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-4">
                        {/* 搜索类型图标 */}
                        <div className="flex-shrink-0 w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📕</span>
                        </div>

                        {/* 关键词和数量 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">{history.keyword}</span>
                            <span className="text-xs text-pink-600 bg-pink-50 px-2 py-0.5 rounded">
                              🔥 {history.notes.length}条
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {new Date(history.timestamp).toLocaleString('zh-CN', {
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                            {' · '}
                            {history.searchType === 'keyword' ? '关键词搜索' : '账号搜索'}
                          </div>
                        </div>

                        {/* 缩略图预览 */}
                        <div className="flex -space-x-2">
                          {history.notes.slice(0, 3).map((note, index) => (
                            note.coverImage && (
                              <div
                                key={index}
                                className="w-8 h-8 rounded-md overflow-hidden border-2 border-white bg-gray-100"
                              >
                                <img
                                  src={note.coverImage}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )
                          ))}
                          {history.notes.length > 3 && (
                            <div className="w-8 h-8 rounded-md bg-gray-100 border-2 border-white flex items-center justify-center text-xs text-gray-500">
                              +{history.notes.length - 3}
                            </div>
                          )}
                        </div>

                        {/* 展开按钮 */}
                        <button className="text-pink-500 hover:text-pink-600 flex items-center gap-1 text-sm">
                          展开
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 空状态 */}
        {!loading && searchHistory.length === 0 && progressSteps.length === 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-20 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">📕</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">开始小红书二创</h3>
              <p className="text-gray-600 mb-6">
                搜索爆款笔记，AI智能二创，生成原创内容
              </p>
              <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span>1️⃣</span>
                  </div>
                  <span>搜索笔记</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span>2️⃣</span>
                  </div>
                  <span>选择素材</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span>3️⃣</span>
                  </div>
                  <span>AI二创</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span>4️⃣</span>
                  </div>
                  <span>保存发布</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
