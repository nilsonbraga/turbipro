
-- Create enum for employment type
CREATE TYPE public.employment_type AS ENUM ('clt', 'pj', 'freela');

-- Create enum for collaborator level
CREATE TYPE public.collaborator_level AS ENUM ('junior', 'pleno', 'senior');

-- Create enum for commission base
CREATE TYPE public.commission_base AS ENUM ('sale_value', 'profit');

-- Create teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on teams
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- RLS policies for teams
CREATE POLICY "Agency users can manage their teams"
ON public.teams FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all teams"
ON public.teams FOR ALL
USING (is_super_admin(auth.uid()));

-- Create collaborators table
CREATE TABLE public.collaborators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  employment_type employment_type NOT NULL DEFAULT 'clt',
  position TEXT,
  level collaborator_level,
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  commission_base commission_base NOT NULL DEFAULT 'sale_value',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaborators
ALTER TABLE public.collaborators ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaborators
CREATE POLICY "Agency users can manage their collaborators"
ON public.collaborators FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all collaborators"
ON public.collaborators FOR ALL
USING (is_super_admin(auth.uid()));

-- Create collaborator_commissions table (for tracking commissions from closed leads)
CREATE TABLE public.collaborator_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  proposal_id UUID NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  sale_value NUMERIC NOT NULL DEFAULT 0,
  profit_value NUMERIC NOT NULL DEFAULT 0,
  commission_percentage NUMERIC NOT NULL DEFAULT 0,
  commission_base commission_base NOT NULL DEFAULT 'sale_value',
  commission_amount NUMERIC NOT NULL DEFAULT 0,
  period_month INTEGER NOT NULL,
  period_year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on collaborator_commissions
ALTER TABLE public.collaborator_commissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaborator_commissions
CREATE POLICY "Agency users can manage their collaborator commissions"
ON public.collaborator_commissions FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all collaborator commissions"
ON public.collaborator_commissions FOR ALL
USING (is_super_admin(auth.uid()));

-- Create collaborator_goals table (monthly goals per collaborator)
CREATE TABLE public.collaborator_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  collaborator_id UUID NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  target_sales_value NUMERIC NOT NULL DEFAULT 0,
  target_profit NUMERIC NOT NULL DEFAULT 0,
  target_deals_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(collaborator_id, month, year)
);

-- Enable RLS on collaborator_goals
ALTER TABLE public.collaborator_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for collaborator_goals
CREATE POLICY "Agency users can manage their collaborator goals"
ON public.collaborator_goals FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all collaborator goals"
ON public.collaborator_goals FOR ALL
USING (is_super_admin(auth.uid()));

-- Create team_goals table (monthly goals per team)
CREATE TABLE public.team_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  target_sales_value NUMERIC NOT NULL DEFAULT 0,
  target_profit NUMERIC NOT NULL DEFAULT 0,
  target_deals_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, month, year)
);

-- Enable RLS on team_goals
ALTER TABLE public.team_goals ENABLE ROW LEVEL SECURITY;

-- RLS policies for team_goals
CREATE POLICY "Agency users can manage their team goals"
ON public.team_goals FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all team goals"
ON public.team_goals FOR ALL
USING (is_super_admin(auth.uid()));

-- Add assigned_collaborator_id to proposals table for tracking who closed the deal
ALTER TABLE public.proposals ADD COLUMN assigned_collaborator_id UUID REFERENCES public.collaborators(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX idx_collaborators_agency_id ON public.collaborators(agency_id);
CREATE INDEX idx_collaborators_team_id ON public.collaborators(team_id);
CREATE INDEX idx_collaborator_commissions_collaborator_id ON public.collaborator_commissions(collaborator_id);
CREATE INDEX idx_collaborator_commissions_period ON public.collaborator_commissions(period_year, period_month);
CREATE INDEX idx_collaborator_goals_period ON public.collaborator_goals(year, month);
CREATE INDEX idx_team_goals_period ON public.team_goals(year, month);

-- Create triggers for updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON public.teams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborators_updated_at
BEFORE UPDATE ON public.collaborators
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_collaborator_goals_updated_at
BEFORE UPDATE ON public.collaborator_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_team_goals_updated_at
BEFORE UPDATE ON public.team_goals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
