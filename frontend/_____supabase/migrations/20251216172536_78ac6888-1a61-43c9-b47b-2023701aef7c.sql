-- Add is_favorite column to studio_templates
ALTER TABLE public.studio_templates 
ADD COLUMN IF NOT EXISTS is_favorite boolean DEFAULT false;