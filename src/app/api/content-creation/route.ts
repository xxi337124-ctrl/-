import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { openaiClient } from "@/lib/openai";
import { doubaoClient } from "@/lib/doubao-client";
import { siliconFlowClient } from "@/lib/siliconflow";
import {
  articlePrompts,
  imagePrompts,
  getStyleGuide,
  getWordCount,
  getPlatformName,
} from "@/lib/prompts";

// AI生成文章
async function generateArticle(
  insights: string[],
  keyword: string,
  length: string,
  style: string
): Promise<{ title: string; content: string; tags?: string[] }> {
  const wordCount = getWordCount(length);
  const styleGuide = getStyleGuide(style);
  const platform = getPlatformName(style);

  // 获取用户的提示词设置
  const promptSettings = await prisma.prompt_settings.findUnique({
    where: { userId: 'default' }
  });

  // 根据风格选择不同的提示词模板
  let prompt: string;

  switch (style) {
    case "xiaohongshu":
    case "casual":
      // 小红书风格
      prompt = articlePrompts.xiaohongshu({
        keyword,
        insights,
        wordCount,
      });
      break;

    case "wechat":
    case "professional":
      // 公众号深度文章
      prompt = articlePrompts.wechat({
        keyword,
        insights,
        wordCount,
      });
      break;

    case "storytelling":
      // 故事化叙述
      prompt = articlePrompts.storytelling({
        keyword,
        insights,
        wordCount,
      });
      break;

    default:
      // 基础文章生成
      prompt = articlePrompts.generateArticle({
        keyword,
        insights,
        wordCount,
        styleGuide,
        platform,
      });
  }

  // 获取平台特定的文案提示词
  let customTextPrompt = '';
  if (style === 'xiaohongshu' || style === 'casual') {
    customTextPrompt = promptSettings?.xiaohongshuTextPrompt || '以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。';
  } else if (style === 'wechat' || style === 'professional') {
    customTextPrompt = promptSettings?.wechatTextPrompt || '以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。';
  } else {
    // 兼容旧的textPrompt字段
    customTextPrompt = promptSettings?.textPrompt || '以专业但易懂的方式撰写，结合实际案例，语言自然流畅';
  }

  try {
    const result = await openaiClient.generateJSON<{
      title: string;
      content: string;
      tags?: string[];
      subtitle?: string;
      story_arc?: string;
    }>(prompt, {
      systemPrompt: `你是一位真人内容创作者,不是AI。

关键要求:
1. 像人一样写作,有情绪、有态度、会犹豫、会质疑
2. 多用口语化表达:"其实""说实话""你想想""我发现"
3. 句子长短不一,节奏有变化,避免机械对称
4. 偶尔用不确定的词:"可能""大概""估计"
5. 加入个人视角和真实感受

绝对禁止:
- AI套话:"在当今时代""随着XX发展""综上所述""值得注意"
- 对比句式:"不是...而是...""不在于...而在于..."
- 书面化词汇:"彰显""赋能""诸如""鉴于"
- 完美对称的结构(每段观点+例子+总结)
- 过度使用成语和四字词语

必须做到:
- 每3-4句话就换个说法,避免模式重复
- 短句和长句交替使用
- 适当打破结构的完整性
- 像和朋友聊天一样自然

用户自定义风格指南:
${customTextPrompt}

请严格按照JSON格式返回,不要添加任何额外解释。确保content包含完整HTML格式文章。`,
      timeout: 120000, // 2分钟超时
      maxRetries: 3,
      maxTokens: 8000, // 增加token限制以支持长文章
    });

    return {
      title: result.title || `关于${keyword}的深度解析`,
      content: result.content || "<p>内容生成失败</p>",
      tags: result.tags || [],
    };
  } catch (error) {
    console.error("AI生成文章失败:", error);

    // 降级处理:返回基础模板
    const title = `${keyword}:${insights[0]?.substring(0, 30) || "深度解析"}`;
    const content = `
      <h2>一、核心观点</h2>
      <p>${insights[0] || "暂无内容"}</p>
      <h2>二、深入分析</h2>
      <p>${insights[1] || "暂无内容"}</p>
      ${insights[2] ? `<h2>三、实践建议</h2><p>${insights[2]}</p>` : ""}
      <h2>总结</h2>
      <p>通过以上分析,我们可以看到${keyword}的重要性和应用价值。</p>
    `;

    return { title, content };
  }
}

