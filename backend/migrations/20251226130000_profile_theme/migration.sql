-- Add theme preference to profile
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "themePreference" TEXT NOT NULL DEFAULT 'dark';
