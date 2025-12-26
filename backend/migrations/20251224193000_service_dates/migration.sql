-- Add optional start/end times for services
ALTER TABLE "ProposalService"
ADD COLUMN IF NOT EXISTS "startTime" VARCHAR(10),
ADD COLUMN IF NOT EXISTS "endTime" VARCHAR(10);
