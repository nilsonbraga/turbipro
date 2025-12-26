-- Add testimonials, YouTube video, Google reviews link, and FAQ fields to expedition_groups
ALTER TABLE public.expedition_groups
ADD COLUMN IF NOT EXISTS youtube_video_url text,
ADD COLUMN IF NOT EXISTS google_reviews_url text,
ADD COLUMN IF NOT EXISTS testimonials jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS faqs jsonb DEFAULT '[]'::jsonb;