/**
 * 图片处理工具函数
 */

/**
 * 从HTML内容中提取图片URL
 */
export function extractImagesFromContent(htmlContent: string): string[] {
  if (!htmlContent) return [];

  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const images: string[] = [];
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const imgUrl = match[1];

    // 过滤掉不需要的图片
    if (shouldIncludeImage(imgUrl)) {
      images.push(imgUrl);
    }
  }

  // 最多返回5张图片
  return images.slice(0, 5);
}

/**
 * 判断图片是否应该被包含
 */
function shouldIncludeImage(url: string): boolean {
  const excludePatterns = [
    /emoji/i,
    /icon/i,
    /avatar/i,
    /qrcode/i,
    /loading/i,
    /placeholder/i,
    /\.gif$/i,  // 排除GIF动图
  ];

  // 检查是否匹配排除模式
  for (const pattern of excludePatterns) {
    if (pattern.test(url)) {
      return false;
    }
  }

  // 检查URL是否有效
  try {
    new URL(url);
    return true;
  } catch {
    // 可能是相对路径，也包含
    return url.startsWith('/') || url.startsWith('http');
  }
}

/**
 * 验证图片URL是否可访问
 */
export async function validateImageUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
    const contentType = response.headers.get('content-type');
    return response.ok && (contentType?.startsWith('image/') ?? false);
  } catch {
    return false;
  }
}

/**
 * 批量验证图片URL
 */
export async function validateImages(urls: string[]): Promise<string[]> {
  const results = await Promise.allSettled(
    urls.map(url => validateImageUrl(url))
  );

  return urls.filter((_, index) => {
    const result = results[index];
    return result.status === 'fulfilled' && result.value;
  });
}

/**
 * 下载图片并转换为Base64
 */
export async function downloadImageAsBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');

    // 检测MIME类型
    const contentType = response.headers.get('content-type') || 'image/jpeg';

    return `data:${contentType};base64,${base64}`;
  } catch (error) {
    console.error(`Error downloading image from ${url}:`, error);
    throw error;
  }
}

/**
 * 从文章数据中提取所有配图
 */
export function extractImagesFromArticles(articles: any[]): string[] {
  const allImages = articles
    .flatMap(article => {
      // 如果已经有images字段，直接使用
      if (article.images && Array.isArray(article.images)) {
        return article.images;
      }

      // 否则从content中提取
      if (article.content) {
        return extractImagesFromContent(article.content);
      }

      return [];
    })
    .filter(Boolean);

  // 去重
  return Array.from(new Set(allImages));
}
