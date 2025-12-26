-- Add images array column to itinerary_days for multiple photos
ALTER TABLE public.itinerary_days 
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';