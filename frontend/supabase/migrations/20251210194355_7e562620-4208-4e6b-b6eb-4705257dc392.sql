-- Enum para roles
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'agent');

-- Tabela de agências
CREATE TABLE public.agencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  cnpj TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  logo_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de perfis de usuários
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE SET NULL,
  name TEXT,
  email TEXT,
  avatar_url TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de roles (separada por segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'agent',
  UNIQUE (user_id, role)
);

-- Tabela de clientes
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  passport TEXT,
  birth_date DATE,
  address TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de parceiros/fornecedores
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  type TEXT, -- hotel, airline, car_rental, etc
  email TEXT,
  phone TEXT,
  commission_rate DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de propostas
CREATE TABLE public.proposals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  number SERIAL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- new, negotiation, follow_up, closing, won, lost
  total_value DECIMAL(12,2) DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  commission_type TEXT DEFAULT 'percentage', -- percentage or fixed
  commission_value DECIMAL(12,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de serviços da proposta
CREATE TABLE public.proposal_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  partner_id UUID REFERENCES public.partners(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- flight, hotel, car, package, itinerary
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  origin TEXT,
  destination TEXT,
  value DECIMAL(12,2) DEFAULT 0,
  cost DECIMAL(12,2) DEFAULT 0,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de histórico/timeline da proposta
CREATE TABLE public.proposal_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de imagens da proposta
CREATE TABLE public.proposal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
  url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela de tags das propostas
CREATE TABLE public.proposal_tags (
  proposal_id UUID REFERENCES public.proposals(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (proposal_id, tag_id)
);

-- Função para verificar role (security definer)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Função para obter agency_id do usuário
CREATE OR REPLACE FUNCTION public.get_user_agency_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT agency_id FROM public.profiles WHERE id = _user_id
$$;

-- Função para verificar se é super_admin
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = 'super_admin'
  )
$$;

-- Trigger para criar perfil quando usuário registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', 'Novo Usuário'), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'agent');
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_tags ENABLE ROW LEVEL SECURITY;

-- RLS Policies para agencies
CREATE POLICY "Super admin can do everything on agencies" ON public.agencies
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view their agency" ON public.agencies
  FOR SELECT USING (id = public.get_user_agency_id(auth.uid()));

-- RLS Policies para profiles
CREATE POLICY "Super admin can view all profiles" ON public.profiles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

-- RLS Policies para user_roles
CREATE POLICY "Super admin can manage roles" ON public.user_roles
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT USING (user_id = auth.uid());

-- RLS Policies para clients
CREATE POLICY "Super admin can manage all clients" ON public.clients
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their clients" ON public.clients
  FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies para partners
CREATE POLICY "Super admin can manage all partners" ON public.partners
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their partners" ON public.partners
  FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies para tags
CREATE POLICY "Super admin can manage all tags" ON public.tags
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their tags" ON public.tags
  FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies para proposals
CREATE POLICY "Super admin can manage all proposals" ON public.proposals
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their proposals" ON public.proposals
  FOR ALL USING (agency_id = public.get_user_agency_id(auth.uid()));

-- RLS Policies para proposal_services
CREATE POLICY "Super admin can manage all services" ON public.proposal_services
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their proposal services" ON public.proposal_services
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM public.proposals 
      WHERE agency_id = public.get_user_agency_id(auth.uid())
    )
  );

-- RLS Policies para proposal_history
CREATE POLICY "Super admin can view all history" ON public.proposal_history
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can view their proposal history" ON public.proposal_history
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM public.proposals 
      WHERE agency_id = public.get_user_agency_id(auth.uid())
    )
  );

-- RLS Policies para proposal_images
CREATE POLICY "Super admin can manage all images" ON public.proposal_images
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their proposal images" ON public.proposal_images
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM public.proposals 
      WHERE agency_id = public.get_user_agency_id(auth.uid())
    )
  );

-- RLS Policies para proposal_tags
CREATE POLICY "Super admin can manage all proposal tags" ON public.proposal_tags
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Agency users can manage their proposal tags" ON public.proposal_tags
  FOR ALL USING (
    proposal_id IN (
      SELECT id FROM public.proposals 
      WHERE agency_id = public.get_user_agency_id(auth.uid())
    )
  );

-- Drop tabela usuarios antiga se existir
DROP TABLE IF EXISTS public.usuarios CASCADE;