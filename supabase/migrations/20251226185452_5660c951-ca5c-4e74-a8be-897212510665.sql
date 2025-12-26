-- Adicionar campos para sistema de aquecimento controlado
ALTER TABLE contas_redes_sociais 
ADD COLUMN IF NOT EXISTS aquecimento_ativo BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS aquecimento_meta_dias INTEGER,
ADD COLUMN IF NOT EXISTS aquecimento_inicio DATE;