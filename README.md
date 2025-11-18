# Content Factory - AI内容工厂

基于 Next.js 和 AI 的智能内容创作、分析和发布管理平台。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/你的用户名/内容工厂)

## ✨ 核心功能

### 🎯 选题洞察
- **小红书搜索**: 按关键词搜索热门笔记，支持排序和筛选
- **公众号搜索**: 搜索公号文章和账号文章
- **AI 智能分析**: 自动分析互动率和选题趋势
- **详细报告**: 点赞 TOP5、互动率 TOP5、高频词云、选题建议

### ✍️ 智能创作中心
- **爆款结构**: 基于预设的爆款文章结构
- **AI 文案生成**: Gemini 2.5 Pro 智能生成优质文案
- **智能配图**: Gemini 2.5 Pro 分析文案 → SiliconFlow 文生图
- **内容优化**: 自动排版、图文分离展示

### 📝 小红书二创
- **智能改写**: 基于原文进行创意改写
- **风格转换**: 多种写作风格可选
- **配图优化**: 自动生成适配小红书的配图

### 📤 发布管理
- **草稿管理**: 统一管理所有待发布内容
- **一键发布**: 发布到小红书/公众号
- **状态追踪**: 实时查看发布状态
- **历史记录**: 所有已发布文章的完整记录

### 📊 数据概览
- **实时统计**: 今日分析数、创作数、发布数
- **趋势分析**: 每日数据趋势图表
- **平台分布**: 小红书/公众号发布占比
- **热门话题**: 最近热门关键词统计

---

## 🚀 快速开始

### 方式一：在线部署（推荐）

最快 **5 分钟**上线，查看 [快速部署指南](./QUICK_DEPLOY.md)

1. 点击上方 "Deploy with Vercel" 按钮
2. 配置环境变量
3. 完成部署

### 方式二：本地开发

#### 1. 克隆仓库

```bash
git clone https://github.com/你的用户名/内容工厂.git
cd content-factory
```

#### 2. 安装依赖

```bash
npm install
```

#### 3. 配置环境变量

复制 `.env.example` 为 `.env` 并填入你的 API 密钥:

```env
# 数据库
DATABASE_URL="file:./dev.db"

# OpenRouter (Gemini 2.5 Pro)
OPENROUTER_API_KEY="sk-or-v1-你的密钥"

# SiliconFlow (文生图)
SILICONFLOW_API_KEY="sk-你的密钥"

# Doubao (SeeDream 4.0)
DOUBAO_API_KEY="你的密钥"

# 小红书（可选）
XHS_COOKIE="你的cookie"
```

#### 4. 初始化数据库

```bash
npx prisma generate
npx prisma migrate dev
```

#### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

---

## 📦 技术栈

| 分类 | 技术 |
|------|------|
| **框架** | Next.js 16.0.1, React 19 |
| **语言** | TypeScript |
| **样式** | Tailwind CSS |
| **数据库** | SQLite (开发) / PostgreSQL (生产) |
| **ORM** | Prisma |
| **AI 服务** | OpenRouter (Gemini 2.5 Pro) |
| **图片生成** | SiliconFlow, Doubao SeeDream 4.0 |
| **动效** | Framer Motion |
| **状态管理** | Zustand |
| **部署** | Vercel (推荐) |

---

## 📁 项目结构

