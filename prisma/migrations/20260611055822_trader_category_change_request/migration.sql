-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "TraderCategoryChangeRequest" (
    "id" TEXT NOT NULL,
    "traderProfileId" TEXT NOT NULL,
    "tradeCategories" JSONB,
    "skillsServices" JSONB,
    "subCategories" JSONB,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,

    CONSTRAINT "TraderCategoryChangeRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TraderCategoryChangeRequest" ADD CONSTRAINT "TraderCategoryChangeRequest_traderProfileId_fkey" FOREIGN KEY ("traderProfileId") REFERENCES "TraderProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TraderCategoryChangeRequest" ADD CONSTRAINT "TraderCategoryChangeRequest_reviewedBy_fkey" FOREIGN KEY ("reviewedBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
