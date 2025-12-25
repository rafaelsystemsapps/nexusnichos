-- Adicionar coluna frequencia na tabela tarefa_templates
ALTER TABLE public.tarefa_templates
ADD COLUMN frequencia text NOT NULL DEFAULT 'diaria';

-- Comentário para documentar os valores aceitos
COMMENT ON COLUMN public.tarefa_templates.frequencia IS 'Frequencia da tarefa: diaria (7 tarefas por semana) ou semanal (1 tarefa por semana)';