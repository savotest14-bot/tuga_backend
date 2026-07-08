-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isEmailVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "verificationOtp" TEXT,
ADD COLUMN     "verificationOtpExpiresAt" TIMESTAMP(3);
