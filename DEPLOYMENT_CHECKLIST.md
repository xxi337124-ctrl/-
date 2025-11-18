# ✅ Vercel 部署检查清单

使用这个清单确保每一步都完成了！

---

## 📦 准备阶段

- [x] **代码已提交到本地 Git**
  - 提交信息：添加 Vercel 部署配置和详细操作指南
  - 包含文件：vercel.json, .env.example, VERCEL_DEPLOY_STEPS.md

- [ ] **代码已推送到 GitHub**
  - 仓库地址：https://github.com/xxi337124-ctrl/-.git
  - 分支：master
  - 👉 **下一步：推送代码到 GitHub**

---

## 🚀 部署步骤（按顺序完成）

### 步骤 1：推送代码 ⏳
- [ ] 打开 GitHub Desktop
- [ ] 找到仓库 "内容工厂" 或 "-"
- [ ] 点击 "Push origin" 按钮
- [ ] 等待推送完成
- [ ] ✅ 确认：GitHub 网页上能看到最新提交

---

### 步骤 2：Vercel 注册和登录 ⏳
- [ ] 访问 https://vercel.com
- [ ] 点击 "Sign Up" 或 "Login"
- [ ] 选择 "Continue with GitHub"
- [ ] 授权 Vercel 访问 GitHub
- [ ] ✅ 确认：成功登录到 Vercel Dashboard

---

### 步骤 3：导入项目 ⏳
- [ ] 点击 "Add New..." → "Project"
- [ ] 找到 "-" 仓库（内容工厂项目）
- [ ] 点击 "Import"
- [ ] **暂时不要点击 Deploy！**
- [ ] ✅ 确认：进入项目配置页面

---

### 步骤 4：配置环境变量（重要）⏳

点击 "Environment Variables"，添加以下变量：

#### 必需变量（3个）
- [ ] **OPENROUTER_API_KEY**
  - 值：`sk-or-v1-你的OpenRouter密钥`
  - 从哪里获取：https://openrouter.ai/keys

- [ ] **SILICONFLOW_API_KEY**
  - 值：`sk-你的SiliconFlow密钥`
  - 从哪里获取：https://cloud.siliconflow.cn/account/ak

- [ ] **DOUBAO_API_KEY**
  - 值：`你的Doubao密钥`
  - 从哪里获取：https://console.volcengine.com/ark

#### 可选变量
- [ ] **XHS_COOKIE**（如果你有小红书账号）
  - 值：`web_session=xxx; xsecappid=xhs-pc-web`
  - 如何获取：浏览器登录小红书 → F12 → Application → Cookies

- [ ] ✅ 确认：所有必需变量已添加

**⚠️ 添加完变量后，先不要点击 Deploy！返回项目列表。**

---

### 步骤 5：创建数据库 ⏳
- [ ] 在 Vercel 项目页面，点击项目名称进入详情
- [ ] 点击顶部 "Storage" 标签
- [ ] 点击 "Create Database"
- [ ] 选择 "Postgres"
- [ ] 数据库名称：`content-factory-db`
- [ ] 区域：Hong Kong (hkg1) 或 Singapore (sin1)
- [ ] 点击 "Create"
- [ ] 选择连接到你的项目
- [ ] 点击 "Connect"
- [ ] ✅ 确认：DATABASE_URL 已自动添加到环境变量

---

### 步骤 6：配置构建命令 ⏳
- [ ] 进入 "Settings" → "General"
- [ ] 找到 "Build & Development Settings"
- [ ] 点击 "Override" 开关
- [ ] 在 "Build Command" 输入：
  ```
  prisma generate && prisma migrate deploy && next build
  ```
- [ ] 点击 "Save"
- [ ] ✅ 确认：构建命令已保存

---

### 步骤 7：开始部署 ⏳
- [ ] 点击顶部 "Deployments" 标签
- [ ] 点击 "Create Deployment" 或 "Redeploy"
- [ ] 等待部署完成（约 2-3 分钟）
- [ ] 观察部署日志：
  - Building... ✅
  - Running Prisma migrations... ✅
  - Deploying... ✅
  - Ready ✅
- [ ] ✅ 确认：看到绿色的 "Ready" 状态

---

### 步骤 8：访问网站 ⏳
- [ ] 点击部署成功后显示的域名链接
- [ ] 或访问：`https://你的项目名.vercel.app`
- [ ] ✅ 确认：网站能正常打开

---

## 🧪 功能测试

访问网站后，测试所有功能：

### 基础功能
- [ ] 首页（Dashboard）正常加载
- [ ] 导航菜单能正常切换页面
- [ ] 没有明显的错误提示

### 选题洞察
- [ ] 能打开"选题洞察"页面
- [ ] 小红书搜索功能（输入关键词如"AI工具"）
- [ ] 搜索结果能正常显示
- [ ] 能生成选题洞察报告

### 智能创作
- [ ] 能打开"智能创作中心"
- [ ] 输入创作主题
- [ ] 文案生成功能正常
- [ ] 图片生成功能正常（可能需要等待）

### 小红书二创
- [ ] 能打开"小红书二创"页面
- [ ] 能提取文章内容
- [ ] 改写功能正常

### 发布管理
- [ ] 能打开"发布管理"页面
- [ ] 能看到已生成的文章
- [ ] 文章状态显示正确

### 历史记录
- [ ] 能打开"历史记录"页面
- [ ] 已发布的文章显示正常

---

## ❌ 问题排查

如果遇到问题：

### 问题 1：部署失败
- [ ] 检查 Vercel Deployments 页面的错误日志
- [ ] 确认环境变量配置正确
- [ ] 确认数据库已创建并连接

### 问题 2：页面 500 错误
- [ ] 点击 Deployments → 最新部署 → "View Function Logs"
- [ ] 查看具体错误信息
- [ ] 检查 DATABASE_URL 是否存在

### 问题 3：API 调用失败
- [ ] 打开浏览器控制台（F12）
- [ ] 查看 Console 和 Network 标签的错误
- [ ] 检查 API Keys 是否正确

### 问题 4：图片生成失败
- [ ] 确认 SILICONFLOW_API_KEY 配置正确
- [ ] 检查 SiliconFlow 账户额度
- [ ] 等待片刻后重试

---

## 🎯 完成标志

全部完成后，你应该：

- ✅ 有一个可访问的网站地址：`https://你的项目名.vercel.app`
- ✅ 所有核心功能都能正常使用
- ✅ 数据能正常保存和读取
- ✅ AI 功能（文案生成、图片生成）正常工作

---

## 📝 下一步

### 可选优化
- [ ] 绑定自定义域名
- [ ] 设置访问密码保护
- [ ] 配置自动备份
- [ ] 监控使用数据

### 日常使用
- 分享网站链接给朋友
- 收集使用反馈
- 根据需求迭代功能

---

## 💡 提示

**如果你卡在某一步：**
1. 查看 VERCEL_DEPLOY_STEPS.md 的详细说明
2. 查看 Vercel 的错误日志
3. 检查环境变量配置

**成本提醒：**
- Vercel: 免费
- Vercel Postgres: $0.29/月（约 ¥2/月）
- 总计：约 ¥2/月

---

**祝部署顺利！🎉**

完成后记得在这个文件中打勾 ✅ 标记进度！
