-- Criar função que marca tarefas não concluídas ao final do dia
CREATE OR REPLACE FUNCTION public.marcar_tarefas_nao_concluidas()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE tarefa_diaria
  SET status = 'nao_concluida', updated_at = now()
  WHERE data = CURRENT_DATE
    AND status IN ('pendente', 'em_andamento');
END;
$$;