# Content Factory - AI内容工厂

基于Next.js和AI的智能内容选题分析、创作和发布管理平台。

## 功能特性

### 1. 选题洞察 🔍
- 通过关键词自动获取公众号热门文章
- AI智能分析互动率和选题趋势
- 生成详细的洞察报告:
  - 点赞量TOP5文章
  - 互动率TOP5文章
  - 高频词云
  - 5个选题洞察建议

### 2. AI内容创作 ✨
- 基于洞察报告一键生成文章
- 自动从Unsplash获取相关配图
- 支持自定义文章长度和风格
- 智能段落插图

### 3. 发布管理 📱
- 统一管理所有AI生成的文章
- 支持多种状态管理(草稿、待审核、已发布等)
- 一键发布到小红书和公众号
- 全流程状态追踪

## 技术栈

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite + Prisma ORM
- **UI Components**: 自定义组件库(参考shadcn/ui)
- **State Management**: React Hooks
- **API**: Next.js API Routes

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env` 文件并填入你的API密钥:

```env
# Database
DATABASE_URL="file:./dev.db"

# OpenAI Compatible API (用于AI生成)
OPENAI_API_KEY="your_api_key_here"
OPENAI_API_BASE="https://api.openai.com/v1"

# 公众号文章API (第三方)
WECHAT_API_KEY="your_wechat_api_key"
WECHAT_API_BASE="https://api.example.com"

# Unsplash API
UNSPLASH_ACCESS_KEY="your_unsplash_key"

# 发布API (第三方)
PUBLISH_XHS_API_KEY="your_xhs_api_key"
PUBLISH_WECHAT_API_KEY="your_wechat_publish_api_key"
```

### 3. 初始化数据库

```bash
npx prisma migrate dev
```

### 4. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
content-factory/
├── prisma/
│   ├── schema.prisma      # 数据库模型
│   └── migrations/        # 数据库迁移
├── src/
│   ├── app/               # Next.js App Router
│   │   ├── api/          # API路由
│   │   │   ├── insights/ # 洞察API
│   │   │   ├── articles/ # 文章管理API
│   │   │   ├── topic-analysis/ # 选题分析API
│   │   │   ├── content-creation/ # 内容创作API
│   │   │   └── publish/  # 发布API
│   │   ├── topic-analysis/      # 选题分析页面
│   │   ├── content-creation/    # 内容创作页面
│   │   ├── publish-management/  # 发布管理页面
│   │   ├── article/[id]/        # 文章编辑页面
│   │   └── page.tsx             # 首页
│   ├── components/
│   │   ├── ui/           # UI组件库
│   │   └── navigation.tsx # 导航组件
│   ├── lib/
│   │   ├── prisma.ts     # Prisma客户端
│   │   └── utils.ts      # 工具函数
│   └── types/
│       └── index.ts      # 类型定义
├── .env                   # 环境变量
└── tailwind.config.ts     # Tailwind配置
```

## API说明

### 选题分析API

**POST /api/topic-analysis**

请求体:
```json
{
  "keyword": "AI工具"
}
```

响应:
```json
{
  "success": true,
  "data": {
    "insightId": "xxx",
    "report": {
      "topLikedArticles": [...],
      "topInteractiveArticles": [...],
      "wordCloud": [...],
      "insights": [...]
    }
  }
}
```

### 内容创作API

**POST /api/content-creation**

请求体:
```json
{
  "insightId": "xxx",
  "topicIndexes": [0, 1],
  "length": "medium",
  "style": "professional"
}
```

### 发布API

**POST /api/publish**

请求体:
```json
{
  "articleId": "xxx",
  "platform": "xiaohongshu" // or "wechat"
}
```

## 数据库模型

### Insight (洞察报告)
- keyword: 关键词
- totalArticles: 分析文章总数
- topLikedArticles: 点赞TOP5
- topInteractiveArticles: 互动率TOP5
- wordCloud: 词云数据
- insights: 洞察建议

### Article (文章)
- title: 标题
- content: 内容(HTML)
- status: 状态(DRAFT/PENDING/PUBLISHED_*)
- wordCount: 字数
- tags: 标签
- images: 配图
- insightId: 关联的洞察报告

### Publish (发布记录)
- articleId: 文章ID
- platform: 平台(XIAOHONGSHU/WECHAT)
- publishedAt: 发布时间
- result: 发布结果

## 待实现功能

目前所有的API调用都使用模拟数据,实际部署时需要:

1. 接入真实的公众号文章获取API
2. 接入OpenAI兼容的AI生成API
3. 接入Unsplash图片API
4. 接入小红书和公众号的发布API

具体实现位置已在代码中标注 `TODO` 注释。

## 设计理念

本项目遵循现代化UI设计原则:
- **极简主义**: 删除一切不必要的视觉元素
- **呼吸感**: 大量留白,让界面不压抑
- **微交互**: 细腻的动效反馈
- **一致性**: 统一的设计语言
- **响应式**: 完美适配所有设备

参考产品: Linear, Notion, Vercel, Stripe

## License

MIT
