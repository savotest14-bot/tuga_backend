/*
  Warnings:

  - You are about to drop the column `maxCategories` on the `SubscriptionPlan` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" DROP COLUMN "maxCategories",
ADD COLUMN     "allowPortfolioVideos" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "bannerLabel" TEXT,
ADD COLUMN     "customerSupportDays" INTEGER NOT NULL DEFAULT 7,
ADD COLUMN     "exposureLevel" TEXT,
ADD COLUMN     "featuredAtTop" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "maxTrades" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "newJobAlerts" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trialDays" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "unlimitedTrades" BOOLEAN NOT NULL DEFAULT false,
ALTER COLUMN "maxPortfolioUploads" SET DEFAULT 0,
ALTER COLUMN "maxQuotesPerDay" SET DEFAULT 0;
