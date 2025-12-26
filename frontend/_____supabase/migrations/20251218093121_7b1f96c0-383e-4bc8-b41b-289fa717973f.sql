-- Allow agency admins to INSERT roles for users in their agency
CREATE POLICY "Agency admins can insert roles in their agency" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.agency_id = get_user_agency_id(auth.uid())
  )
);

-- Allow agency admins to view roles of users in their agency
CREATE POLICY "Agency admins can view roles in their agency" 
ON public.user_roles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  AND user_id IN (
    SELECT profiles.id FROM profiles WHERE profiles.agency_id = get_user_agency_id(auth.uid())
  )
);