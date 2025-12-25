-- Add clientes_habilitado flag to nichos table
ALTER TABLE public.nichos ADD COLUMN IF NOT EXISTS clientes_habilitado boolean NOT NULL DEFAULT false;

-- Create enum types for client module
DO $$ BEGIN
  CREATE TYPE public.tipo_cliente AS ENUM ('influencer', 'negocio_local');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_cliente AS ENUM ('rodando', 'pausado', 'finalizado');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.meta_status AS ENUM ('on_track', 'atencao', 'longe');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE public.status_tarefa_cliente AS ENUM ('pendente', 'feito');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create clientes table
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo public.tipo_cliente NOT NULL DEFAULT 'influencer',
  status public.status_cliente NOT NULL DEFAULT 'rodando',
  instagram_url text,
  tiktok_url text,
  outro_link_label text,
  outro_link_url text,
  link_principal text,
  meta_descricao text,
  meta_valor numeric,
  meta_status public.meta_status NOT NULL DEFAULT 'on_track',
  observacao_texto text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create tarefas_cliente table
CREATE TABLE public.tarefas_cliente (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  descricao text NOT NULL,
  status public.status_tarefa_cliente NOT NULL DEFAULT 'pendente',
  responsavel text,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create cliente_templates table
CREATE TABLE public.cliente_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  tipo public.tipo_cliente NOT NULL DEFAULT 'influencer',
  tarefas_base jsonb DEFAULT '[]'::jsonb,
  campos_padrao jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefas_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cliente_templates ENABLE ROW LEVEL SECURITY;

-- RLS policies for clientes
CREATE POLICY "Colaboradores podem ver clientes do seu nicho"
ON public.clientes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar clientes no seu nicho"
ON public.clientes FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar clientes do seu nicho"
ON public.clientes FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar clientes do seu nicho"
ON public.clientes FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- RLS policies for tarefas_cliente
CREATE POLICY "Colaboradores podem ver tarefas do seu nicho"
ON public.tarefas_cliente FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS (
  SELECT 1 FROM public.clientes c
  WHERE c.id = tarefas_cliente.cliente_id AND c.nicho_id = get_user_nicho(auth.uid())
)));

CREATE POLICY "Colaboradores podem criar tarefas no seu nicho"
ON public.tarefas_cliente FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS (
  SELECT 1 FROM public.clientes c
  WHERE c.id = tarefas_cliente.cliente_id AND c.nicho_id = get_user_nicho(auth.uid())
)));

CREATE POLICY "Colaboradores podem editar tarefas do seu nicho"
ON public.tarefas_cliente FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS (
  SELECT 1 FROM public.clientes c
  WHERE c.id = tarefas_cliente.cliente_id AND c.nicho_id = get_user_nicho(auth.uid())
)));

CREATE POLICY "Colaboradores podem deletar tarefas do seu nicho"
ON public.tarefas_cliente FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (EXISTS (
  SELECT 1 FROM public.clientes c
  WHERE c.id = tarefas_cliente.cliente_id AND c.nicho_id = get_user_nicho(auth.uid())
)));

-- RLS policies for cliente_templates
CREATE POLICY "Colaboradores podem ver templates do seu nicho"
ON public.cliente_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Admins podem criar templates"
ON public.cliente_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Admins podem editar templates"
ON public.cliente_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Admins podem deletar templates"
ON public.cliente_templates FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Create trigger for updated_at on clientes
CREATE TRIGGER update_clientes_updated_at
BEFORE UPDATE ON public.clientes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function for weekly reset of tasks
CREATE OR REPLACE FUNCTION public.reset_tarefas_cliente_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE tarefas_cliente
  SET status = 'pendente'
  WHERE status = 'feito';
  
  UPDATE clientes
  SET meta_status = 'on_track', updated_at = now()
  WHERE meta_status != 'on_track';
END;
$$;