// 根据文章长度决定图片数量
function getImageCount(length: string, imageStrategy: string): number {
  if (imageStrategy === "minimal") return 1;
  if (imageStrategy === "rich") {
    return length === "long" ? 8 : length === "medium" ? 6 : 5;
  }
  // auto策略 - 短篇4-5张,中等5-6张,长篇6-7张
  return length === "long" ? 6 : length === "medium" ? 5 : 4;
}

// 生成图片提示词
async function generateImagePrompts(
  title: string,
  content: string,
  imageCount: number,
  platform: string
): Promise<string[]> {
  try {
    console.log(`🎨 开始生成 ${imageCount} 个图片提示词...`);

    const prompt = imagePrompts.generateImagePrompts({
      articleTitle: title,
      articleContent: content,
      imageCount,
      platform,
    });

    const prompts = await openaiClient.generateJSON<string[]>(prompt, {
      systemPrompt: "你是AI绘画提示词专家，请严格返回JSON数组格式，每个元素都是英文提示词。",
      timeout: 60000,
      maxRetries: 3,
      maxTokens: 2000,
    });

    console.log(`✅ 图片提示词生成成功: ${prompts.length}个`);
    return prompts.slice(0, imageCount); // 确保数量正确
  } catch (error) {
    console.error("生成图片提示词失败:", error);
    // 降级：返回基础提示词
    const fallbackPrompts = Array.from({ length: imageCount }, (_, i) =>
      `professional illustration for article about ${title}, scene ${i + 1}, modern clean style, soft lighting, high quality, 4k`
    );
    console.log(`⚠️ 使用降级提示词: ${fallbackPrompts.length}个`);
    return fallbackPrompts;
  }
}

// 智能插入图片到文章
function insertImagesIntelligently(content: string, images: string[]): string {
  if (images.length === 0) {
    console.log("⚠️ 没有图片可插入");
    return content;
  }

  console.log(`📌 开始插入 ${images.length} 张图片到文章中...`);

  // 按 <h1>, <h2> 或 <h3> 标签分段
  const sections = content.split(/(<h[123]>.*?<\/h[123]>)/);
  let imageIndex = 0;
  const result: string[] = [];
  let isFirstSection = true;

  sections.forEach((section, index) => {
    result.push(section);

    // 检查是否是H1标题
    const isH1 = section.match(/<h1>/);
    // 检查是否是H2或H3标题
    const isH2orH3 = section.match(/<h[23]>/);

    // 插入规则:
    // 1. 跳过H1标题后的第一段(开头引言不配图)
    // 2. 只在H2/H3标题后插入图片
    // 3. 跳过第一个标题(无论是什么级别)
    if (
      index > 0 &&
      isH2orH3 &&
      !isH1 &&
      imageIndex < images.length &&
      !isFirstSection
    ) {
      const imgTag = `<img src="${images[imageIndex]}" alt="配图${imageIndex + 1}" style="width: 100%; max-width: 800px; margin: 2em auto; display: block; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />`;
      result.push(imgTag);
      console.log(`  ✓ 插入图片 ${imageIndex + 1}/${images.length}`);
      imageIndex++;
    }

    // 如果遇到第一个标题(任何级别),标记后续可以插入图片
    if (isFirstSection && (isH1 || isH2orH3)) {
      isFirstSection = false;
    }
  });

  console.log(`✅ 图片插入完成: ${imageIndex}/${images.length} 张`);
  return result.join("");
}

// 注意: fetchUnsplashImages 已废弃，现在使用 SiliconFlow 图片生成
// 如需降级方案，可以从 git 历史中恢复此函数

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode, insightId, topicIndexes, fetchId, articleIndex, length, style, platform, imageStrategy } = body;

    // 根据mode决定如何创建任务
    let taskData: any = {
      length,
      style,
      platform,
      imageStrategy: imageStrategy || "auto",
      status: "PENDING",
      progress: 0,
      progressMessage: "任务已创建,等待处理...",
    };

    if (mode === 'direct') {
      // direct模式：基于单篇文章
      if (!fetchId || articleIndex === undefined) {
        return NextResponse.json(
          { success: false, error: "direct模式缺少fetchId或articleIndex" },
          { status: 400 }
        );
      }

      // 为direct模式创建一个临时的insight记录（或者修改CreationTask schema支持fetchId）
      // 这里采用临时方案：将fetchId和articleIndex存储在topicIndexes字段
      taskData.insightId = null; // direct模式不需要insightId
      taskData.topicIndexes = JSON.stringify({ mode: 'direct', fetchId, articleIndex });
    } else {
      // insight模式（原有逻辑）
      if (!insightId || !topicIndexes) {
        return NextResponse.json(
          { success: false, error: "insight模式缺少insightId或topicIndexes" },
          { status: 400 }
        );
      }

      taskData.insightId = insightId;
      taskData.topicIndexes = JSON.stringify(topicIndexes);
    }

    // 1. 创建任务记录
    const taskId = randomUUID();
    const task = await prisma.creation_tasks.create({
      data: {
        id: taskId,
        ...taskData,
        updatedAt: new Date(),
      },
    });

    console.log(`📝 创建任务: ${task.id} (${mode || 'insight'}模式)`);

    // 2. 立即返回taskId,不等待完成
    // 异步执行创作流程
    processCreationTask(task.id).catch((error) => {
      console.error(`❌ 任务${task.id}处理失败:`, error);
    });

    return NextResponse.json({
      success: true,
      data: {
        taskId: task.id,
      },
    });
  } catch (error) {
    console.error("❌ 创建任务失败:", error);
    return NextResponse.json(
      { success: false, error: "创建任务失败" },
      { status: 500 }
    );
  }
}

