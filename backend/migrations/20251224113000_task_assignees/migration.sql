-- TaskAssignee relation
CREATE TABLE IF NOT EXISTS "TaskAssignee" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "taskId" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskAssignee_taskId_userId_key" ON "TaskAssignee" ("taskId", "userId");
CREATE INDEX IF NOT EXISTS "TaskAssignee_taskId_idx" ON "TaskAssignee" ("taskId");
CREATE INDEX IF NOT EXISTS "TaskAssignee_userId_idx" ON "TaskAssignee" ("userId");

ALTER TABLE "TaskAssignee"
  ADD CONSTRAINT "TaskAssignee_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "TaskAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
