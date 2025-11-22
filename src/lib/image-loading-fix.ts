/**
 * 图片加载修复工具
 * 解决缓存、CORS、URL验证等问题
 */

/**
 * 为图片URL添加缓存破坏参数
 */
export function addCacheBuster(url: string): string {
  if (!url || !url.startsWith('http')) return url;

  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);

  return `${url}${separator}t=${timestamp}&r=${random}`;
}

/**
 * 验证图片URL格式
 */
export function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  try {
    // 检查是否是数据URL
    if (url.startsWith('data:')) {
      return url.includes('image/');
    }

    // 检查是否是有效的HTTP URL
    if (url.startsWith('http')) {
      const urlObj = new URL(url);

      // 检查域名是否可信
      const trustedDomains = [
        'images.unsplash.com',
        'source.unsplash.com',
        'api.siliconflow.cn',
        'api.apicore.ai',
        'localhost',
        '127.0.0.1'
      ];

      const isTrusted = trustedDomains.some(domain =>
        urlObj.hostname.includes(domain)
      );

      if (!isTrusted) {
        console.warn(`⚠️ 非信任域名: ${urlObj.hostname}`);
      }

      return true;
    }

    // 相对路径
    return url.startsWith('/') || url.startsWith('./');
  } catch {
    return false;
  }
}

/**
 * 检查图片是否可访问
 */
export async function checkImageAccessibility(
  url: string,
  timeout = 5000
): Promise<{ accessible: boolean; error?: string; redirected?: boolean }> {
  if (!isValidImageUrl(url)) {
    return { accessible: false, error: 'Invalid URL format' };
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors',
      signal: controller.signal,
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    clearTimeout(timeoutId);

    // 对于no-cors请求，我们无法获取详细信息
    // 但只要没有抛出错误，就认为可访问
    return { accessible: true };

  } catch (error: any) {
    let errorMessage = 'Unknown error';

    if (error.name === 'AbortError') {
      errorMessage = 'Request timeout';
    } else if (error.message.includes('CORS')) {
      errorMessage = 'CORS policy violation';
    } else if (error.message.includes('Failed to fetch')) {
      errorMessage = 'Network error or CORS issue';
    }

    console.error(`❌ 图片访问检查失败: ${url}`, errorMessage);
    return { accessible: false, error: errorMessage };
  }
}

/**
 * 批量检查图片可访问性
 */
export async function checkMultipleImages(
  urls: string[],
  concurrency = 3
): Promise<Array<{ url: string; accessible: boolean; error?: string }>> {
  const results: Array<{ url: string; accessible: boolean; error?: string }> = [];

  // 分批处理避免过多并发请求
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    const batchResults = await Promise.allSettled(
      batch.map(url => checkImageAccessibility(url))
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push({
          url: batch[index],
          ...result.value
        });
      } else {
        results.push({
          url: batch[index],
          accessible: false,
          error: 'Check failed'
        });
      }
    });
  }

  return results;
}

/**
 * 处理图片URL列表 - 添加缓存破坏和验证
 */
export function processImageUrls(
  urls: string[],
  options: {
    addCacheBuster?: boolean;
    validateUrls?: boolean;
    fallbackUrl?: string;
  } = {}
): string[] {
  const {
    addCacheBuster = true,
    validateUrls = false,
    fallbackUrl
  } = options;

  return urls
    .filter(url => {
      if (!url) return false;

      if (validateUrls && !isValidImageUrl(url)) {
        console.warn(`⚠️ 跳过无效图片URL: ${url}`);
        return false;
      }

      return true;
    })
    .map(url => {
      let processedUrl = url;

      // 添加缓存破坏参数
      if (addCacheBuster && url.startsWith('http')) {
        const separator = url.includes('?') ? '&' : '?';
        processedUrl = `${url}${separator}t=${Date.now()}`;
      }

      return processedUrl;
    })
    .map(url => url || fallbackUrl || '')
    .filter(url => url); // 移除空字符串
}

/**
 * 智能图片重试机制
 */
export class ImageRetryManager {
  private retryCount = 0;
  private maxRetries = 3;
  private retryDelay = 1000; // 1秒

  async loadWithRetry(
    url: string,
    onSuccess: (url: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    const attemptLoad = async (attemptUrl: string, attempt: number): Promise<void> => {
      try {
        const result = await checkImageAccessibility(attemptUrl, 10000);

        if (result.accessible) {
          onSuccess(attemptUrl);
          return;
        }

        throw new Error(result.error || 'Image not accessible');
      } catch (error) {
        console.error(`❌ 图片加载尝试 ${attempt + 1}/${this.maxRetries} 失败:`, error);

        if (attempt < this.maxRetries - 1) {
          // 等待后重试，并添加缓存破坏参数
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * (attempt + 1)));
          const retryUrl = addCacheBuster(url);
          return attemptLoad(retryUrl, attempt + 1);
        } else {
          onError(`图片加载失败，已重试 ${this.maxRetries} 次: ${error}`);
        }
      }
    };

