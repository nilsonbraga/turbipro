-- Create platform settings table for super admin customizations
CREATE TABLE public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Super admin can manage platform settings
CREATE POLICY "Super admin can manage platform settings"
ON public.platform_settings
FOR ALL
USING (is_super_admin(auth.uid()));

-- Everyone can read platform settings (for sidebar display)
CREATE POLICY "Everyone can read platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Insert default values
INSERT INTO public.platform_settings (setting_key, setting_value) VALUES
  ('platform_name', 'TravelCRM'),
  ('platform_icon', 'plane');

-- Create default pipeline stages for agency function
CREATE OR REPLACE FUNCTION public.create_default_pipeline_stages(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.pipeline_stages (agency_id, name, color, "order", is_closed, is_lost)
  VALUES
    (_agency_id, 'Novo', '#3B82F6', 0, false, false),
    (_agency_id, 'Contato', '#8B5CF6', 1, false, false),
    (_agency_id, 'Proposta', '#F59E0B', 2, false, false),
    (_agency_id, 'Negociação', '#EC4899', 3, false, false),
    (_agency_id, 'Fechado', '#22C55E', 4, true, false),
    (_agency_id, 'Perdido', '#EF4444', 5, false, true);
END;
$$;