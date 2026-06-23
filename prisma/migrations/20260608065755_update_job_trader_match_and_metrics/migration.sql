/*
  Warnings:

  - You are about to drop the column `ratingAvg` on the `TraderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `reviewCount` on the `TraderProfile` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "JobMatchStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "JobTraderMatch" ADD COLUMN     "distanceKm" DOUBLE PRECISION,
ADD COLUMN     "isQuoteSubmitted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isSelected" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "score" DOUBLE PRECISION,
ADD COLUMN     "viewedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TraderProfile" DROP COLUMN "ratingAvg",
DROP COLUMN "reviewCount";

-- CreateTable
CREATE TABLE "TraderMetrics" (
    "id" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "averageRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalReviews" INTEGER NOT NULL DEFAULT 0,
    "invitesCount" INTEGER NOT NULL DEFAULT 0,
    "responsesCount" INTEGER NOT NULL DEFAULT 0,
    "responseRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "recentLeads" INTEGER NOT NULL DEFAULT 0,
    "completedJobs" INTEGER NOT NULL DEFAULT 0,
    "totalMatchedJobs" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TraderMetrics_pkey" PRIMARY KEY ("id")
);


-- CreateIndex
CREATE UNIQUE INDEX "TraderMetrics_traderId_key" ON "TraderMetrics"("traderId");

-- AddForeignKey
ALTER TABLE "TraderMetrics" ADD CONSTRAINT "TraderMetrics_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TraderMetrics" ADD COLUMN "recentLeadsResetAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
-- CreateIndex on TraderMetrics
CREATE INDEX "TraderMetrics_responseRate_idx" ON "TraderMetrics"("responseRate");
CREATE INDEX "TraderMetrics_averageRating_idx" ON "TraderMetrics"("averageRating");
CREATE INDEX "TraderMetrics_traderId_idx" ON "TraderMetrics"("traderId");
CREATE INDEX "TraderMetrics_recentLeadsResetAt_idx" ON "TraderMetrics"("recentLeadsResetAt");