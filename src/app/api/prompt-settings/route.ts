import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/prompt-settings
 * 获取用户的提示词设置
 */
export async function GET() {
  try {
    let settings = await prisma.prompt_settings.findUnique({
      where: { userId: 'default' }
    });

    // 如果不存在，创建默认设置
    if (!settings) {
      settings = await prisma.prompt_settings.create({
        data: {
          userId: 'default',
          textPrompt: '以专业但易懂的方式撰写，结合实际案例，语言自然流畅',
          wechatTextPrompt: '以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。',
          xiaohongshuTextPrompt: '以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。',
          insightPrompt: '深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。',
          imagePrompt: '扁平插画风格，配色温暖明亮，现代简约，专业质感',
          imageStyle: 'modern-flat',
          strength: 0.5,
          imageAnalysisPrompt: '请仔细分析这张图片，并提供详细的描述和适合 Imagen 3 图片生成的英文提示词。请以 JSON 格式返回：{ "description": "图片描述", "suggestedPrompt": "英文提示词", "keyElements": ["元素列表"], "style": "风格", "mood": "氛围" }',
          imageModel: 'gpt-4o-image',
          imagePositivePrompt: '(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography, sharp focus, intricate details, cinematic lighting, vibrant colors, physically-based rendering',
          imageNegativePrompt: '(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry, jpeg artifacts, noisy, watermark, text, signature, username, canvas frame, out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers',
          denoisingStrength: 0.35,
          cfgScale: 7.5,
          samplerName: 'DPM++ 2M Karras',
          steps: 25,
          seed: -1,
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取提示词设置失败:', error);
    return NextResponse.json(
      { success: false, error: '获取失败' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompt-settings
 * 更新用户的提示词设置
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      textPrompt,
      wechatTextPrompt,
      xiaohongshuTextPrompt,
      insightPrompt,
      imagePrompt,
      imageStyle,
      strength,
      // 图片分析提示词
      imageAnalysisPrompt,
      // 新的图生图高级参数
      imageModel,
      imagePositivePrompt,
      imageNegativePrompt,
      denoisingStrength,
      cfgScale,
      samplerName,
      steps,
      seed,
    } = body;

    const settings = await prisma.prompt_settings.upsert({
      where: { userId: 'default' },
      update: {
        textPrompt,
        wechatTextPrompt,
        xiaohongshuTextPrompt,
        insightPrompt,
        imagePrompt,
        imageStyle,
        strength,
        imageAnalysisPrompt,
        imageModel,
        imagePositivePrompt,
        imageNegativePrompt,
        denoisingStrength,
        cfgScale,
        samplerName,
        steps,
        seed,
      },
      create: {
        userId: 'default',
        textPrompt: textPrompt || '以专业但易懂的方式撰写，结合实际案例，语言自然流畅',
        wechatTextPrompt: wechatTextPrompt || '以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。',
        xiaohongshuTextPrompt: xiaohongshuTextPrompt || '以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。',
        insightPrompt: insightPrompt || '深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。',
        imagePrompt: imagePrompt || '扁平插画风格，配色温暖明亮，现代简约，专业质感',
        imageStyle: imageStyle || 'modern-flat',
        strength: strength !== undefined ? strength : 0.5,
        imageAnalysisPrompt: imageAnalysisPrompt || '请仔细分析这张图片，并提供详细的描述和适合 Imagen 3 图片生成的英文提示词。请以 JSON 格式返回：{ "description": "图片描述", "suggestedPrompt": "英文提示词", "keyElements": ["元素列表"], "style": "风格", "mood": "氛围" }',
        imageModel: imageModel || 'gpt-4o-image',
        imagePositivePrompt: imagePositivePrompt || '(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography, sharp focus, intricate details, cinematic lighting, vibrant colors, physically-based rendering',
        imageNegativePrompt: imageNegativePrompt || '(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry, jpeg artifacts, noisy, watermark, text, signature, username, canvas frame, out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers',
        denoisingStrength: denoisingStrength !== undefined ? denoisingStrength : 0.35,
        cfgScale: cfgScale !== undefined ? cfgScale : 7.5,
        samplerName: samplerName || 'DPM++ 2M Karras',
        steps: steps !== undefined ? steps : 25,
        seed: seed !== undefined ? seed : -1,
      }
    });

    return NextResponse.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('保存提示词设置失败:', error);
    return NextResponse.json(
      { success: false, error: '保存失败' },
      { status: 500 }
    );
  }
}
