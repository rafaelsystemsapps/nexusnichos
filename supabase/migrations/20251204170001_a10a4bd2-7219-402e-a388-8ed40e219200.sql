-- Adicionar coluna para membro do time responsável pela venda
ALTER TABLE public.transacoes_financeiras
ADD COLUMN membro_time_id uuid REFERENCES public.membros_time(id) ON DELETE SET NULL;