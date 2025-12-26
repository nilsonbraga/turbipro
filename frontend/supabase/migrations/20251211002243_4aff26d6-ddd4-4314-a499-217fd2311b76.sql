-- Create table for agency Resend configuration
CREATE TABLE public.agency_resend_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL UNIQUE REFERENCES public.agencies(id) ON DELETE CASCADE,
  api_key_encrypted TEXT,
  from_email TEXT,
  from_name TEXT,
  is_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_resend_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agency admins can manage their Resend config"
ON public.agency_resend_config
FOR ALL
USING (
  agency_id = get_user_agency_id(auth.uid()) 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Super admin can manage all Resend configs"
ON public.agency_resend_config
FOR ALL
USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_agency_resend_config_updated_at
BEFORE UPDATE ON public.agency_resend_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();