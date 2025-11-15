# AI 提示词系统使用指南

本项目实现了灵活的 AI 提示词配置系统,可以在不同功能中使用不同的提示词模板。

## 📁 文件结构

```
src/lib/
├── openai.ts      # OpenRouter API 客户端
└── prompts.ts     # 提示词模板配置
```

## 🎯 核心功能

### 1. **文章创作提示词** (`articlePrompts`)

#### 基础文章生成
```typescript
import { articlePrompts, openaiClient } from '@/lib';

const prompt = articlePrompts.generateArticle({
  keyword: "AI工具",
  insights: ["洞察1", "洞察2", "洞察3"],
  wordCount: "2000-3000字",
  styleGuide: "专业严谨,逻辑清晰",
  platform: "公众号"
});

const result = await openaiClient.generateJSON(prompt);
```

#### 小红书风格文章
```typescript
const prompt = articlePrompts.xiaohongshu({
  keyword: "副业赚钱",
  insights: ["分享真实经验", "数据对比", "行动建议"],
  wordCount: "500-1000字"
});

// 返回格式:
// {
//   title: "标题+emoji",
//   content: "HTML内容",
//   tags: ["标签1", "标签2"]
// }
```

#### 公众号深度文章
```typescript
const prompt = articlePrompts.wechat({
  keyword: "职场技能",
  insights: ["市场需求分析", "技能提升路径", "实战案例"],
  wordCount: "2000-4000字"
});

// 返回格式:
// {
//   title: "标题",
//   subtitle: "副标题",
//   content: "HTML内容"
// }
```

#### 故事化叙述
```typescript
const prompt = articlePrompts.storytelling({
  keyword: "创业故事",
  insights: ["从0到1的过程", "遇到的困难", "突破的关键"],
  wordCount: "1500-2500字"
});
```

### 2. **选题分析提示词** (`topicAnalysisPrompts`)

#### 分析文章
```typescript
import { topicAnalysisPrompts, openaiClient } from '@/lib';

const prompt = topicAnalysisPrompts.analyzeArticle({
  title: "文章标题",
  digest: "文章摘要",
  keyword: "关键词"
});

const summary = await openaiClient.chat([
  { role: "user", content: prompt }
]);
```

#### 生成洞察
```typescript
const prompt = topicAnalysisPrompts.generateInsights({
  keyword: "AI工具",
  summaries: ["摘要1", "摘要2", "摘要3"],
  count: 3
});

// 返回格式:
// [
//   {
//     title: "洞察标题",
//     description: "详细说明",
//     angle: "干货",
//     difficulty: "简单"
//   }
// ]
```

### 3. **内容优化提示词** (`contentOptimizationPrompts`)

#### 改写标题
```typescript
import { contentOptimizationPrompts, openaiClient } from '@/lib';

const prompt = contentOptimizationPrompts.rewriteTitle({
  originalTitle: "原标题",
  style: "小红书风格"
});

// 返回3个备选标题
```

#### 扩写内容
```typescript
const prompt = contentOptimizationPrompts.expandContent({
  content: "简短内容",
  targetLength: 2000
});
```

#### 内容润色
```typescript
const prompt = contentOptimizationPrompts.polishContent({
  content: "待润色的内容",
  style: "专业严谨"
});
```

### 4. **SEO 优化提示词** (`seoPrompts`)

```typescript
import { seoPrompts, openaiClient } from '@/lib';

// 生成关键词
const keywordsPrompt = seoPrompts.generateKeywords({
  title: "文章标题",
  content: "文章内容"
});

// 生成摘要
const summaryPrompt = seoPrompts.generateSummary({
  content: "文章全文",
  length: 150
});
```

### 5. **配图建议提示词** (`imagePrompts`)

```typescript
import { imagePrompts, openaiClient } from '@/lib';

const prompt = imagePrompts.generateImageDescriptions({
  content: "文章内容",
  count: 3
});

// 返回格式:
// [
//   {
//     position: "开头",
//     description: "图片描述",
//     keywords: ["关键词1", "关键词2"]
//   }
// ]
```

## 🔧 辅助函数

### 获取风格指南
```typescript
import { getStyleGuide } from '@/lib/prompts';

const guide = getStyleGuide("professional");
// "专业严谨,逻辑清晰,数据支撑,适合职场人士阅读"
```

### 获取字数要求
```typescript
import { getWordCount } from '@/lib/prompts';

const count = getWordCount("medium");
// "2000-3000字"
```

### 获取平台名称
```typescript
import { getPlatformName } from '@/lib/prompts';

const platform = getPlatformName("casual");
// "小红书"
```

