-- CreateEnum
CREATE TYPE "Language" AS ENUM ('PORTUGUESE', 'ENGLISH', 'SPANISH', 'FRENCH', 'GERMAN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "languages" "Language"[] DEFAULT ARRAY[]::"Language"[];
