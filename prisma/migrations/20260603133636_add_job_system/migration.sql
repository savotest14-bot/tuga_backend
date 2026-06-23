-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('DRAFT', 'POSTED', 'QUOTE_RECEIVED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "JobTimescale" AS ENUM ('URGENT', 'WITHIN_3_DAYS', 'WITHIN_1_WEEK', 'WITHIN_1_MONTH', 'FLEXIBLE');

-- CreateEnum
CREATE TYPE "BudgetRange" AS ENUM ('UNDER_100', 'UNDER_250', 'UNDER_500', 'UNDER_1000', 'UNDER_2000', 'UNDER_4000', 'UNDER_8000', 'BETWEEN_10000_20000', 'BETWEEN_20000_30000', 'ABOVE_30000');

-- CreateEnum
CREATE TYPE "JobMatchStatus" AS ENUM ('SENT', 'VIEWED', 'QUOTED', 'REJECTED', 'NO_RESPONSE');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConversationType" AS ENUM ('JOB', 'DIRECT');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "skillServiceId" TEXT NOT NULL,
    "subCategoryId" TEXT,
    "postcode" TEXT,
    "latitude" DECIMAL(10,7),
    "longitude" DECIMAL(10,7),
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timescale" "JobTimescale" NOT NULL,
    "emergency" BOOLEAN NOT NULL DEFAULT false,
    "budgetRange" "BudgetRange",
    "status" "JobStatus" NOT NULL DEFAULT 'POSTED',
    "selectedTraderId" TEXT,
    "quotesReceived" INTEGER NOT NULL DEFAULT 0,
    "currentRadiusKm" INTEGER NOT NULL DEFAULT 10,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobAttachment" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobTraderMatch" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "radiusKm" INTEGER NOT NULL DEFAULT 10,
    "status" "JobMatchStatus" NOT NULL DEFAULT 'SENT',
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "JobTraderMatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "price" DECIMAL(10,2),
    "estimatedDays" INTEGER,
    "message" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "type" "ConversationType" NOT NULL DEFAULT 'JOB',
    "jobId" TEXT,
    "customerId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "message" TEXT,
    "attachment" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "jobId" TEXT,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "wasWorkCompleted" BOOLEAN NOT NULL DEFAULT false,
    "proofFile" TEXT,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "editableUntil" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "type" TEXT,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobEscalationLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "previousRadius" INTEGER NOT NULL,
    "newRadius" INTEGER NOT NULL,
    "tradersSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JobEscalationLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reportedUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedTrader" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "traderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTrader_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobTraderMatch_jobId_traderId_key" ON "JobTraderMatch"("jobId", "traderId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_jobId_traderId_key" ON "Quote"("jobId", "traderId");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_jobId_customerId_traderId_key" ON "Conversation"("jobId", "customerId", "traderId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedTrader_customerId_traderId_key" ON "SavedTrader"("customerId", "traderId");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_skillServiceId_fkey" FOREIGN KEY ("skillServiceId") REFERENCES "SkillService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "SubCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_selectedTraderId_fkey" FOREIGN KEY ("selectedTraderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAttachment" ADD CONSTRAINT "JobAttachment_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTraderMatch" ADD CONSTRAINT "JobTraderMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobTraderMatch" ADD CONSTRAINT "JobTraderMatch_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobEscalationLog" ADD CONSTRAINT "JobEscalationLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reportedUserId_fkey" FOREIGN KEY ("reportedUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTrader" ADD CONSTRAINT "SavedTrader_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedTrader" ADD CONSTRAINT "SavedTrader_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
