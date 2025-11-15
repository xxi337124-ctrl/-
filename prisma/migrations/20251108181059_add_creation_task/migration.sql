-- CreateTable
CREATE TABLE "creation_tasks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "insightId" TEXT NOT NULL,
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
