-- Add trial settings to platform_settings
INSERT INTO platform_settings (setting_key, setting_value) VALUES
  ('trial_enabled', 'true'),
  ('trial_days', '7'),
  ('trial_max_users', '2'),
  ('trial_max_clients', '10'),
  ('trial_max_proposals', '10')
ON CONFLICT (setting_key) DO NOTHING;

-- Add unique constraint on setting_key if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'platform_settings_setting_key_key'
  ) THEN
    ALTER TABLE platform_settings ADD CONSTRAINT platform_settings_setting_key_key UNIQUE (setting_key);
  END IF;
END $$;