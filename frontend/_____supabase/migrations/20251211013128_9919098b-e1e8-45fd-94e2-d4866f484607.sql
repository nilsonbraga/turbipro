-- Subscription Plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_monthly NUMERIC NOT NULL DEFAULT 0,
  price_yearly NUMERIC NOT NULL DEFAULT 0,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  max_proposals INTEGER,
  max_clients INTEGER,
  max_users INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Agency Subscriptions table
CREATE TABLE public.agency_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.subscription_plans(id),
  billing_cycle TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  grace_period_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(agency_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS for subscription_plans (everyone can read, super admin can manage)
CREATE POLICY "Everyone can read subscription plans"
ON public.subscription_plans FOR SELECT
USING (true);

CREATE POLICY "Super admin can manage subscription plans"
ON public.subscription_plans FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS for agency_subscriptions
CREATE POLICY "Agency users can view their subscription"
ON public.agency_subscriptions FOR SELECT
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all subscriptions"
ON public.agency_subscriptions FOR ALL
USING (is_super_admin(auth.uid()));

-- Add stripe_api_key to platform_settings
INSERT INTO public.platform_settings (setting_key, setting_value)
VALUES ('stripe_secret_key', '') ON CONFLICT DO NOTHING;

-- Create function to check if agency has active subscription
CREATE OR REPLACE FUNCTION public.has_active_subscription(_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.agency_subscriptions
    WHERE agency_id = _agency_id
    AND (
      status = 'active' 
      OR status = 'trialing'
      OR (status = 'past_due' AND current_period_end + (grace_period_days || ' days')::interval > now())
    )
  )
$$;

-- Update trigger for timestamps
CREATE TRIGGER update_subscription_plans_updated_at
BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agency_subscriptions_updated_at
BEFORE UPDATE ON public.agency_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();