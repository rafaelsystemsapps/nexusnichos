-- Adicionar coluna para membro do time que processou o pedido
ALTER TABLE pedidos 
ADD COLUMN processado_por_id UUID REFERENCES membros_time(id) ON DELETE SET NULL;