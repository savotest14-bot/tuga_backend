/*
  Warnings:

  - A unique constraint covering the columns `[customerId,traderId,type]` on the table `Conversation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Conversation_customerId_traderId_type_key" ON "Conversation"("customerId", "traderId", "type");
