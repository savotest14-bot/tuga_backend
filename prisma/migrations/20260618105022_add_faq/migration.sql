-- CreateEnum
CREATE TYPE "FaqAudience" AS ENUM ('CUSTOMER', 'TRADER', 'BOTH');

-- CreateTable
CREATE TABLE "Faq" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "audience" "FaqAudience" NOT NULL DEFAULT 'BOTH',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Faq_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Faq_audience_idx" ON "Faq"("audience");

-- CreateIndex
CREATE INDEX "Faq_isActive_idx" ON "Faq"("isActive");
