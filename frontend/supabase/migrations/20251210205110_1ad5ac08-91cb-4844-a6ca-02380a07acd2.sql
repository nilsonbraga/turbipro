-- Add commission fields to proposal_services
ALTER TABLE public.proposal_services 
ADD COLUMN IF NOT EXISTS commission_type text DEFAULT 'percentage',
ADD COLUMN IF NOT EXISTS commission_value numeric DEFAULT 0;

-- Create public_proposals table for shareable links
CREATE TABLE IF NOT EXISTS public.public_proposal_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  expires_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.public_proposal_links ENABLE ROW LEVEL SECURITY;

-- Policy for agency users to manage their proposal links
CREATE POLICY "Agency users can manage their proposal links" 
ON public.public_proposal_links 
FOR ALL 
USING (proposal_id IN (
  SELECT id FROM proposals WHERE agency_id = get_user_agency_id(auth.uid())
));

-- Policy for public access to view proposals via token (no auth needed)
CREATE POLICY "Anyone can view active proposal links" 
ON public.public_proposal_links 
FOR SELECT 
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Super admin policy
CREATE POLICY "Super admin can manage all proposal links" 
ON public.public_proposal_links 
FOR ALL 
USING (is_super_admin(auth.uid()));