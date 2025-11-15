# 紧急问题修复清单

## 问题汇总

1. ❌ **图片生成失败** - 图生图没有输出图片
2. ❌ **小红书文案和图片未分开** - 需要独立显示
3. ❌ **提示词设置无法保存** - 保存按钮不工作

---

## 问题1: 图片生成失败

### 原因分析

可能的原因:
1. apicore.ai API 返回格式与预期不符
2. 环境变量未生效(需要重启服务器)
3. API响应结构解析错误
4. 图生图逻辑中的错误处理

### 解决方案

#### 步骤1: 添加详细日志
修改 `src/lib/siliconflow.ts` 的 `imageToImage` 函数,添加完整的响应日志:

```typescript
// 在 line 279 之后添加
console.log('🔍 API完整响应:', JSON.stringify(data, null, 2));
```

#### 步骤2: 检查API响应格式
apicore.ai 可能返回的格式:
```json
// 格式1
{
  "data": [{ "url": "..." }]
}

// 格式2
{
  "images": [{ "url": "..." }]
}

// 格式3
{
  "url": "..."
}
```

#### 步骤3: 添加降级处理
修改响应解析逻辑,支持多种格式:

```typescript
// 5. 解析返回结果 (支持多种格式)
let imageUrl: string | undefined;

if (data.data && Array.isArray(data.data) && data.data.length > 0) {
  imageUrl = data.data[0].url;
} else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
  imageUrl = data.images[0].url;
} else if (data.url) {
  imageUrl = data.url;
}

if (!imageUrl) {
  console.error('❌ 无法解析图片URL,完整响应:', data);
  throw new Error("API返回格式不正确");
}

console.log(`✅ 图生图成功: ${imageUrl.slice(0, 60)}...`);
return imageUrl;
```

#### 步骤4: 确认环境变量
```bash
# 重启服务器
1. Ctrl+C 停止当前服务器
2. npm run dev
3. 检查启动日志是否显示加载了 APICORE_API_KEY
```

---

## 问题2: 小红书文案和图片分开

### 当前状态
已经实现了小红书格式的分离显示(在 ContentCreation.tsx lines 970-1094),但可能:
1. 条件判断错误
2. generatedImages 为空
3. 平台判断逻辑问题

### 解决方案

#### 检查平台判断逻辑
在 `ContentCreation.tsx` line 970 处,确认条件:

```typescript
{platform === "xiaohongshu" ? (
  // 小红书格式:分开显示
  <div>标题、文案、图片网格</div>
) : (
  // 公众号格式:富文本
  <div className="prose">...</div>
)}
```

#### 确认 generatedImages 是否有数据
添加调试日志(在 line 133 处):

```typescript
if (article.images) {
  try {
    const images = typeof article.images === 'string'
      ? JSON.parse(article.images)
      : article.images;
    const parsedImages = Array.isArray(images) ? images : [];
    console.log('📸 解析到的图片:', parsedImages);
    setGeneratedImages(parsedImages);
  } catch (e) {
    console.error('解析图片数组失败:', e);
    setGeneratedImages([]);
  }
}
```

#### 图片可能在哪里
检查以下位置:
1. `article.images` (JSON string)
2. `article.content` (富文本中的 img 标签)
3. 需要从content中提取图片URL

---

## 问题3: 提示词设置无法保存

### 原因分析

可能的原因:
1. 数据库字段不存在(迁移未执行)
2. API请求失败
3. 前端验证错误
4. 网络请求被阻止

### 解决方案

#### 步骤1: 检查数据库迁移
```bash
cd "d:\新建文件夹\claude code_内容工厂\content-factory"
npx prisma migrate status
```

如果迁移未应用:
```bash
npx prisma migrate deploy
# 或者
npx prisma db push
```

#### 步骤2: 检查浏览器控制台
打开浏览器F12,查看:
1. Network 标签页 - 查看 `/api/prompt-settings` 请求
2. Console 标签页 - 查看错误信息

#### 步骤3: 添加详细错误处理
修改 `Settings.tsx` 的 `handleSave` 函数:

```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    console.log('💾 正在保存设置:', settings);

    const response = await fetch('/api/prompt-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    console.log('📡 响应状态:', response.status);
    const data = await response.json();
    console.log('📡 响应数据:', data);

    if (data.success) {
      alert('设置保存成功!');
    } else {
      alert('保存失败: ' + (data.error || '未知错误'));
      console.error('保存失败详情:', data);
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存失败,请检查网络连接: ' + error.message);
  } finally {
    setSaving(false);
  }
};
```

#### 步骤4: 检查API路由
确认 `src/app/api/prompt-settings/route.ts` 的 POST 方法正常:

```bash
# 查看API日志
# 在浏览器中点击保存后,检查终端输出
```

---

## 快速修复脚本

### 1. 数据库修复
```bash
cd "d:\新建文件夹\claude code_内容工厂\content-factory"
npx prisma generate
npx prisma db push --accept-data-loss
```

### 2. 重启服务器
```bash
# 停止所有正在运行的服务器
taskkill /F /IM node.exe

# 重新启动
npm run dev
```

### 3. 清除浏览器缓存
```
F12 -> Application -> Clear Storage -> Clear site data
刷新页面 (Ctrl+Shift+R)
```

