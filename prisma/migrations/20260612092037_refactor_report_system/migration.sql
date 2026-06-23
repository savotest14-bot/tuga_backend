/*
  Warnings:

  - You are about to drop the column `reportedUserId` on the `Report` table. All the data in the column will be lost.
  - The `status` column on the `Report` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `reportType` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `targetId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('USER', 'REVIEW', 'JOB', 'MESSAGE', 'TRADER_PROFILE');

-- CreateEnum
CREATE TYPE "ReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'RESOLVED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_reportedUserId_fkey";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "reportedUserId",
ADD COLUMN     "description" TEXT,
ADD COLUMN     "reportType" "ReportType" NOT NULL,
ADD COLUMN     "targetId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "ReportStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE INDEX "Report_reportType_targetId_idx" ON "Report"("reportType", "targetId");

-- CreateIndex
CREATE INDEX "Report_reporterId_idx" ON "Report"("reporterId");

-- CreateIndex
CREATE INDEX "Report_status_idx" ON "Report"("status");
