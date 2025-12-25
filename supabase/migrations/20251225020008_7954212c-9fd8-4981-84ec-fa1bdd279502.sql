-- Add time_habilitado column to nichos table
ALTER TABLE public.nichos 
ADD COLUMN time_habilitado boolean NOT NULL DEFAULT true;