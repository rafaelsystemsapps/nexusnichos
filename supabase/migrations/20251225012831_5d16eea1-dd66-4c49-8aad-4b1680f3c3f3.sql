-- Adicionar flag mapa_dependencia_habilitado na tabela nichos
ALTER TABLE nichos ADD COLUMN mapa_dependencia_habilitado BOOLEAN NOT NULL DEFAULT false;