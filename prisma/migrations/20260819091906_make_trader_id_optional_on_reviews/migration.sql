-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_traderId_fkey";

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "traderId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_traderId_fkey" FOREIGN KEY ("traderId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
