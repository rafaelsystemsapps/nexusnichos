-- Adicionar coluna vezes_por_semana para controle flexível
ALTER TABLE public.tarefa_templates
ADD COLUMN vezes_por_semana integer NOT NULL DEFAULT 7;

-- Migrar dados existentes baseado na frequencia
UPDATE public.tarefa_templates 
SET vezes_por_semana = CASE 
  WHEN frequencia = 'semanal' THEN 1 
  ELSE 7 
END;

-- Comentário para documentar
COMMENT ON COLUMN public.tarefa_templates.vezes_por_semana IS 'Quantas vezes por semana a tarefa deve ser feita (1-7)';