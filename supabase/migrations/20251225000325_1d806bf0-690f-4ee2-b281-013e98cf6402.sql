-- Add avatar customization columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_emoji text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS avatar_color text DEFAULT NULL;