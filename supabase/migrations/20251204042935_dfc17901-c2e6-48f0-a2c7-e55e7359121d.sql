-- Drop the existing admin-only delete policy
DROP POLICY IF EXISTS "Somente admins podem deletar contas" ON contas_redes_sociais;

-- Create new policy allowing collaborators to delete accounts from their niche
CREATE POLICY "Colaboradores podem deletar contas de seu nicho"
ON contas_redes_sociais
FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR (nicho_id = get_user_nicho(auth.uid()))
);