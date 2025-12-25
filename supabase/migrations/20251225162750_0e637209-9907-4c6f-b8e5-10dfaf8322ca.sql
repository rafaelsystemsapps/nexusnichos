-- Remover a constraint antiga
ALTER TABLE public.tarefa_diaria DROP CONSTRAINT IF EXISTS tarefa_diaria_dia_semana_check;

-- Adicionar nova constraint que permite valores de -7 a 6
ALTER TABLE public.tarefa_diaria ADD CONSTRAINT tarefa_diaria_dia_semana_check 
CHECK ((dia_semana >= -7) AND (dia_semana <= 6));