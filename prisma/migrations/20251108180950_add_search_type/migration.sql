-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_insights" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "lastViewedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_insights" ("analysisMetadata", "articleSummaries", "createdAt", "id", "insights", "isFavorite", "keyword", "lastViewedAt", "structuredInsights", "topInteractiveArticles", "topLikedArticles", "totalArticles", "viewCount", "wordCloud") SELECT "analysisMetadata", "articleSummaries", "createdAt", "id", "insights", "isFavorite", "keyword", "lastViewedAt", "structuredInsights", "topInteractiveArticles", "topLikedArticles", "totalArticles", "viewCount", "wordCloud" FROM "insights";
DROP TABLE "insights";
ALTER TABLE "new_insights" RENAME TO "insights";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
