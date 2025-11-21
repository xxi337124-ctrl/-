import { NextRequest, NextResponse } from "next/server";
import { openaiClient } from "@/lib/openai";

/**
 * 小红书二创API
 * 对小红书笔记进行文案改写 + 图片重绘
 *
 * 流程:
 * 1. 文案改写: 使用 Gemini 3 Pro + xiaohongshuTextPrompt
 * 2. 图片分析: 使用 Gemini 3 Pro + imageAnalysisPrompt 分析原图
 * 3. 图片生成: 使用豆包 SeeDream 4.0 根据提示词生成新图
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { noteId, title, content, images = [] } = body;

    if (!title || !content) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数: title 和 content' },
        { status: 400 }
      );
    }

    console.log(`🎨 开始小红书二创: ${title}`);
    console.log(`  - 原始文案长度: ${content.length}字`);
    console.log(`  - 原始图片数量: ${images.length}张`);

    // 1. 加载提示词设置
    const prompts = await loadPrompts();

    // 2. 先改写文案
    const rewrittenText = await rewriteText(title, content, prompts.xiaohongshuTextPrompt);

    // 3. 等待8秒后再处理图片（避免API频率限制）
    console.log('⏳ 等待8秒后开始处理图片，避免触发API频率限制...');
    await new Promise(resolve => setTimeout(resolve, 8000));

    // 4. 处理图片
    const recreatedImages = await recreateImages(images, prompts.imageAnalysisPrompt);

    console.log(`✅ 小红书二创完成`);
    console.log(`  - 新文案长度: ${rewrittenText.length}字`);
    console.log(`  - 新图片数量: ${recreatedImages.length}张`);

    return NextResponse.json({
      success: true,
      data: {
        noteId,
        originalTitle: title,
        originalContent: content,
        originalImages: images,
        rewrittenText,
        recreatedImages,
        metadata: {
          textLength: rewrittenText.length,
          imageCount: recreatedImages.length,
          createdAt: new Date().toISOString(),
        }
      }
    });

  } catch (error: any) {
    console.error('❌ 小红书二创失败:', error);
    return NextResponse.json(
      { success: false, error: error.message || '二创失败' },
      { status: 500 }
    );
  }
}

/**
 * 加载提示词设置
 * 直接使用默认提示词（数据库settings表可能不存在）
 */
async function loadPrompts() {
  console.log('📝 使用默认提示词');
  return {
    xiaohongshuTextPrompt: DEFAULT_TEXT_PROMPT,
    imageAnalysisPrompt: DEFAULT_IMAGE_ANALYSIS_PROMPT,
  };
}

/**
 * 文案改写
 * 使用 Gemini 3 Pro 进行文案改写
 */
async function rewriteText(title: string, content: string, systemPrompt: string): Promise<string> {
  console.log('✍️  开始文案改写...');

  const userPrompt = `原标题: ${title}

原文案:
${content}

---

请根据上述小红书笔记内容，进行二创改写。`;

  const result = await openaiClient.chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  console.log('✅ 文案改写完成');
  return result.content.trim();
}

/**
 * 图片重绘
 * 1. 使用 Gemini 分析原图片
 * 2. 使用豆包 SeeDream 4.0 生成新图片
 */
async function recreateImages(imageUrls: string[], analysisPrompt: string): Promise<Array<{
  originalUrl: string;
  newUrl: string;
  analysis: any;
}>> {
  if (!imageUrls || imageUrls.length === 0) {
    console.log('⚠️  无图片需要重绘');
    return [];
  }

  console.log(`🖼️  开始处理 ${imageUrls.length} 张图片...`);
  console.log(`⚠️  为避免API频率限制，每张图片处理间隔15秒（免费API限制每分钟20次）`);

  const results = [];

  for (let i = 0; i < imageUrls.length; i++) { // 处理所有图片
    const imageUrl = imageUrls[i];
    console.log(`  处理第 ${i + 1}/${imageUrls.length} 张图片...`);

    try {
      // 添加延迟避免速率限制（第2张开始等待15秒）
      if (i > 0) {
        console.log(`    ⏳ 等待15秒避免频率限制...`);
        await new Promise(resolve => setTimeout(resolve, 15000));
      }

      // 1. 使用 Gemini 分析图片
      const analysis = await analyzeImage(imageUrl, analysisPrompt);

      // 2. 使用豆包生成新图片，确保基于原图重绘
      const prompt =
        (analysis && typeof analysis === "object" && analysis.suggestedPrompt)
          ? `${analysis.suggestedPrompt}. Keep the core composition/style of the reference image.`
          : "Recreate this Xiaohongshu photo using the same subject, palette, and framing as the reference image.";
      const newImageUrl = await generateImage(imageUrl, prompt);

      results.push({
        originalUrl: imageUrl,
        newUrl: newImageUrl,
        analysis,
      });

      console.log(`  ✅ 第 ${i + 1} 张图片处理完成`);
    } catch (error) {
      console.error(`  ❌ 第 ${i + 1} 张图片处理失败:`, error);
      // 失败时仍然返回原图
      results.push({
        originalUrl: imageUrl,
        newUrl: imageUrl, // 使用原图
        analysis: null,
      });
    }
  }

  console.log(`✅ 所有图片处理完成，共 ${results.length} 张`);
  return results;
}

