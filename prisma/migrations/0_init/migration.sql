-- CreateTable
CREATE TABLE "article_fetches" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "searchType" TEXT NOT NULL DEFAULT 'keyword',
    "articles" TEXT NOT NULL,
    "totalArticles" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_fetches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "wordCount" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT NOT NULL,
    "images" TEXT NOT NULL,
    "insightId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "creation_tasks" (
    "id" TEXT NOT NULL,
    "insightId" TEXT,
    "topicIndexes" TEXT NOT NULL,
    "length" TEXT NOT NULL,
    "style" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "imageStrategy" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "progressMessage" TEXT,
    "articleId" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "creation_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insights" (
    "id" TEXT NOT NULL,
    "fetchId" TEXT,
    "keyword" TEXT NOT NULL,
    "searchType" TEXT NOT NULL DEFAULT 'keyword',
    "totalArticles" INTEGER NOT NULL,
    "topLikedArticles" TEXT NOT NULL,
    "topInteractiveArticles" TEXT NOT NULL,
    "wordCloud" TEXT NOT NULL,
    "insights" TEXT NOT NULL,
    "articleSummaries" TEXT,
    "structuredInsights" TEXT,
    "analysisMetadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastViewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_settings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "textPrompt" TEXT NOT NULL DEFAULT '以专业但易懂的方式撰写，结合实际案例，语言自然流畅',
    "wechatTextPrompt" TEXT NOT NULL DEFAULT '以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。',
    "xiaohongshuTextPrompt" TEXT NOT NULL DEFAULT '以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。',
    "insightPrompt" TEXT NOT NULL DEFAULT '深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。',
    "imagePrompt" TEXT NOT NULL DEFAULT '扁平插画风格，配色温暖明亮，现代简约，专业质感',
    "imageStyle" TEXT NOT NULL DEFAULT 'modern-flat',
    "strength" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "imageAnalysisPrompt" TEXT NOT NULL DEFAULT '请仔细分析这张图片，并提供详细的描述和适合 Imagen 3 图片生成的英文提示词。请以 JSON 格式返回：{ "description": "图片描述", "suggestedPrompt": "英文提示词", "keyElements": ["元素列表"], "style": "风格", "mood": "氛围" }',
    "imageModel" TEXT NOT NULL DEFAULT 'gpt-4o-image',
    "imagePositivePrompt" TEXT NOT NULL DEFAULT '(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography, sharp focus, intricate details, cinematic lighting, vibrant colors, physically-based rendering',
    "imageNegativePrompt" TEXT NOT NULL DEFAULT '(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry, jpeg artifacts, noisy, watermark, text, signature, username, canvas frame, out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers',
    "denoisingStrength" DOUBLE PRECISION NOT NULL DEFAULT 0.35,
    "cfgScale" DOUBLE PRECISION NOT NULL DEFAULT 7.5,
    "samplerName" TEXT NOT NULL DEFAULT 'DPM++ 2M Karras',
    "steps" INTEGER NOT NULL DEFAULT 25,
    "seed" INTEGER NOT NULL DEFAULT -1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publishes" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "result" TEXT NOT NULL,
    "wechatAppid" TEXT,
    "articleType" TEXT,
    "publicationId" TEXT,
    "mediaId" TEXT,
    "author" TEXT,

    CONSTRAINT "publishes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "prompt_settings_userId_key" ON "prompt_settings"("userId");

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_insightId_fkey" FOREIGN KEY ("insightId") REFERENCES "insights"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insights" ADD CONSTRAINT "insights_fetchId_fkey" FOREIGN KEY ("fetchId") REFERENCES "article_fetches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publishes" ADD CONSTRAINT "publishes_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
