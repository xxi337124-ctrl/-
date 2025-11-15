-- CreateTable
CREATE TABLE "article_fetches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "keyword" TEXT NOT NULL,
    "searchType" TEXT NOT NULL DEFAULT 'keyword',
    "articles" TEXT NOT NULL,
    "totalArticles" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "prompt_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'default',
    "textPrompt" TEXT NOT NULL DEFAULT '以专业但易懂的方式撰写，结合实际案例，语言自然流畅',
    "imagePrompt" TEXT NOT NULL DEFAULT '扁平插画风格，配色温暖明亮，现代简约，专业质感',
    "imageStyle" TEXT NOT NULL DEFAULT 'modern-flat',
    "strength" REAL NOT NULL DEFAULT 0.5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewCount" INTEGER NOT NULL DEFAULT 1,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insights_fetchId_fkey" FOREIGN KEY ("fetchId") REFERENCES "article_fetches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_insights" ("analysisMetadata", "articleSummaries", "createdAt", "id", "insights", "isFavorite", "keyword", "lastViewedAt", "searchType", "structuredInsights", "topInteractiveArticles", "topLikedArticles", "totalArticles", "viewCount", "wordCloud") SELECT "analysisMetadata", "articleSummaries", "createdAt", "id", "insights", "isFavorite", "keyword", "lastViewedAt", "searchType", "structuredInsights", "topInteractiveArticles", "topLikedArticles", "totalArticles", "viewCount", "wordCloud" FROM "insights";
DROP TABLE "insights";
ALTER TABLE "new_insights" RENAME TO "insights";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "prompt_settings_userId_key" ON "prompt_settings"("userId");
