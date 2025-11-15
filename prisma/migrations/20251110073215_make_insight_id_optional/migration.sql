-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_creation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_creation_tasks" ("articleId", "createdAt", "error", "id", "imageStrategy", "insightId", "length", "platform", "progress", "progressMessage", "status", "style", "topicIndexes", "updatedAt") SELECT "articleId", "createdAt", "error", "id", "imageStrategy", "insightId", "length", "platform", "progress", "progressMessage", "status", "style", "topicIndexes", "updatedAt" FROM "creation_tasks";
DROP TABLE "creation_tasks";
ALTER TABLE "new_creation_tasks" RENAME TO "creation_tasks";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
