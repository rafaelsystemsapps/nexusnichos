-- Tabela de aplicativos
CREATE TABLE public.aplicativos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL,
  nome text NOT NULL,
  descricao text,
  tipo_app text DEFAULT 'guia',
  status text DEFAULT 'ideia',
  tecnologias text,
  url_producao text,
  url_repositorio text,
  data_criacao date DEFAULT CURRENT_DATE,
  data_lancamento date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS para aplicativos
ALTER TABLE public.aplicativos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver apps do seu nicho"
ON public.aplicativos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar apps no seu nicho"
ON public.aplicativos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar apps do seu nicho"
ON public.aplicativos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar apps do seu nicho"
ON public.aplicativos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger para updated_at
CREATE TRIGGER update_aplicativos_updated_at
BEFORE UPDATE ON public.aplicativos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Tabela de resultados/metricas do app
CREATE TABLE public.resultados_app (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id uuid NOT NULL REFERENCES public.aplicativos(id) ON DELETE CASCADE,
  nicho_id uuid NOT NULL,
  data date DEFAULT CURRENT_DATE,
  tipo text NOT NULL,
  valor numeric,
  observacao text,
  created_at timestamptz DEFAULT now()
);

-- RLS para resultados_app
ALTER TABLE public.resultados_app ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver resultados do seu nicho"
ON public.resultados_app FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar resultados no seu nicho"
ON public.resultados_app FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar resultados do seu nicho"
ON public.resultados_app FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Adicionar app_id na tabela clientes
ALTER TABLE public.clientes ADD COLUMN app_id uuid REFERENCES public.aplicativos(id);

-- Adicionar app_id na tabela transacoes_financeiras
ALTER TABLE public.transacoes_financeiras ADD COLUMN app_id uuid REFERENCES public.aplicativos(id);

-- Adicionar apps_habilitado na tabela nichos
ALTER TABLE public.nichos ADD COLUMN apps_habilitado boolean NOT NULL DEFAULT false;