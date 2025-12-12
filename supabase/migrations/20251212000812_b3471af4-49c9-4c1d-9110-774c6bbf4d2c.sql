
-- Criar tabela de produtos cadastrados
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  preco_custo_padrao NUMERIC DEFAULT 0,
  preco_venda_padrao NUMERIC DEFAULT 0,
  descricao TEXT,
  ativa BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- RLS policies para produtos
CREATE POLICY "Colaboradores podem ver produtos do seu nicho"
ON public.produtos FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem criar produtos no seu nicho"
ON public.produtos FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem editar produtos do seu nicho"
ON public.produtos FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

CREATE POLICY "Colaboradores podem deletar produtos do seu nicho"
ON public.produtos FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_produtos_updated_at
BEFORE UPDATE ON public.produtos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar policy DELETE para transacoes_financeiras
CREATE POLICY "Colaboradores podem deletar transações do seu nicho"
ON public.transacoes_financeiras FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));
