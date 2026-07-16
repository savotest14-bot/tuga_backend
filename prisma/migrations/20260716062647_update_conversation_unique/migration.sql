/*
  Warnings:

  - A unique constraint covering the columns `[customerId,traderId,type,jobId]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Conversation_customerId_traderId_type_key";

-- DropIndex
DROP INDEX "Conversation_jobId_customerId_traderId_key";

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_customerId_traderId_type_jobId_key" ON "Conversation"("customerId", "traderId", "type", "jobId");
