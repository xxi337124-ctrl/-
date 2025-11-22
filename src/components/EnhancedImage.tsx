/**
 * 增强版图片组件 - 解决缓存和加载问题
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface EnhancedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  disableCache?: boolean;
  fallbackSrc?: string;
  onError?: () => void;
  onLoad?: () => void;
}

export default function EnhancedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  disableCache = true,
  fallbackSrc = '/placeholder-image.jpg',
  onError,
  onLoad
}: EnhancedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.error(`图片加载失败: ${imageSrc}`);
    setHasError(true);
    setIsLoading(false);

    if (onError) {
      onError();
    }

    if (imageSrc !== fallbackSrc && fallbackSrc) {
      setImageSrc(fallbackSrc);
      setHasError(false);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);

    if (onLoad) {
      onLoad();
    }
  };

  const getCacheBustedUrl = (url: string) => {
    if (!disableCache || !url) return url;
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  };

  const processImageUrl = (url: string) => {
    if (!url) return fallbackSrc;
    if (url.startsWith('/')) return url;
    if (url.startsWith('data:')) return url;
    if (url.startsWith('http')) return getCacheBustedUrl(url);
    return url;
  };

  const processedSrc = processImageUrl(imageSrc);

  if (hasError && imageSrc === fallbackSrc) {
    return (
      <div className={`${className} flex items-center justify-center bg-gray-100 text-gray-500`}>
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-sm">图片加载失败</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${className} relative`}>
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}

      <Image
        src={processedSrc}
        alt={alt}
        width={width}
        height={height}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized={true}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

/**
 * 图片URL验证工具
 */
export const ImageValidator = {
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  async isAccessible(url: string): Promise<boolean> {
    try {
      await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true;
    } catch {
      return false;
    }
  },

  async validateMultiple(urls: string[]): Promise<{ url: string; valid: boolean }[]> {
    const results = await Promise.allSettled(
      urls.map(async url => ({
        url,
        valid: await this.isAccessible(url)
      }))
    );

    return results
      .filter((result): result is PromiseFulfilledResult<{ url: string; valid: boolean }> =>
        result.status === 'fulfilled'
      )
      .map(result => result.value);
  },

  processImageUrls(urls: string[], options: {
    disableCache?: boolean;
    fallbackUrl?: string;
  } = {}): string[] {
    const { disableCache = true, fallbackUrl } = options;

    return urls.map(url => {
      if (!url) return fallbackUrl || '';

      if (disableCache && url.startsWith('http')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${Date.now()}`;
      }

      return url;
    }).filter(url => url);
  }
};

/**
 * 图片缓存管理器
 */
export const ImageCacheManager = {
  clearAll() {
    console.log('清除图片缓存');

    const imageKeys = [
      'image_cache',
      'generated_images',
      'article_images',
      'cached_image_urls',
      'image_validation_cache'
    ];

    imageKeys.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });

    if (typeof window !== 'undefined') {
      document.querySelectorAll('img').forEach(img => {
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          const separator = originalSrc.includes('?') ? '&' : '?';
          img.src = `${originalSrc}${separator}t=${Date.now()}`;
        }
      });
    }

    console.log('图片缓存已清除');
  },

  checkCacheStatus() {
    const cacheInfo: {
      localStorage: Record<string, unknown>;
      sessionStorage: Record<string, unknown>;
      timestamp: string;
    } = {
      localStorage: {},
      sessionStorage: {},
      timestamp: new Date().toISOString()
    };

    const imageKeys = [
      'image_cache',
      'generated_images',
      'article_images',
      'cached_image_urls',
      'image_validation_cache'
    ];

    imageKeys.forEach(key => {
      const localData = localStorage.getItem(key);
      const sessionData = sessionStorage.getItem(key);

      if (localData) {
        try {
          cacheInfo.localStorage[key] = JSON.parse(localData);
        } catch {
          cacheInfo.localStorage[key] = localData;
        }
      }

      if (sessionData) {
        try {
          cacheInfo.sessionStorage[key] = JSON.parse(sessionData);
        } catch {
          cacheInfo.sessionStorage[key] = sessionData;
        }
      }
    });

    console.log('缓存状态:', cacheInfo);
    return cacheInfo;
  }
};
