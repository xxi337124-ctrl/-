/**
 * 小红书内容格式化工具
 */

/**
 * 清洗文本，移除所有Markdown和HTML标记，提取纯文本
 */
export function cleanTextContent(content: string): string {
  let text = content
    // 移除图片（Markdown格式）
    .replace(/!\[.*?\]\(.*?\)/g, '')
    // 移除图片（HTML格式）
    .replace(/<img[^>]+>/gi, '')
    // 移除链接，保留文本（Markdown格式）
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 移除链接（HTML格式）
    .replace(/<a[^>]*>([^<]+)<\/a>/gi, '$1')
    // 移除所有其他HTML标签
    .replace(/<[^>]+>/g, '')
    // 移除Markdown标题标记
    .replace(/^#{1,6}\s+/gm, '')
    // 移除粗体标记
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    // 移除斜体标记
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // 移除代码块
    .replace(/```[\s\S]*?```/g, '')
    // 移除行内代码
    .replace(/`([^`]+)`/g, '$1')
    // 移除引用标记
    .replace(/^>\s+/gm, '')
    // 移除列表标记
    .replace(/^[\*\-\+]\s+/gm, '')
    .replace(/^\d+\.\s+/gm, '')
    // 移除水平分隔线
    .replace(/^[-*_]{3,}$/gm, '')
    // 移除删除线
    .replace(/~~([^~]+)~~/g, '$1')
    // 清理多余空行（保留最多一个空行）
    .replace(/\n{3,}/g, '\n\n')
    // 清理首尾空白
    .trim();

  return text;
}

/**
 * 从文章内容中提取标签
 * 优先提取标题作为标签，最多返回5个
 */
export function extractTags(content: string): string[] {
  const tags: string[] = [];

  // 1. 提取二级和三级标题作为标签
  const headingRegex = /^#{2,3}\s+(.+)$/gm;
  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const tag = match[1]
      .trim()
      .replace(/[#*_`~\[\]\(\)]/g, '') // 移除特殊符号
      .substring(0, 10); // 限制长度

    if (tag.length > 0 && !tags.includes(tag)) {
      tags.push(tag);
    }
  }

  // 2. 如果标签不足，从一级标题提取
  if (tags.length < 3) {
    const h1Regex = /^#\s+(.+)$/gm;
    while ((match = h1Regex.exec(content)) !== null) {
      const tag = match[1]
        .trim()
        .replace(/[#*_`~\[\]\(\)]/g, '')
        .substring(0, 10);

      if (tag.length > 0 && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  // 3. 如果还不足，尝试从粗体文本提取关键词
  if (tags.length < 3) {
    const boldRegex = /\*\*([^*]{2,10})\*\*/g;
    while ((match = boldRegex.exec(content)) !== null) {
      const tag = match[1].trim();
      if (tag.length >= 2 && tag.length <= 10 && !tags.includes(tag)) {
        tags.push(tag);
      }
    }
  }

  // 返回最多5个标签
  return tags.slice(0, 5);
}

/**
 * 验证内容是否适合发布到小红书
 */
export function validateXiaohongshuContent(content: string): {
  valid: boolean;
  error?: string;
  warnings?: string[];
} {
  const warnings: string[] = [];

  // 检查是否有内容
  const cleanedText = cleanTextContent(content);
  if (!cleanedText || cleanedText.length === 0) {
    return {
      valid: false,
      error: '文章内容不能为空',
    };
  }

  // 检查内容长度（小红书限制：1000字以内效果最佳）
  if (cleanedText.length > 1000) {
    warnings.push(`内容较长（${cleanedText.length}字），建议精简到1000字以内`);
  }

  // 检查是否太短
  if (cleanedText.length < 50) {
    warnings.push('内容较短，建议增加到50字以上');
  }

  return {
    valid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}
