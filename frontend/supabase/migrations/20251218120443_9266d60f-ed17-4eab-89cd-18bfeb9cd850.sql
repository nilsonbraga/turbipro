-- Create table for shift types (tipos de plantão)
CREATE TABLE public.shift_types (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  color text DEFAULT '#3B82F6',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create table for collaborator schedules (escalas)
CREATE TABLE public.collaborator_schedules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  shift_type_id uuid REFERENCES public.shift_types(id) ON DELETE SET NULL,
  schedule_date date NOT NULL,
  start_time time,
  end_time time,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(collaborator_id, schedule_date)
);

-- Create table for time off (férias/folgas)
CREATE TABLE public.collaborator_time_off (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  collaborator_id uuid NOT NULL REFERENCES public.collaborators(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vacation', 'day_off', 'sick_leave', 'other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  reason text,
  status text DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shift_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.collaborator_time_off ENABLE ROW LEVEL SECURITY;

-- RLS policies for shift_types
CREATE POLICY "Agency users can manage their shift types"
ON public.shift_types FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all shift types"
ON public.shift_types FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for collaborator_schedules
CREATE POLICY "Agency users can manage their schedules"
ON public.collaborator_schedules FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all schedules"
ON public.collaborator_schedules FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for collaborator_time_off
CREATE POLICY "Agency users can manage their time off"
ON public.collaborator_time_off FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all time off"
ON public.collaborator_time_off FOR ALL
USING (is_super_admin(auth.uid()));

-- Create indexes
CREATE INDEX idx_shift_types_agency ON public.shift_types(agency_id);
CREATE INDEX idx_collaborator_schedules_agency ON public.collaborator_schedules(agency_id);
CREATE INDEX idx_collaborator_schedules_date ON public.collaborator_schedules(schedule_date);
CREATE INDEX idx_collaborator_schedules_collaborator ON public.collaborator_schedules(collaborator_id);
CREATE INDEX idx_collaborator_time_off_agency ON public.collaborator_time_off(agency_id);
CREATE INDEX idx_collaborator_time_off_dates ON public.collaborator_time_off(start_date, end_date);