/*
  Warnings:

  - Added the required column `updatedAt` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Notification" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "readAt" DROP NOT NULL,
ALTER COLUMN "readAt" DROP DEFAULT;
