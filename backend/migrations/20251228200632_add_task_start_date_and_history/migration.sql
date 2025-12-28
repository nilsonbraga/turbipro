-- AlterTable
ALTER TABLE "CustomItinerary" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "ExpeditionGroup" ALTER COLUMN "publicToken" SET DEFAULT encode(gen_random_bytes(16), 'hex');

-- AlterTable
ALTER TABLE "PublicProposalLink" ALTER COLUMN "token" SET DEFAULT encode(gen_random_bytes(32), 'hex');

-- CreateTable
CREATE TABLE "TaskHistory" (
    "id" UUID NOT NULL,
    "taskId" UUID NOT NULL,
    "userId" UUID,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TaskHistory_taskId_idx" ON "TaskHistory"("taskId");

-- CreateIndex
CREATE INDEX "TaskHistory_userId_idx" ON "TaskHistory"("userId");

-- CreateIndex
CREATE INDEX "TaskHistory_createdAt_idx" ON "TaskHistory"("createdAt");

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskHistory" ADD CONSTRAINT "TaskHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
