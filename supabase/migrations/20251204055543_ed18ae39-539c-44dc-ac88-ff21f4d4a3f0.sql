-- 1. Adicionar coluna na tabela nichos para habilitar o módulo financeiro
ALTER TABLE public.nichos
ADD COLUMN financeiro_habilitado BOOLEAN NOT NULL DEFAULT false;

-- 2. Criar tabela de transações financeiras
CREATE TABLE public.transacoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nicho_id UUID NOT NULL REFERENCES public.nichos(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    produto_nome TEXT NOT NULL CHECK (char_length(produto_nome) > 0 AND char_length(produto_nome) <= 255),
    preco_custo NUMERIC(10, 2) NOT NULL CHECK (preco_custo >= 0),
    preco_venda NUMERIC(10, 2) NOT NULL CHECK (preco_venda >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Criar índices para performance
CREATE INDEX idx_transacoes_nicho_id ON public.transacoes_financeiras(nicho_id);
CREATE INDEX idx_transacoes_created_at ON public.transacoes_financeiras(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE public.transacoes_financeiras ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS - Colaboradores podem ver transações do seu nicho
CREATE POLICY "Colaboradores podem ver transações do seu nicho"
ON public.transacoes_financeiras FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));

-- 6. Colaboradores podem criar transações no seu nicho
CREATE POLICY "Colaboradores podem criar transações no seu nicho"
ON public.transacoes_financeiras FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR (nicho_id = get_user_nicho(auth.uid())));