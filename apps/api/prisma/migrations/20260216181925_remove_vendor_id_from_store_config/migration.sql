/*
  Warnings:

  - You are about to drop the column `vendorId` on the `StoreConfig` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "StoreConfig_vendorId_idx";

-- AlterTable
ALTER TABLE "StoreConfig" DROP COLUMN "vendorId";
