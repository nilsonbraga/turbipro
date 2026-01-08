/*
  Warnings:

  - You are about to drop the column `documents` on the `ItineraryDay` table. All the data in the column will be lost.
  - You are about to drop the column `documents` on the `ItineraryItem` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ItineraryDay" DROP COLUMN "documents";

-- AlterTable
ALTER TABLE "ItineraryItem" DROP COLUMN "documents";

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');
