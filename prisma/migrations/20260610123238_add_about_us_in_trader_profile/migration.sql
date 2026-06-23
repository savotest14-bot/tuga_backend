-- CreateEnum
CREATE TYPE "PortfolioType" AS ENUM ('IMAGE', 'VIDEO');

-- AlterTable
ALTER TABLE "TraderProfile" ADD COLUMN     "aboutUs" TEXT;

-- CreateTable
CREATE TABLE "TraderPortfolio" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "type" "PortfolioType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderPortfolio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderCertificate" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TraderInsuranceDocument" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TraderInsuranceDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TraderPortfolio_traderProfileId_idx" ON "TraderPortfolio"("traderProfileId");

-- CreateIndex
CREATE INDEX "TraderPortfolio_type_idx" ON "TraderPortfolio"("type");

-- CreateIndex
CREATE INDEX "TraderCertificate_traderProfileId_idx" ON "TraderCertificate"("traderProfileId");

-- CreateIndex
CREATE INDEX "TraderInsuranceDocument_traderProfileId_idx" ON "TraderInsuranceDocument"("traderProfileId");

-- AddForeignKey
ALTER TABLE "TraderPortfolio" ADD CONSTRAINT "TraderPortfolio_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "TraderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderCertificate" ADD CONSTRAINT "TraderCertificate_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "TraderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderInsuranceDocument" ADD CONSTRAINT "TraderInsuranceDocument_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "TraderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
