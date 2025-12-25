-- Adicionar coluna para armazenar a ordem das abas por nicho
ALTER TABLE public.nichos 
ADD COLUMN ordem_abas TEXT[] DEFAULT NULL;