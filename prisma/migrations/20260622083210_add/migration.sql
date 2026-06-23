-- CreateEnum
CREATE TYPE "DistributionStatus" AS ENUM ('AUTO', 'MANUAL_REVIEW', 'PAUSED', 'COMPLETED');

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "distributionStatus" "DistributionStatus" NOT NULL DEFAULT 'AUTO';
