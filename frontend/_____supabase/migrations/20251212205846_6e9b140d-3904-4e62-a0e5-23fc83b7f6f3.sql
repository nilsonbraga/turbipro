-- Add landing page customization fields to expedition_groups
ALTER TABLE public.expedition_groups
ADD COLUMN IF NOT EXISTS cover_image_url TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS carousel_images TEXT[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS landing_text TEXT DEFAULT NULL;