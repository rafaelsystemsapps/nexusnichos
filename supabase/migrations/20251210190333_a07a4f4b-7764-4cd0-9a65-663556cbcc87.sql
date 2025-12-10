-- Create ENUM for order status
CREATE TYPE status_pedido AS ENUM ('pendente', 'enviado', 'cancelado');

-- Create pedidos table
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
  pedido_id TEXT NOT NULL,
  cliente_nome TEXT,
  produto TEXT,
  valor NUMERIC,
  status status_pedido NOT NULL DEFAULT 'pendente',
  observacoes TEXT,
  data_pedido DATE NOT NULL DEFAULT CURRENT_DATE,
  data_envio TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Colaboradores podem ver pedidos do seu nicho"
ON public.pedidos
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar pedidos no seu nicho"
ON public.pedidos
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar pedidos do seu nicho"
ON public.pedidos
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar pedidos do seu nicho"
ON public.pedidos
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Add toggle field to nichos table
ALTER TABLE public.nichos ADD COLUMN pedidos_habilitado BOOLEAN NOT NULL DEFAULT false;

-- Add trigger for updated_at
CREATE TRIGGER update_pedidos_updated_at
BEFORE UPDATE ON public.pedidos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();