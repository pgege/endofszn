/*
  Warnings:

  - You are about to drop the column `apiKey` on the `StoreConfig` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "StoreConfig_apiKey_key";

-- AlterTable
ALTER TABLE "StoreConfig" DROP COLUMN "apiKey";
