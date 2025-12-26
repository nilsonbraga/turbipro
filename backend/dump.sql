-- =====================================================
-- DUMP DO BANCO DE DADOS - VOYU/TURBIPRO
-- Gerado em: 2025-12-22
-- =====================================================

-- =====================================================
-- 1. TIPOS ENUM (CUSTOM TYPES)
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'agent');
CREATE TYPE public.collaborator_level AS ENUM ('junior', 'pleno', 'senior');
CREATE TYPE public.commission_base AS ENUM ('sale_value', 'profit');
CREATE TYPE public.employment_type AS ENUM ('clt', 'pj', 'freela');

-- =====================================================
-- 2. TABELAS
-- =====================================================

-- Tabela: agencies
CREATE TABLE public.agencies (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    cnpj text,
    phone text,
    email text,
    address text,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: profiles
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY,
    agency_id uuid,
    name text,
    email text,
    phone text,
    avatar_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: user_roles
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL
);

-- Tabela: clients
CREATE TABLE public.clients (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    cpf text,
    passport text,
    birth_date date,
    address text,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: pipeline_stages
CREATE TABLE public.pipeline_stages (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    "order" integer NOT NULL DEFAULT 0,
    is_closed boolean NOT NULL DEFAULT false,
    is_lost boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: proposals
CREATE TABLE public.proposals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    client_id uuid,
    user_id uuid,
    assigned_collaborator_id uuid,
    stage_id uuid,
    number integer NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'new',
    total_value numeric DEFAULT 0,
    discount numeric DEFAULT 0,
    commission_type text DEFAULT 'percentage',
    commission_value numeric DEFAULT 0,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: proposal_services
CREATE TABLE public.proposal_services (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL,
    partner_id uuid,
    type text NOT NULL,
    description text,
    origin text,
    destination text,
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    value numeric DEFAULT 0,
    cost numeric DEFAULT 0,
    commission_type text DEFAULT 'percentage',
    commission_value numeric DEFAULT 0,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: partners
CREATE TABLE public.partners (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    type text,
    email text,
    phone text,
    commission_rate numeric,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: tags
CREATE TABLE public.tags (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: proposal_tags
CREATE TABLE public.proposal_tags (
    proposal_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    PRIMARY KEY (proposal_id, tag_id)
);

-- Tabela: teams
CREATE TABLE public.teams (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: collaborators
CREATE TABLE public.collaborators (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    user_id uuid,
    team_id uuid,
    name text NOT NULL,
    email text,
    phone text,
    cpf text,
    status text NOT NULL DEFAULT 'active',
    employment_type public.employment_type NOT NULL DEFAULT 'clt',
    position text,
    level public.collaborator_level,
    commission_percentage numeric NOT NULL DEFAULT 0,
    commission_base public.commission_base NOT NULL DEFAULT 'sale_value',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: collaborator_goals
CREATE TABLE public.collaborator_goals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    collaborator_id uuid NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    target_sales_value numeric NOT NULL DEFAULT 0,
    target_profit numeric NOT NULL DEFAULT 0,
    target_deals_count integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: collaborator_commissions
CREATE TABLE public.collaborator_commissions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    collaborator_id uuid NOT NULL,
    proposal_id uuid NOT NULL,
    period_month integer NOT NULL,
    period_year integer NOT NULL,
    sale_value numeric NOT NULL DEFAULT 0,
    profit_value numeric NOT NULL DEFAULT 0,
    commission_percentage numeric NOT NULL DEFAULT 0,
    commission_base public.commission_base NOT NULL DEFAULT 'sale_value',
    commission_amount numeric NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: shift_types
CREATE TABLE public.shift_types (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    color text DEFAULT '#3B82F6',
    start_time time NOT NULL,
    end_time time NOT NULL,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: collaborator_schedules
CREATE TABLE public.collaborator_schedules (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    collaborator_id uuid NOT NULL,
    shift_type_id uuid,
    schedule_date date NOT NULL,
    start_time time,
    end_time time,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: collaborator_time_off
CREATE TABLE public.collaborator_time_off (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    collaborator_id uuid NOT NULL,
    type text NOT NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    reason text,
    status text DEFAULT 'approved',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: task_columns
CREATE TABLE public.task_columns (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    color text NOT NULL DEFAULT '#3B82F6',
    "order" integer NOT NULL DEFAULT 0,
    is_default boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: tasks
CREATE TABLE public.tasks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    column_id uuid NOT NULL,
    proposal_id uuid,
    client_id uuid,
    created_by uuid NOT NULL,
    title text NOT NULL,
    description text,
    due_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: expedition_groups
CREATE TABLE public.expedition_groups (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    destination text NOT NULL,
    description text,
    start_date date NOT NULL,
    duration_days integer NOT NULL DEFAULT 1,
    max_participants integer NOT NULL DEFAULT 10,
    price_cash numeric,
    price_installment numeric,
    installments_count integer,
    currency text DEFAULT 'BRL',
    cover_image_url text,
    carousel_images text[],
    landing_text text,
    included_items text[],
    excluded_items text[],
    testimonials jsonb DEFAULT '[]'::jsonb,
    faqs jsonb DEFAULT '[]'::jsonb,
    google_reviews_url text,
    youtube_video_url text,
    show_date_preference boolean DEFAULT false,
    is_active boolean DEFAULT true,
    public_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: expedition_registrations
CREATE TABLE public.expedition_registrations (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    group_id uuid NOT NULL,
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    date_preference text,
    status text NOT NULL DEFAULT 'confirmed',
    is_waitlist boolean NOT NULL DEFAULT false,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: custom_itineraries
CREATE TABLE public.custom_itineraries (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    client_id uuid,
    created_by uuid,
    title text NOT NULL,
    description text,
    destination text,
    cover_image_url text,
    start_date date,
    end_date date,
    status text NOT NULL DEFAULT 'draft',
    is_active boolean NOT NULL DEFAULT true,
    requires_token boolean NOT NULL DEFAULT false,
    access_token text,
    public_token text NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
    approved_at timestamp with time zone,
    approved_by text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: itinerary_days
CREATE TABLE public.itinerary_days (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    itinerary_id uuid NOT NULL,
    day_number integer NOT NULL,
    date date,
    title text,
    description text,
    location text,
    cover_image_url text,
    images text[] DEFAULT '{}',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: itinerary_items
CREATE TABLE public.itinerary_items (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day_id uuid NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    description text,
    location text,
    address text,
    start_time time,
    end_time time,
    price numeric,
    currency text DEFAULT 'BRL',
    confirmation_number text,
    booking_reference text,
    images text[],
    details jsonb DEFAULT '{}',
    sort_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: itinerary_day_feedbacks
CREATE TABLE public.itinerary_day_feedbacks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    day_id uuid NOT NULL,
    is_approved boolean,
    observation text,
    client_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: itinerary_item_feedbacks
CREATE TABLE public.itinerary_item_feedbacks (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    item_id uuid NOT NULL,
    is_approved boolean,
    observation text,
    client_name text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: financial_transactions
CREATE TABLE public.financial_transactions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    proposal_id uuid,
    client_id uuid,
    supplier_id uuid,
    created_by uuid,
    type text NOT NULL,
    category text,
    description text NOT NULL,
    total_value numeric NOT NULL DEFAULT 0,
    profit_value numeric DEFAULT 0,
    installments integer DEFAULT 1,
    current_installment integer DEFAULT 1,
    launch_date date NOT NULL DEFAULT CURRENT_DATE,
    due_date date,
    payment_date date,
    payment_method text,
    status text NOT NULL DEFAULT 'pending',
    document_name text,
    document_number text,
    details text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: suppliers
CREATE TABLE public.suppliers (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    name text NOT NULL,
    type text,
    cnpj text,
    email text,
    phone text,
    address text,
    notes text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: subscription_plans
CREATE TABLE public.subscription_plans (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    price_monthly numeric,
    price_yearly numeric,
    max_users integer,
    max_clients integer,
    max_proposals integer,
    modules text[] DEFAULT '{}',
    stripe_price_id_monthly text,
    stripe_price_id_yearly text,
    trial_days integer DEFAULT 7,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_subscriptions
CREATE TABLE public.agency_subscriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    plan_id uuid,
    coupon_id uuid,
    billing_cycle text NOT NULL DEFAULT 'monthly',
    status text NOT NULL DEFAULT 'active',
    stripe_customer_id text,
    stripe_subscription_id text,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    grace_period_days integer DEFAULT 7,
    discount_applied numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: discount_coupons
CREATE TABLE public.discount_coupons (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    code text NOT NULL UNIQUE,
    description text,
    discount_type text NOT NULL DEFAULT 'percentage',
    discount_value numeric NOT NULL DEFAULT 0,
    max_uses integer,
    current_uses integer DEFAULT 0,
    valid_from timestamp with time zone,
    valid_until timestamp with time zone,
    applicable_plans uuid[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: platform_settings
CREATE TABLE public.platform_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key text NOT NULL UNIQUE,
    setting_value text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: studio_templates
CREATE TABLE public.studio_templates (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    created_by uuid,
    template_id integer NOT NULL,
    format_id text NOT NULL,
    art_type_id text NOT NULL,
    name text NOT NULL,
    data jsonb NOT NULL DEFAULT '{}',
    colors jsonb NOT NULL DEFAULT '{}',
    icons jsonb,
    images text[] DEFAULT '{}',
    logo_url text,
    blur_level integer NOT NULL DEFAULT 24,
    is_favorite boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: public_proposal_links
CREATE TABLE public.public_proposal_links (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL,
    token text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    is_active boolean NOT NULL DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: proposal_history
CREATE TABLE public.proposal_history (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL,
    user_id uuid,
    action text NOT NULL,
    description text,
    old_value jsonb,
    new_value jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: proposal_images
CREATE TABLE public.proposal_images (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid NOT NULL,
    url text NOT NULL,
    caption text,
    created_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_resend_config
CREATE TABLE public.agency_resend_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    api_key_encrypted text,
    from_email text,
    from_name text,
    is_configured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_smtp_config
CREATE TABLE public.agency_smtp_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    smtp_host text,
    smtp_port integer DEFAULT 587,
    smtp_user text,
    smtp_pass_encrypted text,
    smtp_from_email text,
    smtp_from_name text,
    is_configured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_whatsapp_config
CREATE TABLE public.agency_whatsapp_config (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    phone_number_id text,
    access_token text,
    business_account_id text,
    webhook_verify_token text,
    is_configured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_email_oauth
CREATE TABLE public.agency_email_oauth (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    provider text NOT NULL,
    access_token text,
    refresh_token text,
    token_expires_at timestamp with time zone,
    email_address text,
    is_configured boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Tabela: agency_emails
CREATE TABLE public.agency_emails (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    agency_id uuid NOT NULL,
    user_id uuid,
    provider text NOT NULL DEFAULT 'smtp',
    message_id text,
    thread_id text,
    from_email text NOT NULL,
    from_name text,
    to_emails text[] NOT NULL,
    cc_emails text[],
    bcc_emails text[],
    subject text NOT NULL,
    body_text text,
    body_html text,
    is_read boolean DEFAULT false,
    is_starred boolean DEFAULT false,
    is_sent boolean DEFAULT false,
    folder text DEFAULT 'inbox',
    sent_at timestamp with time zone,
    received_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- =====================================================
-- 3. FUNÇÕES (FUNCTIONS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_default_pipeline_stages(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.create_default_task_columns(_agency_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.task_columns (agency_id, name, color, "order", is_default)
  VALUES
    (_agency_id, 'A Fazer', '#3B82F6', 0, true),
    (_agency_id, 'Fazendo', '#F59E0B', 1, true),
    (_agency_id, 'Feito', '#22C55E', 2, true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT agency_id FROM public.profiles WHERE id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

CREATE OR REPLACE FUNCTION public.has_active_subscription(_agency_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
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

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =====================================================
-- 4. DADOS
-- =====================================================

-- Agencies
INSERT INTO public.agencies (id, name, email, logo_url, is_active, created_at, updated_at) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Voyu', 'nilsonbragax@gmail.com', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/a1b2c3d4-e5f6-7890-abcd-ef1234567890/logo.png', true, '2025-12-10 19:59:46.183303+00', '2025-12-10 21:07:17.473+00'),
('1fe294d4-05f2-4471-9f52-1b6a941746ca', 'fly', 'flyfly@tour.com', NULL, true, '2025-12-11 01:13:42.884883+00', '2025-12-11 01:13:42.884883+00');

-- Profiles
INSERT INTO public.profiles (id, agency_id, name, email, created_at, updated_at) VALUES
('96118975-6d6b-4bdd-a97a-3a8f2ccc0ea2', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nilson Braga', 'nilsonbragax@gmail.com', '2025-12-10 19:59:46.183303+00', '2025-12-10 19:59:46.183303+00'),
('f7a276a3-2838-4899-b0aa-0149ba50567e', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Beatriz Braga', 'ba.bragax@gmail.com', '2025-12-10 21:52:03.679051+00', '2025-12-10 21:52:03.679051+00'),
('f903aa2f-540f-4423-8b9d-d2faee85d556', '1fe294d4-05f2-4471-9f52-1b6a941746ca', 'Fly', 'flyfly@tour.com', '2025-12-11 01:13:46.21867+00', '2025-12-11 01:13:46.21867+00'),
('6f7b36a8-4d5d-4ec0-bc65-3296e3fe63e3', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nilson Braga', 'comercial@voyu.com.br', '2025-12-12 21:38:20.074631+00', '2025-12-12 21:38:20.074631+00');

-- User Roles
INSERT INTO public.user_roles (id, user_id, role) VALUES
('72a3445a-3ca8-4e08-aa21-8986d94bced0', '96118975-6d6b-4bdd-a97a-3a8f2ccc0ea2', 'super_admin'),
('fc3aa498-d818-4785-97f3-82408d4080d1', 'f903aa2f-540f-4423-8b9d-d2faee85d556', 'admin'),
('3439615f-25b9-40a1-9a89-1570acb748b1', '6f7b36a8-4d5d-4ec0-bc65-3296e3fe63e3', 'admin'),
('52dd7b07-9e09-43a9-a54b-933a9d15c1d3', 'f7a276a3-2838-4899-b0aa-0149ba50567e', 'agent');

-- Clients
INSERT INTO public.clients (id, agency_id, name, email, cpf, birth_date, phone, created_at, updated_at) VALUES
('178cae51-9cba-4fb1-8342-355ce49856be', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'teste', 'teste@teste.com', '00786132302', '2025-12-09', NULL, '2025-12-10 20:02:34.813844+00', '2025-12-10 20:02:34.813844+00'),
('e7cbf587-b1a0-416a-9927-22e778f7b347', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fulanin da Vida', 'fulanin@vida.com', NULL, '2025-12-03', '88888888', '2025-12-13 14:59:54.705367+00', '2025-12-13 14:59:54.705367+00'),
('6568cd99-7f65-4b29-a1d9-95ad154c2518', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Luíza', NULL, NULL, NULL, '‪+55 85 98504‑1747‬', '2025-12-13 23:49:44.794562+00', '2025-12-13 23:49:44.794562+00');

-- Pipeline Stages
INSERT INTO public.pipeline_stages (id, agency_id, name, color, "order", is_closed, is_lost, created_at, updated_at) VALUES
('4faa7ebe-2b0f-4cc8-959d-b254a4c45aa9', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Novo', '#6366F1', 0, false, false, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00'),
('da22d4d8-f90d-4466-a5d1-a04409e5f883', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Contato', '#8B5CF6', 1, false, false, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00'),
('4f740fb3-60a4-414a-b6bb-541bc0c8b2c5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Proposta Enviada', '#EC4899', 2, false, false, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00'),
('d8c6556e-a769-4eb2-944e-7fff2ca2cdee', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Negociação', '#F59E0B', 3, false, false, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00'),
('26254755-08c8-4ed1-982f-a06767f0cb44', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fechado', '#10B981', 4, true, false, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00'),
('8385067c-1de4-4510-ae0f-927c98831cf5', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Perdido', '#EF4444', 5, false, true, '2025-12-10 20:12:13.189712+00', '2025-12-10 20:12:13.189712+00');

-- Teams
INSERT INTO public.teams (id, agency_id, name, description, is_active, created_at, updated_at) VALUES
('f1265fa5-d6c5-40d3-8227-ca90435b6540', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Vendedores', 'Equipe de vendedores', true, '2025-12-18 09:11:11.705959+00', '2025-12-18 09:11:11.705959+00'),
('76e3e9e1-f7eb-431a-bb1a-f4dc3e839a12', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Gerentes', 'Equipe de gerentes', true, '2025-12-18 09:11:11.705959+00', '2025-12-18 09:11:11.705959+00');

-- Collaborators
INSERT INTO public.collaborators (id, agency_id, user_id, team_id, name, email, status, employment_type, position, level, commission_percentage, commission_base, created_at, updated_at) VALUES
('b46a912f-38c2-49b2-8fa5-646f04d0a0a4', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '6f7b36a8-4d5d-4ec0-bc65-3296e3fe63e3', '76e3e9e1-f7eb-431a-bb1a-f4dc3e839a12', 'Nilson Braga', 'comercial@voyu.com.br', 'active', 'clt', 'Gerente', 'senior', 5, 'profit', '2025-12-18 09:11:11.705959+00', '2025-12-18 09:11:11.705959+00'),
('9f6479f5-f146-4beb-a40a-31886bd4ee00', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'f7a276a3-2838-4899-b0aa-0149ba50567e', '76e3e9e1-f7eb-431a-bb1a-f4dc3e839a12', 'Beatriz Braga', 'ba.bragax@gmail.com', 'active', 'clt', 'Gerente', 'senior', 10, 'profit', '2025-12-18 09:11:11.705959+00', '2025-12-18 09:13:01.159557+00'),
('35ffdfbf-8691-4891-8811-804c62d451cc', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '96118975-6d6b-4bdd-a97a-3a8f2ccc0ea2', '76e3e9e1-f7eb-431a-bb1a-f4dc3e839a12', 'Nilson Braga', 'nilsonbragax@gmail.com', 'active', 'clt', 'Gerente', 'senior', 10, 'profit', '2025-12-18 09:11:11.705959+00', '2025-12-18 09:13:15.429362+00');

-- Tags
INSERT INTO public.tags (id, agency_id, name, color, created_at) VALUES
('d5228c92-6de5-480d-9a96-bcc81bc1e23c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'CLIENTE VIP', '#EC4899', '2025-12-10 23:18:55.992657+00');

-- Partners
INSERT INTO public.partners (id, agency_id, name, type, commission_rate, created_at, updated_at) VALUES
('af2c6daa-de23-4ec6-920e-93825d750a9b', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Oner', 'other', 0.00, '2025-12-10 20:06:01.092803+00', '2025-12-10 20:06:01.092803+00');

-- Subscription Plans
INSERT INTO public.subscription_plans (id, name, price_monthly, price_yearly, max_users, modules, trial_days, is_active, created_at, updated_at) VALUES
('af85a0ff-0d03-407c-bc59-81b0f8f86b20', 'PLANO START', 0.5, 2, 2, ARRAY['leads', 'dashboard', 'tasks', 'clients', 'suppliers', 'tags', 'financial', 'calendar', 'communication', 'partners'], 10, true, '2025-12-11 01:56:11.613643+00', '2025-12-21 21:35:15.272147+00'),
('ff55b370-a22e-44ea-9be3-be3ca32a4f70', 'PLANO TOP DAS GALÁXIAS', 0.2, 0.5, 0, ARRAY['dashboard', 'leads', 'tasks', 'expeditions', 'itineraries', 'studio', 'clients', 'partners', 'suppliers', 'tags', 'financial', 'team', 'calendar', 'communication'], 10, true, '2025-12-11 01:41:36.425935+00', '2025-12-21 21:35:29.203544+00');

-- Agency Subscriptions
INSERT INTO public.agency_subscriptions (id, agency_id, plan_id, billing_cycle, status, current_period_start, current_period_end, grace_period_days, discount_applied, created_at, updated_at) VALUES
('a4cc661c-6184-42cd-8a95-9a21b9f528c1', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'ff55b370-a22e-44ea-9be3-be3ca32a4f70', 'monthly', 'active', '2025-12-12 20:08:31.176+00', '2026-01-11 00:00:00+00', 7, 0, '2025-12-12 20:08:36.178415+00', '2025-12-21 21:35:56.709472+00');

-- Discount Coupons
INSERT INTO public.discount_coupons (id, code, description, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, applicable_plans, is_active, created_at, updated_at) VALUES
('25a54454-bea2-420a-8e83-241cb628cd39', 'PROMO15', 'Teste cupom 15%', 'percentage', 15, 10, 0, '2025-12-11 00:00:00+00', '2025-12-23 23:59:59+00', ARRAY['ff55b370-a22e-44ea-9be3-be3ca32a4f70', 'af85a0ff-0d03-407c-bc59-81b0f8f86b20']::uuid[], true, '2025-12-12 20:53:13.945884+00', '2025-12-12 20:53:13.945884+00');

-- Platform Settings
INSERT INTO public.platform_settings (id, setting_key, setting_value, created_at, updated_at) VALUES
('d0ab9047-c9c9-45dd-81fd-dd6802420cef', 'stripe_secret_key', '', '2025-12-11 01:31:26.652588+00', '2025-12-11 01:31:26.652588+00'),
('3a6b0ded-c821-44a8-972f-28ad7c74201e', 'platform_icon_url', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/platform/icon.png?t=1765418101701', '2025-12-11 01:35:26.619457+00', '2025-12-11 01:55:01.703+00'),
('a24c6fc8-940d-4492-adef-271d7c366971', 'platform_name', 'TurbiPRO', '2025-12-11 01:08:44.467711+00', '2025-12-12 21:21:20.533+00'),
('41434b51-3af6-4b4c-a646-48a853b8e1f1', 'platform_icon', 'building2', '2025-12-11 01:08:44.467711+00', '2025-12-12 21:21:20.534+00'),
('5d29f3b5-6a40-46ba-80e9-ee17710756eb', 'trial_max_proposals', '10', '2025-12-12 21:32:19.096347+00', '2025-12-12 21:35:12.093+00'),
('552adea1-dc5c-427b-9f27-42cd2fa88fcc', 'trial_days', '7', '2025-12-12 21:32:19.096347+00', '2025-12-12 21:35:12.093+00'),
('4aaf5eaf-2437-48d9-87a3-49c4064979dd', 'trial_max_users', '2', '2025-12-12 21:32:19.096347+00', '2025-12-12 21:35:12.093+00'),
('59364956-0fa8-44b7-b257-24a457277bd5', 'trial_enabled', 'true', '2025-12-12 21:32:19.096347+00', '2025-12-12 21:35:12.093+00'),
('9cbd6804-fc0c-4697-a20f-bca25121077b', 'trial_max_clients', '10', '2025-12-12 21:32:19.096347+00', '2025-12-12 21:35:12.093+00');

-- Task Columns
INSERT INTO public.task_columns (id, agency_id, name, color, "order", is_default, created_at, updated_at) VALUES
('1f98d820-c365-466e-aa17-bf8a326f3ca9', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'A Fazer', '#3B82F6', 0, true, '2025-12-12 19:13:20.169161+00', '2025-12-12 19:13:20.169161+00'),
('9f0604a8-274b-4e9b-ad0a-4062090aa97c', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Fazendo', '#F59E0B', 1, true, '2025-12-12 19:13:20.169161+00', '2025-12-12 19:13:20.169161+00'),
('782e7a85-7bf8-4e45-9b51-48aaf0fff96a', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Feito', '#22C55E', 2, true, '2025-12-12 19:13:20.169161+00', '2025-12-12 19:13:20.169161+00');

-- Expedition Groups
INSERT INTO public.expedition_groups (id, agency_id, destination, description, start_date, duration_days, max_participants, price_cash, price_installment, installments_count, currency, cover_image_url, carousel_images, landing_text, included_items, excluded_items, testimonials, faqs, google_reviews_url, youtube_video_url, show_date_preference, is_active, public_token, created_at, updated_at) VALUES
('a3dfcbcc-dc81-4eba-b726-5e3cfe7f2dce', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Expedição Dolomitas', 'Lago de Braies, Sorapis...', '2026-03-14', 8, 1, 2100, 2500, 12, 'BRL', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765635041535-anqwhi.jpg', ARRAY['https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765635054502-b2w1ee.jpg', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765635055909-m45uu.jpg', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765635058345-7ixsvl.jpg', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765635060163-ibe8v38.jpg'], 'O lugar mais lindo que você vai ver na sua vida!', ARRAY['Passagem aérea ida e volta do Brasil para Itália', 'Transfer entre as cidades', 'Hotel 4 estrelas, ou equivalente'], ARRAY['Maleiro', 'Almoço'], '[{"name": "Nilson Braga", "photo": "https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/proposal-files/expedition-covers/1765640258586-k7wnc.PNG", "text": "teste de depoimento"}]', '[{"answer": "Responsta 1, claro", "question": "Pergunta 1"}, {"answer": "Resposta 2, óbvio", "question": "Pergunta 2"}]', 'https://g.page/r/CWLtdj-ejc5yEAE/review', 'https://www.youtube.com/watch?v=WWn4lfNQy2s', true, true, '4cf43dbab5f42c40bd7581496d5907f2', '2025-12-13 14:11:20.723499+00', '2025-12-13 15:38:02.886791+00');

-- Expedition Registrations
INSERT INTO public.expedition_registrations (id, group_id, name, email, phone, date_preference, status, is_waitlist, created_at) VALUES
('1e634cf5-736e-47ef-bda2-64c2c9506605', 'a3dfcbcc-dc81-4eba-b726-5e3cfe7f2dce', 'Fulanin da Vida', 'fulanin@vida.com', '88888888', NULL, 'em_captacao', false, '2025-12-13 14:12:05.123182+00'),
('5bc33008-e71f-4d15-b19c-d87a6e3bb6eb', 'a3dfcbcc-dc81-4eba-b726-5e3cfe7f2dce', 'Cicrano', 'cicrano@vida.comm', '99999999', NULL, 'em_captacao', false, '2025-12-13 14:15:41.796428+00'),
('e25d17bb-f935-4296-a85c-bfe839f0f628', 'a3dfcbcc-dc81-4eba-b726-5e3cfe7f2dce', 'Teste da Silva', 'teste@teste.com', '55555555555', 'nao', 'em_captacao', false, '2025-12-14 00:40:15.523594+00');

-- Custom Itineraries
INSERT INTO public.custom_itineraries (id, agency_id, client_id, title, description, destination, cover_image_url, start_date, end_date, status, is_active, requires_token, access_token, public_token, created_at, updated_at) VALUES
('7d37afda-012f-4980-b622-b1850ad425d9', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', '6568cd99-7f65-4b29-a1d9-95ad154c2518', 'Barcelona e arredores', 'Roteiro teste', 'Espanha', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/itinerary-images/covers/1766350199936-ngmfwg69t9o.jpg', '2025-12-22', '2025-12-28', 'draft', true, false, '111', 'e057f8c2605a19fc9a42f375e39266b6', '2025-12-21 14:11:21.229112+00', '2025-12-21 14:11:21.229112+00');

-- Itinerary Days
INSERT INTO public.itinerary_days (id, itinerary_id, day_number, date, title, description, location, cover_image_url, images, sort_order, created_at, updated_at) VALUES
('6a0d8bc5-f6b6-4695-bb3b-a47fd02e6eb8', '7d37afda-012f-4980-b622-b1850ad425d9', 1, '2025-12-22', 'Dia 1', 'Sagrada familia', 'Barcelona', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/itinerary-images/days/1766350240048-mecs5bnryw.jpg', '{}', 0, '2025-12-21 14:13:11.186633+00', '2025-12-21 14:13:11.186633+00');

-- Itinerary Items
INSERT INTO public.itinerary_items (id, day_id, type, title, description, location, address, start_time, end_time, currency, images, details, sort_order, created_at, updated_at) VALUES
('536cd9dd-9b8f-46ea-a71d-51ac9af8f066', '6a0d8bc5-f6b6-4695-bb3b-a47fd02e6eb8', 'hotel', 'Checkin no hotel X', 'teste', 'Teste localizacao', 'rua x', '13:14:00', '15:14:00', 'BRL', ARRAY['https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/itinerary-images/items/1766350958183-ztcij7qvxtc.jpg', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/itinerary-images/items/1766350961080-32aootut4w.jpeg', 'https://nzbvcrbmauriwtjndkpt.supabase.co/storage/v1/object/public/itinerary-images/items/1766350961538-h5ltoqhrre.png'], '{}', 0, '2025-12-21 14:14:36.863405+00', '2025-12-21 14:14:36.863405+00');

-- =====================================================
-- 5. RLS POLICIES (Row Level Security)
-- =====================================================

-- Habilitar RLS nas tabelas
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expedition_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agency_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discount_coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_templates ENABLE ROW LEVEL SECURITY;

-- Políticas para agencies
CREATE POLICY "Users can view their agency" ON public.agencies FOR SELECT USING (id = get_user_agency_id(auth.uid()));
CREATE POLICY "Super admin can do everything on agencies" ON public.agencies FOR ALL USING (is_super_admin(auth.uid()));
CREATE POLICY "Agency admins can update their agency" ON public.agencies FOR UPDATE USING ((id = get_user_agency_id(auth.uid())) AND has_role(auth.uid(), 'admin'));

-- Políticas para clients
CREATE POLICY "Agency users can manage their clients" ON public.clients FOR ALL USING (agency_id = get_user_agency_id(auth.uid()));
CREATE POLICY "Super admin can manage all clients" ON public.clients FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para proposals
CREATE POLICY "Agency users can manage their proposals" ON public.proposals FOR ALL USING (agency_id = get_user_agency_id(auth.uid()));
CREATE POLICY "Super admin can manage all proposals" ON public.proposals FOR ALL USING (is_super_admin(auth.uid()));

-- Políticas para platform_settings
CREATE POLICY "Everyone can read platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Super admin can manage platform settings" ON public.platform_settings FOR ALL USING (is_super_admin(auth.uid()));

-- =====================================================
-- FIM DO DUMP
-- =====================================================
