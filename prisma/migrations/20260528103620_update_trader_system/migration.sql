/*
  Warnings:

  - You are about to drop the column `bio` on the `TraderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `experience` on the `TraderProfile` table. All the data in the column will be lost.
  - You are about to drop the column `isApproved` on the `TraderProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[subscriptionId]` on the table `TraderProfile` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeCustomerId]` on the table `TraderProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "SubscriptionTier" AS ENUM ('BRONZE', 'SILVER', 'GOLD');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'CANCELLED', 'EXPIRED');

-- AlterTable
ALTER TABLE "TraderProfile" DROP COLUMN "bio",
DROP COLUMN "experience",
DROP COLUMN "isApproved",
ADD COLUMN     "about" TEXT,
ADD COLUMN     "badges" TEXT[],
ADD COLUMN     "companyType" TEXT,
ADD COLUMN     "insured" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "profilePhoto" TEXT,
ADD COLUMN     "ratingAvg" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "reviewCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "skillsServices" TEXT[],
ADD COLUMN     "stripeCustomerId" TEXT,
ADD COLUMN     "subscriptionEndDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionId" TEXT,
ADD COLUMN     "subscriptionStartDate" TIMESTAMP(3),
ADD COLUMN     "subscriptionStatus" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "subscriptionTier" "SubscriptionTier",
ADD COLUMN     "tradeCategories" TEXT[],
ADD COLUMN     "trialEndsAt" TIMESTAMP(3),
ADD COLUMN     "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "workRadius" INTEGER;

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "tier" "SubscriptionTier" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "stripeSubscriptionId" TEXT,
    "stripeCustomerId" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TraderProfile_subscriptionId_key" ON "TraderProfile"("subscriptionId");

-- CreateIndex
CREATE UNIQUE INDEX "TraderProfile_stripeCustomerId_key" ON "TraderProfile"("stripeCustomerId");

-- AddForeignKey
ALTER TABLE "TraderProfile" ADD CONSTRAINT "TraderProfile_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
