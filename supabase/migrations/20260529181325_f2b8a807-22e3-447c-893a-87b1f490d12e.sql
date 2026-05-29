CREATE TABLE public.app_lab_apps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  app_type text NOT NULL DEFAULT 'b2b',
  category text,
  country text DEFAULT 'BR',
  status text NOT NULL DEFAULT 'active',
  description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.app_lab_apps TO authenticated;
GRANT ALL ON public.app_lab_apps TO service_role;

ALTER TABLE public.app_lab_apps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Ver apps applab"
ON public.app_lab_apps FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Criar apps applab"
ON public.app_lab_apps FOR INSERT
WITH CHECK ((user_id = auth.uid()) AND (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid()))));

CREATE POLICY "Editar apps applab"
ON public.app_lab_apps FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Deletar apps applab"
ON public.app_lab_apps FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE TRIGGER update_app_lab_apps_updated_at
BEFORE UPDATE ON public.app_lab_apps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.app_lab_clients ADD COLUMN app_id uuid;