    await attemptLoad(url, 0);
  }
}

/**
 * 浏览器端图片加载修复
 */
export function fixBrowserImageLoading(): void {
  if (typeof window === 'undefined') return;

  console.log('🔧 应用浏览器端图片加载修复');

  // 清除所有图片缓存
  const clearImageCaches = () => {
    // 清除localStorage中的图片缓存
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

    console.log('✅ 已清除浏览器图片缓存');
  };

  // 强制刷新所有图片
  const forceReloadImages = () => {
    const images = document.querySelectorAll('img');
    console.log(`🔄 强制刷新 ${images.length} 张图片`);

    images.forEach(img => {
      const originalSrc = img.getAttribute('src');
      if (originalSrc) {
        // 添加缓存破坏参数
        const separator = originalSrc.includes('?') ? '&' : '?';
        const newSrc = `${originalSrc}${separator}t=${Date.now()}`;

        // 先设置为空，再设置新URL以强制刷新
        img.src = '';
        setTimeout(() => {
          img.src = newSrc;
        }, 0);
      }
    });
  };

  // 监听图片加载错误
  const handleImageError = (event: Event) => {
    const img = event.target as HTMLImageElement;
    const originalSrc = img.getAttribute('src');

    if (originalSrc) {
      console.error(`❌ 图片加载错误: ${originalSrc}`);

      // 尝试添加缓存破坏参数重新加载
      const separator = originalSrc.includes('?') ? '&' : '?';
      const retryUrl = `${originalSrc}${separator}t=${Date.now()}`;

      setTimeout(() => {
        img.src = retryUrl;
      }, 1000);
    }
  };

  // 添加错误监听器
  document.addEventListener('error', handleImageError, true);

  // 页面加载完成后执行修复
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      clearImageCaches();
      forceReloadImages();
    });
  } else {
    clearImageCaches();
    forceReloadImages();
  }

  // 提供全局调试函数
  // @ts-ignore - Extending window object for debugging
  window.fixImageLoading = () => {
    console.log('🔧 手动触发图片加载修复');
    clearImageCaches();
    forceReloadImages();
  };

  // @ts-ignore - Extending window object for debugging
  window.debugImageLoading = () => {
    const images = document.querySelectorAll('img');
    const imageInfo = Array.from(images).map(img => ({
      src: img.src,
      alt: img.alt,
      loaded: img.complete,
      naturalWidth: img.naturalWidth,
      naturalHeight: img.naturalHeight
    }));

    console.log('📊 页面图片信息:', imageInfo);
    return imageInfo;
  };

  console.log('✅ 浏览器端图片加载修复已应用');
}

/**
 * 创建图片加载监控器
 */
export function createImageMonitor() {
  if (typeof window === 'undefined') return;

  const monitor = {
    start() {
      console.log('📊 开始监控图片加载');

      // 监控所有图片加载
      const images = document.querySelectorAll('img');
      let loadedCount = 0;
      let failedCount = 0;

      images.forEach(img => {
        if (img.complete) {
          if (img.naturalWidth > 0) {
            loadedCount++;
          } else {
            failedCount++;
          }
        } else {
          img.addEventListener('load', () => {
            loadedCount++;
            console.log(`✅ 图片加载成功: ${img.src}`);
          });

          img.addEventListener('error', () => {
            failedCount++;
            console.error(`❌ 图片加载失败: ${img.src}`);
          });
        }
      });

      console.log(`📈 监控开始 - 总计: ${images.length}, 已加载: ${loadedCount}, 失败: ${failedCount}`);

      // 5秒后报告结果
      setTimeout(() => {
        console.log(`📊 图片加载报告 - 总计: ${images.length}, 成功: ${loadedCount}, 失败: ${failedCount}`);
      }, 5000);
    }
  };

  // @ts-ignore - Extending window object for monitoring
  window.imageMonitor = monitor;
  return monitor;
}

// 自动应用修复
if (typeof window !== 'undefined') {
  fixBrowserImageLoading();
  createImageMonitor();

  console.log('🔧 图片加载修复工具已加载');
  console.log('可用函数:');
  console.log('  window.fixImageLoading() - 修复图片加载');
  console.log('  window.debugImageLoading() - 调试图片加载');
  console.log('  window.imageMonitor.start() - 开始监控图片加载');
}

export default {
  addCacheBuster,
  isValidImageUrl,
  checkImageAccessibility,
  checkMultipleImages,
  processImageUrls,
  ImageRetryManager,
  fixBrowserImageLoading,
  createImageMonitor
};