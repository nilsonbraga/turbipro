-- Add pricing fields to expedition_groups
ALTER TABLE public.expedition_groups
ADD COLUMN IF NOT EXISTS price_cash numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_installment numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS installments_count integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'BRL',
ADD COLUMN IF NOT EXISTS show_date_preference boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS included_items text[] DEFAULT NULL,
ADD COLUMN IF NOT EXISTS excluded_items text[] DEFAULT NULL;

-- Add date_preference field to expedition_registrations
ALTER TABLE public.expedition_registrations
ADD COLUMN IF NOT EXISTS date_preference text DEFAULT NULL;