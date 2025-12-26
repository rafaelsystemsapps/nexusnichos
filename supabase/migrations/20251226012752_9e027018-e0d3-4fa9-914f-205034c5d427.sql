-- Adicionar coluna para habilitar/desabilitar Dashboard
ALTER TABLE public.nichos 
ADD COLUMN dashboard_habilitado boolean NOT NULL DEFAULT true;