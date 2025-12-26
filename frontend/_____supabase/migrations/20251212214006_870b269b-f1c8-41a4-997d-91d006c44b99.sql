-- Allow authenticated users to create agencies (needed for self-registration)
CREATE POLICY "Authenticated users can create agencies"
ON public.agencies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow users to update their own agency (if they're the agency admin)
CREATE POLICY "Agency admins can update their agency"
ON public.agencies
FOR UPDATE
TO authenticated
USING (id = get_user_agency_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (id = get_user_agency_id(auth.uid()) AND has_role(auth.uid(), 'admin'::app_role));