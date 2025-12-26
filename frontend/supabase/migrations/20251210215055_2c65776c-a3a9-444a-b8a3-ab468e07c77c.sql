-- Allow agency admins to update roles of users in their agency
CREATE POLICY "Agency admins can update roles in their agency"
ON public.user_roles
FOR UPDATE
USING (
  has_role(auth.uid(), 'admin') AND
  user_id IN (
    SELECT id FROM public.profiles 
    WHERE agency_id = get_user_agency_id(auth.uid())
  )
);