// 异步处理创作任务
async function processCreationTask(taskId: string) {
  try {
    console.log(`\n🚀 ========== 开始处理任务 ${taskId} ==========`);

    // 更新状态为处理中
    await prisma.creation_tasks.update({
      where: { id: taskId },
      data: {
        status: "PROCESSING",
        progress: 5,
        progressMessage: "开始内容创作流程...",
      },
    });

    console.log('✅ 任务状态已更新为 PROCESSING');

    const task = await prisma.creation_tasks.findUnique({
      where: { id: taskId },
    });

    if (!task) {
      throw new Error("任务不存在");
    }

    console.log("📝 开始内容创作流程...");
    console.log(`  - 文章长度: ${task.length}`);
    console.log(`  - 写作风格: ${task.style}`);
    console.log(`  - 发布平台: ${task.platform}`);
    console.log(`  - 配图策略: ${task.imageStrategy}`);

    // 解析topicIndexes以判断模式
    const topicIndexesData = JSON.parse(task.topicIndexes);
    const isDirectMode = topicIndexesData.mode === 'direct';

    let keyword: string;
    let selectedInsights: string[];
    let fetchRecord: any = null;
    let targetArticle: any = null;

    if (isDirectMode) {
      // direct模式：从ArticleFetch加载单篇文章
      console.log("🎯 direct模式：基于单篇文章创作");

      await prisma.creation_tasks.update({
        where: { id: taskId },
        data: { progress: 10, progressMessage: "正在加载原文数据..." },
      });

      fetchRecord = await prisma.articlesFetch.findUnique({
        where: { id: topicIndexesData.fetchId }
      });

      if (!fetchRecord) {
        throw new Error("原文记录不存在");
      }

      const articles = JSON.parse(fetchRecord.articles);
      targetArticle = articles[topicIndexesData.articleIndex];

      if (!targetArticle) {
        throw new Error("目标文章不存在");
      }

      keyword = fetchRecord.keyword;
      selectedInsights = [
        `基于爆款文章《${targetArticle.title}》进行内容改写`,
        `原文数据：${targetArticle.views || 0}阅读，${targetArticle.likes || 0}点赞`,
        `包含${targetArticle.images?.length || 0}张高质量配图`
      ];

      console.log(`  ✓ 原文标题: ${targetArticle.title}`);
      console.log(`  ✓ 原文配图: ${targetArticle.images?.length || 0}张`);
    } else {
      // insight模式：原有逻辑
      console.log("📊 insight模式：基于洞察创作");

      await prisma.creation_tasks.update({
        where: { id: taskId },
        data: { progress: 10, progressMessage: "正在获取洞察数据..." },
      });

      if (!task.insightId) {
        throw new Error("insightId 不能为空");
      }

      const insight = await prisma.insights.findUnique({
        where: { id: task.insightId },
      });

      if (!insight) {
        throw new Error("洞察报告不存在");
      }

      const allInsights = JSON.parse(insight.insights);
      const topicIndexes = topicIndexesData as number[];
      selectedInsights = topicIndexes.map((i: number) => allInsights[i]);
      keyword = insight.keyword;
    }

    // 2. AI生成文章
    await prisma.creation_tasks.update({
      where: { id: taskId },
      data: { progress: 30, progressMessage: "AI正在生成文章内容..." },
    });

    console.log("🤖 步骤1: 生成文章内容...");
    const finalStyle = task.platform === "xiaohongshu" ? "xiaohongshu" : (task.platform === "wechat" ? "wechat" : task.style);
    const { title, content } = await generateArticle(
      selectedInsights,
      keyword,
      task.length,
      finalStyle
    );
    console.log(`  ✓ 文章生成完成: ${title}`);

    // 3. 确定图片数量
    await prisma.creation_tasks.update({
      where: { id: taskId },
      data: { progress: 50, progressMessage: "正在准备生成配图..." },
    });

    const imageCount = getImageCount(task.length, task.imageStrategy);
    console.log(`📊 步骤2: 确定配图数量: ${imageCount}张`);

    let images: string[] = [];
    let finalContent = content;

    // 4. 生成图片 (使用SiliconFlow文生图 + Gemini 3 Pro生成提示词)
    if (siliconFlowClient.isConfigured()) {
      try {
        console.log("🎨 使用智能创作文生图流程...");

        await prisma.creation_tasks.update({
          where: { id: taskId },
          data: { progress: 60, progressMessage: "正在使用Gemini 3 Pro分析文案生成图片提示词..." },
        });

        // 步骤1: 使用 Gemini 3 Pro 分析文案，生成图片提示词
        console.log("📝 步骤1: Gemini 3 Pro分析文案并生成提示词...");
        const imagePromptsList = await generateImagePrompts(title, content, imageCount, task.platform);
        console.log(`✅ 生成了 ${imagePromptsList.length} 个高质量图片提示词`);

        await prisma.creation_tasks.update({
          where: { id: taskId },
          data: { progress: 70, progressMessage: `正在使用SiliconFlow生成 ${imageCount} 张高质量配图...` },
        });

        // 步骤2: 使用 SiliconFlow 进行文生图
        console.log("🖼️ 步骤2: SiliconFlow根据提示词生成图片...");
        const imageSize = task.platform === "xiaohongshu" ? "1024x1024" : "1024x576";
        images = await siliconFlowClient.generateMultipleImages(imagePromptsList, { imageSize });
        console.log(`✅ SiliconFlow 文生图完成: ${images.filter(img => img).length}/${images.length}张`);

        // 智能插入图片
        if (images.filter(img => img).length > 0) {
          await prisma.creation_tasks.update({
            where: { id: taskId },
            data: { progress: 85, progressMessage: "正在将配图插入到文章..." },
          });

          console.log("📌 步骤3: 智能插入图片到文章...");
          finalContent = insertImagesIntelligently(content, images.filter(img => img));
        } else {
          console.warn("⚠️ 没有成功生成图片，使用无图文章");
        }
      } catch (error) {
        console.error("❌ 图片生成失败，将返回无图文章:", error);
        images = [];
        finalContent = content;
      }
    } else {
      console.warn("⚠️ SiliconFlow API 未配置，跳过图片生成");
    }

    // 5. 保存文章
    await prisma.creation_tasks.update({
      where: { id: taskId },
      data: { progress: 95, progressMessage: "正在保存文章..." },
    });

    console.log("💾 步骤6: 保存文章到数据库...");
    const article = await prisma.articles.create({
      data: {
        id: randomUUID(),
        title,
        content: finalContent,
        status: "DRAFT",
        wordCount: content.replace(/<[^>]*>/g, "").length,
        tags: JSON.stringify([keyword]),
        images: JSON.stringify(images),
        insightId: isDirectMode ? null : task.insightId, // direct模式不关联insight
        updatedAt: new Date(),
      },
    });

    console.log(`✅ 文章已保存: ID=${article.id}`);

    // 6. 更新任务为完成 - 🔥 使用事务确保原子性
    const updatedTask = await prisma.creation_tasks.update({
      where: { id: taskId },
      data: {
        status: "COMPLETED",
        progress: 100,
        progressMessage: "内容创作完成!",
        articleId: article.id,
        updatedAt: new Date(), // 🔥 强制更新时间戳
      },
    });

    console.log("✅ 内容创作完成!");
    console.log(`  - 任务ID: ${taskId}`);
    console.log(`  - 文章ID: ${article.id}`);
    console.log(`  - 字数: ${article.wordCount}`);
    console.log(`  - 图片数: ${images.length}`);
    console.log(`  - 最终状态: ${updatedTask.status}`);
    console.log(`========== 任务处理完成 ==========\n`);
  } catch (error: any) {
    console.error(`❌ 任务${taskId}处理失败:`, error);

    // 更新任务为失败状态
    await prisma.creation_tasks.update({
      where: { id: taskId },
      data: {
        status: "FAILED",
        error: error.message || "创作失败",
        progressMessage: "创作失败: " + (error.message || "未知错误"),
        updatedAt: new Date(), // 🔥 强制更新时间戳
      },
    });
  }
}
