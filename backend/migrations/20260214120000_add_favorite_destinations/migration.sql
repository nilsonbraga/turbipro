-- Create favorite destinations and relation to clients
CREATE TABLE "FavoriteDestination" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "agencyId" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMPTZ(6) NOT NULL DEFAULT now(),

  CONSTRAINT "FavoriteDestination_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FavoriteDestination_agencyId_idx" ON "FavoriteDestination"("agencyId");
CREATE INDEX "FavoriteDestination_name_idx" ON "FavoriteDestination"("name");

ALTER TABLE "FavoriteDestination"
  ADD CONSTRAINT "FavoriteDestination_agencyId_fkey"
  FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "_ClientToFavoriteDestination" (
  "A" UUID NOT NULL,
  "B" UUID NOT NULL
);

CREATE UNIQUE INDEX "_ClientToFavoriteDestination_AB_unique" ON "_ClientToFavoriteDestination"("A", "B");
CREATE INDEX "_ClientToFavoriteDestination_B_index" ON "_ClientToFavoriteDestination"("B");

ALTER TABLE "_ClientToFavoriteDestination"
  ADD CONSTRAINT "_ClientToFavoriteDestination_A_fkey"
  FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "_ClientToFavoriteDestination"
  ADD CONSTRAINT "_ClientToFavoriteDestination_B_fkey"
  FOREIGN KEY ("B") REFERENCES "FavoriteDestination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
