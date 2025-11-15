'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { XhsNote, RewriteResult } from './index';

interface FinalResultProps {
  originalNote: XhsNote;
  result: RewriteResult;
  onBack: () => void;
  onRestart: () => void;
}

export default function FinalResult({
  originalNote,
  result,
  onBack,
  onRestart,
}: FinalResultProps) {
  const [regeneratingImages, setRegeneratingImages] = useState<Set<number>>(new Set());
  const [localImages, setLocalImages] = useState<string[]>(result.rewritten.images);

  const handleCopyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      alert('文案已复制到剪贴板！');
    } catch (error) {
      console.error('复制失败:', error);
      alert('复制失败，请手动复制');
    }
  };

  const handleDownloadImage = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `二创图片-${index + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateImage = async (index: number) => {
    setRegeneratingImages(prev => new Set(prev).add(index));

    try {
      let prompt = result.rewritten.imagePrompts?.[index];
      const referenceImage = result.original.images[index];

      console.log(`🔄 [图片 ${index + 1}] 开始重新生成...`);
      console.log(`📍 提示词存在: ${!!prompt}, 原图存在: ${!!referenceImage}`);

      if (!referenceImage) {
        throw new Error('原图不存在，无法生成');
      }

      // 如果没有提示词，先分析图片生成提示词
      if (!prompt) {
        console.log(`🔍 [图片 ${index + 1}] 提示词不存在，先分析图片...`);

        const analyzeResponse = await fetch('/api/xiaohongshu/analyze-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageUrl: referenceImage,
          }),
        });

        const analyzeData = await analyzeResponse.json();

        if (!analyzeData.success || !analyzeData.data?.prompt) {
          throw new Error('图片分析失败，无法生成提示词');
        }

        prompt = analyzeData.data.prompt;
        console.log(`✅ [图片 ${index + 1}] 图片分析成功，提示词: ${prompt.substring(0, 50)}...`);
      }

      // 生成图片
      console.log(`🎨 [图片 ${index + 1}] 开始生成图片...`);
      const response = await fetch('/api/xiaohongshu/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          referenceImageUrl: referenceImage,
        }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || '图片生成失败');
      }

      // 更新本地图片数组
      const newImages = [...localImages];
      newImages[index] = data.data.generatedImageUrl;
      setLocalImages(newImages);

      console.log(`✅ [图片 ${index + 1}] 重新生成成功!`);
      alert(`图片 ${index + 1} 重新生成成功！`);
    } catch (error: any) {
      console.error(`❌ [图片 ${index + 1}] 重新生成失败:`, error);
      alert(`图片 ${index + 1} 重新生成失败: ${error.message}`);
    } finally {
      setRegeneratingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(index);
        return newSet;
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">二创结果</h2>
          <p className="text-gray-600">查看生成的新内容和图片</p>
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
            <div className="p-4 bg-pink-50 rounded-lg mb-4">
              <p className="text-gray-700 whitespace-pre-wrap">{result.rewritten.content}</p>
            </div>
            <Button
              className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              size="sm"
              onClick={() => handleCopyText(result.rewritten.content)}
            >
              复制新文案
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* 图片对比 */}
      <div>
        <h3 className="text-xl font-semibold text-gray-800 mb-4">图片对比</h3>
        <div className="space-y-6">
          {result.original.images.map((originalImage, index) => {
            const generatedImage = localImages[index];
            const prompt = result.rewritten.imagePrompts[index];
            const isRegenerating = regeneratingImages.has(index);

            return (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-base">图片 {index + 1}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* 原图 */}
                    <div>
                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                        <img
                          src={originalImage}
                          alt={`原图 ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <p className="text-sm text-gray-500 text-center">原图</p>
                    </div>

                    {/* 新图 */}
                    <div>
                      {isRegenerating ? (
                        <div className="aspect-square rounded-lg bg-gray-100 flex flex-col items-center justify-center">
                          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mb-3" />
                          <p className="text-sm text-gray-500">正在重新生成...</p>
                        </div>
                      ) : generatedImage ? (
                        <>
                          <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 mb-2">
                            <img
                              src={generatedImage}
                              alt={`新图 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleDownloadImage(generatedImage, index)}
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
                        </>
                      ) : (
                        <div className="aspect-square rounded-lg bg-red-50 border-2 border-red-200 flex flex-col items-center justify-center p-4">
                          <p className="text-red-600 text-center mb-3 font-medium">❌ 生成失败</p>
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

                  {/* 提示词 */}
                  {prompt && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-gray-500 mb-1">生成提示词:</p>
                      <p className="text-sm text-gray-700">{prompt}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* 操作按钮 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-3">
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-red-500 hover:from-pink-600 hover:to-red-600"
              size="lg"
              onClick={() => handleCopyText(result.rewritten.content)}
            >
              📋 复制全部文案
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onRestart}
            >
              🔄 重新二创
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

