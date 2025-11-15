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
  disableCache = true, // 默认禁用缓存避免问题
  fallbackSrc = '/placeholder-image.jpg',
  onError,
  onLoad
}: EnhancedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 当src改变时重置状态
    setImageSrc(src);
    setHasError(false);
    setIsLoading(true);
  }, [src]);

  const handleError = () => {
    console.error(`❌ 图片加载失败: ${imageSrc}`);
    setHasError(true);
    setIsLoading(false);

    if (onError) {
      onError();
    }

    // 尝试使用备用图片
    if (imageSrc !== fallbackSrc && fallbackSrc) {
      console.log(`🔄 尝试备用图片: ${fallbackSrc}`);
      setImageSrc(fallbackSrc);
      setHasError(false);
    }
  };

  const handleLoad = () => {
    console.log(`✅ 图片加载成功: ${imageSrc}`);
    setIsLoading(false);
    setHasError(false);

    if (onLoad) {
      onLoad();
    }
  };

  // 生成带缓存破坏参数的URL
  const getCacheBustedUrl = (url: string) => {
    if (!disableCache || !url) return url;

    // 添加时间戳参数来避免缓存
    const timestamp = Date.now();
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}t=${timestamp}`;
  };

  // 处理相对路径
  const processImageUrl = (url: string) => {
    if (!url) return fallbackSrc;

    // 如果是相对路径，添加前缀
    if (url.startsWith('/')) {
      return url;
    }

    // 如果是数据URL，直接使用
    if (url.startsWith('data:')) {
      return url;
    }

    // 如果是HTTP URL，添加缓存破坏参数
    if (url.startsWith('http')) {
      return getCacheBustedUrl(url);
    }

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
        unoptimized={true} // 禁用Next.js优化以避免缓存问题
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  );
}

/**
 * 图片URL验证工具
 */
export const ImageValidator = {
  // 验证URL格式
  isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // 验证图片URL是否可访问
  async isAccessible(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors',
        cache: 'no-cache'
      });
      return true; // 即使无法获取详细信息，只要没有抛出错误就认为可访问
    } catch {
      return false;
    }
  },

  // 批量验证图片URL
  async validateMultiple(urls: string[]): Promise<{ url: string; valid: boolean }[]> {
    const results = await Promise.allSettled(
      urls.map(async url => ({
        url,
        valid: await this.isAccessible(url)
      }))
    );

    return results
      .filter(result => result.status === 'fulfilled')
      .map(result => (result as PromiseFulfilledResult<any>).value);
  },

  // 处理图片URL列表
  processImageUrls(urls: string[], options: {
    disableCache?: boolean;
    fallbackUrl?: string;
  } = {}): string[] {
    const { disableCache = true, fallbackUrl } = options;

    return urls.map(url => {
      if (!url) return fallbackUrl || '';

      // 添加缓存破坏参数
      if (disableCache && url.startsWith('http')) {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}t=${Date.now()}`;
      }

      return url;
    }).filter(url => url); // 过滤掉空URL
  }
};

/**
 * 图片缓存管理器
 */
export const ImageCacheManager = {
  // 清除所有图片相关的缓存
  clearAll() {
    console.log('🗑️ 清除图片缓存');

    // 清除localStorage
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

    // 清除浏览器缓存（通过重新加载页面）
    if (typeof window !== 'undefined') {
      // 强制重新加载所有图片
      document.querySelectorAll('img').forEach(img => {
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          const separator = originalSrc.includes('?') ? '&' : '?';
          img.src = `${originalSrc}${separator}t=${Date.now()}`;
        }
      });
    }

    console.log('✅ 图片缓存已清除');
  },

  // 检查缓存状态
  checkCacheStatus() {
    const cacheInfo = {
      localStorage: {},
      sessionStorage: {},
      timestamp: new Date().toISOString()
    };

    // 检查localStorage
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

    console.log('📊 缓存状态:', cacheInfo);
    return cacheInfo;
  }
};

// 全局调试工具
if (typeof window !== 'undefined') {
  window.ImageUtils = {
    EnhancedImage,
    ImageValidator,
    ImageCacheManager,
    debugImages: () => {
      console.log('🔍 开始调试页面图片');

      // 检查缓存状态
      ImageCacheManager.checkCacheStatus();

      // 获取所有图片
      const images = document.querySelectorAll('img');
      console.log(`📸 发现 ${images.length} 张图片`);

      // 验证图片URL
      const imageUrls = Array.from(images).map(img => img.src).filter(src => src);
      ImageValidator.validateMultiple(imageUrls.slice(0, 5)).then(results => {
        console.log('📊 图片验证结果:', results);
      });
    },
    reloadAllImages: () => {
      document.querySelectorAll('img').forEach(img => {
        const originalSrc = img.getAttribute('src');
        if (originalSrc) {
          const separator = originalSrc.includes('?') ? '&' : '?';
          img.src = `${originalSrc}${separator}t=${Date.now()}`;
        }
      });
      console.log('🔄 已强制刷新所有图片');
    },
    clearImageCache: () => {
      ImageCacheManager.clearAll();
      alert('图片缓存已清除');
    }
  };

  console.log('🔧 图片调试工具已加载');
  console.log('可用命令:');
  console.log('  window.ImageUtils.debugImages() - 调试当前页面图片');
  console.log('  window.ImageUtils.reloadAllImages() - 强制刷新所有图片');
  console.log('  window.ImageUtils.clearImageCache() - 清除图片缓存');
  console.log('  window.ImageUtils.EnhancedImage - 增强版图片组件');
  console.log('  window.ImageUtils.ImageValidator - 图片验证工具');
  console.log('  window.ImageUtils.ImageCacheManager - 缓存管理器');
}

export default EnhancedImage;