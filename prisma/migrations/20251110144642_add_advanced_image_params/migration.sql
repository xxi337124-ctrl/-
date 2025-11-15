-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_prompt_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "textPrompt" TEXT NOT NULL DEFAULT '以专业但易懂的方式撰写，结合实际案例，语言自然流畅',
    "wechatTextPrompt" TEXT NOT NULL DEFAULT '以专业正式的方式撰写，结构清晰，段落分明，适合深度阅读。使用数据和案例支撑观点，语言严谨但不失亲和力。',
    "xiaohongshuTextPrompt" TEXT NOT NULL DEFAULT '以轻松活泼的方式撰写，多用表情符号和网络用语，句子简短有力，适合快速浏览。强调实用性和分享价值，语言贴近年轻群体。',
    "insightPrompt" TEXT NOT NULL DEFAULT '深入分析文章主题和趋势，提炼核心观点，识别用户痛点和需求。提供3-5个具有实操价值的选题建议，每个建议包含目标受众、内容角度和推荐标题。',
    "imagePrompt" TEXT NOT NULL DEFAULT '扁平插画风格，配色温暖明亮，现代简约，专业质感',
    "imageStyle" TEXT NOT NULL DEFAULT 'modern-flat',
    "strength" REAL NOT NULL DEFAULT 0.5,
    "imageModel" TEXT NOT NULL DEFAULT 'nanobannana_v1.0',
    "imagePositivePrompt" TEXT NOT NULL DEFAULT '(masterpiece:1.2), best quality, ultra-detailed, 8k, professional photography, sharp focus, intricate details, cinematic lighting, vibrant colors, physically-based rendering',
    "imageNegativePrompt" TEXT NOT NULL DEFAULT '(worst quality, low quality, normal quality:1.4), ugly, deformed, blurry, jpeg artifacts, noisy, watermark, text, signature, username, canvas frame, out of frame, cropped, disfigured, mutated hands, extra limbs, extra fingers',
    "denoisingStrength" REAL NOT NULL DEFAULT 0.35,
    "cfgScale" REAL NOT NULL DEFAULT 7.5,
    "samplerName" TEXT NOT NULL DEFAULT 'DPM++ 2M Karras',
    "steps" INTEGER NOT NULL DEFAULT 25,
    "seed" INTEGER NOT NULL DEFAULT -1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_prompt_settings" ("createdAt", "id", "imagePrompt", "imageStyle", "insightPrompt", "strength", "textPrompt", "updatedAt", "userId", "wechatTextPrompt", "xiaohongshuTextPrompt") SELECT "createdAt", "id", "imagePrompt", "imageStyle", "insightPrompt", "strength", "textPrompt", "updatedAt", "userId", "wechatTextPrompt", "xiaohongshuTextPrompt" FROM "prompt_settings";
DROP TABLE "prompt_settings";
ALTER TABLE "new_prompt_settings" RENAME TO "prompt_settings";
CREATE UNIQUE INDEX "prompt_settings_userId_key" ON "prompt_settings"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
