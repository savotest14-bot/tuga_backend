/*
  Warnings:

  - You are about to drop the column `tier` on the `Subscription` table. All the data in the column will be lost.
  - You are about to drop the column `subscriptionId` on the `TraderProfile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[traderProfileId]` on the table `Subscription` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `planId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceId` to the `Subscription` table without a default value. This is not possible if the table is not empty.
  - Added the required column `traderProfileId` to the `Subscription` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('STRIPE', 'MBWAY');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAYMENT_FAILED';

-- DropForeignKey
ALTER TABLE "TraderProfile" DROP CONSTRAINT "TraderProfile_subscriptionId_fkey";

-- DropForeignKey
ALTER TABLE "TraderProfile" DROP CONSTRAINT "TraderProfile_userId_fkey";

-- DropIndex
DROP INDEX "TraderProfile_subscriptionId_key";

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "tier",
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "failedPaymentCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "isTrial" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextBillingDate" TIMESTAMP(3),
ADD COLUMN     "planId" TEXT NOT NULL,
ADD COLUMN     "priceId" TEXT NOT NULL,
ADD COLUMN     "profileHiddenAt" TIMESTAMP(3),
ADD COLUMN     "traderProfileId" TEXT NOT NULL,
ADD COLUMN     "trialEndDate" TIMESTAMP(3),
ADD COLUMN     "trialStartDate" TIMESTAMP(3),
ALTER COLUMN "status" SET DEFAULT 'TRIAL';

-- AlterTable
ALTER TABLE "TraderProfile" DROP COLUMN "subscriptionId",
ADD COLUMN     "isVisible" BOOLEAN NOT NULL DEFAULT true;

-- CreateTable
CREATE TABLE "SubscriptionPlan" (
    "id" TEXT NOT NULL,
    "name" "SubscriptionTier" NOT NULL,
    "description" TEXT,
    "maxCategories" INTEGER NOT NULL,
    "maxPortfolioUploads" INTEGER NOT NULL,
    "maxQuotesPerDay" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPrice" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePriceId" TEXT,
    "mbwayPlanId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "status" "PaymentStatus" NOT NULL,
    "paymentProvider" "PaymentProvider" NOT NULL,
    "transactionId" TEXT,
    "invoiceUrl" TEXT,
    "paidAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPlan_name_key" ON "SubscriptionPlan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SubscriptionPrice_planId_billingCycle_key" ON "SubscriptionPrice"("planId", "billingCycle");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_traderProfileId_key" ON "Subscription"("traderProfileId");

-- AddForeignKey
ALTER TABLE "TraderProfile" ADD CONSTRAINT "TraderProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPrice" ADD CONSTRAINT "SubscriptionPrice_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "TraderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "SubscriptionPlan"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_priceId_fkey" FOREIGN KEY ("priceId") REFERENCES "SubscriptionPrice"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
