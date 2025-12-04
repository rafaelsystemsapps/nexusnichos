-- Permitir que colaboradores possam deletar tarefas do seu nicho
CREATE POLICY "Colaboradores podem deletar tarefas do seu nicho"
ON public.tarefa_diaria
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR EXISTS (
    SELECT 1 FROM semana_logistica s
    WHERE s.id = tarefa_diaria.semana_id 
    AND s.nicho_id = get_user_nicho(auth.uid())
  )
);