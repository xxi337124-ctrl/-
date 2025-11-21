'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ContentExtract from './ContentExtract';
import ContentView from './ContentView';
import RewriteProcess from './RewriteProcess';
import FinalResult from './FinalResult';

// 简单的字符串哈希函数，用于生成稳定的ID
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

export interface XhsNote {
  id: string;
  title: string;
  content: string;
  images: string[];
  likes: number;
  comments: number;
  author: string;
  url: string;
}

export interface RewriteResult {
  original: {
    content: string;
    images: string[];
  };
  rewritten: {
    content: string;
    images: string[];
    imagePrompts: string[];
  };
}

type Step = 'extract' | 'view' | 'process' | 'result';

export default function XiaohongshuRewrite() {
  const searchParams = useSearchParams();
  console.log('XiaohongshuRewrite - 组件初始化, searchParams:', searchParams.toString());

  const [currentStep, setCurrentStep] = useState<Step>('extract');
  const [selectedNote, setSelectedNote] = useState<XhsNote | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<XhsNote[]>([]);
  const [searchResults, setSearchResults] = useState<XhsNote[]>([]); // 保存搜索结果

  // 定义函数
  const loadHistory = () => {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('xiaohongshu_rewrite_history');
      if (saved) {
        const historyData = JSON.parse(saved);

        // 去重：根据ID去重,保留最早的记录
        const uniqueHistory = historyData.reduce((acc: XhsNote[], current: XhsNote) => {
          const exists = acc.find(item => item.id === current.id);
          if (!exists) {
            acc.push(current);
          }
          return acc;
        }, []);

        // 如果去重后数量发生变化,更新localStorage
        if (uniqueHistory.length !== historyData.length) {
          console.log(`🔄 去重历史记录: ${historyData.length} -> ${uniqueHistory.length}`);
          localStorage.setItem('xiaohongshu_rewrite_history', JSON.stringify(uniqueHistory));
        }

        setHistory(uniqueHistory);
      }
    } catch (error) {
      console.error('加载历史记录失败:', error);
    }
  };

  const saveToHistory = (note: XhsNote) => {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('xiaohongshu_rewrite_history');
      let historyData: XhsNote[] = saved ? JSON.parse(saved) : [];

      // 检查是否已存在（根据ID）
      const exists = historyData.find(h => h.id === note.id);
      if (!exists) {
        // 添加到开头，最多保存20条
        historyData = [note, ...historyData].slice(0, 20);
        localStorage.setItem('xiaohongshu_rewrite_history', JSON.stringify(historyData));
        setHistory(historyData);
      }
    } catch (error) {
      console.error('保存历史记录失败:', error);
    }
  };

  // 处理URL参数，从素材库跳转过来
  useEffect(() => {
    const imagesParam = searchParams.get('images');
    const imageUrl = searchParams.get('imageUrl'); // 兼容旧的单图参数
    const content = searchParams.get('content');

    console.log('URL参数处理:', { imagesParam, imageUrl, content: content?.substring(0, 50) });

    // 只要有content就处理，images可选
    if (content) {
      // 从URL参数创建一个note对象
      const lines = content.split('\n');
      const title = lines[0] || '无标题';
      const noteContent = lines.slice(2).join('\n') || content; // 跳过标题和空行

      // 解析图片数组
      let images: string[] = [];
      try {
        if (imagesParam) {
          images = JSON.parse(imagesParam);
        } else if (imageUrl) {
          images = [imageUrl];
        }
      } catch (error) {
        console.error('解析图片参数失败:', error);
        images = imageUrl ? [imageUrl] : [];
      }

      // 使用内容和图片的哈希值生成稳定的ID，避免重复记录
      const contentHash = simpleHash(content + JSON.stringify(images));
      const stableId = `url-${contentHash}`;

      const note: XhsNote = {
        id: stableId,
        title: title,
        content: noteContent,
        images: images,
        likes: 0,
        comments: 0,
        author: '来自素材库',
        url: ''
      };

      console.log('创建note对象:', note);
      setSelectedNote(note);

      // 直接保存到历史记录（使用稳定ID，避免重复）
      try {
        if (typeof window !== 'undefined') {
          const saved = localStorage.getItem('xiaohongshu_rewrite_history');
          let historyData: XhsNote[] = saved ? JSON.parse(saved) : [];
          const exists = historyData.find(h => h.id === note.id);
          if (!exists) {
            historyData = [note, ...historyData].slice(0, 20);
            localStorage.setItem('xiaohongshu_rewrite_history', JSON.stringify(historyData));
            setHistory(historyData);
            console.log('✅ 保存到历史记录，稳定ID:', stableId);
          } else {
            console.log('⚠️ 该笔记已存在历史记录中，跳过保存:', stableId);
          }
        }
      } catch (error) {
        console.error('保存历史记录失败:', error);
      }

      setCurrentStep('view');
      console.log('已设置步骤为view');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadHistory();
    }
  }, []);

  const handleNoteSelect = (note: XhsNote) => {
    setSelectedNote(note);
    saveToHistory(note); // 保存到历史记录
    setCurrentStep('view');
  };

  // 处理搜索结果更新
  const handleSearchResults = (results: XhsNote[]) => {
    setSearchResults(results);
  };

  const handleStartRewrite = () => {
    if (!selectedNote) return;
    setCurrentStep('process');
  };

  const handleRewriteComplete = (result: RewriteResult) => {
    setRewriteResult(result);
    setCurrentStep('result');
    setIsProcessing(false);
  };

  const handleBack = () => {
    if (currentStep === 'view') {
      setCurrentStep('extract');
      // 不清空 selectedNote，保留搜索结果
    } else if (currentStep === 'process') {
      setCurrentStep('view');
    } else if (currentStep === 'result') {
      setCurrentStep('extract');
      setSelectedNote(null);
      setRewriteResult(null);
    }
  };

  // 阻止点击空白区域返回
  const handleContainerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 头部 */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent mb-2">
            小红书内容二创
          </h1>
          <p className="text-gray-600 mb-3">
            AI智能二创，一键生成全新内容
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            图片生成限制：最多处理10张图片（超过10张只处理前10张）
          </div>
        </div>

        {/* 步骤指示器 */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            {[
              { key: 'extract', label: '1. 提取内容', icon: '🔍' },
              { key: 'view', label: '2. 查看内容', icon: '👁️' },
              { key: 'process', label: '3. AI处理', icon: '⚡' },
              { key: 'result', label: '4. 查看结果', icon: '✨' },
            ].map((step, index) => {
              const stepKeys: Step[] = ['extract', 'view', 'process', 'result'];
              const currentIndex = stepKeys.indexOf(currentStep);
              const isActive = step.key === currentStep;
              const isCompleted = stepKeys.indexOf(step.key) < currentIndex;

              return (
                <div key={step.key} className="flex items-center">
                  <div
                    className={`flex flex-col items-center gap-2 ${
                      isActive ? 'scale-110' : ''
                    } transition-transform`}
                  >
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-pink-500 to-red-500 text-white shadow-lg'
                          : isCompleted
                          ? 'bg-green-500 text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                    >
                      {isCompleted ? '✓' : step.icon}
                    </div>
                    <span
                      className={`text-sm font-medium ${
                        isActive ? 'text-pink-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`w-16 h-1 mx-2 ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-200'
                      } transition-colors`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="bg-white rounded-2xl shadow-xl p-8" onClick={handleContainerClick}>
          {(() => {
            console.log('渲染内容区域 - currentStep:', currentStep, 'selectedNote:', selectedNote);

            if (currentStep === 'extract') {
              console.log('渲染 ContentExtract');
              return (
                <ContentExtract
                  onNoteSelect={handleNoteSelect}
                  history={history}
                  onSelectFromHistory={handleNoteSelect}
                  searchResults={searchResults}
                  onSearchResults={handleSearchResults}
                />
              );
            }

            if (currentStep === 'view' && selectedNote) {
              console.log('渲染 ContentView，note:', selectedNote);
              return (
                <ContentView
                  note={selectedNote}
                  onStartRewrite={handleStartRewrite}
                  onBack={handleBack}
                />
              );
            }

            if (currentStep === 'process' && selectedNote) {
              console.log('渲染 RewriteProcess');
              return (
                <RewriteProcess
                  note={selectedNote}
                  onComplete={handleRewriteComplete}
                  onBack={handleBack}
                  onProcessingChange={setIsProcessing}
                />
              );
            }

            if (currentStep === 'result' && rewriteResult && selectedNote) {
              console.log('渲染 FinalResult');
              return (
                <FinalResult
                  originalNote={selectedNote}
                  result={rewriteResult}
                  onBack={handleBack}
                  onRestart={() => {
                    setCurrentStep('extract');
                    setSelectedNote(null);
                    setRewriteResult(null);
                  }}
                />
              );
            }

            console.log('没有匹配的步骤，显示默认内容');
            return <div>加载中...</div>;
          })()}
        </div>
      </div>
    </div>
  );
}

