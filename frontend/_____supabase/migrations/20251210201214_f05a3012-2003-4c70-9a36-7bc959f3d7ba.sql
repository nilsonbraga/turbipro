-- Create pipeline_stages table for customizable pipeline
CREATE TABLE public.pipeline_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3B82F6',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_closed BOOLEAN NOT NULL DEFAULT false,
  is_lost BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Agency users can manage their pipeline stages"
  ON public.pipeline_stages
  FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all pipeline stages"
  ON public.pipeline_stages
  FOR ALL
  USING (is_super_admin(auth.uid()));

-- Add stage_id column to proposals (referencing pipeline_stages)
ALTER TABLE public.proposals ADD COLUMN stage_id UUID REFERENCES public.pipeline_stages(id);

-- Insert default pipeline stages for Voyu agency
INSERT INTO public.pipeline_stages (agency_id, name, color, "order", is_closed, is_lost) 
SELECT id, 'Novo', '#6366F1', 0, false, false FROM public.agencies WHERE name = 'Voyu'
UNION ALL
SELECT id, 'Contato', '#8B5CF6', 1, false, false FROM public.agencies WHERE name = 'Voyu'
UNION ALL
SELECT id, 'Proposta Enviada', '#EC4899', 2, false, false FROM public.agencies WHERE name = 'Voyu'
UNION ALL
SELECT id, 'Negociação', '#F59E0B', 3, false, false FROM public.agencies WHERE name = 'Voyu'
UNION ALL
SELECT id, 'Fechado', '#10B981', 4, true, false FROM public.agencies WHERE name = 'Voyu'
UNION ALL
SELECT id, 'Perdido', '#EF4444', 5, false, true FROM public.agencies WHERE name = 'Voyu';

-- Create index for better performance
CREATE INDEX idx_pipeline_stages_agency ON public.pipeline_stages(agency_id);
CREATE INDEX idx_proposals_stage ON public.proposals(stage_id);