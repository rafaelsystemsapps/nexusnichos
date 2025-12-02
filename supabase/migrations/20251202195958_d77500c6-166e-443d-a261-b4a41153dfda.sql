-- Create enum for task status
CREATE TYPE status_tarefa AS ENUM ('pendente', 'em_andamento', 'concluida', 'nao_concluida');

-- Create task templates table (predefined tasks per niche)
CREATE TABLE public.tarefa_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  ordem INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create weekly log table
CREATE TABLE public.semana_logistica (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  semana_fim DATE NOT NULL,
  semana_numero INTEGER NOT NULL,
  ano INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa', 'finalizada')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(nicho_id, semana_numero, ano)
);

-- Create daily tasks table
CREATE TABLE public.tarefa_diaria (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  semana_id UUID NOT NULL REFERENCES public.semana_logistica(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.tarefa_templates(id) ON DELETE CASCADE,
  dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  data DATE NOT NULL,
  status status_tarefa NOT NULL DEFAULT 'pendente',
  responsavel_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(semana_id, template_id, dia_semana)
);

-- Enable RLS on all tables
ALTER TABLE public.tarefa_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semana_logistica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tarefa_diaria ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tarefa_templates
CREATE POLICY "Colaboradores podem ver templates do seu nicho"
ON public.tarefa_templates FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Admins podem criar templates"
ON public.tarefa_templates FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem editar templates"
ON public.tarefa_templates FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins podem deletar templates"
ON public.tarefa_templates FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for semana_logistica
CREATE POLICY "Colaboradores podem ver semanas do seu nicho"
ON public.semana_logistica FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Sistema pode criar semanas"
ON public.semana_logistica FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Sistema pode atualizar semanas"
ON public.semana_logistica FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- RLS Policies for tarefa_diaria
CREATE POLICY "Colaboradores podem ver tarefas do seu nicho"
ON public.tarefa_diaria FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.semana_logistica s 
    WHERE s.id = tarefa_diaria.semana_id 
    AND s.nicho_id = get_user_nicho(auth.uid())
  )
);

CREATE POLICY "Colaboradores podem criar tarefas no seu nicho"
ON public.tarefa_diaria FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.semana_logistica s 
    WHERE s.id = tarefa_diaria.semana_id 
    AND s.nicho_id = get_user_nicho(auth.uid())
  )
);

CREATE POLICY "Colaboradores podem atualizar tarefas do seu nicho"
ON public.tarefa_diaria FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  EXISTS (
    SELECT 1 FROM public.semana_logistica s 
    WHERE s.id = tarefa_diaria.semana_id 
    AND s.nicho_id = get_user_nicho(auth.uid())
  )
);

-- Create triggers for updated_at
CREATE TRIGGER update_tarefa_templates_updated_at
BEFORE UPDATE ON public.tarefa_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_semana_logistica_updated_at
BEFORE UPDATE ON public.semana_logistica
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tarefa_diaria_updated_at
BEFORE UPDATE ON public.tarefa_diaria
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();