/**
 * 图片加载调试脚本
 * 用于诊断和修复图片加载问题
 */

// 创建调试工具
const ImageDebugger = {
  // 检查图片URL有效性
  async checkImageUrl(url) {
    console.log(`🔍 检查图片URL: ${url}`);

    try {
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // 避免CORS问题
        cache: 'no-cache'
      });

      console.log(`✅ URL可访问: ${url}`);
      return true;
    } catch (error) {
      console.error(`❌ URL访问失败: ${url}`, error);
      return false;
    }
  },

  // 检查多个图片URL
  async checkMultipleImageUrls(urls) {
    console.log(`📊 开始检查 ${urls.length} 个图片URL`);
    const results = [];

    for (const url of urls) {
      const isValid = await this.checkImageUrl(url);
      results.push({ url, valid: isValid });
    }

    const validCount = results.filter(r => r.valid).length;
    console.log(`📈 检查结果: ${validCount}/${urls.length} 个URL有效`);

    return results;
  },

  // 强制刷新图片
  forceReloadImages(imageElements) {
    console.log(`🔄 强制刷新 ${imageElements.length} 张图片`);

    imageElements.forEach(img => {
      const originalSrc = img.src;
      // 添加时间戳参数来避免缓存
      const cacheBuster = `?t=${Date.now()}`;
      const newSrc = originalSrc.includes('?')
        ? `${originalSrc}&t=${Date.now()}`
        : `${originalSrc}?t=${Date.now()}`;

      console.log(`🔄 刷新图片: ${originalSrc} -> ${newSrc}`);
      img.src = newSrc;
    });
  },

  // 检查浏览器缓存设置
  checkCacheSettings() {
    console.log('🔧 检查缓存设置');

    // 检查localStorage中的图片缓存
    const imageCache = localStorage.getItem('image_cache');
    if (imageCache) {
      console.log('📦 发现localStorage图片缓存:', JSON.parse(imageCache));
    }

    // 检查sessionStorage
    const sessionCache = sessionStorage.getItem('image_cache');
    if (sessionCache) {
      console.log('📦 发现sessionStorage图片缓存:', JSON.parse(sessionCache));
    }

    return { localStorage: imageCache, sessionStorage: sessionCache };
  },

  // 清除图片缓存
  clearImageCache() {
    console.log('🗑️ 清除图片缓存');

    // 清除localStorage
    localStorage.removeItem('image_cache');
    localStorage.removeItem('generated_images');
    localStorage.removeItem('article_images');

    // 清除sessionStorage
    sessionStorage.removeItem('image_cache');
    sessionStorage.removeItem('generated_images');
    sessionStorage.removeItem('article_images');

    console.log('✅ 图片缓存已清除');
  },

  // 检查CORS问题
  checkCORSIssues(url) {
    console.log(`🔒 检查CORS问题: ${url}`);

    // 尝试不同的加载方式
    const img = new Image();
    img.crossOrigin = 'anonymous'; // 尝试匿名CORS

    return new Promise((resolve) => {
      img.onload = () => {
        console.log(`✅ CORS正常: ${url}`);
        resolve({ url, cors: 'ok' });
      };

      img.onerror = () => {
        console.error(`❌ CORS问题或加载失败: ${url}`);
        resolve({ url, cors: 'error' });
      };

      img.src = url;
    });
  },

  // 生成图片加载报告
  generateReport(urls) {
    console.log('📋 生成图片加载报告');

    const report = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      urls: urls,
      cacheSettings: this.checkCacheSettings(),
      networkInfo: {
        onLine: navigator.onLine,
        connection: navigator.connection || 'unknown'
      }
    };

    console.log('📊 图片加载报告:', JSON.stringify(report, null, 2));
    return report;
  },

  // 修复常见的图片加载问题
  async fixCommonIssues(imageUrls) {
    console.log('🔧 开始修复常见图片加载问题');

    const fixes = [];

    // 1. 清除缓存
    this.clearImageCache();
    fixes.push('✅ 已清除图片缓存');

    // 2. 检查URL格式
    const invalidUrls = imageUrls.filter(url => {
      try {
        new URL(url);
        return false;
      } catch {
        return true;
      }
    });

    if (invalidUrls.length > 0) {
      console.warn(`⚠️ 发现 ${invalidUrls.length} 个无效URL:`, invalidUrls);
      fixes.push(`⚠️ 发现无效URL: ${invalidUrls.join(', ')}`);
    }

    // 3. 检查HTTP vs HTTPS
    const httpUrls = imageUrls.filter(url => url.startsWith('http:'));
    if (httpUrls.length > 0) {
      console.warn(`⚠️ 发现 ${httpUrls.length} 个HTTP URL，可能导致混合内容问题`);
      fixes.push(`⚠️ 发现HTTP URL，建议转换为HTTPS`);
    }

    // 4. 生成时间戳版本
    const timestampedUrls = imageUrls.map(url => {
      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}t=${Date.now()}`;
    });

    console.log('🔄 生成时间戳版本URL');
    fixes.push('✅ 已生成时间戳版本URL');

    return {
      fixes,
      originalUrls: imageUrls,
      timestampedUrls,
      invalidUrls,
      httpUrls
    };
  }
};

// 页面加载时自动运行的调试功能
window.ImageDebugger = ImageDebugger;

// 自动检查页面中的图片
window.addEventListener('load', async () => {
  console.log('🔍 图片调试器已加载');

  // 收集页面中所有的图片
  const allImages = document.querySelectorAll('img');
  const imageUrls = Array.from(allImages).map(img => img.src).filter(src => src);

  if (imageUrls.length > 0) {
    console.log(`📸 发现 ${imageUrls.length} 张图片`);

    // 检查缓存设置
    ImageDebugger.checkCacheSettings();

    // 检查图片URL
    const results = await ImageDebugger.checkMultipleImageUrls(imageUrls.slice(0, 5)); // 只检查前5个避免过多请求

    // 生成报告
    ImageDebugger.generateReport(imageUrls);

    // 如果有失败的图片，尝试修复
    const failedImages = results.filter(r => !r.valid);
    if (failedImages.length > 0) {
      console.warn(`⚠️ 发现 ${failedImages.length} 张图片加载失败`);

      // 尝试修复
      const fixResult = await ImageDebugger.fixCommonIssues(imageUrls);
      console.log('🔧 修复结果:', fixResult);

      // 应用时间戳版本
      if (confirm('发现图片加载问题，是否尝试自动修复？')) {
        ImageDebugger.forceReloadImages(allImages);
      }
    }
  } else {
    console.log('📸 页面中没有发现图片');
  }
});

// 便捷函数
window.debugImages = () => {
  const allImages = document.querySelectorAll('img');
  const imageUrls = Array.from(allImages).map(img => img.src).filter(src => src);

  if (imageUrls.length === 0) {
    console.log('📸 页面中没有发现图片');
    return;
  }

  console.log('🔍 手动调试图片...');
  ImageDebugger.generateReport(imageUrls);
  ImageDebugger.fixCommonIssues(imageUrls).then(result => {
    console.log('🔧 修复建议:', result);
  });
};

window.reloadAllImages = () => {
  const allImages = document.querySelectorAll('img');
  ImageDebugger.forceReloadImages(allImages);
  console.log('🔄 已强制刷新所有图片');
};

window.clearImageCache = () => {
  ImageDebugger.clearImageCache();
  alert('图片缓存已清除');
};

console.log('🔧 图片调试工具已加载');
console.log('可用命令:');
console.log('  window.debugImages() - 调试当前页面图片');
console.log('  window.reloadAllImages() - 强制刷新所有图片');
console.log('  window.clearImageCache() - 清除图片缓存');
console.log('  window.ImageDebugger - 完整的调试工具对象');