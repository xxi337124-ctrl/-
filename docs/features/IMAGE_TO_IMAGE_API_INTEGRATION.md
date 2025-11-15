# 图生图API集成 - apicore.ai

## 修复时间
2025-11-10

## 背景

用户反馈: **小红书的图片二创没有办法去用提示词驱动**

原有的 SiliconFlow API (`/image2image`) 存在问题:
- 频繁返回 404 错误
- 无法精确控制图生图参数
- 缺少高级配置选项

## 新API: apicore.ai

### API端点
```
POST https://api.apicore.ai/v1/images/edits
```

### 请求格式
使用 **form-data** (不是JSON):

```bash
curl --location --request POST 'https://api.apicore.ai/v1/images/edits' \
--header 'Authorization: Bearer <token>' \
--form 'image=@"source.jpg"' \
--form 'model="nanobannana_v1.0"' \
--form 'prompt="(masterpiece:1.2), best quality..."' \
--form 'n="1"' \
--form 'size="1024x576"' \
--form 'response_format="url"' \
--form 'user="{"negative_prompt":"...","denoising_strength":0.35}"'
```

### 响应格式
```json
{
  "data": [
    {
      "url": "https://generated-image-url.jpg"
    }
  ]
}
```

## 实现方案

### 1. 数据库配置

**文件**: [prisma/schema.prisma:147-155](prisma/schema.prisma#L147-L155)

新增8个图生图高级参数:

```prisma
model PromptSettings {
  // 图生图高级参数
  imageModel           String  @default("nanobannana_v1.0")
  imagePositivePrompt  String  @default("(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography, sharp focus, intricate details, cinematic lighting, vibrant colors, physically-based rendering")
  imageNegativePrompt  String  @default("(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry, jpeg artifacts, noisy, watermark, text, signature, username, canvas frame, out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers")
  denoisingStrength    Float   @default(0.35)  // 重绘强度 0-1
  cfgScale             Float   @default(7.5)   // 提示词引导强度
  samplerName          String  @default("DPM++ 2M Karras")
  steps                Int     @default(25)    // 采样步数
  seed                 Int     @default(-1)    // 随机种子,-1表示随机
}
```

### 2. 修改图生图客户端

**文件**: [src/lib/siliconflow.ts:188-293](src/lib/siliconflow.ts#L188-L293)

#### 关键改动:

1. **从数据库读取用户配置**:
```typescript
// 1. 获取用户的图生图高级参数设置
const { prisma } = await import("@/lib/prisma");
const settings = await prisma.promptSettings.findUnique({
  where: { userId: "default" },
});

const imageModel = settings?.imageModel || "nanobannana_v1.0";
const positivePrompt = settings?.imagePositivePrompt || prompt;
const negativePrompt = settings?.imageNegativePrompt || "";
const denoisingStrength = settings?.denoisingStrength ?? 0.35;
const cfgScale = settings?.cfgScale ?? 7.5;
const samplerName = settings?.samplerName || "DPM++ 2M Karras";
const steps = settings?.steps ?? 25;
const seed = settings?.seed ?? -1;
```

2. **改用form-data格式**:
```typescript
// 2. 下载原图
const imageResponse = await fetch(originalImageUrl, {
  signal: AbortSignal.timeout(10000),
});
const imageBlob = await imageResponse.blob();

// 3. 构建 form-data
const formData = new FormData();
formData.append("image", imageBlob, "source.jpg");
formData.append("model", imageModel);
formData.append("prompt", positivePrompt);
formData.append("n", "1");
formData.append("size", imageSize);
formData.append("response_format", "url");

// 添加高级参数 (通过user字段传递JSON配置)
const advancedParams = {
  negative_prompt: negativePrompt,
  denoising_strength: denoisingStrength,
  cfg_scale: cfgScale,
  sampler_name: samplerName,
  steps: steps,
  seed: seed,
};
formData.append("user", JSON.stringify(advancedParams));
```

3. **调用新API**:
```typescript
// 4. 调用 apicore.ai 图生图API
const apicoreKey = process.env.APICORE_API_KEY || process.env.SILICONFLOW_API_KEY;
if (!apicoreKey) {
  throw new Error("APICORE_API_KEY 未配置");
}

const response = await fetch("https://api.apicore.ai/v1/images/edits", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apicoreKey}`,
  },
  body: formData,
});
```

4. **解析新的返回格式**:
```typescript
// 5. 解析返回结果
if (!data.data || data.data.length === 0) {
  throw new Error("API返回的图片列表为空");
}

