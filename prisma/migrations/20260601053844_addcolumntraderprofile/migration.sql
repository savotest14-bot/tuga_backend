-- AlterTable
ALTER TABLE "TraderProfile" ADD COLUMN     "isRegistrationCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registrationStep" INTEGER NOT NULL DEFAULT 1;
