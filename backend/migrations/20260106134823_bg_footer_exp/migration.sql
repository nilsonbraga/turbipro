/*
  Warnings:

  - You are about to drop the column `footerImageUrl` on the `Agency` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Agency" DROP COLUMN IF EXISTS "footerImageUrl";

-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');
