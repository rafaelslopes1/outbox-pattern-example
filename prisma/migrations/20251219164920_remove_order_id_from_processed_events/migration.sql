/*
  Warnings:

  - You are about to drop the column `orderId` on the `processed_events` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "outbox_events" ALTER COLUMN "amount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "processed_events" DROP COLUMN "orderId";
