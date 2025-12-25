-- Adicionar coluna ordem para persistir a ordem das contas
ALTER TABLE public.contas_redes_sociais ADD COLUMN IF NOT EXISTS ordem integer DEFAULT 0;