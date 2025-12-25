-- Add column to enable module per nicho
ALTER TABLE public.nichos 
ADD COLUMN lembretes_hoje_habilitado BOOLEAN NOT NULL DEFAULT false;

-- Create table for daily reminders
CREATE TABLE public.lembretes_hoje (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  descricao TEXT NOT NULL CHECK (char_length(descricao) <= 200),
  prioridade TEXT NOT NULL DEFAULT 'media' CHECK (prioridade IN ('alta', 'media', 'baixa')),
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida', 'encerrada')),
  data_criacao DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.lembretes_hoje ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Colaboradores podem ver lembretes do seu nicho"
ON public.lembretes_hoje FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar lembretes no seu nicho"
ON public.lembretes_hoje FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar lembretes do seu nicho"
ON public.lembretes_hoje FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar lembretes do seu nicho"
ON public.lembretes_hoje FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger for updated_at
CREATE TRIGGER update_lembretes_hoje_updated_at
BEFORE UPDATE ON public.lembretes_hoje
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to close pending reminders at day end (to be called via cron)
CREATE OR REPLACE FUNCTION public.encerrar_lembretes_dia()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE lembretes_hoje
  SET status = 'encerrada', updated_at = now()
  WHERE data_criacao < CURRENT_DATE
    AND status = 'pendente';
END;
$$;