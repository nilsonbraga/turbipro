-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- AlterTable
ALTER TABLE "StudioTemplate" ALTER COLUMN "agencyId" DROP NOT NULL,
ALTER COLUMN "templateId" SET DEFAULT 0,
ALTER COLUMN "formatId" SET DEFAULT 'custom',
ALTER COLUMN "artTypeId" SET DEFAULT 'custom';
