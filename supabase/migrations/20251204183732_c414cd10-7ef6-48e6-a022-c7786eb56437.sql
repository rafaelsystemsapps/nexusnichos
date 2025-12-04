-- Adicionar coluna para data da transação (quando a venda aconteceu)
ALTER TABLE public.transacoes_financeiras
ADD COLUMN data_transacao DATE NOT NULL DEFAULT CURRENT_DATE;