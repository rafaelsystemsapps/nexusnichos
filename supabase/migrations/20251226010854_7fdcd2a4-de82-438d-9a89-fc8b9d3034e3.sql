-- Criar tabela de prospects
CREATE TABLE public.prospects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  
  -- Identificação
  nome_display text NOT NULL,
  
  -- Origem
  origem text NOT NULL DEFAULT 'instagram',
  origem_url text,
  
  -- Contato
  metodo_contato text NOT NULL DEFAULT 'dm',
  contato text,
  
  -- Status (CORE)
  status_contato text NOT NULL DEFAULT 'salvo',
  
  -- Observação
  observacao text,
  
  -- Timestamps
  data_ultimo_contato timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.prospects ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Colaboradores podem ver prospects do seu nicho"
  ON public.prospects FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem criar prospects no seu nicho"
  ON public.prospects FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem editar prospects do seu nicho"
  ON public.prospects FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem deletar prospects do seu nicho"
  ON public.prospects FOR DELETE
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

-- Trigger para updated_at
CREATE TRIGGER update_prospects_updated_at
  BEFORE UPDATE ON public.prospects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();