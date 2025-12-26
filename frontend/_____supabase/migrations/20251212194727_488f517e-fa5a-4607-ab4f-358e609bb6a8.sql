-- Add trial_days to subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0;

-- Create discount coupons table
CREATE TABLE public.discount_coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC NOT NULL DEFAULT 0,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  applicable_plans UUID[], -- null means all plans
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add coupon_id to agency_subscriptions
ALTER TABLE public.agency_subscriptions 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.discount_coupons(id),
ADD COLUMN IF NOT EXISTS discount_applied NUMERIC DEFAULT 0;

-- Enable RLS on discount_coupons
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;

-- RLS for discount_coupons (everyone can read active coupons, super admin can manage)
CREATE POLICY "Everyone can read active coupons"
ON public.discount_coupons FOR SELECT
USING (is_active = true);

CREATE POLICY "Super admin can manage all coupons"
ON public.discount_coupons FOR ALL
USING (is_super_admin(auth.uid()));

-- Add trigger for updated_at
CREATE TRIGGER update_discount_coupons_updated_at
BEFORE UPDATE ON public.discount_coupons
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();