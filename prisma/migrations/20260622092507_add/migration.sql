-- CreateTable
CREATE TABLE "AdminJobActionLog" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AdminJobActionLog_pkey" PRIMARY KEY ("id")
);
