-- DropIndex
DROP INDEX "JobTraderMatch_jobId_idx";

-- DropIndex
DROP INDEX "JobTraderMatch_traderId_idx";

-- DropIndex
DROP INDEX "Review_createdAt_idx";

-- DropIndex
DROP INDEX "Review_jobId_idx";

-- DropIndex
DROP INDEX "TraderMetrics_recentLeadsResetAt_idx";

-- RenameIndex
ALTER INDEX "TraderProfile_verificationStatus_isVisible_subscriptionStatus_i" RENAME TO "TraderProfile_verificationStatus_isVisible_subscriptionStat_idx";
