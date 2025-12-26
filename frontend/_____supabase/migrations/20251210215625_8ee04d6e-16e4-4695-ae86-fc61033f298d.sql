-- Table for WhatsApp configuration per agency
CREATE TABLE public.agency_whatsapp_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL UNIQUE,
  phone_number_id text,
  access_token text,
  business_account_id text,
  webhook_verify_token text,
  is_configured boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.agency_whatsapp_config ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Agency admins can manage their WhatsApp config"
ON public.agency_whatsapp_config
FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admin can manage all WhatsApp configs"
ON public.agency_whatsapp_config
FOR ALL
USING (is_super_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_agency_whatsapp_config_updated_at
BEFORE UPDATE ON public.agency_whatsapp_config
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();