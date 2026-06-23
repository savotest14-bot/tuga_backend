-- CreateEnum
CREATE TYPE "ContactSubject" AS ENUM ('GENERAL_ENQUIRY', 'REPORT_TRADER', 'REPORT_REVIEW', 'TECHNICAL_ISSUE', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateTable
CREATE TABLE "ContactSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "subject" "ContactSubject" NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ContactStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContactAttachment" (
    "id" TEXT NOT NULL,
    "contactSubmissionId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "mimeType" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactSubmission_email_idx" ON "ContactSubmission"("email");

-- CreateIndex
CREATE INDEX "ContactSubmission_subject_idx" ON "ContactSubmission"("subject");

-- CreateIndex
CREATE INDEX "ContactSubmission_status_idx" ON "ContactSubmission"("status");

-- CreateIndex
CREATE INDEX "ContactSubmission_createdAt_idx" ON "ContactSubmission"("createdAt");

-- CreateIndex
CREATE INDEX "ContactAttachment_contactSubmissionId_idx" ON "ContactAttachment"("contactSubmissionId");

-- AddForeignKey
ALTER TABLE "ContactSubmission" ADD CONSTRAINT "ContactSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAttachment" ADD CONSTRAINT "ContactAttachment_contactSubmissionId_fkey" FOREIGN KEY ("contactSubmissionId") REFERENCES "ContactSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
