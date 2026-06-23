-- CreateEnum
CREATE TYPE "ViolationCategory" AS ENUM ('OFF_PLATFORM_CONTACT', 'ABUSE', 'SPAM', 'FRAUD', 'HARASSMENT');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('MESSAGE', 'REVIEW', 'PROFILE', 'JOB');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "ViolationKeyword" (
    "id" TEXT NOT NULL,
    "keyword" TEXT NOT NULL,
    "category" "ViolationCategory" NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ViolationKeyword_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentFlag" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "contentType" "ContentType" NOT NULL,
    "contentId" TEXT,
    "detectedText" TEXT,
    "reason" TEXT NOT NULL,
    "severity" INTEGER NOT NULL,
    "status" "ModerationStatus" NOT NULL DEFAULT 'PENDING',
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ViolationKeyword_keyword_key" ON "ViolationKeyword"("keyword");

-- CreateIndex
CREATE INDEX "ViolationKeyword_category_idx" ON "ViolationKeyword"("category");

-- CreateIndex
CREATE INDEX "ViolationKeyword_isActive_idx" ON "ViolationKeyword"("isActive");

-- CreateIndex
CREATE INDEX "ContentFlag_userId_idx" ON "ContentFlag"("userId");

-- CreateIndex
CREATE INDEX "ContentFlag_contentType_idx" ON "ContentFlag"("contentType");

-- CreateIndex
CREATE INDEX "ContentFlag_status_idx" ON "ContentFlag"("status");

-- CreateIndex
CREATE INDEX "ContentFlag_createdAt_idx" ON "ContentFlag"("createdAt");

-- AddForeignKey
ALTER TABLE "ContentFlag" ADD CONSTRAINT "ContentFlag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
