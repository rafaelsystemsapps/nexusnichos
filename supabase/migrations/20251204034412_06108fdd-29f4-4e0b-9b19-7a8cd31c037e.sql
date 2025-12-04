-- Adicionar novos campos para contas
ALTER TABLE contas_redes_sociais 
ADD COLUMN IF NOT EXISTS tipo_conteudo text,
ADD COLUMN IF NOT EXISTS media_videos integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS status_aquecimento text DEFAULT 'media';

-- Adicionar conta_id opcional na tarefa_templates (NULL = tarefa geral)
ALTER TABLE tarefa_templates
ADD COLUMN IF NOT EXISTS conta_id uuid REFERENCES contas_redes_sociais(id) ON DELETE SET NULL;