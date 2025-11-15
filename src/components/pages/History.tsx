"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    loadRecords();
  }, [filter, sortBy]);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter !== "all") params.append("filter", filter);
      if (sortBy) params.append("sortBy", sortBy);
      if (searchQuery) params.append("search", searchQuery);

      const response = await fetch(`/api/insights?${params.toString()}`);
      const data = await response.json();

      if (data.success) {
        setRecords(data.data);
      }
    } catch (error) {
      console.error("加载历史记录失败:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    loadRecords();
  };

  const handleToggleExpand = async (id: string) => {
    if (expandedId === id) {
      // Collapse
      setExpandedId(null);
    } else {
      // Expand and increment view count
      setExpandedId(id);
      try {
        const response = await fetch(`/api/insights/${id}`);
        const data = await response.json();
        if (data.success) {
          // Update the record in the list with new viewCount
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

  return (
    <div className="h-full bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-gray-900 via-purple-900 to-pink-600 bg-clip-text text-transparent">
            历史记录
          </h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            查看和管理所有的选题分析历史
          </p>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">总记录</p>
                  <p className="text-2xl font-bold text-gray-900">{records.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-rose-100 to-rose-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-rose-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">收藏</p>
                  <p className="text-2xl font-bold text-gray-900">{records.filter(r => r.isFavorite).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                    <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">总查看</p>
                  <p className="text-2xl font-bold text-gray-900">{records.reduce((sum, r) => sum + r.viewCount, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-2 hover:shadow-xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">总文章</p>
                  <p className="text-2xl font-bold text-gray-900">{records.reduce((sum, r) => sum + r.totalArticles, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8 border-2 shadow-lg">
          <CardContent className="pt-6 pb-6">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={filter === "all" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("all")}
                  className={filter === "all" ? "shadow-md" : ""}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                  </svg>
                  全部
                </Button>
                <Button
                  variant={filter === "favorites" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("favorites")}
                  className={filter === "favorites" ? "shadow-md" : ""}
                >
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  收藏
                </Button>
                <Button
                  variant={filter === "7days" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("7days")}
                  className={filter === "7days" ? "shadow-md" : ""}
                >
                  近7天
                </Button>
                <Button
                  variant={filter === "30days" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setFilter("30days")}
                  className={filter === "30days" ? "shadow-md" : ""}
                >
                  近30天
                </Button>
              </div>
              <div className="h-6 w-px bg-gray-200 hidden md:block" />
              <div className="flex gap-2">
                <Button
                  variant={sortBy === "time" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("time")}
                >
                  按时间
                </Button>
                <Button
                  variant={sortBy === "views" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setSortBy("views")}
                >
                  按查看
                </Button>
              </div>
              <div className="flex-1 w-full md:w-auto">
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <Input
                    placeholder="搜索关键词..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                    className="pl-12 h-10 border-2 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Records List */}
        <div className="space-y-4">
          {loading ? (
            <Card className="border-2">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <svg className="w-10 h-10 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <p className="text-gray-500 text-lg">加载中...</p>
              </CardContent>
            </Card>
          ) : records.length === 0 ? (
            <Card className="border-2">
              <CardContent className="py-16 text-center">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-gray-500 text-lg mb-3">还没有历史记录</p>
                <p className="text-gray-400 text-sm">开始第一次选题分析吧</p>
              </CardContent>
            </Card>
          ) : (
            records.map((record) => (
              <Card key={record.id} className="group border-2 hover:border-purple-200 hover:shadow-2xl transition-all duration-300">
                <CardContent className="pt-6 pb-6">
                  <div className="flex items-start gap-6">
                    {/* Icon */}
                    <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-pink-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                        <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                      </svg>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                          {record.keyword}
                        </h3>
                        {record.isFavorite && (
                          <Badge className="bg-gradient-to-r from-rose-400 to-pink-400 text-white border-0">
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                            收藏
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-6 text-sm text-gray-500 mb-4">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{record.totalArticles}</span> 篇文章
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="font-semibold">{JSON.parse(record.insights).length}</span> 个洞察
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-semibold">{record.viewCount}</span> 次查看
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                          </svg>
                          {formatDate(record.createdAt)}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className="hover:bg-purple-50 hover:text-purple-600" onClick={() => handleToggleExpand(record.id)}>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {expandedId === record.id ? (
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            ) : (
                              <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </>
                            )}
                          </svg>
                          {expandedId === record.id ? "收起" : "查看详情"}
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-indigo-50 hover:text-indigo-600" onClick={() => handleReanalyze(record.keyword)}>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          重新分析
                        </Button>
                        <Button size="sm" variant="ghost" className={record.isFavorite ? "text-rose-500 hover:bg-rose-50" : "hover:bg-rose-50 hover:text-rose-600"} onClick={() => handleToggleFavorite(record.id, record.isFavorite)}>
                          <svg className="w-4 h-4 mr-1.5" fill={record.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                          </svg>
                          {record.isFavorite ? "取消收藏" : "收藏"}
                        </Button>
                        <Button size="sm" variant="ghost" className="hover:bg-red-50 hover:text-red-600" onClick={() => handleDelete(record.id)}>
                          <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          删除
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Detail View */}
                  {expandedId === record.id && (
                    <div className="mt-6 pt-6 border-t-2 border-gray-100 animate-in slide-in-from-top-2 duration-300">
                      <div className="space-y-6">
                        {/* Top Liked Articles */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">点赞量 TOP5</h4>
                          </div>
                          <div className="space-y-3">
                            {JSON.parse(record.topLikedArticles).map((article: any, index: number) => (
                              <div key={index} className="p-4 bg-rose-50/50 rounded-lg border border-rose-100 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                    index === 0 ? 'bg-gradient-to-br from-rose-500 to-pink-500 text-white' :
                                    index === 1 ? 'bg-gray-300 text-white' :
                                    index === 2 ? 'bg-rose-300 text-white' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-2">{article.title}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-rose-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                                        </svg>
                                        {formatNumber(article.likes)}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                        </svg>
                                        {formatNumber(article.views)}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Top Interactive Articles */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">互动率 TOP5</h4>
                          </div>
                          <div className="space-y-3">
                            {JSON.parse(record.topInteractiveArticles).map((article: any, index: number) => (
                              <div key={index} className="p-4 bg-purple-50/50 rounded-lg border border-purple-100 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-3">
                                  <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                                    index === 0 ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white' :
                                    index === 1 ? 'bg-purple-400 text-white' :
                                    index === 2 ? 'bg-purple-300 text-white' :
                                    'bg-gray-100 text-gray-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-medium text-gray-900 mb-2">{article.title}</p>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-gray-100 rounded-full h-2">
                                        <div
                                          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                                          style={{ width: `${Math.min(article.interactionRate * 5, 100)}%` }}
                                        />
                                      </div>
                                      <span className="text-sm font-bold text-purple-600 min-w-[3rem] text-right">
                                        {article.interactionRate.toFixed(1)}%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Word Cloud */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">高频词云</h4>
                          </div>
                          <div className="flex flex-wrap gap-2 p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                            {JSON.parse(record.wordCloud).slice(0, 20).map((word: any, index: number) => {
                              const size = Math.min(word.count / 2 + 12, 20);
                              const colors = [
                                'bg-gradient-to-br from-indigo-500 to-indigo-600',
                                'bg-gradient-to-br from-purple-500 to-purple-600',
                                'bg-gradient-to-br from-blue-500 to-blue-600',
                                'bg-gradient-to-br from-cyan-500 to-cyan-600',
                                'bg-gradient-to-br from-pink-500 to-pink-600',
                              ];
                              return (
                                <span
                                  key={index}
                                  className={`px-3 py-1.5 ${colors[index % colors.length]} text-white rounded-lg font-medium shadow-sm hover:shadow-md transition-shadow`}
                                  style={{ fontSize: `${size}px` }}
                                >
                                  {word.word}
                                </span>
                              );
                            })}
                          </div>
                        </div>

                        {/* Insights */}
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            </div>
                            <h4 className="font-bold text-lg text-gray-900">选题洞察</h4>
                          </div>
                          <div className="space-y-3">
                            {JSON.parse(record.insights).map((insight: string, index: number) => (
                              <div key={index} className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-emerald-400 to-teal-500 text-white rounded-lg flex items-center justify-center font-bold text-xs">
                                    {index + 1}
                                  </div>
                                  <p className="flex-1 text-gray-700 leading-relaxed">{insight}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
