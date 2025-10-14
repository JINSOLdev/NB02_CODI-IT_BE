/*
  Warnings:

  - The values [ORDER_UPDATE,PROMOTION,SYSTEM_ALERT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[userId,type,productId,inquiryId,orderId,storeId]` on the table `Notification` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."NotificationType_new" AS ENUM ('OUT_OF_STOCK_CART', 'OUT_OF_STOCK_ORDER', 'OUT_OF_STOCK_SELLER', 'NEW_INQUIRY', 'INQUIRY_ANSWERED', 'SYSTEM');
ALTER TABLE "public"."Notification" ALTER COLUMN "type" TYPE "public"."NotificationType_new" USING ("type"::text::"public"."NotificationType_new");
ALTER TYPE "public"."NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "public"."NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "public"."NotificationType_old";
COMMIT;

-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "inquiryId" TEXT,
ADD COLUMN     "orderId" TEXT,
ADD COLUMN     "productId" TEXT,
ADD COLUMN     "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "storeId" TEXT,
ADD COLUMN     "title" TEXT;

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "public"."Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_type_idx" ON "public"."Notification"("type");

-- CreateIndex
CREATE INDEX "Notification_productId_idx" ON "public"."Notification"("productId");

-- CreateIndex
CREATE INDEX "Notification_inquiryId_idx" ON "public"."Notification"("inquiryId");

-- CreateIndex
CREATE INDEX "Notification_orderId_idx" ON "public"."Notification"("orderId");

-- CreateIndex
CREATE INDEX "Notification_storeId_idx" ON "public"."Notification"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_type_productId_inquiryId_orderId_storeI_key" ON "public"."Notification"("userId", "type", "productId", "inquiryId", "orderId", "storeId");

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_inquiryId_fkey" FOREIGN KEY ("inquiryId") REFERENCES "public"."Inquiry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "public"."Order"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Notification" ADD CONSTRAINT "Notification_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "public"."Store"("id") ON DELETE SET NULL ON UPDATE CASCADE;
