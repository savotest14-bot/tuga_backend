/*
  Warnings:

  - You are about to drop the column `expiresAt` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `proofFile` on the `Review` table. All the data in the column will be lost.
  - Added the required column `moderationType` to the `Review` table without a default value. This is not possible if the table is not empty.
  - Added the required column `reviewType` to the `Review` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReviewType" AS ENUM ('DIRECTORY', 'JOB');

-- CreateEnum
CREATE TYPE "ReviewModerationType" AS ENUM ('AUTO', 'MANUAL');

-- CreateEnum
CREATE TYPE "ReviewInteractionSource" AS ENUM ('JOB_CHAT', 'DIRECTORY_CHAT', 'WHATSAPP', 'PHONE', 'MANUAL');

-- DropIndex
DROP INDEX "User_location_gist";

-- AlterTable
ALTER TABLE "Review" DROP COLUMN "expiresAt",
DROP COLUMN "proofFile",
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "approvedBy" TEXT,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "interactionSource" "ReviewInteractionSource",
ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "moderationType" "ReviewModerationType" NOT NULL,
ADD COLUMN     "proofRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectedBy" TEXT,
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "reviewRequestExpiresAt" TIMESTAMP(3),
ADD COLUMN     "reviewType" "ReviewType" NOT NULL,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "traderReply" TEXT,
ADD COLUMN     "traderReplyAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "TraderMetrics" ADD COLUMN     "bayesianRating" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ReviewProof" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReviewProof_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewProof_reviewId_idx" ON "ReviewProof"("reviewId");

-- CreateIndex
CREATE INDEX "Review_traderId_status_idx" ON "Review"("traderId", "status");

-- CreateIndex
CREATE INDEX "Review_customerId_idx" ON "Review"("customerId");

-- CreateIndex
CREATE INDEX "Review_jobId_idx" ON "Review"("jobId");

-- CreateIndex
CREATE INDEX "Review_createdAt_idx" ON "Review"("createdAt");

-- AddForeignKey
ALTER TABLE "ReviewProof" ADD CONSTRAINT "ReviewProof_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;
