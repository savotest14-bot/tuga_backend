-- AlterEnum
ALTER TYPE "ReviewStatus" ADD VALUE 'ARCHIVED';

-- AlterTable Job - add escalation version for optimistic locking
ALTER TABLE "Job" ADD COLUMN "escalationVersion" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex on User
CREATE INDEX "User_role_status_isVerified_idx" ON "User"("role", "status", "isVerified");
CREATE INDEX "User_latitude_longitude_idx" ON "User"("latitude", "longitude");
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");

-- CreateIndex on TraderProfile
CREATE INDEX "TraderProfile_verificationStatus_isVisible_subscriptionStatus_idx" ON "TraderProfile"("verificationStatus", "isVisible", "subscriptionStatus");
CREATE INDEX "TraderProfile_userId_idx" ON "TraderProfile"("userId");

-- CreateIndex on Job
CREATE INDEX "Job_status_quotesReceived_idx" ON "Job"("status", "quotesReceived");
CREATE INDEX "Job_createdAt_currentRadiusKm_idx" ON "Job"("createdAt", "currentRadiusKm");
CREATE INDEX "Job_customerId_status_idx" ON "Job"("customerId", "status");

ALTER TABLE "JobTraderMatch"
ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex on JobTraderMatch
CREATE INDEX "JobTraderMatch_jobId_status_idx" ON "JobTraderMatch"("jobId", "status");
CREATE INDEX "JobTraderMatch_traderId_status_idx" ON "JobTraderMatch"("traderId", "status");
CREATE INDEX "JobTraderMatch_createdAt_idx" ON "JobTraderMatch"("createdAt");
CREATE INDEX "JobTraderMatch_jobId_idx" ON "JobTraderMatch"("jobId");
CREATE INDEX "JobTraderMatch_traderId_idx" ON "JobTraderMatch"("traderId");

-- CreateIndex on Quote
CREATE INDEX "Quote_jobId_idx" ON "Quote"("jobId");
CREATE INDEX "Quote_traderId_idx" ON "Quote"("traderId");

-- CreateIndex on Conversation
CREATE INDEX "Conversation_jobId_idx" ON "Conversation"("jobId");
CREATE INDEX "Conversation_customerId_idx" ON "Conversation"("customerId");
CREATE INDEX "Conversation_traderId_idx" ON "Conversation"("traderId");

-- CreateIndex on Notification
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex on JobEscalationLog
CREATE INDEX "JobEscalationLog_jobId_idx" ON "JobEscalationLog"("jobId");
CREATE INDEX "JobEscalationLog_createdAt_idx" ON "JobEscalationLog"("createdAt");

-- CreateIndex on Review
CREATE INDEX "Review_jobId_idx" ON "Review"("jobId");
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- CreateIndex on Subscription
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");
CREATE INDEX "Subscription_traderProfileId_idx" ON "Subscription"("traderProfileId");
