-- Remover políticas antigas restritivas de admin-only
DROP POLICY IF EXISTS "Admins podem criar templates" ON tarefa_templates;
DROP POLICY IF EXISTS "Admins podem editar templates" ON tarefa_templates;
DROP POLICY IF EXISTS "Admins podem deletar templates" ON tarefa_templates;

-- Novas políticas que permitem colaboradores do nicho
CREATE POLICY "Colaboradores podem criar templates no seu nicho"
ON tarefa_templates FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (nicho_id = get_user_nicho(auth.uid()))
);

CREATE POLICY "Colaboradores podem editar templates do seu nicho"
ON tarefa_templates FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (nicho_id = get_user_nicho(auth.uid()))
);

CREATE POLICY "Colaboradores podem deletar templates do seu nicho"
ON tarefa_templates FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  (nicho_id = get_user_nicho(auth.uid()))
);