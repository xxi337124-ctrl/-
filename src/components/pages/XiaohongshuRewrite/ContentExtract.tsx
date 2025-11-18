'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import XhsImage from '@/components/XhsImage';
import type { XhsNote } from './index';

interface ContentExtractProps {
  onNoteSelect: (note: XhsNote) => void;
  history?: XhsNote[];
  onSelectFromHistory?: (note: XhsNote) => void;
  searchResults?: XhsNote[];
  onSearchResults?: (results: XhsNote[]) => void;
}

export default function ContentExtract({
  onNoteSelect,
  history = [],
  onSelectFromHistory,
  searchResults = [],
  onSearchResults
}: ContentExtractProps) {
  const [searchType, setSearchType] = useState<'keyword' | 'account'>('keyword');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<XhsNote[]>(searchResults);
  const [error, setError] = useState<string | null>(null);

  // 筛选选项
  const [filters, setFilters] = useState({
    sort: 'general' as 'general' | 'popularity_descending' | 'time_descending',
    note_type: 'image' as 'image' | 'video' | 'all',
    note_time: '不限' as '不限' | '近一周' | '近一月' | '近三月',
    note_range: '不限' as '不限' | '10w+' | '1w+',
  });

  // 当 searchResults 变化时同步更新 notes
  useEffect(() => {
    if (searchResults.length > 0) {
      setNotes(searchResults);
    }
  }, [searchResults]);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError('请输入搜索关键词或用户ID');
      return;
    }

    setLoading(true);
    setError(null);
    setNotes([]);

    try {
      // 通过API调用搜索
      const response = await fetch('/api/topic-analysis/fetch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'xiaohongshu',
          searchType,
          query: keyword,
          xhsOptions: filters, // 传递筛选参数
        }),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || '搜索失败，请稍后重试');
        return;
      }

      const articles = data.data.articles || [];
      const results: XhsNote[] = articles.map((article: any) => ({
        id: article.id || String(Math.random()),
        title: article.title || '无标题',
        content: article.content || article.desc || article.title || '暂无内容描述',
        images: article.images || [],
        likes: article.likes || 0,
        comments: article.comments || 0,
        author: article.author || '',
        url: article.url || '',
      }));

      if (results.length === 0) {
        setError('未找到相关内容，请尝试其他关键词');
      } else {
        setNotes(results);
        onSearchResults?.(results); // 通知父组件保存搜索结果
      }
    } catch (error: any) {
      console.error('搜索失败:', error);
      setError(error.message || '搜索失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">提取小红书内容</h2>
        <p className="text-gray-600">输入关键词或用户ID，提取小红书笔记内容</p>
      </div>

      {/* 搜索框 */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Button
            variant={searchType === 'keyword' ? 'default' : 'outline'}
            onClick={() => setSearchType('keyword')}
            className="flex-1"
          >
            关键词搜索
          </Button>
          <Button
            variant={searchType === 'account' ? 'default' : 'outline'}
            onClick={() => setSearchType('account')}
            className="flex-1"
          >
            用户搜索
          </Button>
        </div>

        {/* 筛选选项 - 仅关键词搜索时显示 */}
        {searchType === 'keyword' && (
          <div className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <h3 className="font-semibold text-gray-700">筛选选项</h3>
            </div>

            {/* 排序方式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={filters.sort === 'general' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, sort: 'general' })}
                  className="text-sm"
                >
                  综合排序
                </Button>
                <Button
                  size="sm"
                  variant={filters.sort === 'popularity_descending' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, sort: 'popularity_descending' })}
                  className="text-sm"
                >
                  🔥 最热
                </Button>
                <Button
                  size="sm"
                  variant={filters.sort === 'time_descending' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, sort: 'time_descending' })}
                  className="text-sm"
                >
                  🕒 最新
                </Button>
              </div>
            </div>

            {/* 内容类型 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">内容类型</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={filters.note_type === 'all' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_type: 'all' })}
                  className="text-sm"
                >
                  全部
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_type === 'image' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_type: 'image' })}
                  className="text-sm"
                >
                  📷 图文
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_type === 'video' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_type: 'video' })}
                  className="text-sm"
                >
                  🎬 视频
                </Button>
              </div>
            </div>

            {/* 发布时间 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">发布时间</label>
              <div className="grid grid-cols-4 gap-2">
                <Button
                  size="sm"
                  variant={filters.note_time === '不限' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_time: '不限' })}
                  className="text-sm"
                >
                  不限
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_time === '近一周' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_time: '近一周' })}
                  className="text-sm"
                >
                  近一周
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_time === '近一月' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_time: '近一月' })}
                  className="text-sm"
                >
                  近一月
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_time === '近三月' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_time: '近三月' })}
                  className="text-sm"
                >
                  近三月
                </Button>
              </div>
            </div>

            {/* 点赞范围 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">热度范围</label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  variant={filters.note_range === '不限' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_range: '不限' })}
                  className="text-sm"
                >
                  不限
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_range === '1w+' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_range: '1w+' })}
                  className="text-sm"
                >
                  💖 1w+
                </Button>
                <Button
                  size="sm"
                  variant={filters.note_range === '10w+' ? 'default' : 'outline'}
                  onClick={() => setFilters({ ...filters, note_range: '10w+' })}
                  className="text-sm"
                >
                  🔥 10w+
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <Input
            placeholder={
              searchType === 'keyword'
                ? '输入关键词，例如：咖啡探店、穿搭分享'
                : '输入小红书用户ID或昵称'
            }
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="flex-1"
            disabled={loading}
          />
          <Button onClick={handleSearch} disabled={loading || !keyword.trim()}>
            {loading ? '搜索中...' : '搜索'}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
      </div>

      {/* 历史记录 - 始终显示 */}
      {history.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            历史记录 ({history.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {history.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-lg transition-shadow border-blue-200"
                onClick={(e) => {
                  e.stopPropagation();
                  if (onSelectFromHistory) {
                    onSelectFromHistory(note);
                  } else {
                    onNoteSelect(note);
                  }
                }}
              >
                <CardContent className="p-4" onClick={(e) => e.stopPropagation()}>
                  {note.images.length > 0 && (
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                      <XhsImage
                        src={note.images[0]}
                        alt={note.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {note.title}
                  </h4>
                  {note.content && note.content !== note.title && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {note.content}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>❤️ {note.likes}</span>
                    <span>💬 {note.comments}</span>
                    {note.author && <span>👤 {note.author}</span>}
                  </div>
                  <div className="mt-3">
                    <Button
                      className="w-full"
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onSelectFromHistory) {
                          onSelectFromHistory(note);
                        } else {
                          onNoteSelect(note);
                        }
                      }}
                    >
                      查看并创作
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      {notes.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            找到 {notes.length} 条笔记
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => (
              <Card
                key={note.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={(e) => {
                  e.stopPropagation();
                  onNoteSelect(note);
                }}
              >
                <CardContent className="p-4" onClick={(e) => e.stopPropagation()}>
                  {note.images.length > 0 && (
                    <div className="aspect-square mb-3 rounded-lg overflow-hidden bg-gray-100">
                      <XhsImage
                        src={note.images[0]}
                        alt={note.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <h4 className="font-semibold text-gray-800 mb-2 line-clamp-2">
                    {note.title}
                  </h4>
                  {note.content && note.content !== note.title && (
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {note.content}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>❤️ {note.likes}</span>
                    <span>💬 {note.comments}</span>
                    {note.author && <span>👤 {note.author}</span>}
                  </div>
                  <div className="mt-3">
                    <Button 
                      className="w-full" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        onNoteSelect(note);
                      }}
                    >
                      选择此笔记
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