## 📝 实际应用示例

### 示例 1: 在 API 路由中使用

```typescript
// src/app/api/content-creation/route.ts
import { openaiClient } from '@/lib/openai';
import { articlePrompts, getWordCount, getStyleGuide } from '@/lib/prompts';

export async function POST(request: NextRequest) {
  const { keyword, insights, length, style } = await request.json();

  // 根据风格选择提示词模板
  let prompt: string;

  if (style === "xiaohongshu") {
    prompt = articlePrompts.xiaohongshu({
      keyword,
      insights,
      wordCount: getWordCount(length)
    });
  } else {
    prompt = articlePrompts.wechat({
      keyword,
      insights,
      wordCount: getWordCount(length)
    });
  }

  // 调用 AI 生成
  const result = await openaiClient.generateJSON(prompt, {
    timeout: 120000,
    maxRetries: 3
  });

  return NextResponse.json({ success: true, data: result });
}
```

### 示例 2: 批量处理

```typescript
// 批量改写标题
async function rewriteTitlesInBatch(titles: string[]) {
  const results = [];

  for (const title of titles) {
    const prompt = contentOptimizationPrompts.rewriteTitle({
      originalTitle: title,
      style: "小红书风格"
    });

    const rewritten = await openaiClient.generateJSON(prompt);
    results.push(rewritten);

    // 避免速率限制
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  return results;
}
```

### 示例 3: 组合多个提示词

```typescript
async function createCompleteArticle(keyword: string, insights: string[]) {
  // 1. 生成文章内容
  const contentPrompt = articlePrompts.wechat({
    keyword,
    insights,
    wordCount: "2000-3000字"
  });

  const article = await openaiClient.generateJSON(contentPrompt);

  // 2. 生成 SEO 关键词
  const keywordsPrompt = seoPrompts.generateKeywords({
    title: article.title,
    content: article.content
  });

  const keywords = await openaiClient.generateJSON(keywordsPrompt);

  // 3. 生成配图建议
  const imagesPrompt = imagePrompts.generateImageDescriptions({
    content: article.content,
    count: 3
  });

  const images = await openaiClient.generateJSON(imagesPrompt);

  return {
    ...article,
    keywords,
    images
  };
}
```

## 🎨 自定义提示词

如果需要添加新的提示词模板,在 `src/lib/prompts.ts` 中扩展:

```typescript
export const customPrompts = {
  myCustomPrompt: (params: { ... }) => `
    你的自定义提示词...

    参数: ${params.xxx}

    输出格式: ...
  `
};
```

## 💡 最佳实践

### 1. **选择合适的模板**
- 小红书内容 → `articlePrompts.xiaohongshu`
- 公众号深度文章 → `articlePrompts.wechat`
- 故事化内容 → `articlePrompts.storytelling`
- 通用文章 → `articlePrompts.generateArticle`

### 2. **设置合理的超时和重试**
```typescript
await openaiClient.generateJSON(prompt, {
  timeout: 120000,     // 2分钟超时
  maxRetries: 3,       // 最多重试3次
  maxTokens: 4096      // 最大token数
});
```

### 3. **处理错误**
```typescript
try {
  const result = await openaiClient.generateJSON(prompt);
} catch (error) {
  console.error("AI生成失败:", error);
  // 降级处理: 返回默认内容或提示用户
}
```

### 4. **优化成本**
```typescript
// 使用更短的提示词
const prompt = articlePrompts.xiaohongshu({
  keyword,
  insights: insights.slice(0, 3),  // 只用前3个洞察
  wordCount: "500-1000字"          // 较短的字数
});

// 预估 token 使用
const estimatedTokens = openaiClient.estimateTokens(prompt);
console.log(`预计使用 ${estimatedTokens} tokens`);
```

## 🔍 调试技巧

### 查看生成的提示词
```typescript
const prompt = articlePrompts.xiaohongshu({ ... });
console.log("生成的提示词:", prompt);
```

### 检查模型配置
```typescript
console.log("当前模型:", openaiClient.getModelName());
// "google/gemini-2.5-pro"
```

### 估算成本
```typescript
const cost = openaiClient.estimateCost(inputTokens, outputTokens);
console.log(`本次调用成本: $${cost.toFixed(4)}`);
```

## 📚 更多资源

- [OpenRouter API 文档](https://openrouter.ai/docs)
- [Gemini 模型说明](https://ai.google.dev/gemini-api/docs)
- [提示词工程指南](https://platform.openai.com/docs/guides/prompt-engineering)
