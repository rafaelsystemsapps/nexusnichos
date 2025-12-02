-- Tabela para conteúdo bruto / ideias
CREATE TABLE public.conteudo_bruto (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('video', 'imagem', 'texto', 'link')),
  titulo TEXT,
  descricao TEXT,
  url_arquivo TEXT,
  responsavel_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.conteudo_bruto ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver conteúdo bruto do seu nicho"
ON public.conteudo_bruto FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar conteúdo bruto no seu nicho"
ON public.conteudo_bruto FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar conteúdo bruto do seu nicho"
ON public.conteudo_bruto FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar conteúdo bruto do seu nicho"
ON public.conteudo_bruto FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Tabela para biblioteca do nicho
CREATE TABLE public.biblioteca_nicho (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  categoria TEXT NOT NULL CHECK (categoria IN ('legenda', 'hashtag', 'cta', 'guia_identidade')),
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.biblioteca_nicho ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver biblioteca do seu nicho"
ON public.biblioteca_nicho FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar na biblioteca do seu nicho"
ON public.biblioteca_nicho FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar biblioteca do seu nicho"
ON public.biblioteca_nicho FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar da biblioteca do seu nicho"
ON public.biblioteca_nicho FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Tabela para subtarefas de conteúdo (fluxo operacional)
CREATE TABLE public.subtarefas_conteudo (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conteudo_id UUID NOT NULL REFERENCES public.conteudos(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('copy', 'edicao', 'design', 'postagem', 'outro')),
  titulo TEXT NOT NULL,
  concluida BOOLEAN NOT NULL DEFAULT false,
  responsavel_id UUID,
  observacoes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subtarefas_conteudo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Colaboradores podem ver subtarefas do seu nicho"
ON public.subtarefas_conteudo FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.conteudos c 
    WHERE c.id = conteudo_id AND c.nicho_id = get_user_nicho(auth.uid())
  )
);

CREATE POLICY "Colaboradores podem criar subtarefas no seu nicho"
ON public.subtarefas_conteudo FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.conteudos c 
    WHERE c.id = conteudo_id AND c.nicho_id = get_user_nicho(auth.uid())
  )
);

CREATE POLICY "Colaboradores podem editar subtarefas do seu nicho"
ON public.subtarefas_conteudo FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.conteudos c 
    WHERE c.id = conteudo_id AND c.nicho_id = get_user_nicho(auth.uid())
  )
);

CREATE POLICY "Colaboradores podem deletar subtarefas do seu nicho"
ON public.subtarefas_conteudo FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.conteudos c 
    WHERE c.id = conteudo_id AND c.nicho_id = get_user_nicho(auth.uid())
  )
);

-- Triggers para updated_at
CREATE TRIGGER update_conteudo_bruto_updated_at
BEFORE UPDATE ON public.conteudo_bruto
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_biblioteca_nicho_updated_at
BEFORE UPDATE ON public.biblioteca_nicho
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_subtarefas_conteudo_updated_at
BEFORE UPDATE ON public.subtarefas_conteudo
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();