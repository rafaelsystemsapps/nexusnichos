-- Adicionar campos de credenciais à tabela contas_redes_sociais
ALTER TABLE public.contas_redes_sociais
ADD COLUMN login_email TEXT DEFAULT NULL,
ADD COLUMN senha_acesso TEXT DEFAULT NULL;