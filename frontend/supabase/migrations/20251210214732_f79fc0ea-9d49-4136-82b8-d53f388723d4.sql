-- Create update_updated_at_column function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Table for SMTP configuration per agency
CREATE TABLE public.agency_smtp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL UNIQUE,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_user text,
  smtp_pass_encrypted text,
  smtp_from_name text,
  smtp_from_email text,
  is_configured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_smtp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agency admins can manage their SMTP config"
ON public.agency_smtp_config
FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admin can manage all SMTP configs"
ON public.agency_smtp_config
FOR ALL
USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_agency_smtp_config_updated_at
BEFORE UPDATE ON public.agency_smtp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();