-- Create storage bucket for proposal files
INSERT INTO storage.buckets (id, name, public) VALUES ('proposal-files', 'proposal-files', true);

-- Create policies for proposal files
CREATE POLICY "Users can view proposal files"
ON storage.objects FOR SELECT
USING (bucket_id = 'proposal-files');

CREATE POLICY "Users can upload proposal files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'proposal-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete proposal files"
ON storage.objects FOR DELETE
USING (bucket_id = 'proposal-files' AND auth.uid() IS NOT NULL);