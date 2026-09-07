/*
  Warnings:

  - You are about to drop the column `categoryId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `skillServiceId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `subCategoryId` on the `Job` table. All the data in the column will be lost.

*/


-- AlterTable
ALTER TABLE "Quote"
ADD COLUMN IF NOT EXISTS "availability" TEXT;

