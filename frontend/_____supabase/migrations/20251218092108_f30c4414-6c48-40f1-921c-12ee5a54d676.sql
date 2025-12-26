-- Allow agency admins to view profiles of users in their agency
CREATE POLICY "Agency admins can view profiles in their agency" 
ON public.profiles 
FOR SELECT 
USING (
  agency_id = get_user_agency_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);