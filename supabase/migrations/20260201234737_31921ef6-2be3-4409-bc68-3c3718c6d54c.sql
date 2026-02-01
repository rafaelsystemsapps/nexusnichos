-- Criar tabela ferramentas_trabalho
CREATE TABLE public.ferramentas_trabalho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  periodicidade text NOT NULL DEFAULT 'mensal',
  categoria text DEFAULT 'outros',
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ferramentas_trabalho ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Colaboradores podem ver ferramentas do seu nicho"
ON public.ferramentas_trabalho
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar ferramentas no seu nicho"
ON public.ferramentas_trabalho
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar ferramentas do seu nicho"
ON public.ferramentas_trabalho
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar ferramentas do seu nicho"
ON public.ferramentas_trabalho
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger para updated_at
CREATE TRIGGER update_ferramentas_trabalho_updated_at
BEFORE UPDATE ON public.ferramentas_trabalho
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();