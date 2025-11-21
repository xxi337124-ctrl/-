'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import XhsImage from '@/components/XhsImage';
import type { XhsNote, RewriteResult } from './index';

interface FinalResultProps {
  originalNote: XhsNote;
  result: RewriteResult;
  onBack: () => void;
  onRestart: () => void;
}

// 图片生成状态类型
type ImageGenerationState =
  | { status: 'pending' }
  | { status: 'analyzing' }
  | { status: 'generating'; prompt: string }
  | { status: 'completed'; url: string; prompt: string }
  | { status: 'failed'; error: string };

export default function FinalResult({
  originalNote,
  result,
  onBack,
  onRestart,
}: FinalResultProps) {
  const [isSaving, setIsSaving] = useState(false);

  // 每张图片的生成状态
  const [imageStates, setImageStates] = useState<ImageGenerationState[]>([]);

  // 用于防止重复执行
  const hasStartedGeneration = useRef(false);

  // 可编辑的文案内容
  const [editableContent, setEditableContent] = useState(result.rewritten.content);
  const [isEditing, setIsEditing] = useState(false);

  // 初始化图片状态
  useEffect(() => {
    if (result.original.images.length === 0) return;

    // 如果已经有生成的图片（例如从其他地方跳转过来），直接标记为完成
    if (result.rewritten.images.length > 0) {
      const states: ImageGenerationState[] = result.original.images.map((_, index) => {
        const generatedUrl = result.rewritten.images[index];
        const prompt = result.rewritten.imagePrompts[index];

        if (generatedUrl) {
          return { status: 'completed', url: generatedUrl, prompt: prompt || '' };
        }
        return { status: 'pending' };
      });
      setImageStates(states);
    } else {
      // 初始化为pending状态
      setImageStates(result.original.images.map(() => ({ status: 'pending' })));
    }
  }, []);

  // 自动开始生成图片
  useEffect(() => {
    // 防止重复执行
    if (hasStartedGeneration.current) return;

    // 如果没有原图，不生成
    if (result.original.images.length === 0) return;

    // 如果已经有生成的图片，不再自动生成
    if (result.rewritten.images.length > 0) return;

    // 如果状态还未初始化，等待
    if (imageStates.length === 0) return;

    hasStartedGeneration.current = true;
    generateAllImagesSequentially();
  }, [imageStates.length]);

  // 更新单张图片的状态
  const updateImageState = (index: number, state: ImageGenerationState) => {
    setImageStates(prev => {
      const newStates = [...prev];
      newStates[index] = state;
      return newStates;
    });
  };

  // 延迟函数
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // 串行生成所有图片
  const generateAllImagesSequentially = async () => {
    const MAX_IMAGES = 10;
    const images = result.original.images.slice(0, MAX_IMAGES);

    console.log(`🚀 开始自动生成 ${images.length} 张图片...`);

    for (let i = 0; i < images.length; i++) {
      console.log(`\n📍 [图片 ${i + 1}/${images.length}] 开始处理...`);
      await generateSingleImage(i);

      // 每张图之间延迟5秒，避免API限流
      if (i < images.length - 1) {
        console.log(`⏱️  等待 5 秒后继续下一张...`);
        await sleep(5000);
      }
    }

    console.log(`\n✅ 所有图片处理完成！`);
  };

  // 生成单张图片
  const generateSingleImage = async (index: number) => {
    const originalImage = result.original.images[index];

    try {
      // 步骤1: 分析图片
      console.log(`🔍 [图片 ${index + 1}] 开始分析...`);
      updateImageState(index, { status: 'analyzing' });

      const analyzeResponse = await fetch('/api/xiaohongshu/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: originalImage,
        }),
      });

      const analyzeData = await analyzeResponse.json();

      if (!analyzeData.success || !analyzeData.data?.prompt) {
        throw new Error(analyzeData.error || '图片分析失败');
      }

      const prompt = analyzeData.data.prompt;
      console.log(`✅ [图片 ${index + 1}] 分析成功，提示词长度: ${prompt.length}`);

      // 步骤2: 生成图片
      console.log(`🎨 [图片 ${index + 1}] 开始生成...`);
      updateImageState(index, { status: 'generating', prompt });

      const generateResponse = await fetch('/api/xiaohongshu/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceImageUrl: originalImage,
        }),
      });

      const generateData = await generateResponse.json();

      if (!generateData.success || !generateData.data?.generatedImageUrl) {
        throw new Error(generateData.error || '图片生成失败');
      }

      const generatedImageUrl = generateData.data.generatedImageUrl;
      console.log(`✅ [图片 ${index + 1}] 生成成功！`);

      // 步骤3: 标记完成
      updateImageState(index, {
        status: 'completed',
        url: generatedImageUrl,
        prompt,
      });
    } catch (error: any) {
      console.error(`❌ [图片 ${index + 1}] 失败:`, error);
      updateImageState(index, {
        status: 'failed',
        error: error.message || '生成失败',
      });
    }
  };

  // 手动重新生成单张图片
  const handleRegenerateImage = async (index: number) => {
    console.log(`🔄 [图片 ${index + 1}] 手动重新生成...`);
    await generateSingleImage(index);
  };

  // 复制文案
  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('文案已复制到剪贴板！');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  // 保存编辑
  const handleSaveEdit = () => {
    setIsEditing(false);
    alert('文案已更新！');
  };

  // 取消编辑
  const handleCancelEdit = () => {
    setEditableContent(result.rewritten.content);
    setIsEditing(false);
  };

  // 下载图片
  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `二创图片-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 保存到草稿箱
  const handleSaveToDraft = async () => {
    setIsSaving(true);
    try {
      // 收集所有已完成的图片
      const completedImages = imageStates
        .filter(state => state.status === 'completed')
        .map(state => (state as any).url);

      const response = await fetch('/api/xiaohongshu/save-draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `【二创】${originalNote.title}`,
          content: editableContent,  // 使用编辑后的内容
          images: completedImages,
          originalNote: {
            title: originalNote.title,
            url: originalNote.url,
            author: originalNote.author,
          },
        }),
      });

      const data = await response.json();

      if (data.success) {
        const message = data.data.isUpdate
          ? '✅ 草稿已更新！您可以在"发布管理"中查看和编辑。'
          : '✅ 保存成功！您可以在"发布管理"中查看和编辑。';
        alert(message);
      } else {
        throw new Error(data.error || '保存失败');
      }
    } catch (error: any) {
      console.error('保存失败:', error);
      alert(`❌ 保存失败: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 渲染图片卡片
  const renderImageCard = (originalImage: string, index: number) => {
    const state = imageStates[index] || { status: 'pending' };

    return (
      <Card key={index}>
        <CardHeader>
          <CardTitle className="text-base">图片 {index + 1}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            {/* 左侧：原图 */}
            <div>
              <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                <XhsImage
                  src={originalImage}
                  alt={`原图 ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-sm text-gray-500 text-center">原图</p>
            </div>

            {/* 右侧：新图（根据状态显示不同内容） */}
            <div>
              {state.status === 'pending' && (
                <div className="aspect-square rounded-lg bg-gray-50 border-2 border-dashed border-gray-300 flex flex-col items-center justify-center">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-sm text-gray-500">等待生成...</p>
                </div>
              )}

              {state.status === 'analyzing' && (
                <div className="aspect-square rounded-lg bg-blue-50 border-2 border-blue-300 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-blue-600 font-medium">正在分析图片...</p>
                  <p className="text-xs text-gray-500 mt-1">使用 Gemini 3 Pro</p>
                </div>
              )}

              {state.status === 'generating' && (
                <div className="aspect-square rounded-lg bg-pink-50 border-2 border-pink-300 flex flex-col items-center justify-center p-4">
                  <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-3" />
                  <p className="text-sm text-pink-600 font-medium">正在生成图片...</p>
                  <p className="text-xs text-gray-500 mt-1">使用豆包 SeeDream 4.0</p>
                  {state.prompt && (
                    <p className="text-xs text-gray-400 mt-2 text-center line-clamp-2">
                      {state.prompt.slice(0, 60)}...
                    </p>
                  )}
                </div>
              )}

              {state.status === 'completed' && (
                <>
                  <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2 relative">
                    <XhsImage
                      src={state.url}
                      alt={`新图 ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                      ✓ 完成
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDownloadImage(state.url, index)}
                    >
                      📥 下载
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleRegenerateImage(index)}
                    >
                      🔄 重新生成
                    </Button>
                  </div>
                  <p className="text-sm text-gray-500 text-center mt-2">新图</p>

                  {/* 提示词 */}
                  {state.prompt && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">生成提示词:</p>
                      <p className="text-sm text-gray-700">{state.prompt}</p>
                    </div>
                  )}
                </>
              )}

              {state.status === 'failed' && (
                <div className="aspect-square rounded-lg bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center p-4">
                  <div className="text-4xl mb-3">❌</div>
                  <p className="text-red-600 text-center mb-2 font-medium">生成失败</p>
                  <p className="text-xs text-gray-500 text-center mb-3">{state.error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => handleRegenerateImage(index)}
                  >
                    🔄 重新生成
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">二创结果</h2>
          <p className="text-gray-600">新文案已生成，图片正在自动生成中...</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onBack}>
            返回
          </Button>
          <Button onClick={onRestart} variant="outline">
            重新开始
          </Button>
        </div>
      </div>

      {/* 文案对比 */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">原文案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-gray-50 rounded-lg mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{result.original.content}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleCopyText(result.original.content)}
            >
              复制原文
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">新文案（二创后）</CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <>
                <textarea
                  className="w-full p-4 bg-pink-50 rounded-lg border border-pink-200 focus:border-pink-400 focus:outline-none min-h-[200px] text-gray-700"
                  value={editableContent}
                  onChange={(e) => setEditableContent(e.target.value)}
                  placeholder="编辑您的文案..."
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
                    size="sm"
                    onClick={handleSaveEdit}
                  >
                    ✓ 保存
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                  >
                    ✕ 取消
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="p-4 bg-pink-50 rounded-lg mb-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{editableContent}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
                    size="sm"
                    onClick={() => handleCopyText(editableContent)}
                  >
                    复制新文案
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    ✏️ 编辑
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 图片对比 */}
      {result.original.images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-800">
              图片对比 (最多处理10张)
            </h3>
            <div className="text-sm text-gray-500">
              {imageStates.filter(s => s.status === 'completed').length} / {Math.min(result.original.images.length, 10)} 张已完成
            </div>
          </div>
          <div className="space-y-6">
            {result.original.images.slice(0, 10).map((originalImage, index) =>
              renderImageCard(originalImage, index)
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              size="lg"
              onClick={() => handleCopyText(editableContent)}
            >
              📋 复制全部文案
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
              size="lg"
              onClick={handleSaveToDraft}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '💾 保存到草稿箱'}
            </Button>
            <Button variant="outline" size="lg" onClick={onRestart}>
              🔄 重新二创
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
