/*
  Warnings:

  - Made the column `orderId` on table `outbox_events` required. This step will fail if there are existing NULL values in that column.
  - Made the column `amount` on table `outbox_events` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "outbox_events" ALTER COLUMN "orderId" SET NOT NULL,
ALTER COLUMN "amount" SET NOT NULL;
