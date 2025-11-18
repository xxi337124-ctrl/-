'use client';

import { useState } from 'react';

interface XhsImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function XhsImage({ src, alt, className = '' }: XhsImageProps) {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  // 使用代理URL来绕过防盗链
  const proxiedSrc = `/api/proxy/image?url=${encodeURIComponent(src)}`;

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
        <div className="text-center text-gray-400">
          <svg className="w-16 h-16 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 flex items-center justify-center bg-gray-100 ${className}`}>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      )}
      <img
        src={proxiedSrc}
        alt={alt}
        className={className}
        onError={() => setError(true)}
        onLoad={() => setLoading(false)}
        style={{ display: loading ? 'none' : 'block' }}
      />
    </div>
  );
}
