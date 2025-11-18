# 内容工厂部署上线指南

## 📋 目录

1. [部署前准备](#部署前准备)
2. [推荐部署方案](#推荐部署方案)
3. [Vercel 部署（推荐）](#vercel-部署推荐)
4. [云服务器部署（备选）](#云服务器部署备选)
5. [环境变量配置](#环境变量配置)
6. [数据库配置](#数据库配置)
7. [域名绑定](#域名绑定)
8. [上线后检查](#上线后检查)

---

## 部署前准备

### 1. 确认代码已推送到 GitHub

```bash
# 检查 git 状态
git status

# 如果有未提交的改动
git add .
git commit -m "准备部署上线"
git push origin main
```

### 2. 准备 API Keys

确保你有以下 API Keys（在部署时需要配置）：

- ✅ **OpenRouter API Key** (Gemini 2.5 Pro - 文案生成和分析)
- ✅ **SiliconFlow API Key** (文生图功能)
- ✅ **Doubao API Key** (SeeDream 4.0 - 图生图功能)
- ⚠️ **小红书 Cookie** (可选，用于搜索功能)
- ⚠️ **公众号 API** (可选，用于搜索功能)

---

## 推荐部署方案

根据你的需求和技术水平，有三种推荐方案：

| 方案 | 适用场景 | 优点 | 缺点 |
|------|---------|------|------|
| **Vercel** | 小团队、快速上线 | 零成本、自动部署、免运维 | 免费版有限制 |
| **阿里云/腾讯云** | 商业化使用 | 稳定、可控、无限制 | 需要运维、有成本 |
| **Docker部署** | 技术团队 | 灵活、可移植 | 需要容器知识 |

**推荐顺序：Vercel > 云服务器 > Docker**

---

## Vercel 部署（推荐）

### 优势
- ✅ **完全免费**（免费版足够小团队使用）
- ✅ **自动化部署**（Git push 自动更新）
- ✅ **全球 CDN 加速**
- ✅ **免费 HTTPS 证书**
- ✅ **零运维成本**

### 限制
- ⚠️ 免费版每月 100GB 带宽
- ⚠️ 函数执行时间限制（免费版 10s，Pro版 60s）
- ⚠️ SQLite 数据库每次部署会重置（需要升级数据库方案）

---

### 步骤 1: 注册 Vercel 账号

1. 访问 [Vercel 官网](https://vercel.com)
2. 使用 GitHub 账号登录
3. 授权 Vercel 访问你的 GitHub 仓库

---

### 步骤 2: 导入项目

1. 在 Vercel Dashboard 点击 **"Add New Project"**
2. 选择你的 GitHub 仓库（内容工厂项目）
3. Vercel 会自动识别为 Next.js 项目

---

### 步骤 3: 配置环境变量

在 Vercel 项目设置中，添加以下环境变量：

#### 必需的环境变量

```env
# 数据库（使用 Vercel Postgres 或 Turso）
DATABASE_URL=你的数据库连接URL

# OpenRouter (Gemini 2.5 Pro)
OPENROUTER_API_KEY=sk-or-v1-你的密钥

# SiliconFlow (文生图)
SILICONFLOW_API_KEY=sk-你的密钥

# Doubao (SeeDream 4.0)
DOUBAO_API_KEY=你的密钥
```

#### 可选的环境变量

```env
# 小红书
XHS_COOKIE=你的cookie

# 微信公众号
WECHAT_API_KEY=你的密钥
WECHAT_API_SECRET=你的密钥
```

---

### 步骤 4: 数据库升级方案

**重要：** SQLite 不适合生产环境，需要升级到持久化数据库。

#### 方案 A: Vercel Postgres（推荐）

**优点：** 与 Vercel 无缝集成、自动备份
**成本：** $0.29/月起

1. 在 Vercel 项目中点击 **Storage** → **Create Database**
2. 选择 **Postgres**
3. Vercel 会自动配置 `DATABASE_URL`
4. 更新 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"  // 改为 postgresql
  url      = env("DATABASE_URL")
}
```

5. 运行迁移：

```bash
npx prisma migrate dev --name init
npx prisma generate
git add .
git commit -m "迁移到 PostgreSQL"
git push
```

#### 方案 B: Turso（免费方案更大）

**优点：** 免费额度更大（500个数据库，9GB存储）
**缺点：** 需要额外配置

1. 注册 [Turso 账号](https://turso.tech)
2. 创建数据库：

```bash
# 安装 Turso CLI
npm install -g @turso/cli

# 登录
turso auth login

# 创建数据库
turso db create content-factory

# 获取连接 URL
turso db show content-factory
```

3. 在 Vercel 添加环境变量：

```env
DATABASE_URL=libsql://你的数据库.turso.io
DATABASE_AUTH_TOKEN=你的认证token
```

4. 更新 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

---

### 步骤 5: 部署

1. 点击 **Deploy** 按钮
2. 等待构建完成（通常 2-3 分钟）
3. 部署成功后，Vercel 会分配一个域名：`https://your-project.vercel.app`

---

### 步骤 6: 初始化数据库

部署完成后，需要初始化数据库表结构：

```bash
# 本地连接到生产数据库
DATABASE_URL="你的生产数据库URL" npx prisma migrate deploy

# 或者在 Vercel 部署设置中添加构建命令
# Build Command: npm run build && npx prisma migrate deploy
```

---

## 云服务器部署（备选）

### 推荐服务商

| 服务商 | 配置 | 价格 | 适用场景 |
|--------|------|------|---------|
| **阿里云** | 2核4G | ¥100/月 | 国内用户多 |
| **腾讯云** | 2核4G | ¥100/月 | 国内用户多 |
| **AWS** | t2.medium | $30/月 | 国际化 |

---

### 部署步骤（以阿里云为例）

#### 1. 购买服务器

1. 访问 [阿里云ECS](https://www.aliyun.com/product/ecs)
2. 选择配置：
   - **CPU**: 2核
   - **内存**: 4GB
   - **硬盘**: 40GB SSD
   - **带宽**: 5Mbps
   - **系统**: Ubuntu 22.04 LTS

#### 2. 连接服务器

```bash
# 使用 SSH 连接（Windows 用户可以用 PuTTY）
ssh root@你的服务器IP
```

#### 3. 安装环境

```bash
# 更新系统
apt update && apt upgrade -y

# 安装 Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# 安装 Git
apt install -y git

# 安装 PM2（进程管理器）
npm install -g pm2

# 安装 Nginx（反向代理）
apt install -y nginx
```

#### 4. 克隆项目

```bash
# 创建项目目录
mkdir -p /var/www
cd /var/www

# 克隆仓库
git clone https://github.com/你的用户名/内容工厂.git
cd 内容工厂/content-factory

# 安装依赖
npm install

# 配置环境变量
nano .env
# 粘贴你的环境变量，按 Ctrl+X 保存
```

#### 5. 构建项目

```bash
# 生成 Prisma Client
npx prisma generate

# 初始化数据库
npx prisma migrate deploy

# 构建 Next.js
npm run build
```

#### 6. 启动服务

```bash
# 使用 PM2 启动
pm2 start npm --name "content-factory" -- start

# 设置开机自启
pm2 startup
pm2 save

# 查看状态
pm2 status
```

#### 7. 配置 Nginx 反向代理

```bash
# 创建配置文件
nano /etc/nginx/sites-available/content-factory
```

粘贴以下内容：

```nginx
server {
    listen 80;
    server_name 你的域名.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

启用配置：

```bash
# 创建软链接
ln -s /etc/nginx/sites-available/content-factory /etc/nginx/sites-enabled/

# 测试配置
nginx -t

# 重启 Nginx
systemctl restart nginx
```

#### 8. 配置 HTTPS（推荐）

```bash
# 安装 Certbot
apt install -y certbot python3-certbot-nginx

# 获取证书
certbot --nginx -d 你的域名.com

# 自动续期
certbot renew --dry-run
```

---

## 环境变量配置

### 完整的 .env 文件示例

```env
# ===========================================
# 数据库配置
# ===========================================
# 生产环境使用 PostgreSQL 或 Turso
DATABASE_URL="postgresql://user:password@host:5432/database"

# ===========================================
# AI 服务配置
# ===========================================
# OpenRouter (Gemini 2.5 Pro)
OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# SiliconFlow (文生图)
SILICONFLOW_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Doubao (SeeDream 4.0)
DOUBAO_API_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ===========================================
# 平台 API 配置（可选）
# ===========================================
# 小红书
XHS_COOKIE="web_session=xxxxxxxx; xsecappid=xhs-pc-web"

# 微信公众号
WECHAT_API_KEY="wxxxxxxxxxxxxxxxxx"
WECHAT_API_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ===========================================
# 其他配置
# ===========================================
# Next.js 配置
NODE_ENV="production"
NEXT_PUBLIC_API_URL="https://你的域名.com"
```

---

## 数据库配置

### PostgreSQL 连接示例

```bash
# Vercel Postgres
DATABASE_URL="postgres://default:xxxxx@ep-xxxxx.us-east-1.postgres.vercel-storage.com:5432/verceldb"

# 自建 PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/content_factory"
```

### Turso 连接示例

```bash
DATABASE_URL="libsql://content-factory-xxxxx.turso.io"
DATABASE_AUTH_TOKEN="eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9..."
```

---

## 域名绑定

### Vercel 绑定自定义域名

1. 在 Vercel 项目设置中，点击 **Domains**
2. 输入你的域名（例如：`app.yourdomain.com`）
3. 在你的域名注册商添加 DNS 记录：

```
类型: CNAME
名称: app
值: cname.vercel-dns.com
```

4. 等待 DNS 生效（通常 5-10 分钟）
5. Vercel 会自动配置 HTTPS

### 云服务器绑定域名

1. 在域名注册商添加 A 记录：

```
类型: A
名称: @
值: 你的服务器IP地址
```

2. 配置 Nginx（参考上面的 Nginx 配置）
3. 使用 Certbot 配置 HTTPS

---

## 上线后检查

### 1. 功能测试清单

- [ ] **首页加载**：访问网站，检查首页是否正常显示
- [ ] **数据概览**：Dashboard 数据是否正确
- [ ] **小红书搜索**：搜索功能是否正常
- [ ] **公众号搜索**：搜索功能是否正常
- [ ] **智能创作**：文案生成是否成功
- [ ] **图片生成**：文生图功能是否正常
- [ ] **小红书二创**：改写功能是否正常
- [ ] **发布管理**：草稿列表是否显示
- [ ] **历史记录**：已发布文章是否显示
- [ ] **数据统计**：统计数据是否准确

### 2. 性能监控

#### Vercel 自带监控

- 访问 Vercel Dashboard → Analytics
- 查看访问量、响应时间等指标

#### 自建监控（云服务器）

```bash
# 安装性能监控工具
pm2 install pm2-logrotate

# 查看日志
pm2 logs content-factory

# 查看资源使用
pm2 monit
```

### 3. 错误处理

#### 常见问题排查

1. **页面 500 错误**
   - 检查环境变量是否配置正确
   - 查看服务器日志：`pm2 logs` 或 Vercel Logs

2. **API 调用失败**
   - 检查 API Keys 是否有效
   - 检查 API 额度是否用完

3. **图片加载失败**
   - 检查图片代理是否正常
   - 检查 CORS 设置

4. **数据库连接失败**
   - 检查 `DATABASE_URL` 是否正确
   - 检查数据库服务是否运行

---

## 成本估算

### Vercel 方案（推荐新手）

| 项目 | 免费版 | Pro 版 |
|------|--------|--------|
| 月费 | $0 | $20/月 |
| 带宽 | 100GB | 1TB |
| 函数执行时间 | 10秒 | 60秒 |
| 团队成员 | 无限 | 无限 |
| **数据库** | Vercel Postgres | $0.29/月起 |
| **总成本** | **$0.29/月** | **$20.29/月** |

### 云服务器方案（推荐商业化）

| 项目 | 基础版 | 进阶版 |
|------|--------|--------|
| 服务器 | 2核4G | 4核8G |
| 月费 | ¥100 | ¥300 |
| 域名 | ¥50/年 | ¥50/年 |
| SSL证书 | 免费 | 免费 |
| **总成本** | **¥100/月** | **¥300/月** |

---

## 安全建议

### 1. 环境变量保护

- ✅ 不要将 `.env` 文件提交到 Git
- ✅ 使用 Vercel 或服务器的环境变量功能
- ✅ 定期轮换 API Keys

### 2. 访问控制

```typescript
// middleware.ts - 添加简单的密码保护
export function middleware(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const validPassword = process.env.ACCESS_PASSWORD;

  if (!authHeader || authHeader !== `Bearer ${validPassword}`) {
    return new Response('Unauthorized', { status: 401 });
  }
}
```

### 3. 数据备份

```bash
# PostgreSQL 备份
pg_dump $DATABASE_URL > backup.sql

# 定时备份（crontab）
0 2 * * * pg_dump $DATABASE_URL > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 维护和更新

### 自动部署流程

#### Vercel（自动）

```bash
# 只需推送到 GitHub
git add .
git commit -m "更新功能"
git push

# Vercel 会自动检测并部署
```

#### 云服务器（手动）

```bash
# SSH 连接服务器
ssh root@你的服务器IP

# 进入项目目录
cd /var/www/内容工厂/content-factory

# 拉取最新代码
git pull

# 安装依赖
npm install

# 重新构建
npm run build

# 重启服务
pm2 restart content-factory
```

---

## 技术支持

### 遇到问题？

1. **查看日志**
   - Vercel: 项目 → Logs
   - 服务器: `pm2 logs content-factory`

2. **社区支持**
   - GitHub Issues
   - Next.js 官方文档
   - Vercel 官方文档

3. **紧急回滚**
   - Vercel: Deployments → 选择上一个版本 → Promote to Production
   - 服务器: `git reset --hard HEAD~1 && npm run build && pm2 restart content-factory`

---

## 总结

### 推荐方案对比

| 场景 | 推荐方案 | 理由 |
|------|---------|------|
| **个人学习/小团队** | Vercel + Vercel Postgres | 简单、免费、免运维 |
| **商业化产品** | 云服务器 + PostgreSQL | 稳定、可控、无限制 |
| **技术团队** | Docker + Kubernetes | 灵活、可扩展 |

### 下一步

1. ✅ 选择部署方案
2. ✅ 配置环境变量
3. ✅ 升级数据库
4. ✅ 执行部署
5. ✅ 测试功能
6. ✅ 绑定域名
7. ✅ 监控运行

---

**祝部署顺利！🎉**
