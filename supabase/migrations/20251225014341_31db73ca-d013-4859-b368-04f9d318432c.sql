-- Tabela para logs de aprendizado diário
CREATE TABLE public.logs_aprendizado (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  aprendizado TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: máximo 1 log por dia por nicho
  UNIQUE (nicho_id, data)
);

-- Índices
CREATE INDEX idx_logs_aprendizado_nicho_id ON public.logs_aprendizado(nicho_id);
CREATE INDEX idx_logs_aprendizado_data ON public.logs_aprendizado(data DESC);

-- Trigger para updated_at
CREATE TRIGGER update_logs_aprendizado_updated_at
  BEFORE UPDATE ON public.logs_aprendizado
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.logs_aprendizado ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver logs do seu nicho" 
  ON public.logs_aprendizado FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem criar logs no seu nicho" 
  ON public.logs_aprendizado FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem editar logs do seu nicho" 
  ON public.logs_aprendizado FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem deletar logs do seu nicho" 
  ON public.logs_aprendizado FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

-- Flag na tabela nichos
ALTER TABLE public.nichos ADD COLUMN logs_aprendizado_habilitado BOOLEAN NOT NULL DEFAULT false;