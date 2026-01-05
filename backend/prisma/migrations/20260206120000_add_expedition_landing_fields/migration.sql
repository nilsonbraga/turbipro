-- AlterTable
ALTER TABLE "ExpeditionGroup"
ADD COLUMN "impactPhrase" TEXT,
ADD COLUMN "descriptionImageUrl" TEXT,
ADD COLUMN "aboutTitle" TEXT,
ADD COLUMN "aboutDescription" TEXT,
ADD COLUMN "aboutImageUrl" TEXT,
ADD COLUMN "destinationSummaryTitle" TEXT,
ADD COLUMN "destinationSummaryDescription" TEXT,
ADD COLUMN "destinationSummaryImageUrl" TEXT,
ADD COLUMN "itinerarySummaryTitle" TEXT,
ADD COLUMN "itinerarySummaryDescription" TEXT,
ADD COLUMN "itinerarySummaryImages" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN "transportTitle" TEXT,
ADD COLUMN "transportText" TEXT,
ADD COLUMN "transportImages" TEXT[],
ADD COLUMN "notRecommendedItems" JSONB NOT NULL DEFAULT '[]';
