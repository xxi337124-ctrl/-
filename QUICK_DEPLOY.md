# 🚀 快速部署指南（5分钟上线）

## 最简单的部署方式：Vercel（推荐）

### 为什么选择 Vercel？
- ✅ **完全免费**（小团队够用）
- ✅ **3分钟部署**
- ✅ **自动HTTPS**
- ✅ **自动更新**（Git push 即部署）
- ✅ **零运维**

---

## 第一步：准备工作（1分钟）

### 1. 确保代码已推送到 GitHub

```bash
git add .
git commit -m "准备部署"
git push origin main
```

### 2. 准备 API Keys

你需要这些密钥（复制保存好）：

```
OpenRouter API Key: sk-or-v1-xxxxxxxxxxxx
SiliconFlow API Key: sk-xxxxxxxxxxxx
Doubao API Key: xxxxxxxxxxxx
```

---

## 第二步：在 Vercel 部署（2分钟）

### 1. 导入项目

1. 访问 [vercel.com](https://vercel.com)
2. 用 GitHub 登录
3. 点击 "Add New Project"
4. 选择你的仓库
5. 点击 "Import"

### 2. 配置环境变量

在 "Environment Variables" 部分添加：

```env
OPENROUTER_API_KEY=sk-or-v1-你的密钥
SILICONFLOW_API_KEY=sk-你的密钥
DOUBAO_API_KEY=你的密钥
```

### 3. 点击 Deploy

等待 2-3 分钟，完成！

---

## 第三步：升级数据库（2分钟）

**重要：** 默认使用 SQLite，每次部署会清空。需要升级到持久化数据库。

### 推荐：Vercel Postgres

1. 在 Vercel 项目中，点击 **Storage** → **Create Database**
2. 选择 **Postgres**
3. 点击 **Create**
4. Vercel 会自动添加 `DATABASE_URL` 环境变量

### 更新代码以支持 PostgreSQL

1. 修改 `prisma/schema.prisma`：

```prisma
datasource db {
  provider = "postgresql"  // 从 sqlite 改为 postgresql
  url      = env("DATABASE_URL")
}
```

2. 推送代码：

```bash
git add .
git commit -m "升级到 PostgreSQL"
git push
```

3. Vercel 会自动重新部署

---

## 第四步：初始化数据库

在 Vercel 项目设置中：

1. 进入 **Settings** → **General** → **Build & Development Settings**
2. 在 **Build Command** 中输入：

```bash
npm run build && npx prisma migrate deploy
```

3. 点击 **Save**
4. 在 **Deployments** 中点击最新部署的 "Redeploy"

---

## 完成！🎉

你的网站已经上线了！

- 访问地址：`https://你的项目名.vercel.app`
- 自定义域名：在 Vercel 项目设置 → Domains 添加

---

## 常见问题

### Q1: 数据库连接失败？

**解决：** 确保已经创建 Vercel Postgres 并更新了 `schema.prisma`

### Q2: API 调用失败？

**解决：** 检查环境变量是否正确配置，确保 API Keys 有效

### Q3: 图片无法显示？

**解决：** 图片代理可能需要时间加载，稍等片刻或刷新页面

### Q4: 如何更新网站？

**答：** 只需推送代码到 GitHub：

```bash
git add .
git commit -m "更新功能"
git push
```

Vercel 会自动检测并部署新版本！

---

## 成本

- **Vercel**: 免费
- **Vercel Postgres**: $0.29/月起
- **总计**: **约 ¥2/月**（比一杯咖啡还便宜！）

---

## 下一步

✅ 测试所有功能
✅ 绑定自定义域名
✅ 邀请朋友使用

详细部署指南请查看 [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
