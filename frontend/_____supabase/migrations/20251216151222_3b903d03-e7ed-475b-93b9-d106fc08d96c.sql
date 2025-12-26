-- Create studio_templates table for saving all template data
CREATE TABLE public.studio_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  format_id TEXT NOT NULL,
  art_type_id TEXT NOT NULL,
  template_id INTEGER NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  colors JSONB NOT NULL DEFAULT '{}'::jsonb,
  icons JSONB DEFAULT NULL,
  blur_level INTEGER NOT NULL DEFAULT 24,
  images TEXT[] DEFAULT '{}',
  logo_url TEXT DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.studio_templates ENABLE ROW LEVEL SECURITY;

-- Agency users can manage their studio templates
CREATE POLICY "Agency users can manage their studio templates"
ON public.studio_templates
FOR ALL
USING (agency_id = get_user_agency_id(auth.uid()));

-- Super admin can manage all studio templates
CREATE POLICY "Super admin can manage all studio templates"
ON public.studio_templates
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_studio_templates_updated_at
BEFORE UPDATE ON public.studio_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for studio template images
INSERT INTO storage.buckets (id, name, public) VALUES ('studio-templates', 'studio-templates', true);

-- Storage policies for studio templates bucket
CREATE POLICY "Agency users can upload studio template images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'studio-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Agency users can update their studio template images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'studio-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Agency users can delete their studio template images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'studio-templates' AND auth.uid() IS NOT NULL);

CREATE POLICY "Studio template images are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'studio-templates');