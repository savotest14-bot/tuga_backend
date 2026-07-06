-- AddForeignKey
ALTER TABLE "AdminJobActionLog" ADD CONSTRAINT "AdminJobActionLog_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminJobActionLog" ADD CONSTRAINT "AdminJobActionLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
