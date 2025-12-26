-- Add storage policies for platform icon upload (super admin only)
CREATE POLICY "Super admin can upload platform files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'proposal-files' 
  AND (storage.foldername(name))[1] = 'platform'
  AND public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admin can update platform files"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'proposal-files' 
  AND (storage.foldername(name))[1] = 'platform'
  AND public.is_super_admin(auth.uid())
);

CREATE POLICY "Super admin can delete platform files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'proposal-files' 
  AND (storage.foldername(name))[1] = 'platform'
  AND public.is_super_admin(auth.uid())
);