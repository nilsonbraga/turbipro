-- Create expedition groups table
CREATE TABLE public.expedition_groups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  start_date DATE NOT NULL,
  duration_days INTEGER NOT NULL DEFAULT 1,
  max_participants INTEGER NOT NULL DEFAULT 10,
  description TEXT,
  public_token TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(16), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create expedition registrations table
CREATE TABLE public.expedition_registrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID NOT NULL REFERENCES public.expedition_groups(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  is_waitlist BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.expedition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_registrations ENABLE ROW LEVEL SECURITY;

-- RLS policies for expedition_groups
CREATE POLICY "Agency users can manage their expedition groups"
ON public.expedition_groups
FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all expedition groups"
ON public.expedition_groups
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can view active groups by token"
ON public.expedition_groups
FOR SELECT
USING (is_active = true);

-- RLS policies for expedition_registrations
CREATE POLICY "Agency users can manage registrations of their groups"
ON public.expedition_registrations
FOR ALL
USING (group_id IN (
  SELECT id FROM public.expedition_groups
  WHERE agency_id = get_user_agency_id(auth.uid())
));

CREATE POLICY "Super admin can manage all registrations"
ON public.expedition_registrations
FOR ALL
USING (is_super_admin(auth.uid()));

CREATE POLICY "Public can insert registrations"
ON public.expedition_registrations
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Public can view registrations"
ON public.expedition_registrations
FOR SELECT
USING (true);

-- Add indexes
CREATE INDEX idx_expedition_groups_agency ON public.expedition_groups(agency_id);
CREATE INDEX idx_expedition_groups_token ON public.expedition_groups(public_token);
CREATE INDEX idx_expedition_registrations_group ON public.expedition_registrations(group_id);

-- Trigger for updated_at
CREATE TRIGGER update_expedition_groups_updated_at
BEFORE UPDATE ON public.expedition_groups
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();