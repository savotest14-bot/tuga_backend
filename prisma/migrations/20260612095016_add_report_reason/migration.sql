/*
  Warnings:

  - You are about to drop the column `description` on the `Report` table. All the data in the column will be lost.
  - Changed the type of `reason` on the `Report` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ReportReason" AS ENUM ('SPAM', 'FAKE', 'ABUSIVE', 'HARASSMENT', 'INAPPROPRIATE_CONTENT', 'SCAM', 'OTHER');

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "description",
ADD COLUMN     "customReason" TEXT,
ADD COLUMN     "reviewedAt" TIMESTAMP(3),
ADD COLUMN     "reviewedById" TEXT,
DROP COLUMN "reason",
ADD COLUMN     "reason" "ReportReason" NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_reviewedById_fkey" FOREIGN KEY ("reviewedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
