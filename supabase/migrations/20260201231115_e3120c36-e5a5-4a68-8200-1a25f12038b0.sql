-- Adicionar campo ticket_valor na tabela clientes
-- Usado quando modelo_pagamento = 'porcentagem' para armazenar o valor do ticket do cliente
ALTER TABLE clientes ADD COLUMN IF NOT EXISTS ticket_valor numeric NULL;