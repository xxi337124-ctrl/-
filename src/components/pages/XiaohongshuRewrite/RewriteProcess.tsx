'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGlobalStore } from '@/lib/stores/globalStore';
import type { XhsNote, RewriteResult } from './index';

interface RewriteProcessProps {
  note: XhsNote;
  onComplete: (result: RewriteResult) => void;
  onBack: () => void;
  onProcessingChange: (processing: boolean) => void;
}

type ProcessStep = 'rewrite' | 'analyze' | 'generate' | 'complete';

export default function RewriteProcess({
  note,
  onComplete,
  onBack,
  onProcessingChange,
}: RewriteProcessProps) {
  const [currentStep, setCurrentStep] = useState<ProcessStep>('rewrite');
  const [rewrittenContent, setRewrittenContent] = useState<string>('');
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 使用全局store
  const { activeTask, updateTask, startTask, completeTask, failTask } = useGlobalStore();

  // 生成唯一任务ID
  const taskId = `xhs-${note.id}-${Date.now()}`;

  // 使用 ref 来跟踪是否已经初始化
  const isInitializedRef = useRef(false);

  // 组件挂载时，检查是否有正在进行的任务并启动/恢复
  useEffect(() => {
    // 防止重复初始化
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    if (activeTask && activeTask.type === 'xiaohongshu-rewrite') {
      // 恢复任务状态
      setCurrentStep((activeTask.currentStep || 'rewrite') as ProcessStep);
      setProgress(activeTask.progress || 0);
      setProgressMessage(activeTask.progressMessage || '');
      setRewrittenContent(activeTask.rewrittenContent || '');
      setImagePrompts(activeTask.imagePrompts || []);
      setGeneratedImages(activeTask.generatedImages || []);

      // 如果任务已完成，直接返回结果
      if (activeTask.status === 'COMPLETED' && activeTask.result) {
        onComplete(activeTask.result);
        return;
      }

      // 恢复中断的任务 - 根据当前步骤继续执行
      if (activeTask.currentStep && activeTask.currentStep !== 'complete') {
        const step = activeTask.currentStep;
        if (step === 'rewrite' && !activeTask.rewrittenContent) {
          handleRewriteContent();
        } else if (step === 'analyze' && (!activeTask.imagePrompts || activeTask.imagePrompts.length === 0)) {
          handleAnalyzeImages();
        } else if (step === 'generate' && activeTask.imagePrompts && activeTask.imagePrompts.length > 0) {
          // 恢复生成图片任务，需要原图参考
          const MAX_IMAGES = 10;
          const imagesToProcess = note.images.slice(0, MAX_IMAGES);
          handleGenerateImages(activeTask.imagePrompts, imagesToProcess);
        }
      }
    } else {
      // 启动新任务
      startTask(taskId, 'xiaohongshu-rewrite', undefined, `小红书二创: ${note.title.substring(0, 20)}...`);
      // 开始执行第一步
      handleRewriteContent();
    }
  }, []);

  // 监听全局任务变化，同步进度
  useEffect(() => {
    if (activeTask && activeTask.type === 'xiaohongshu-rewrite') {
      setProgress(activeTask.progress || 0);
      setProgressMessage(activeTask.progressMessage || '');
    }
  }, [activeTask]);

  // 通知父组件处理状态变化
  useEffect(() => {
    onProcessingChange(currentStep !== 'complete');
  }, [currentStep, onProcessingChange]);

  // 步骤1: 文案二创
  const handleRewriteContent = async () => {
    setCurrentStep('rewrite');
    setProgress(10);
    setProgressMessage('正在使用 Gemini 3 Pro 进行文案二创...');
    setError(null);

    // 更新全局store
    updateTask({
      status: 'PROCESSING',
      progress: 10,
      progressMessage: '正在使用 Gemini 3 Pro 进行文案二创...',
      currentStep: 'rewrite',
    });

    try {
      const response = await fetch('/api/xiaohongshu/rewrite-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalContent: note.content,
          style: '轻松活泼',
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '文案二创失败');
      }

      setRewrittenContent(data.data.rewrittenContent);
      setProgress(100);
      setProgressMessage('文案二创完成！正在跳转到结果页面...');

      // 更新全局store
      updateTask({
        progress: 100,
        progressMessage: '文案二创完成！',
        rewrittenContent: data.data.rewrittenContent,
      });

      // 文案生成完成后，直接跳转到结果页面
      // 图片将在结果页面自动逐个生成
      setTimeout(() => {
        handleComplete();
      }, 1000);
    } catch (error: any) {
      console.error('文案二创失败:', error);
      setError(error.message || '文案二创失败，请稍后重试');
      failTask(error.message || '文案二创失败');
    }
  };

  // 步骤2: 图片分析
  const handleAnalyzeImages = async () => {
    setCurrentStep('analyze');

    // 限制最多处理10张图片
    const MAX_IMAGES = 10;
    const imagesToProcess = note.images.slice(0, MAX_IMAGES);
    const imageCount = imagesToProcess.length;

    setProgress(40);
    setProgressMessage(
      note.images.length > MAX_IMAGES
        ? `原文有 ${note.images.length} 张图片，处理前 ${imageCount} 张...`
        : `正在使用 Gemini 3 Pro 分析 ${imageCount} 张图片...`
    );
    setError(null);

    // 更新全局store
    updateTask({
      progress: 40,
      progressMessage:
        note.images.length > MAX_IMAGES
          ? `原文有 ${note.images.length} 张图片，处理前 ${imageCount} 张...`
          : `正在使用 Gemini 3 Pro 分析 ${imageCount} 张图片...`,
      currentStep: 'analyze',
    });

    try {
      // 每次分析一张图片，实时更新进度
      const prompts: string[] = [];

      for (let i = 0; i < imagesToProcess.length; i++) {
        const currentProgress = 40 + Math.floor((i / imageCount) * 20);
        setProgress(currentProgress);
        setProgressMessage(`正在分析第 ${i + 1}/${imageCount} 张图片...`);
        updateTask({
          progress: currentProgress,
          progressMessage: `正在分析第 ${i + 1}/${imageCount} 张图片...`,
        });

        const response = await fetch('/api/xiaohongshu/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: imagesToProcess[i],
          }),
        });

        const data = await response.json();

        if (data.success && data.data.prompt) {
          prompts.push(data.data.prompt);
        } else {
          console.warn(`图片 ${i + 1} 分析失败`);
        }
      }

      const validPrompts = prompts.filter((p: string) => p.length > 0);
      setImagePrompts(validPrompts);
      setProgress(60);
      setProgressMessage(`图片分析完成，获得 ${validPrompts.length} 个提示词！`);

      // 更新全局store
      updateTask({
        progress: 60,
        progressMessage: `图片分析完成，获得 ${validPrompts.length} 个提示词！`,
        imagePrompts: validPrompts,
      });

      // 继续生成图片
      if (validPrompts.length > 0) {
        setTimeout(() => {
          handleGenerateImages(validPrompts, imagesToProcess.slice(0, validPrompts.length));
        }, 1000);
      } else {
        // 没有有效提示词，直接完成
        handleComplete();
      }
    } catch (error: any) {
      console.error('图片分析失败:', error);
      setError(error.message || '图片分析失败，请稍后重试');
      failTask(error.message || '图片分析失败');
    }
  };

  // 步骤3: 图片生成
  const handleGenerateImages = async (prompts: string[], referenceImages: string[]) => {
    setCurrentStep('generate');
    setProgress(70);
    setProgressMessage(`正在使用豆包 SeeDream 4.0 生成 ${prompts.length} 张新图片...`);
    setError(null);

    // 更新全局store
    updateTask({
      progress: 70,
      progressMessage: `正在使用豆包 SeeDream 4.0 生成 ${prompts.length} 张新图片...`,
      currentStep: 'generate',
    });

    try {
      // 确保提示词和原图数量匹配
      const validPrompts = prompts.slice(0, referenceImages.length);
      const validReferenceImages = referenceImages.slice(0, prompts.length);
      const totalImages = Math.min(validPrompts.length, validReferenceImages.length);

      // 先清空已生成的图片数组
      setGeneratedImages([]);
      const images: string[] = [];

      // 逐个生成图片，实时更新进度
      for (let i = 0; i < totalImages; i++) {
        const currentProgress = 70 + Math.floor((i / totalImages) * 30);
        setProgress(currentProgress);
        setProgressMessage(`正在生成第 ${i + 1}/${totalImages} 张图片...`);
        updateTask({
          progress: currentProgress,
          progressMessage: `正在生成第 ${i + 1}/${totalImages} 张图片...`,
        });

        try {
          const response = await fetch('/api/xiaohongshu/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: validPrompts[i],
              referenceImageUrl: validReferenceImages[i],
            }),
          });

          const data = await response.json();

          if (data.success && data.data.generatedImageUrl) {
            const newImageUrl = data.data.generatedImageUrl;
            images.push(newImageUrl);

            // 🔥 关键改动：每成功生成一张图片就立即更新状态，触发UI刷新
            setGeneratedImages([...images]);

            // 同时更新全局 store，让其他组件也能看到实时进度
            updateTask({
              progress: currentProgress,
              progressMessage: `已生成 ${images.length}/${totalImages} 张图片`,
              generatedImages: [...images],
            });

            console.log(`✅ 第 ${i + 1} 张图片生成成功，已实时显示`);
          } else {
            console.warn(`⚠️ 图片 ${i + 1} 生成失败，跳过`);
          }
        } catch (error) {
          console.error(`❌ 图片 ${i + 1} 生成异常:`, error);
        }
      }

      const validImages = images.filter((url: string) => url.length > 0);
      // 最后再更新一次，确保状态一致
      setGeneratedImages(validImages);
      setProgress(100);
      setProgressMessage(`图片生成完成！成功生成 ${validImages.length}/${totalImages} 张图片`);

      // 更新全局store
      updateTask({
        progress: 100,
        progressMessage: `图片生成完成！成功生成 ${validImages.length}/${totalImages} 张图片`,
        generatedImages: validImages,
      });

      setTimeout(() => {
        handleComplete();
      }, 1000);
    } catch (error: any) {
      console.error('图片生成失败:', error);
      setError(error.message || '图片生成失败，请稍后重试');
      failTask(error.message || '图片生成失败');
    }
  };

  // 完成处理
  const handleComplete = () => {
    setCurrentStep('complete');
    setProgress(100);
    setProgressMessage('跳转到结果页面...');

    const result: RewriteResult = {
      original: {
        content: note.content,
        images: note.images,  // 传递原图列表
      },
      rewritten: {
        content: rewrittenContent,
        images: [],  // 🔥 空数组！图片将在结果页面生成
        imagePrompts: [],  // 🔥 空数组！
      },
    };

    // 更新全局store - 标记为完成
    completeTask(result);

    setTimeout(() => {
      onComplete(result);
    }, 500);
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'rewrite':
        return { icon: '📝', title: '文案二创', description: '使用 Gemini 3 Pro 改写文案' };
      case 'analyze':
        return { icon: '🔍', title: '图片分析', description: '使用 Gemini 3 Pro 分析图片并生成提示词' };
      case 'generate':
        return { icon: '🎨', title: '图片生成', description: '使用豆包 SeeDream 4.0 生成新图片（最多10张）' };
      case 'complete':
        return { icon: '✅', title: '处理完成', description: '所有步骤已完成' };
    }
  };

  const stepInfo = getStepInfo();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AI 处理中</h2>
          <p className="text-gray-600">正在使用 AI 进行内容二创...</p>
        </div>
        {currentStep !== 'complete' && (
          <Button variant="outline" onClick={onBack} disabled>
            返回
          </Button>
        )}
      </div>

      {/* 进度显示 */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {/* 当前步骤 */}
            <div className="text-center">
              <div className="text-6xl mb-4">{stepInfo.icon}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{stepInfo.title}</h3>
              <p className="text-gray-600">{stepInfo.description}</p>
            </div>

            {/* 进度条 */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>处理进度</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-500 to-red-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* 进度消息 */}
            {progressMessage && (
              <div className="text-center text-sm text-gray-600">{progressMessage}</div>
            )}

            {/* 错误提示 */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}

            {/* 处理中的动画 */}
            {currentStep !== 'complete' && (
              <div className="flex justify-center">
                <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

