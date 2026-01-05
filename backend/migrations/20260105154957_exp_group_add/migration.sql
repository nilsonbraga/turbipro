-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ADD COLUMN     "aboutDescription" TEXT,
ADD COLUMN     "aboutImageUrl" TEXT,
ADD COLUMN     "aboutTitle" TEXT,
ADD COLUMN     "descriptionImageUrl" TEXT,
ADD COLUMN     "destinationSummaryDescription" TEXT,
ADD COLUMN     "destinationSummaryImageUrl" TEXT,
ADD COLUMN     "destinationSummaryTitle" TEXT,
ADD COLUMN     "impactPhrase" TEXT,
ADD COLUMN     "itinerarySummaryDescription" TEXT,
ADD COLUMN     "itinerarySummaryImages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "itinerarySummaryTitle" TEXT,
ADD COLUMN     "notRecommendedItems" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "transportImages" TEXT[],
ADD COLUMN     "transportText" TEXT,
ADD COLUMN     "transportTitle" TEXT,
ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');
