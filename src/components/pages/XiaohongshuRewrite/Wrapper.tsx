'use client';

import { Suspense } from 'react';
import XiaohongshuRewrite from './index';

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-600">加载中...</p>
      </div>
    </div>
  );
}

export default function XiaohongshuRewriteWrapper() {
  console.log('XiaohongshuRewriteWrapper - 包装组件渲染');

  return (
    <Suspense fallback={<LoadingFallback />}>
      <XiaohongshuRewrite />
    </Suspense>
  );
}
