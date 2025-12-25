-- Adicionar novas plataformas ao enum
ALTER TYPE plataforma_social ADD VALUE IF NOT EXISTS 'whatsapp';
ALTER TYPE plataforma_social ADD VALUE IF NOT EXISTS 'telegram';
ALTER TYPE plataforma_social ADD VALUE IF NOT EXISTS 'site';

-- Adicionar coluna telefone para WhatsApp/Telegram
ALTER TABLE public.contas_redes_sociais ADD COLUMN IF NOT EXISTS telefone text;

-- Adicionar coluna url_site para Sites
ALTER TABLE public.contas_redes_sociais ADD COLUMN IF NOT EXISTS url_site text;