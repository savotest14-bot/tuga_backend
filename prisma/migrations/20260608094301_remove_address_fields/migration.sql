/*
  Warnings:

  - You are about to drop the column `addressLine` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `city` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `country` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `postalCode` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `state` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "addressLine",
DROP COLUMN "city",
DROP COLUMN "country",
DROP COLUMN "postalCode",
DROP COLUMN "state";