```
content-factory/
├── prisma/
│   ├── schema.prisma           # 数据库模型
│   └── migrations/             # 数据库迁移
├── src/
│   ├── app/
│   │   ├── api/                # API 路由
│   │   │   ├── topic-analysis/ # 选题分析
│   │   │   ├── content-creation/ # 智能创作
│   │   │   ├── xiaohongshu/    # 小红书二创
│   │   │   ├── articles/       # 文章管理
│   │   │   ├── publish/        # 发布功能
│   │   │   └── dashboard/      # 数据统计
│   │   ├── page.tsx            # 首页 (Dashboard)
│   │   └── ...                 # 其他页面
│   ├── components/
│   │   ├── common/             # 通用组件
│   │   ├── pages/              # 页面组件
│   │   └── ...
│   ├── lib/
│   │   ├── ai/                 # AI 服务客户端
│   │   │   ├── openrouter.ts   # Gemini
│   │   │   ├── siliconflow.ts  # 文生图
│   │   │   └── doubao.ts       # 图生图
│   │   ├── prisma.ts           # 数据库客户端
│   │   ├── design.ts           # 设计系统
│   │   └── utils.ts            # 工具函数
│   ├── stores/                 # Zustand 状态管理
│   └── types/                  # TypeScript 类型
├── DEPLOYMENT_GUIDE.md         # 详细部署指南
├── QUICK_DEPLOY.md             # 快速部署指南
└── README.md                   # 本文件
```

---

## 🔧 环境变量说明

### 必需配置

| 变量名 | 说明 | 获取方式 |
|--------|------|----------|
| `DATABASE_URL` | 数据库连接 | 本地: `file:./dev.db`<br>生产: Vercel Postgres |
| `OPENROUTER_API_KEY` | Gemini 2.5 Pro | [openrouter.ai](https://openrouter.ai) |
| `SILICONFLOW_API_KEY` | 文生图服务 | [siliconflow.cn](https://siliconflow.cn) |
| `DOUBAO_API_KEY` | SeeDream 图生图 | [doubao.com](https://doubao.com) |

### 可选配置

| 变量名 | 说明 | 功能 |
|--------|------|------|
| `XHS_COOKIE` | 小红书 Cookie | 小红书搜索功能 |
| `WECHAT_API_KEY` | 公众号 API | 公众号搜索功能 |

---

## 🎨 设计理念

遵循现代化极简设计原则：

- **极简主义**: 删除不必要的视觉元素
- **呼吸感**: 大量留白，界面不压抑
- **微交互**: 细腻的动效反馈
- **一致性**: 统一的设计语言
- **响应式**: 完美适配所有设备

设计参考: Linear, Notion, Vercel, Stripe

---

## 📖 部署指南

### 推荐方案

| 方案 | 适用场景 | 成本 |
|------|---------|------|
| **Vercel** | 个人/小团队 | ~¥2/月 |
| **云服务器** | 商业化产品 | ~¥100/月 |

详细部署步骤：
- [快速部署（5分钟）](./QUICK_DEPLOY.md)
- [完整部署指南](./DEPLOYMENT_GUIDE.md)

---

## 📊 数据模型

### insights (洞察报告)
- `keyword`: 搜索关键词
- `totalArticles`: 分析文章数
- `topLikedArticles`: 点赞 TOP5
- `topInteractiveArticles`: 互动率 TOP5
- `wordCloud`: 高频词云
- `insights`: AI 洞察建议

### articles (文章)
- `title`: 标题
- `content`: 内容 (HTML)
- `status`: 状态 (DRAFT / PUBLISHED_XHS / PUBLISHED_WECHAT / PUBLISHED_ALL)
- `wordCount`: 字数
- `images`: 配图 URL 列表
- `tags`: 标签和元数据

### publishes (发布记录)
- `articleId`: 关联文章
- `platform`: 发布平台
- `publishedAt`: 发布时间
- `result`: 发布结果

---

## 🛣️ 路线图

- [x] 选题洞察分析
- [x] 智能内容创作
- [x] 小红书二创
- [x] 发布管理系统
- [x] 数据统计看板
- [ ] 真实平台发布对接
- [ ] 多账号管理
- [ ] 定时发布
- [ ] 数据导出功能
- [ ] 团队协作功能

---

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

## 📄 License

MIT License

---

## 💬 联系方式

- GitHub Issues: [提交问题](https://github.com/你的用户名/内容工厂/issues)
- 部署问题: 查看 [部署指南](./DEPLOYMENT_GUIDE.md)
