ALTER TABLE "PipelineStage"
  ADD COLUMN "slaMinutes" INTEGER,
  ADD COLUMN "templates" JSONB;

ALTER TABLE "Proposal"
  ADD COLUMN "stageEnteredAt" TIMESTAMPTZ(6);

UPDATE "Proposal"
SET "stageEnteredAt" = "createdAt"
WHERE "stageEnteredAt" IS NULL;
