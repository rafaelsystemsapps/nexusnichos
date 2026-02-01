-- Criar tabela workspace_links para links do projeto
CREATE TABLE workspace_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text,
  title text NOT NULL DEFAULT 'Link',
  url text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nicho_id, type)
);

-- Trigger para updated_at
CREATE TRIGGER workspace_links_updated_at
  BEFORE UPDATE ON workspace_links
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE workspace_links ENABLE ROW LEVEL SECURITY;

-- SELECT: Colaboradores podem ver links do seu nicho
CREATE POLICY "Colaboradores podem ver links do seu nicho"
ON workspace_links FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- INSERT: Colaboradores podem criar links no seu nicho
CREATE POLICY "Colaboradores podem criar links no seu nicho"
ON workspace_links FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- UPDATE: Colaboradores podem editar links do seu nicho
CREATE POLICY "Colaboradores podem editar links do seu nicho"
ON workspace_links FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);

-- DELETE: Colaboradores podem deletar links do seu nicho
CREATE POLICY "Colaboradores podem deletar links do seu nicho"
ON workspace_links FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR nicho_id = get_user_nicho(auth.uid())
);