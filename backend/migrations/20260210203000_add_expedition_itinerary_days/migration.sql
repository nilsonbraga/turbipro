-- Add itinerary days for expedition groups
ALTER TABLE "ExpeditionGroup"
ADD COLUMN "itineraryDays" JSONB NOT NULL DEFAULT '[]';