/**
 * 使用 Gemini 分析图片
 */
async function analyzeImage(imageUrl: string, systemPrompt: string): Promise<any> {
  console.log('    🔍 分析图片中...');

  const userPrompt = `请分析这张图片，并返回 JSON 格式的结果。

图片URL: ${imageUrl}

请务必返回以下格式的 JSON:
{
  "description": "图片的详细描述(中文)",
  "suggestedPrompt": "适合用于图片生成的英文提示词",
  "keyElements": ["关键元素列表"],
  "style": "图片风格",
  "mood": "图片氛围"
}`;

  const result = await openaiClient.chat([
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ]);

  const response = result.content;

  try {
    // 尝试解析 JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // 如果没有找到 JSON，返回默认结构
    return {
      description: response,
      suggestedPrompt: "A beautiful image with vibrant colors and aesthetic composition",
      keyElements: ["image"],
      style: "modern",
      mood: "positive"
    };
  } catch (error) {
    console.warn('    ⚠️ JSON 解析失败，使用默认值');
    return {
      description: response,
      suggestedPrompt: "A beautiful image with vibrant colors and aesthetic composition",
      keyElements: ["image"],
      style: "modern",
      mood: "positive"
    };
  }
}

/**
 * 使用豆包 SeeDream 4.0 生成图片
 */
async function generateImage(referenceImageUrl: string, prompt: string): Promise<string> {
  console.log('    🎨 生成新图片中...');

  const { doubaoClient } = await import('@/lib/doubao-client');

  if (!doubaoClient.isConfigured()) {
    console.warn('    ⚠️ DOUBAO_API_KEY 未配置，返回原图');
    return referenceImageUrl;
  }

  try {
    const newImageUrl = await doubaoClient.generateImage(prompt, referenceImageUrl, {
      maxRetries: 3,
      size: '1024x1024',
      n: 1,
    });

    console.log('    ✅ 图片生成成功');
    return newImageUrl;
  } catch (error: any) {
    console.error('    ❌ 图片生成失败:', error.message);
    // 失败时返回原图
    return referenceImageUrl;
  }
}

// 默认提示词
const DEFAULT_TEXT_PROMPT = `你是一位专业的小红书内容创作者。请将用户提供的内容改写成小红书风格的文案。

要求:
1. 保持轻松活泼的语气，多使用emoji表情
2. 标题要有吸引力，可以使用"｜"、"！"等符号
3. 内容要有结构性，使用序号、空行等增强可读性
4. 保留核心观点，但用更生动的表达方式
5. 适当添加互动性的提问或引导
6. 长度控制在300-800字之间

请直接返回改写后的文案，不要有任何其他说明。`;

const DEFAULT_IMAGE_ANALYSIS_PROMPT = `你是一位专业的图片分析专家。请仔细分析用户提供的图片，并提供详细的描述和适合图片生成的英文提示词。

请以 JSON 格式返回:
{
  "description": "图片的详细描述(中文)",
  "suggestedPrompt": "适合用于图片生成的详细英文提示词",
  "keyElements": ["关键元素1", "关键元素2", ...],
  "style": "图片的整体风格(如：现代、复古、简约等)",
  "mood": "图片传递的氛围(如：温馨、活力、宁静等)"
}

注意:
1. suggestedPrompt 要详细，包含主体、风格、色彩、构图等要素
2. 用英文描述，适合传递给图片生成模型
3. 保持JSON格式的完整性和准确性`;
