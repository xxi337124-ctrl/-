# 🚀 Vercel 部署操作指南

## 当前状态
- ✅ 代码已在本地提交
- ✅ GitHub 仓库：https://github.com/xxi337124-ctrl/-.git
- ✅ Vercel 配置文件已创建
- ✅ Prisma 已更新为 PostgreSQL
- ⏳ 等待代码推送到 GitHub

---

## 📋 完整部署流程

### 步骤 1：推送代码到 GitHub ⏳

由于网络问题，需要手动推送代码。有以下几种方式：

#### 方式 A：使用 GitHub Desktop（最简单）
1. 打开 GitHub Desktop
2. 找到仓库 "内容工厂"
3. 点击右上角 **"Push origin"** 按钮
4. 等待推送完成

#### 方式 B：使用命令行（需要稳定网络）
```bash
cd "D:\新建文件夹\claude code_内容工厂\content-factory"
git push origin master
```

#### 方式 C：使用代理
如果你有 VPN 或代理：
```bash
# 配置代理（替换为你的代理地址）
git config --global http.proxy http://127.0.0.1:7890
git config --global https.proxy http://127.0.0.1:7890

# 推送
git push origin master
```

---

### 步骤 2：注册 Vercel 账号并导入项目

#### 2.1 访问 Vercel 并登录
1. 打开浏览器，访问：https://vercel.com
2. 点击右上角 **"Sign Up"** 或 **"Login"**
3. 选择 **"Continue with GitHub"**
4. 授权 Vercel 访问你的 GitHub 账号

#### 2.2 导入项目
1. 登录后，点击 **"Add New..."** → **"Project"**
2. 在项目列表中找到 **"-"** 仓库（你的内容工厂项目）
3. 点击 **"Import"** 按钮

#### 2.3 配置项目（重要！）
在导入页面，你会看到配置界面：

**Framework Preset**: 自动识别为 Next.js（无需修改）

**Root Directory**: 选择 `content-factory`（如果有多个文件夹）

**Build and Output Settings**: 保持默认

**Environment Variables（环境变量）**: 点击展开，添加以下变量：

```
名称: OPENROUTER_API_KEY
值: sk-or-v1-你的OpenRouter密钥

名称: SILICONFLOW_API_KEY
值: sk-你的SiliconFlow密钥

名称: DOUBAO_API_KEY
值: 你的Doubao密钥
```

**可选变量（如果有）**:
```
名称: XHS_COOKIE
值: 你的小红书Cookie
```

#### 2.4 暂不部署
⚠️ **先不要点击 Deploy！** 我们需要先设置数据库。

点击 **"Cancel"** 或关闭配置页面，返回项目列表。

---

### 步骤 3：创建 Vercel Postgres 数据库

#### 3.1 进入项目
1. 在 Vercel Dashboard 中，找到刚才导入的项目
2. 点击项目名称进入项目详情

#### 3.2 创建数据库
1. 点击顶部菜单的 **"Storage"** 标签
2. 点击 **"Create Database"** 按钮
3. 选择 **"Postgres"**
4. 数据库名称：`content-factory-db`（可自定义）
5. 区域选择：**Hong Kong (hkg1)** 或 **Singapore (sin1)**（离中国近）
6. 点击 **"Create"** 按钮

#### 3.3 连接数据库到项目
1. 创建成功后，会提示连接到项目
2. 选择你的项目（内容工厂）
3. 点击 **"Connect"**
4. Vercel 会自动添加 `DATABASE_URL` 等环境变量

---

### 步骤 4：配置数据库迁移

#### 4.1 添加构建命令
1. 进入项目设置：**Settings** → **General**
2. 找到 **Build & Development Settings**
3. 点击 **"Override"** 开关
4. **Build Command** 输入：
   ```
   prisma generate && prisma migrate deploy && next build
   ```
5. 点击 **"Save"** 保存

---

### 步骤 5：触发部署

#### 5.1 重新部署
1. 点击顶部的 **"Deployments"** 标签
2. 点击右上角 **"Create Deployment"**
3. 或者直接点击项目首页的 **"Deploy"** 按钮

#### 5.2 监控部署进度
- 部署过程大约需要 2-3 分钟
- 你会看到：
  - ✅ Building...（构建中）
  - ✅ Running Prisma migrations...（数据库迁移）
  - ✅ Deploying...（部署中）
  - ✅ Ready（完成）

---

### 步骤 6：访问你的网站

部署成功后：

1. Vercel 会分配一个域名：`https://你的项目名.vercel.app`
2. 点击域名访问网站
3. 测试所有功能是否正常

---

## 🔍 部署后检查清单

访问你的网站后，请逐一测试：

- [ ] 首页能正常加载
- [ ] 数据概览页面显示正常（可能数据为空）
- [ ] 选题洞察 - 小红书搜索功能
- [ ] 选题洞察 - 公众号搜索功能
- [ ] 智能创作中心 - 文案生成
- [ ] 智能创作中心 - 图片生成
- [ ] 小红书二创功能
- [ ] 发布管理页面
- [ ] 历史记录页面

---

## ❌ 常见问题解决

### 问题 1：部署失败 - "Prisma migration failed"

**解决方案**:
1. 进入 **Settings** → **Environment Variables**
2. 确认 `DATABASE_URL` 已存在（由 Vercel Postgres 自动添加）
3. 如果没有，需要重新连接数据库

### 问题 2：页面 500 错误

**解决方案**:
1. 点击 **Deployments** → 最新部署 → **"Function Logs"**
2. 查看错误日志
3. 通常是环境变量配置错误

### 问题 3：API 调用失败

**解决方案**:
1. 检查 API Keys 是否正确配置
2. 确认 API Keys 有足够的额度
3. 查看浏览器控制台错误信息

### 问题 4：图片无法加载

**解决方案**:
- 图片需要时间生成，稍等片刻
- 刷新页面重试

---

## 🎯 环境变量完整清单

确保以下环境变量已配置（在 Settings → Environment Variables）：

### 必需变量
```
OPENROUTER_API_KEY = sk-or-v1-你的密钥
SILICONFLOW_API_KEY = sk-你的密钥
DOUBAO_API_KEY = 你的密钥
DATABASE_URL = (Vercel Postgres 自动添加)
POSTGRES_PRISMA_URL = (Vercel Postgres 自动添加)
POSTGRES_URL_NON_POOLING = (Vercel Postgres 自动添加)
```

### 可选变量
```
XHS_COOKIE = 你的小红书Cookie（用于搜索功能）
```

---

## 🔄 更新网站

以后要更新网站，只需：

1. 修改本地代码
2. 提交并推送到 GitHub：
   ```bash
   git add .
   git commit -m "更新说明"
   git push origin master
   ```
3. Vercel 会自动检测并重新部署（约 2 分钟）

---

## 💰 费用说明

### 免费额度
- Vercel: 免费
- 带宽: 100GB/月（够小团队用）
- 构建时长: 6000 分钟/月

### 数据库费用
- Vercel Postgres: $0.29/月起（约 ¥2/月）
- 包含：256 MB 存储，60 小时计算时间

### 超出免费额度后
- Pro 套餐: $20/月
- 但小团队使用免费版完全够用

---

## 🎉 完成！

按照以上步骤操作后，你的内容工厂就成功部署上线了！

**网站地址**: `https://你的项目名.vercel.app`

如果遇到任何问题，可以：
1. 查看 Vercel 的 Function Logs
2. 检查环境变量配置
3. 参考本文档的常见问题部分

祝部署顺利！🚀
