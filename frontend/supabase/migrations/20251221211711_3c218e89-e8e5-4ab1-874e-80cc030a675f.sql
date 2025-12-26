-- Add modules column to subscription_plans table
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS modules text[] DEFAULT '{}'::text[];

-- Update existing plans to have all modules by default
UPDATE public.subscription_plans 
SET modules = ARRAY['dashboard', 'leads', 'tasks', 'expeditions', 'itineraries', 'studio', 'clients', 'partners', 'suppliers', 'tags', 'financial', 'team', 'calendar', 'communication']
WHERE modules IS NULL OR modules = '{}';

COMMENT ON COLUMN public.subscription_plans.modules IS 'List of module keys that are included in this plan';