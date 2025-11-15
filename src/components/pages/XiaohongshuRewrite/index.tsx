'use client';

import { useState, useEffect } from 'react';
import ContentExtract from './ContentExtract';
import ContentView from './ContentView';
import RewriteProcess from './RewriteProcess';
import FinalResult from './FinalResult';

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
  const [currentStep, setCurrentStep] = useState<Step>('extract');
  const [selectedNote, setSelectedNote] = useState<XhsNote | null>(null);
  const [rewriteResult, setRewriteResult] = useState<RewriteResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [history, setHistory] = useState<XhsNote[]>([]);

  // 加载历史记录
  useEffect(() => {
    if (typeof window !== 'undefined') {
      loadHistory();
    }
  }, []);

  const loadHistory = () => {
    try {
      if (typeof window === 'undefined') return;
      const saved = localStorage.getItem('xiaohongshu_rewrite_history');
      if (saved) {
        const historyData = JSON.parse(saved);
        setHistory(historyData);
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

  const handleNoteSelect = (note: XhsNote) => {
    setSelectedNote(note);
    saveToHistory(note); // 保存到历史记录
    setCurrentStep('view');
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
      setSelectedNote(null);
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
          {currentStep === 'extract' && (
            <ContentExtract 
              onNoteSelect={handleNoteSelect}
              history={history}
              onSelectFromHistory={handleNoteSelect}
            />
          )}

          {currentStep === 'view' && selectedNote && (
            <ContentView
              note={selectedNote}
              onStartRewrite={handleStartRewrite}
              onBack={handleBack}
            />
          )}

          {currentStep === 'process' && selectedNote && (
            <RewriteProcess
              note={selectedNote}
              onComplete={handleRewriteComplete}
              onBack={handleBack}
              onProcessingChange={setIsProcessing}
            />
          )}

          {currentStep === 'result' && rewriteResult && selectedNote && (
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
          )}
        </div>
      </div>
    </div>
  );
}