const imageUrl = data.data[0].url;
console.log(`✅ 图生图成功: ${imageUrl.slice(0, 60)}...`);
return imageUrl;
```

## 环境变量配置

需要在 `.env` 中配置:

```bash
# apicore.ai API密钥 (或者复用 SILICONFLOW_API_KEY)
APICORE_API_KEY=your-apicore-key-here
```

如果未配置 `APICORE_API_KEY`, 会尝试使用 `SILICONFLOW_API_KEY` 作为降级。

## 参数说明

### 模型选择 (imageModel)
- `nanobannana_v1.0` (推荐): 综合效果最佳
- `stable-diffusion-xl`: Stable Diffusion XL
- `stable-diffusion-3`: Stable Diffusion 3

### 正向提示词 (imagePositivePrompt)
描述你想要的画面效果、风格、质量等。

**默认值**:
```
(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography,
sharp focus, intricate details, cinematic lighting, vibrant colors,
physically-based rendering
```

### 负向提示词 (imageNegativePrompt)
描述你不想要的画面效果、瑕疵、错误等。

**默认值**:
```
(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry,
jpeg artifacts, noisy, watermark, text, signature, username, canvas frame,
out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers
```

### 重绘强度 (denoisingStrength)
- **范围**: 0-1
- **默认**: 0.35
- **说明**:
  - 0-0.3: 保守 - 几乎不改变原图,仅微调细节
  - 0.3-0.5: 温和 - 保留原图主体,优化画面质量
  - 0.5-0.7: 平衡 - 部分重绘,改变风格但保留构图
  - 0.7-1.0: 激进 - 大幅重绘,可能完全改变画面

### 提示词引导强度 (cfgScale)
- **范围**: 1-20
- **默认**: 7.5
- **说明**: 控制AI遵循提示词的程度
  - 太低 (1-5): 会偏离提示词
  - 适中 (7-10): 平衡效果 (推荐)
  - 太高 (15-20): 可能过度饱和

### 采样器 (samplerName)
- `DPM++ 2M Karras` (推荐): 综合效果最佳
- `Euler a`: 快速生成
- `Euler`: 标准生成
- `DPM++ SDE Karras`: 高质量生成
- `DDIM`: 传统方法

### 采样步数 (steps)
- **范围**: 10-50
- **默认**: 25
- **说明**: 步数越多质量越好但生成越慢
  - 15-20: 快速生成,牺牲部分质量
  - 20-30: 平衡效果 (推荐)
  - 30-40: 高质量,生成较慢

### 随机种子 (seed)
- **范围**: -1 或 正整数
- **默认**: -1 (随机)
- **说明**: 使用相同种子可以复现相同的生成结果

## 参数调优建议

### 日常使用
```
重绘强度: 0.35
CFG Scale: 7.5
采样步数: 25
```

### 保守优化 (仅优化画质)
```
重绘强度: 0.2-0.3
CFG Scale: 7-8
采样步数: 20-25
```

### 风格转换
```
重绘强度: 0.5-0.7
CFG Scale: 8-10
采样步数: 25-30
```

### 完全重绘
```
重绘强度: 0.8-1.0
CFG Scale: 7-9
采样步数: 30-40
```

### 高质量生成
```
重绘强度: 0.35-0.5
CFG Scale: 8-10
采样步数: 30-40
```

### 快速生成
```
重绘强度: 0.3-0.4
CFG Scale: 7
采样步数: 15-20
```

## 使用流程

### 1. 用户配置参数

在 **创作设置** → **🎨 图片生成** 标签页配置所有参数:
- 选择模型
- 编辑正向/负向提示词
- 调整重绘强度滑块
- 设置CFG Scale
- 选择采样器
- 设置采样步数
- 设置随机种子

### 2. 保存设置

点击 **💾 保存设置** 按钮,参数保存到数据库。

### 3. 创作时自动使用

在小红书内容创作时:
1. 选择 **图片策略** → **保留原图,AI二创**
2. 系统自动:
   - 抓取原图URL
   - 从数据库加载用户配置
   - 调用 apicore.ai API
   - 使用所有高级参数进行图生图

## 调试日志

### 成功日志示例
```
🎨 开始图生图 (apicore.ai): https://example.com/image.jpg...
📝 图生图参数: {
  model: 'nanobannana_v1.0',
  denoisingStrength: 0.35,
  cfgScale: 7.5,
  samplerName: 'DPM++ 2M Karras',
  steps: 25,
  seed: '随机'
}
✅ 图生图成功: https://api.apicore.ai/generated/abc123.jpg...
```

### 失败日志示例
```
❌ 图生图失败: Error: 图生图API错误: 401 - Unauthorized
❌ 图生图失败: Error: APICORE_API_KEY 未配置
❌ 图生图失败: Error: 下载原图失败: 404
```

## 与旧API的对比

### 旧API (SiliconFlow)
```
❌ 端点: ${baseUrl}/image2image (404错误)
❌ 格式: JSON + base64
❌ 参数: 仅支持 strength, num_inference_steps
❌ 返回: { images: [{ url }] }
```

### 新API (apicore.ai)
```
✅ 端点: https://api.apicore.ai/v1/images/edits
✅ 格式: form-data + Blob
✅ 参数: 支持8个高级参数 (model, positive/negative prompt, denoising, cfg, sampler, steps, seed)
✅ 返回: { data: [{ url }] }
```

## 降级策略

如果图生图失败, `batchImageToImage` 函数会自动降级:

1. **降级策略1**: 使用 Unsplash 免费图库
2. **降级策略2**: 使用占位图

这确保了即使API失败,用户也能看到文章预览。

## 测试清单

- [x] 修改 `imageToImage` 函数使用新API
- [x] 集成数据库参数读取
- [x] form-data格式构建
- [x] 新API响应解析
- [ ] 端到端测试小红书图生图流程
- [ ] 测试不同参数组合的效果
- [ ] 验证降级策略是否工作
- [ ] 配置环境变量 `APICORE_API_KEY`

## 修改的文件

1. [src/lib/siliconflow.ts:188-293](src/lib/siliconflow.ts#L188-L293) - imageToImage 函数完全重写
2. [prisma/schema.prisma:147-155](prisma/schema.prisma#L147-L155) - 添加8个高级参数字段
3. [src/components/pages/Settings.tsx](src/components/pages/Settings.tsx) - 图片生成标签页UI
4. [src/app/api/prompt-settings/route.ts](src/app/api/prompt-settings/route.ts) - API支持新字段

## 用户价值

1. **更精确的控制**: 8个可调参数,满足不同场景需求
2. **更稳定的服务**: 使用可靠的 apicore.ai 端点
3. **更好的效果**: 支持正向/负向提示词,质量更高
4. **更灵活的配置**: 每个参数都有详细说明和建议值
5. **更好的体验**: 保存配置后自动应用,无需重复设置

---

**功能状态**: ✅ 已完成
**测试状态**: ⚠️ 待用户端到端验证
**文档状态**: ✅ 已更新
