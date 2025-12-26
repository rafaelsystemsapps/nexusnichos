
-- Criar tabela principal applab_apps
CREATE TABLE public.applab_apps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  nome_app TEXT NOT NULL,
  descricao_curta TEXT,
  status_teste TEXT NOT NULL DEFAULT 'em_analise' CHECK (status_teste IN ('em_analise', 'em_teste', 'validado', 'descartado')),
  usuarios_ativos INTEGER DEFAULT 0,
  usuarios_ativos_atualizado_em TIMESTAMP WITH TIME ZONE,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de vinculação applab_account_links
CREATE TABLE public.applab_account_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id UUID NOT NULL REFERENCES public.applab_apps(id) ON DELETE CASCADE,
  conta_id UUID NOT NULL REFERENCES public.contas_redes_sociais(id) ON DELETE CASCADE,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  status_vinculo TEXT NOT NULL DEFAULT 'ativo' CHECK (status_vinculo IN ('ativo', 'pausado')),
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(app_id, conta_id)
);

-- Adicionar flag applab_habilitado na tabela nichos
ALTER TABLE public.nichos ADD COLUMN applab_habilitado BOOLEAN NOT NULL DEFAULT false;

-- Habilitar RLS
ALTER TABLE public.applab_apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applab_account_links ENABLE ROW LEVEL SECURITY;

-- RLS policies para applab_apps
CREATE POLICY "Colaboradores podem ver apps do seu nicho"
ON public.applab_apps FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar apps no seu nicho"
ON public.applab_apps FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar apps do seu nicho"
ON public.applab_apps FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar apps do seu nicho"
ON public.applab_apps FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- RLS policies para applab_account_links
CREATE POLICY "Colaboradores podem ver links do seu nicho"
ON public.applab_account_links FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar links no seu nicho"
ON public.applab_account_links FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar links do seu nicho"
ON public.applab_account_links FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar links do seu nicho"
ON public.applab_account_links FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger para updated_at
CREATE TRIGGER update_applab_apps_updated_at
BEFORE UPDATE ON public.applab_apps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
