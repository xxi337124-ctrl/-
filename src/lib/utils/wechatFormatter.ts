/**
 * 微信公众号内容格式转换工具
 */

/**
 * 从Markdown内容中提取第一张图片
 */
export function extractFirstImage(content: string): string | null {
  // 匹配Markdown图片语法: ![alt](url)
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/;
  const match = content.match(markdownImageRegex);

  if (match && match[1]) {
    return match[1];
  }

  // 匹配HTML img标签
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const htmlMatch = content.match(htmlImageRegex);

  if (htmlMatch && htmlMatch[1]) {
    return htmlMatch[1];
  }

  return null;
}

/**
 * 从Markdown内容中提取所有图片URL
 */
export function extractAllImages(content: string): string[] {
  const images: string[] = [];

  // 提取Markdown格式图片
  const markdownImageRegex = /!\[.*?\]\((.*?)\)/g;
  let match;
  while ((match = markdownImageRegex.exec(content)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }

  // 提取HTML格式图片
  const htmlImageRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  while ((match = htmlImageRegex.exec(content)) !== null) {
    if (match[1] && !images.includes(match[1])) {
      images.push(match[1]);
    }
  }

  return images;
}

/**
 * 生成文章摘要（从内容中提取前120字）
 */
export function generateSummary(content: string, maxLength: number = 120): string {
  // 移除Markdown标记和HTML标签
  let text = content
    .replace(/!\[.*?\]\(.*?\)/g, '') // 移除图片
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 保留链接文本
    .replace(/<[^>]+>/g, '') // 移除HTML标签
    .replace(/[#*`~\-_]/g, '') // 移除Markdown标记
    .replace(/\s+/g, ' ') // 合并多余空格
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + '...';
}

/**
 * 清理和优化Markdown内容用于微信发布
 */
export function cleanMarkdownForWechat(content: string): string {
  // 移除不支持的Markdown语法
  let cleaned = content
    // 保留标题但简化
    .replace(/^#{1,6}\s+/gm, '**') // 标题转为粗体
    // 保留列表
    .replace(/^\*\s+/gm, '• ') // 无序列表
    .replace(/^\d+\.\s+/gm, (match) => match) // 有序列表保持
    // 保留强调
    .replace(/\*\*(.+?)\*\*/g, '**$1**') // 粗体
    .replace(/\*(.+?)\*/g, '*$1*') // 斜体
    // 移除代码块（微信不支持）
    .replace(/```[\s\S]*?```/g, '') // 代码块
    .replace(/`([^`]+)`/g, '$1'); // 行内代码

  return cleaned.trim();
}

/**
 * 验证内容是否符合小绿书发布要求
 */
export function validateNewspicContent(content: string): {
  valid: boolean;
  error?: string;
  imageCount?: number;
  textLength?: number;
} {
  const images = extractAllImages(content);
  const imageCount = images.length;

  // 检查图片数量
  if (imageCount === 0) {
    return {
      valid: false,
      error: '小绿书模式至少需要1张图片',
      imageCount: 0,
    };
  }

  if (imageCount > 20) {
    return {
      valid: false,
      error: '小绿书模式最多支持20张图片',
      imageCount,
    };
  }

  // 检查文本长度
  const text = content
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/<img[^>]+>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

  const textLength = text.length;

  if (textLength > 1000) {
    return {
      valid: false,
      error: '小绿书模式文本内容不能超过1000字',
      textLength,
      imageCount,
    };
  }

  return {
    valid: true,
    imageCount,
    textLength,
  };
}

/**
 * 验证图片URL是否有效
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const pathname = urlObj.pathname.toLowerCase();
    return validExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}
