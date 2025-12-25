-- Adicionar flag alertas_habilitado na tabela nichos
ALTER TABLE nichos ADD COLUMN alertas_habilitado BOOLEAN NOT NULL DEFAULT false;