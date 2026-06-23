-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "TraderProfile" ALTER COLUMN "subscriptionStatus" SET DEFAULT 'PENDING';