---

## 调试检查清单

### 图片生成问题
- [ ] 检查终端是否显示 "🎨 开始图生图 (apicore.ai)"
- [ ] 查看是否有 "📝 图生图参数" 日志
- [ ] 确认 APICORE_API_KEY 是否正确加载
- [ ] 查看 API 响应内容
- [ ] 检查降级策略是否触发(Unsplash/占位图)

### 小红书显示问题
- [ ] 确认 platform 变量是否为 "xiaohongshu"
- [ ] 检查 generatedImages 数组是否有数据
- [ ] 查看浏览器Elements标签,确认DOM结构
- [ ] 确认图片URL是否有效

### 设置保存问题
- [ ] 打开浏览器Network标签
- [ ] 点击"保存设置"按钮
- [ ] 查看 `/api/prompt-settings` 请求
- [ ] 检查请求payload
- [ ] 查看响应状态码和内容
- [ ] 检查数据库是否更新

---

## 需要执行的代码修改

### 文件1: src/lib/siliconflow.ts (line 279-288)

**当前代码:**
```typescript
const data = await response.json();

// 5. 解析返回结果
if (!data.data || data.data.length === 0) {
  throw new Error("API返回的图片列表为空");
}

const imageUrl = data.data[0].url;
console.log(`✅ 图生图成功: ${imageUrl.slice(0, 60)}...`);
return imageUrl;
```

**修改为:**
```typescript
const data = await response.json();
console.log('🔍 API完整响应:', JSON.stringify(data, null, 2));

// 5. 解析返回结果 (支持多种格式)
let imageUrl: string | undefined;

if (data.data && Array.isArray(data.data) && data.data.length > 0) {
  imageUrl = data.data[0].url;
} else if (data.images && Array.isArray(data.images) && data.images.length > 0) {
  imageUrl = data.images[0].url;
} else if (data.url) {
  imageUrl = data.url;
}

if (!imageUrl) {
  console.error('❌ 无法解析图片URL,完整响应:', data);
  throw new Error(`API返回格式不正确: ${JSON.stringify(data)}`);
}

console.log(`✅ 图生图成功: ${imageUrl.slice(0, 60)}...`);
return imageUrl;
```

### 文件2: src/components/pages/ContentCreation.tsx (line 133)

**当前代码:**
```typescript
if (article.images) {
  try {
    const images = typeof article.images === 'string'
      ? JSON.parse(article.images)
      : article.images;
    setGeneratedImages(Array.isArray(images) ? images : []);
  } catch (e) {
    console.error('解析图片数组失败:', e);
    setGeneratedImages([]);
  }
}
```

**修改为:**
```typescript
if (article.images) {
  try {
    const images = typeof article.images === 'string'
      ? JSON.parse(article.images)
      : article.images;
    const parsedImages = Array.isArray(images) ? images : [];
    console.log('📸 成功解析图片数组:', parsedImages.length, '张');
    console.log('📸 图片URLs:', parsedImages);
    setGeneratedImages(parsedImages);
  } catch (e) {
    console.error('❌ 解析图片数组失败:', e);
    setGeneratedImages([]);
  }
} else {
  console.warn('⚠️ article.images 为空');
  setGeneratedImages([]);
}
```

### 文件3: src/components/pages/Settings.tsx (line 55)

**当前代码:**
```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    const response = await fetch('/api/prompt-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    const data = await response.json();

    if (data.success) {
      alert('设置保存成功!');
    } else {
      alert('保存失败: ' + data.error);
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    alert('保存失败,请稍后重试');
  } finally {
    setSaving(false);
  }
};
```

**修改为:**
```typescript
const handleSave = async () => {
  setSaving(true);
  try {
    console.log('💾 正在保存设置:', settings);

    const response = await fetch('/api/prompt-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });

    console.log('📡 响应状态:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    console.log('📡 响应数据:', data);

    if (data.success) {
      alert('设置保存成功! ✅');
    } else {
      throw new Error(data.error || '未知错误');
    }
  } catch (error: any) {
    console.error('❌ 保存设置失败:', error);
    alert(`保存失败: ${error.message}\n请检查浏览器控制台获取详情`);
  } finally {
    setSaving(false);
  }
};
```

---

## 立即执行步骤

### 第1步: 修复数据库
```bash
cd "d:\新建文件夹\claude code_内容工厂\content-factory"
npx prisma db push
```

### 第2步: 重启服务器
```bash
# 停止当前服务器 (Ctrl+C)
npm run dev
```

### 第3步: 测试流程
1. 打开浏览器 http://localhost:3000
2. 打开F12控制台
3. 进入"创作设置"
4. 修改任意设置
5. 点击"保存设置"
6. 观察控制台输出

### 第4步: 测试图生图
1. 进入"选题洞察"
2. 搜索小红书文章
3. 点击"基于此文章创作"
4. 选择"保留原图,AI二创"
5. 观察控制台的图生图日志

---

## 紧急联系信息

如果以上方案都无效,请提供:
1. 浏览器控制台完整错误信息
2. 服务器终端完整日志
3. `/api/prompt-settings` 的Network请求详情
4. 图生图API的完整响应内容

我会根据这些信息给出更精确的解决方案。
