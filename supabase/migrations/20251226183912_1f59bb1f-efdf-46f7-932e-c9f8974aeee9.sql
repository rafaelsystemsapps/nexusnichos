-- Adicionar coluna país na tabela de contas
ALTER TABLE public.contas_redes_sociais 
ADD COLUMN pais TEXT DEFAULT 'BR';