-- Create task columns table for customizable kanban columns
CREATE TABLE public.task_columns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3B82F6',
  "order" integer NOT NULL DEFAULT 0,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  column_id uuid NOT NULL REFERENCES public.task_columns(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  due_date timestamp with time zone,
  client_id uuid REFERENCES public.clients(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create task assignees table (many-to-many)
CREATE TABLE public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(task_id, user_id)
);

-- Enable RLS
ALTER TABLE public.task_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

-- RLS policies for task_columns
CREATE POLICY "Agency users can manage their task columns"
ON public.task_columns FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all task columns"
ON public.task_columns FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for tasks
CREATE POLICY "Agency users can manage their tasks"
ON public.tasks FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all tasks"
ON public.tasks FOR ALL
USING (is_super_admin(auth.uid()));

-- RLS policies for task_assignees
CREATE POLICY "Agency users can manage their task assignees"
ON public.task_assignees FOR ALL
USING (task_id IN (
  SELECT id FROM public.tasks WHERE agency_id = get_user_agency_id(auth.uid())
));

CREATE POLICY "Super admin can manage all task assignees"
ON public.task_assignees FOR ALL
USING (is_super_admin(auth.uid()));

-- Function to create default task columns for new agencies
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

-- Trigger to update updated_at
CREATE TRIGGER update_task_columns_updated_at
BEFORE UPDATE ON public.task_columns
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
BEFORE UPDATE ON public.tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();