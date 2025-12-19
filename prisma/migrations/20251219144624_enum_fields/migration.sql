/*
  Warnings:

  - The `status` column on the `orders` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `eventType` on the `outbox_events` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'PAID');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ORDER_CREATED', 'ORDER_PAID');

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "status",
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "outbox_events" DROP COLUMN "eventType",
ADD COLUMN     "eventType" "EventType" NOT NULL;
