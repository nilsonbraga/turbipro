-- AlterTable
ALTER TABLE "CustomItinerary" ADD COLUMN     "logoUrl" TEXT,
ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ItineraryDay" ADD COLUMN     "documents" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "links" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "ItineraryItem" ADD COLUMN     "documents" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "links" JSONB NOT NULL DEFAULT '[]';

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');
