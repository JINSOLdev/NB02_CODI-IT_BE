/*
  Warnings:

  - A unique constraint covering the columns `[inquiryId]` on the table `Answer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Answer_inquiryId_key" ON "public"."Answer"("inquiryId");
