-- Adicionar flag de ativação para módulo Controle de Contas
ALTER TABLE nichos ADD COLUMN contas_habilitado BOOLEAN NOT NULL DEFAULT true;