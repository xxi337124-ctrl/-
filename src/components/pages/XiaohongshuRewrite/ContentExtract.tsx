'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import type { XhsNote } from './index';

interface ContentExtractProps {
  onNoteSelect: (note: XhsNote) => void;
  history?: XhsNote[];
  onSelectFromHistory?: (note: XhsNote) => void;
}

export default function ContentExtract({ onNoteSelect, history = [], onSelectFromHistory }: ContentExtractProps) {
  const [searchType, setSearchType] = useState<'keyword' | 'account'>('keyword');
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<XhsNote[]>([]);
  const [error, setError] = useState<string | null>(null);

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

      {/* 历史记录 */}
      {history.length > 0 && notes.length === 0 && (
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
                      <img
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
                      <img
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

