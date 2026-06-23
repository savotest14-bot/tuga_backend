/*
  Warnings:

  - You are about to drop the column `profilePhoto` on the `TraderProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "TraderProfile" DROP COLUMN "profilePhoto",
ADD COLUMN     "acceptedPrivacyPolicy" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "acceptedTermsConditions" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "authorisedBusiness" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "document" TEXT,
ADD COLUMN     "logo" TEXT,
ADD COLUMN     "minimumExperience" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationNumber" TEXT,
ADD COLUMN     "subCategories" TEXT[],
ADD COLUMN     "understandVettingPolicy" BOOLEAN NOT NULL DEFAULT false;
