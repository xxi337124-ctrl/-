# 提示词设置增强 - 平台化和功能分离

## 修复时间
2025-11-10

## 用户需求

用户希望在创作设置中增加更多板块,实现:
1. **公众号和小红书的提示词分开** - 不同平台使用不同的文案风格
2. **洞察提示词独立设置** - 专门配置洞察分析的提示词
3. **根据用户使用的功能使用不同的提示词** - 智能选择对应的提示词输出给AI

## 解决方案

### 1. 数据库Schema扩展

**文件**: [prisma/schema.prisma:126-151](prisma/schema.prisma#L126-L151)

新增三个提示词字段:
```prisma
model PromptSettings {
  // 通用文字创作提示词(已废弃,保留兼容)
  textPrompt   String   @default("以专业但易懂的方式撰写，结合实际案例，语言自然流畅")

  // 公众号文字创作提示词
  wechatTextPrompt String @default("以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。")

  // 小红书文字创作提示词
  xiaohongshuTextPrompt String @default("以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。")

  // 洞察分析提示词
  insightPrompt String @default("深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。")
}
```

### 2. UI设计 - 标签页式布局

**文件**: [src/components/pages/Settings.tsx](src/components/pages/Settings.tsx)

#### 标签导航 (lines 121-165)
```typescript
<div className="flex gap-2 border-b border-gray-200 pb-4">
  <button onClick={() => setActiveTab('wechat')}>📱 公众号文案</button>
  <button onClick={() => setActiveTab('xiaohongshu')}>📕 小红书文案</button>
  <button onClick={() => setActiveTab('insight')}>🔍 洞察分析</button>
  <button onClick={() => setActiveTab('image')}>🎨 图片生成</button>
</div>
```

#### 公众号文案设置 (lines 168-194)
- **背景色**: green-50 (公众号品牌色)
- **功能**: 配置公众号文章的写作风格
- **特点**:
  - 专业正式
  - 结构清晰,段落分明
  - 适合深度阅读
  - 使用数据和案例支撑观点

#### 小红书文案设置 (lines 196-223)
- **背景色**: red-50 (小红书品牌色)
- **功能**: 配置小红书笔记的写作风格
- **特点**:
  - 轻松活泼
  - 多用表情符号和网络用语
  - 句子简短有力
  - 强调实用性和分享价值

#### 洞察分析设置 (lines 225-252)
- **背景色**: indigo-50
- **功能**: 配置洞察分析的提示词
- **特点**:
  - 深入分析文章主题和趋势
  - 提炼核心观点和用户关注点
  - 识别用户痛点和真实需求
  - 提供3-5个实操价值的选题建议

#### 图片生成设置 (lines 254-309)
- **背景色**: purple-50
- **功能**: 配置图生图的风格和强度
- **特点**:
  - 风格提示词
  - 重绘强度滑块 (0-1)
  - 详细的强度说明

### 3. API路由更新

**文件**: [src/app/api/prompt-settings/route.ts:40-91](src/app/api/prompt-settings/route.ts#L40-L91)

#### POST请求处理
```typescript
export async function POST(request: NextRequest) {
  const {
    textPrompt,
    wechatTextPrompt,
    xiaohongshuTextPrompt,
    insightPrompt,
    imagePrompt,
    imageStyle,
    strength
  } = body;

  const settings = await prisma.promptSettings.upsert({
    where: { userId: 'default' },
    update: {
      textPrompt,
      wechatTextPrompt,
      xiaohongshuTextPrompt,
      insightPrompt,
      imagePrompt,
      imageStyle,
      strength,
    },
    create: {
      // 所有字段都有默认值
    }
  });
}
```

### 4. 内容创作API集成

**文件**: [src/app/api/content-creation/route.ts:13-82](src/app/api/content-creation/route.ts#L13-L82)

#### 智能选择提示词 (lines 24-82)
```typescript
async function generateArticle(...) {
  // 获取用户的提示词设置
  const promptSettings = await prisma.promptSettings.findUnique({
    where: { userId: 'default' }
  });

  // 根据风格智能选择提示词
  let customTextPrompt = '';
  if (style === 'xiaohongshu' || style === 'casual') {
    customTextPrompt = promptSettings?.xiaohongshuTextPrompt || '默认小红书风格...';
  } else if (style === 'wechat' || style === 'professional') {
    customTextPrompt = promptSettings?.wechatTextPrompt || '默认公众号风格...';
  } else {
    // 兼容旧的textPrompt字段
    customTextPrompt = promptSettings?.textPrompt || '默认通用风格...';
  }

  // 将自定义提示词注入systemPrompt
  const result = await openaiClient.generateJSON(prompt, {
    systemPrompt: `你是一位真人内容创作者...

用户自定义风格指南:
${customTextPrompt}

请严格按照JSON格式返回...`,
  });
}
```

### 5. 洞察分析API集成

**文件**: [src/app/api/topic-analysis/insights/route.ts:57-114](src/app/api/topic-analysis/insights/route.ts#L57-L114)

#### 使用洞察提示词 (lines 63-68)
```typescript
async function generateStructuredInsights(...) {
  // 获取用户的洞察提示词设置
  const promptSettings = await prisma.promptSettings.findUnique({
    where: { userId: 'default' }
  });

  const insightPrompt = promptSettings?.insightPrompt || '默认洞察提示词...';

  const result = await openRouterClient.generateJSON(
    prompt,
    {
      systemPrompt: `你是专业的内容洞察分析师。

分析要求：
${insightPrompt}

返回3个JSON选题,简洁直接,避免套话。`,
    }
  );
}
```

## 功能特性

### ✅ 平台化提示词
- **公众号**: 专业正式,深度长文
- **小红书**: 轻松活泼,短小精悍
- **通用**: 保留兼容性,支持旧版本

### ✅ 功能化提示词
- **洞察分析**: 专门用于分析文章和生成选题建议
- **图片生成**: 控制图生图的风格和强度

### ✅ 智能选择机制
```
用户选择平台 → 系统自动加载对应提示词 → AI使用该提示词生成内容
```

### ✅ UI/UX优化
- 标签页式布局,清晰分类
- 每个标签有独立的配色方案
- 提供详细的使用建议和示例
- 实时预览提示词效果

## 使用流程

### 公众号内容创作
1. 打开"创作设置" → "📱 公众号文案"
2. 编辑提示词(例如: "以专业正式的方式撰写...")
3. 点击"保存设置"
4. 在创作页面选择"公众号"平台
5. 系统自动使用公众号提示词生成内容

### 小红书内容创作
1. 打开"创作设置" → "📕 小红书文案"
2. 编辑提示词(例如: "以轻松活泼的方式撰写...")
3. 点击"保存设置"
4. 在创作页面选择"小红书"平台
5. 系统自动使用小红书提示词生成内容

### 洞察分析
1. 打开"创作设置" → "🔍 洞察分析"
2. 编辑提示词(例如: "深入分析文章主题...")
3. 点击"保存设置"
4. 在选题洞察页面点击"生成洞察"
5. 系统使用洞察提示词进行分析

## 技术实现

### 1. 提示词注入机制
```typescript
// 在生成内容时注入自定义提示词
systemPrompt: `
基础规则:
- 像人一样写作
- 避免AI套话
- 自然流畅

用户自定义风格指南:
${customTextPrompt}  // 这里注入用户配置的提示词

输出格式:
JSON格式返回
`
```

### 2. 兼容性处理
```typescript
// 优先使用新字段,兼容旧字段
customTextPrompt = promptSettings?.xiaohongshuTextPrompt
  || promptSettings?.textPrompt  // 兼容旧版本
  || '默认提示词';  // 最终降级
```

### 3. 数据库迁移
```bash
# 迁移名称: 20251110085202_add_platform_prompts
# 新增字段: wechatTextPrompt, xiaohongshuTextPrompt, insightPrompt
npx prisma migrate dev --name add-platform-prompts
```

## 界面设计

### 色彩方案

| 提示词类型 | 背景色 | 边框色 | 图标 | 用途 |
|-----------|--------|--------|------|------|
| 公众号 | green-50 | green-500 | 📱 | 突出公众号品牌 |
| 小红书 | red-50 | red-500 | 📕 | 突出小红书品牌 |
| 洞察分析 | indigo-50 | indigo-500 | 🔍 | 专业分析感 |
| 图片生成 | purple-50 | purple-500 | 🎨 | 创意视觉感 |

### 交互设计

1. **标签切换**: 点击标签,切换不同的提示词编辑区
2. **实时保存**: 点击"保存设置"按钮,立即保存到数据库
3. **使用提示**: 每个标签页都有详细的使用建议
4. **示例说明**: 提供placeholder示例帮助用户理解

## 使用提示

### 公众号文案建议
- 语言专业正式,适合职场和知识分享
- 结构清晰,分段明确,利于长文阅读
- 使用数据和案例支撑观点
- 适当使用小标题划分层次
- 语言严谨但不失亲和力

### 小红书文案建议
- 语言轻松活泼,多用表情符号
- 句子简短有力,适合快速浏览
- 强调实用性和分享价值
- 使用网络热词,贴近年轻群体
- 多用"！"和emoji增加感染力

### 洞察分析建议
- 深入分析文章主题和热点趋势
- 提炼核心观点和用户关注点
- 识别用户痛点和真实需求
- 提供3-5个具有实操价值的选题建议
- 每个建议包含目标受众、内容角度和推荐标题

### 图片风格建议
- 扁平插画: 适合科技、商务类内容
- 手绘风格: 适合生活、情感类内容
- 极简主义: 适合品质、高端类内容
- 色彩丰富: 适合活泼、年轻类内容
- 重绘强度建议从0.5开始调整

## 文件修改

### 修改的文件
1. [prisma/schema.prisma](prisma/schema.prisma) - 添加新提示词字段
2. [src/components/pages/Settings.tsx](src/components/pages/Settings.tsx) - UI完全重构
3. [src/app/api/prompt-settings/route.ts](src/app/api/prompt-settings/route.ts) - API支持新字段
4. [src/app/api/content-creation/route.ts](src/app/api/content-creation/route.ts) - 智能选择提示词
5. [src/app/api/topic-analysis/insights/route.ts](src/app/api/topic-analysis/insights/route.ts) - 使用洞察提示词

### 未修改的文件
- 其他API路由保持不变
- 前端其他页面保持不变
- 数据库其他表结构保持不变

## 测试清单

- [x] 数据库迁移成功
- [x] Settings页面UI显示正常
- [x] 标签切换功能正常
- [x] 保存设置功能正常
- [x] 加载设置功能正常
- [x] API支持新字段
- [ ] 公众号创作使用正确提示词
- [ ] 小红书创作使用正确提示词
- [ ] 洞察分析使用正确提示词
- [ ] 向后兼容性测试

## 效果对比

### 修改前
```
所有平台使用统一的textPrompt
无法区分公众号和小红书的风格差异
洞察分析使用硬编码的提示词
```

### 修改后
```
公众号: 使用wechatTextPrompt,专业正式
小红书: 使用xiaohongshuTextPrompt,轻松活泼
洞察分析: 使用insightPrompt,深度分析
图片生成: 保持独立配置
```

## 用户价值

1. **更精准的风格控制**: 不同平台使用不同的文案风格,提高内容质量
2. **更灵活的配置**: 用户可以自定义每个功能的提示词
3. **更好的用户体验**: 清晰的标签式布局,易于理解和操作
4. **更智能的系统**: 自动根据平台选择对应的提示词

---

**功能状态**: ✅ 已完成
**测试状态**: ⚠️ 部分测试待完成
**文档状态**: ✅ 已更新
