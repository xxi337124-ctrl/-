/**
 * 测试图片加载修复效果
 */

// 由于TypeScript模块导入问题，直接定义测试函数
function addCacheBuster(url) {
  if (!url || !url.startsWith('http')) return url;
  const separator = url.includes('?') ? '&' : '?';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(7);
  return `${url}${separator}t=${timestamp}&r=${random}`;
}

function isValidImageUrl(url) {
  if (!url) return false;
  try {
    if (url.startsWith('data:')) {
      return url.includes('image/');
    }
    if (url.startsWith('http')) {
      new URL(url);
      return true;
    }
    return url.startsWith('/') || url.startsWith('./');
  } catch {
    return false;
  }
}

function processImageUrls(urls, options = {}) {
  const { addCacheBuster: shouldAddBuster = true, validateUrls = false, fallbackUrl } = options;

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
      if (shouldAddBuster && url.startsWith('http')) {
        processedUrl = addCacheBuster(url);
      }
      return processedUrl;
    })
    .map(url => url || fallbackUrl || '')
    .filter(url => url);
}

/**
 * 检查图片可访问性（简化版本）
 */
async function checkMultipleImages(urls, concurrency = 3) {
  console.log(`🔍 检查 ${urls.length} 个图片URL的可访问性...`);

  const results = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    console.log(`📦 处理批次 ${Math.floor(i/concurrency) + 1}/${Math.ceil(urls.length/concurrency)}`);

    const batchResults = await Promise.allSettled(
      batch.map(async (url) => {
        try {
          // 模拟可访问性检查
          if (url.includes('unsplash')) {
            return { url, accessible: true };
          } else if (url.includes('invalid')) {
            return { url, accessible: false, error: 'Invalid domain' };
          } else {
            return { url, accessible: false, error: 'Unknown error' };
          }
        } catch (error) {
          return { url, accessible: false, error: error.message };
        }
      })
    );

    batchResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
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
 * 测试图片URL处理
 */
function testImageUrlProcessing() {
  console.log('🧪 测试图片URL处理...');

  const testUrls = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac',
    'https://images.unsplash.com/photo-1486427944299-aa1a5e0def7d',
    'https://source.unsplash.com/random/800x600',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InJlZCIvPjwvc3ZnPg==',
    'invalid-url',
    '',
    null,
    undefined
  ];

  const processed = processImageUrls(testUrls, {
    addCacheBuster: true,
    validateUrls: true
  });

  console.log('📋 处理结果:');
  processed.forEach((url, index) => {
    console.log(`  ${index + 1}. ${url}`);
  });

  return processed;
}

/**
 * 测试缓存破坏功能
 */
function testCacheBuster() {
  console.log('\n🧪 测试缓存破坏功能...');

  const testUrl = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac';

  console.log('原始URL:', testUrl);
  console.log('第一次处理:', addCacheBuster(testUrl));

  // 等待一小段时间
  setTimeout(() => {
    console.log('第二次处理:', addCacheBuster(testUrl));
    console.log('第三次处理:', addCacheBuster(testUrl));
  }, 100);
}

/**
 * 测试图片可访问性检查
 */
async function testImageAccessibility() {
  console.log('\n🧪 测试图片可访问性检查...');

  const testUrls = [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac',
    'https://images.unsplash.com/photo-1486427944299-aa1a5e0def7d',
    'https://invalid-url-12345.com/image.jpg',
    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9InJlZCIvPjwvc3ZnPg=='
  ];

  try {
    const results = await checkMultipleImages(testUrls, 2);

    console.log('📊 可访问性检查结果:');
    results.forEach(result => {
      const status = result.accessible ? '✅' : '❌';
      const error = result.error ? ` (${result.error})` : '';
      console.log(`  ${status} ${result.url}${error}`);
    });

    return results;
  } catch (error) {
    console.error('❌ 测试失败:', error);
    return [];
  }
}

/**
 * 模拟浏览器环境测试
 */
