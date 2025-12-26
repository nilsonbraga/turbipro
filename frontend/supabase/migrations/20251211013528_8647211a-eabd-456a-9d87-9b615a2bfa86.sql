-- Add platform_icon_url setting
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES ('platform_icon_url', '') ON CONFLICT DO NOTHING;