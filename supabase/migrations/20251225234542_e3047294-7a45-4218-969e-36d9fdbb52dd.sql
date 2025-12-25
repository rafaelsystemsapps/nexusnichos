-- Criar enum para modelo de pagamento
CREATE TYPE public.modelo_pagamento AS ENUM ('porcentagem', 'valor_fixo');

-- Adicionar novos campos na tabela clientes
ALTER TABLE public.clientes 
ADD COLUMN modelo_pagamento public.modelo_pagamento,
ADD COLUMN valor_contrato numeric,
ADD COLUMN app_url text,
ADD COLUMN data_inicio_parceria date;