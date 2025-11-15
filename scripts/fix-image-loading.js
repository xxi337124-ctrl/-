/**
 * 修复图片加载问题的脚本
 * 自动更新现有组件中的图片加载逻辑
 */

const fs = require('fs');
const path = require('path');

/**
 * 需要修复的文件列表
 */
const filesToFix = [
  'src/components/pages/ContentCreation.tsx',
  'src/components/pages/TopicAnalysis.tsx',
  'src/components/pages/TopicAnalysis-new.tsx',
  'src/components/RichTextEditor.tsx'
];

/**
 * 修复策略
 */
const fixes = {
  // 替换 img 标签为 EnhancedImage 组件
  replaceImgTags: {
    pattern: /<(img)\s+([^>]*?)src=["']([^"']+)["']([^>]*?)\/?>/g,
    replacement: (match, tag, before, src, after) => {
      // 提取属性
      const altMatch = match.match(/alt=["']([^"']+)["']/);
      const classMatch = match.match(/className=["']([^"']+)["']/);
      const widthMatch = match.match(/width=["'](\d+)["']/);
      const heightMatch = match.match(/height=["'](\d+)["']/);

      const alt = altMatch ? altMatch[1] : '图片';
      const className = classMatch ? classMatch[1] : '';
      const width = widthMatch ? widthMatch[1] : 'undefined';
      const height = heightMatch ? heightMatch[1] : 'undefined';

      // 构建新的组件调用
      let props = `src="${src}" alt="${alt}"`;
      if (className) props += ` className="${className}"`;
      if (width !== 'undefined') props += ` width={${width}}`;
      if (height !== 'undefined') props += ` height={${height}}`;

      return `<EnhancedImage ${props} disableCache={true} />`;
    }
  },

  // 添加时间戳参数到图片URL
  addCacheBuster: {
    pattern: /src=\{([^}]+)\}/g,
    replacement: 'src={`${$1}${$1.includes("?") ? "&" : "?"}t=${Date.now()}`}'
  },

  // 修复动态图片URL
  fixDynamicImages: {
    pattern: /src=\{(img|image|url)\}/g,
    replacement: 'src={`${$1}${$1.includes("?") ? "&" : "?"}t=${Date.now()}`}'
  }
};

/**
 * 应用修复
 */
function applyFixes(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    console.log(`🔧 处理文件: ${filePath}`);

    // 检查是否需要导入EnhancedImage
    if (!content.includes('EnhancedImage') && content.includes('<img')) {
      // 在文件开头添加导入
      const importStatement = 'import EnhancedImage from "@/components/EnhancedImage";\n';

      // 找到最后一个import语句的位置
      const importRegex = /import\s+.*?from\s+['"][^'"]+['"];?\n/g;
      const imports = content.match(importRegex);

      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport) + lastImport.length;
        content = content.slice(0, lastImportIndex) + importStatement + content.slice(lastImportIndex);
      } else {
        // 如果没有import语句，添加到文件开头
        content = importStatement + content;
      }

      console.log('✅ 已添加EnhancedImage导入');
      modified = true;
    }

    // 应用缓存破坏修复
    let newContent = content;

    // 修复动态图片URL
    newContent = newContent.replace(fixes.fixDynamicImages.pattern, fixes.fixDynamicImages.replacement);

    // 修复静态图片URL
    newContent = newContent.replace(fixes.addCacheBuster.pattern, fixes.addCacheBuster.replacement);

    if (newContent !== content) {
      console.log('✅ 已应用缓存破坏修复');
      modified = true;
      content = newContent;
    }

    // 替换img标签（可选，比较复杂，先不启用）
    // newContent = newContent.replace(fixes.replaceImgTags.pattern, fixes.replaceImgTags.replacement);

    if (modified) {
      // 创建备份
      const backupPath = `${filePath}.backup.${Date.now()}`;
      fs.writeFileSync(backupPath, fs.readFileSync(filePath, 'utf8'));
      console.log(`💾 已创建备份: ${backupPath}`);

      // 写入修复后的内容
      fs.writeFileSync(filePath, content);
      console.log(`✅ 文件已修复: ${filePath}`);
      return true;
    } else {
      console.log('ℹ️ 文件无需修复');
      return false;
    }

  } catch (error) {
    console.error(`❌ 处理文件失败: ${filePath}`, error);
    return false;
  }
}

/**
 * 检查并修复Next.js配置
 */
function checkNextConfig() {
  const configPath = 'next.config.ts';

  try {
    let content = fs.readFileSync(configPath, 'utf8');

    // 检查是否已经有图片配置
    if (!content.includes('images')) {
      // 添加图片配置
      const imageConfig = `
  images: {
    domains: ['images.unsplash.com', 'source.unsplash.com', 'api.siliconflow.cn', 'api.apicore.ai'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60, // 1分钟缓存，避免长期缓存问题
  },`;

      // 在配置对象中添加images配置
      const configRegex = /const\s+nextConfig.*?=\s*\{([\s\S]*?)\};/;
      const match = content.match(configRegex);

      if (match) {
        const existingContent = match[1];
        const newContent = existingContent + imageConfig;
        content = content.replace(existingContent, newContent);

        fs.writeFileSync(configPath, content);
        console.log('✅ Next.js配置已更新，添加了图片域名配置');
        return true;
      }
    }

    console.log('ℹ️ Next.js配置已正确');
    return false;

  } catch (error) {
    console.error('❌ 检查Next.js配置失败:', error);
    return false;
  }
}

/**
 * 创建增强版图片组件（如果不存在）
 */
function createEnhancedImageComponent() {
  const componentPath = 'src/components/EnhancedImage.tsx';

  if (fs.existsSync(componentPath)) {
    console.log('ℹ️ 增强版图片组件已存在');
    return;
  }

  // 这里可以复制EnhancedImage组件的内容，但为简洁起见，假设文件已存在
  console.log('ℹ️ 增强版图片组件将在单独的文件中创建');
}

/**
 * 主函数
 */
async function main() {
  console.log('🚀 开始修复图片加载问题...\n');

  let totalFixed = 0;

  // 检查Next.js配置
  console.log('🔧 检查Next.js配置...');
  if (checkNextConfig()) {
    totalFixed++;
  }

  // 处理每个文件
  for (const filePath of filesToFix) {
    const fullPath = path.join(process.cwd(), filePath);

    if (fs.existsSync(fullPath)) {
      console.log(`\n📁 处理: ${filePath}`);
      if (applyFixes(fullPath)) {
        totalFixed++;
      }
    } else {
      console.log(`⚠️ 文件不存在: ${filePath}`);
    }
  }

  console.log(`\n✅ 修复完成！总计修复 ${totalFixed} 个文件`);
  console.log('\n📋 建议操作:');
  console.log('1. 重启开发服务器: npm run dev');
  console.log('2. 清除浏览器缓存');
  console.log('3. 在浏览器控制台运行: window.clearImageCache()');
  console.log('4. 使用调试工具: window.debugImages()');
  console.log('\n💡 提示:');
  console.log('- 如果图片仍然无法加载，检查网络连接');
  console.log('- 检查图片URL是否有效');
  console.log('- 确认API服务是否正常运行');
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  applyFixes,
  checkNextConfig,
  fixes
};