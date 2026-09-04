/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `skillServiceId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `subCategoryId` on the `Job` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_categoryId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_skillServiceId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_subCategoryId_fkey";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "categoryId",
DROP COLUMN "skillServiceId",
DROP COLUMN "subCategoryId";

-- AlterTable
ALTER TABLE "TraderMetrics" ADD COLUMN     "cancelledJobs" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "closedJobs" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "TraderProfile" ADD COLUMN     "displayName" TEXT;

-- CreateTable
CREATE TABLE "_CategoryToJob" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CategoryToJob_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_JobToSkillService" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobToSkillService_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_JobToSubCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_JobToSubCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CategoryToJob_B_index" ON "_CategoryToJob"("B");

-- CreateIndex
CREATE INDEX "_JobToSkillService_B_index" ON "_JobToSkillService"("B");

-- CreateIndex
CREATE INDEX "_JobToSubCategory_B_index" ON "_JobToSubCategory"("B");

-- AddForeignKey
ALTER TABLE "_CategoryToJob" ADD CONSTRAINT "_CategoryToJob_A_fkey" FOREIGN KEY ("A") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CategoryToJob" ADD CONSTRAINT "_CategoryToJob_B_fkey" FOREIGN KEY ("B") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToSkillService" ADD CONSTRAINT "_JobToSkillService_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToSkillService" ADD CONSTRAINT "_JobToSkillService_B_fkey" FOREIGN KEY ("B") REFERENCES "SkillService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToSubCategory" ADD CONSTRAINT "_JobToSubCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_JobToSubCategory" ADD CONSTRAINT "_JobToSubCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "SubCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
