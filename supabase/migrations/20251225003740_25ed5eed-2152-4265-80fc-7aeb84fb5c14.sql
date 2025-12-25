-- Adicionar colunas para controle de atenção (minimalista)
ALTER TABLE public.contas_redes_sociais 
ADD COLUMN IF NOT EXISTS ultima_acao text,
ADD COLUMN IF NOT EXISTS proxima_acao text;