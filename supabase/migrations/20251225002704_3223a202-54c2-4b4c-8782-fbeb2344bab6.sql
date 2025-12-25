-- Adicionar coluna cemiterio_habilitado na tabela nichos
ALTER TABLE nichos ADD COLUMN cemiterio_habilitado boolean NOT NULL DEFAULT false;

-- Criar tabela cemiterio (arquivo morto)
CREATE TABLE cemiterio (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  motivo text NOT NULL,
  observacao text,
  data_encerramento date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE cemiterio ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - Colaboradores podem ver itens do seu nicho
CREATE POLICY "Colaboradores podem ver cemiterio do seu nicho"
ON cemiterio FOR SELECT
USING (has_role(auth.uid(), 'admin') OR nicho_id = get_user_nicho(auth.uid()));

-- Colaboradores podem criar itens no seu nicho
CREATE POLICY "Colaboradores podem criar no cemiterio do seu nicho"
ON cemiterio FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR nicho_id = get_user_nicho(auth.uid()));

-- Colaboradores podem deletar itens do seu nicho (sem restaurar)
CREATE POLICY "Colaboradores podem deletar do cemiterio do seu nicho"
ON cemiterio FOR DELETE
USING (has_role(auth.uid(), 'admin') OR nicho_id = get_user_nicho(auth.uid()));

-- SEM política de UPDATE - itens são definitivos