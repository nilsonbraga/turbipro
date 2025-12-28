-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "startDate" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "Task_startDate_idx" ON "Task"("startDate");
