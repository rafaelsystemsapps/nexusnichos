-- Add validation and test duration fields to applab_account_links
ALTER TABLE public.applab_account_links
ADD COLUMN IF NOT EXISTS validando TEXT,
ADD COLUMN IF NOT EXISTS duracao_teste TEXT DEFAULT '7_dias',
ADD COLUMN IF NOT EXISTS data_inicio_teste TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Add check constraint for duracao_teste values
ALTER TABLE public.applab_account_links
ADD CONSTRAINT applab_account_links_duracao_teste_check
CHECK (duracao_teste IN ('7_dias', '30_dias', '3_meses'));