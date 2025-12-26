-- Create storage bucket for itinerary images
INSERT INTO storage.buckets (id, name, public)
VALUES ('itinerary-images', 'itinerary-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload itinerary images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'itinerary-images' 
  AND auth.role() = 'authenticated'
);

-- Allow public read access
CREATE POLICY "Anyone can view itinerary images"
ON storage.objects FOR SELECT
USING (bucket_id = 'itinerary-images');

-- Allow users to update their own uploads
CREATE POLICY "Users can update their itinerary images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'itinerary-images' 
  AND auth.role() = 'authenticated'
);

-- Allow users to delete their own uploads
CREATE POLICY "Users can delete their itinerary images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'itinerary-images' 
  AND auth.role() = 'authenticated'
);