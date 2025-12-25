-- Adicionar campos de Gmail vinculado
ALTER TABLE public.contas_redes_sociais
ADD COLUMN gmail_email text,
ADD COLUMN gmail_senha text;