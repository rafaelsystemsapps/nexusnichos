-- Adicionar flag no nichos
ALTER TABLE nichos ADD COLUMN teste_rapido_habilitado BOOLEAN NOT NULL DEFAULT false;

-- Criar tabela testes_rapidos
CREATE TABLE public.testes_rapidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id UUID NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  hipotese TEXT NOT NULL,
  plataforma TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'em_teste' CHECK (status IN ('em_teste', 'funcionou', 'nao_funcionou')),
  resultado_percebido TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para busca por nicho
CREATE INDEX idx_testes_rapidos_nicho_id ON testes_rapidos(nicho_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_testes_rapidos_updated_at
  BEFORE UPDATE ON testes_rapidos
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE testes_rapidos ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Colaboradores podem ver testes do seu nicho" 
  ON testes_rapidos FOR SELECT 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem criar testes no seu nicho" 
  ON testes_rapidos FOR INSERT 
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem editar testes do seu nicho" 
  ON testes_rapidos FOR UPDATE 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));

CREATE POLICY "Colaboradores podem deletar testes do seu nicho" 
  ON testes_rapidos FOR DELETE 
  USING (has_role(auth.uid(), 'admin'::app_role) OR nicho_id = get_user_nicho(auth.uid()));