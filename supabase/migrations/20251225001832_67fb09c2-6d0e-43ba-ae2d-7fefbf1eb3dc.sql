-- Add radar_habilitado column to nichos table
ALTER TABLE public.nichos ADD COLUMN radar_habilitado boolean NOT NULL DEFAULT false;

-- Create radar_oportunidades table
CREATE TABLE public.radar_oportunidades (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  tema text NOT NULL,
  plataforma text NOT NULL,
  status_termico text NOT NULL DEFAULT 'morno',
  data_validade date,
  observacao text,
  arquivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.radar_oportunidades ENABLE ROW LEVEL SECURITY;

-- RLS Policies for radar_oportunidades
CREATE POLICY "Colaboradores podem ver radar do seu nicho"
ON public.radar_oportunidades
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar no radar do seu nicho"
ON public.radar_oportunidades
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar radar do seu nicho"
ON public.radar_oportunidades
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar do radar do seu nicho"
ON public.radar_oportunidades
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_radar_oportunidades_updated_at
BEFORE UPDATE ON public.radar_oportunidades
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();