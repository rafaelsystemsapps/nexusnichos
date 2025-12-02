-- Create table for organizational team members (separate from system users)
CREATE TABLE public.membros_time (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  especialidade TEXT,
  contato TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.membros_time ENABLE ROW LEVEL SECURITY;

-- Admins can manage all members
CREATE POLICY "Admins podem gerenciar membros" ON public.membros_time
FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Colaboradores can view members of their nicho
CREATE POLICY "Colaboradores podem ver membros do seu nicho" ON public.membros_time
FOR SELECT USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  nicho_id = get_user_nicho(auth.uid())
);

-- Colaboradores can create members in their nicho
CREATE POLICY "Colaboradores podem criar membros no seu nicho" ON public.membros_time
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  nicho_id = get_user_nicho(auth.uid())
);

-- Colaboradores can update members in their nicho
CREATE POLICY "Colaboradores podem editar membros do seu nicho" ON public.membros_time
FOR UPDATE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  nicho_id = get_user_nicho(auth.uid())
);

-- Colaboradores can delete members in their nicho
CREATE POLICY "Colaboradores podem deletar membros do seu nicho" ON public.membros_time
FOR DELETE USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  nicho_id = get_user_nicho(auth.uid())
);

-- Create trigger for updated_at
CREATE TRIGGER update_membros_time_updated_at
BEFORE UPDATE ON public.membros_time
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();