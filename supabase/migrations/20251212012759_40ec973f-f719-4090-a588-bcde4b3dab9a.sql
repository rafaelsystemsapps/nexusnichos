-- Adicionar coluna cor na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN cor TEXT DEFAULT NULL;