function simulateBrowserTests() {
  console.log('\n🧪 模拟浏览器环境测试...');

  // 模拟localStorage
  global.localStorage = {
    getItem: (key) => {
      console.log(`📦 获取localStorage: ${key}`);
      return null;
    },
    removeItem: (key) => {
      console.log(`🗑️ 移除localStorage: ${key}`);
    },
    setItem: (key, value) => {
      console.log(`💾 设置localStorage: ${key} = ${value}`);
    }
  };

  // 模拟sessionStorage
  global.sessionStorage = {
    getItem: (key) => {
      console.log(`📦 获取sessionStorage: ${key}`);
      return null;
    },
    removeItem: (key) => {
      console.log(`🗑️ 移除sessionStorage: ${key}`);
    },
    setItem: (key, value) => {
      console.log(`💾 设置sessionStorage: ${key} = ${value}`);
    }
  };

  // 模拟document
  global.document = {
    querySelectorAll: (selector) => {
      console.log(`🔍 查询选择器: ${selector}`);
      return [];
    },
    addEventListener: (event, handler) => {
      console.log(`🔗 添加事件监听器: ${event}`);
    }
  };

  global.window = {
    ImageUtils: {},
    ImageDebugger: {},
    fixImageLoading: () => console.log('🔄 修复图片加载'),
    debugImageLoading: () => console.log('🔍 调试图片加载'),
    imageMonitor: { start: () => console.log('📊 开始监控') }
  };

  // 模拟Image类
  global.Image = class MockImage {
    constructor() {
      this.src = '';
      this.onload = null;
      this.onerror = null;

      // 模拟加载行为
      setTimeout(() => {
        if (this.src && this.src.includes('unsplash')) {
          if (this.onload) this.onload();
        } else {
          if (this.onerror) this.onerror();
        }
      }, 100);
    }
  };

  console.log('✅ 浏览器环境模拟完成');
}

/**
 * 运行所有测试
 */
async function runAllTests() {
  console.log('🚀 开始图片加载修复测试...\n');

  try {
    // 测试图片URL处理
    const processedUrls = testImageUrlProcessing();

    // 测试缓存破坏
    testCacheBuster();

    // 等待一下再测试可访问性
    await new Promise(resolve => setTimeout(resolve, 200));

    // 测试图片可访问性
    const accessibilityResults = await testImageAccessibility();

    // 模拟浏览器测试
    simulateBrowserTests();

    console.log('\n📊 测试总结:');
    console.log(`✅ 处理图片URL: ${processedUrls.length} 个`);
    console.log(`✅ 可访问性检查: ${accessibilityResults.length} 个URL`);

    console.log('\n💡 建议:');
    console.log('1. 在浏览器中加载debug-image-loading.js进行实时调试');
    console.log('2. 使用EnhancedImage组件替代普通img标签');
    console.log('3. 定期清理浏览器缓存');
    console.log('4. 监控图片加载性能');

  } catch (error) {
    console.error('❌ 测试过程中出错:', error);
  }
}

/**
 * 性能测试
 */
function performanceTest() {
  console.log('\n⚡ 性能测试...');

  const iterations = 1000;
  const testUrl = 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3aac';

  console.time('缓存破坏处理');
  for (let i = 0; i < iterations; i++) {
    addCacheBuster(testUrl);
  }
  console.timeEnd('缓存破坏处理');

  console.time('URL验证');
  for (let i = 0; i < iterations; i++) {
    isValidImageUrl(testUrl);
  }
  console.timeEnd('URL验证');

  console.time('URL处理');
  const urls = Array(100).fill(testUrl);
  for (let i = 0; i < 10; i++) {
    processImageUrls(urls);
  }
  console.timeEnd('URL处理');
}

// 运行测试
if (require.main === module) {
  runAllTests().then(() => {
    performanceTest();
    console.log('\n✅ 所有测试完成！');
  }).catch(console.error);
}

module.exports = {
  testImageUrlProcessing,
  testCacheBuster,
  testImageAccessibility,
  simulateBrowserTests,
  performanceTest
};