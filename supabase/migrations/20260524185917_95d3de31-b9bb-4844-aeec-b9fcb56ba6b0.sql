-- NEXUS v0.0.2: structural cleanup
DROP TABLE IF EXISTS public.transacoes_financeiras CASCADE;
DROP TABLE IF EXISTS public.ferramentas_trabalho CASCADE;
DROP TABLE IF EXISTS public.client_apps CASCADE;
DROP TABLE IF EXISTS public.produtos CASCADE;
DROP TABLE IF EXISTS public.resultados_app CASCADE;
DROP TABLE IF EXISTS public.pedidos CASCADE;
DROP TABLE IF EXISTS public.membros_time CASCADE;
DROP TABLE IF EXISTS public.radar_oportunidades CASCADE;
DROP TABLE IF EXISTS public.offer_vault CASCADE;
DROP TABLE IF EXISTS public.logs_aprendizado CASCADE;
DROP TABLE IF EXISTS public.lembretes_hoje CASCADE;
DROP TABLE IF EXISTS public.cemiterio CASCADE;
DROP TABLE IF EXISTS public.tarefas_cliente CASCADE;
DROP TABLE IF EXISTS public.cliente_templates CASCADE;
DROP TABLE IF EXISTS public.clientes CASCADE;
DROP TABLE IF EXISTS public.prospects CASCADE;
DROP TABLE IF EXISTS public.subtarefas_conteudo CASCADE;
DROP TABLE IF EXISTS public.conteudo_bruto CASCADE;
DROP TABLE IF EXISTS public.conteudos CASCADE;
DROP TABLE IF EXISTS public.tarefa_diaria CASCADE;
DROP TABLE IF EXISTS public.semana_logistica CASCADE;
DROP TABLE IF EXISTS public.tarefa_templates CASCADE;
DROP TABLE IF EXISTS public.biblioteca_nicho CASCADE;
DROP TABLE IF EXISTS public.aplicativos CASCADE;

DROP FUNCTION IF EXISTS public.marcar_tarefas_nao_concluidas() CASCADE;
DROP FUNCTION IF EXISTS public.encerrar_lembretes_dia() CASCADE;
DROP FUNCTION IF EXISTS public.reset_tarefas_cliente_semanal() CASCADE;

ALTER TABLE public.nichos
  DROP COLUMN IF EXISTS financeiro_habilitado,
  DROP COLUMN IF EXISTS pedidos_habilitado,
  DROP COLUMN IF EXISTS radar_habilitado,
  DROP COLUMN IF EXISTS cemiterio_habilitado,
  DROP COLUMN IF EXISTS time_habilitado,
  DROP COLUMN IF EXISTS mapa_dependencia_habilitado,
  DROP COLUMN IF EXISTS teste_rapido_habilitado,
  DROP COLUMN IF EXISTS logs_aprendizado_habilitado,
  DROP COLUMN IF EXISTS alertas_habilitado,
  DROP COLUMN IF EXISTS lembretes_hoje_habilitado,
  DROP COLUMN IF EXISTS clientes_habilitado,
  DROP COLUMN IF EXISTS apps_habilitado,
  DROP COLUMN IF EXISTS offer_vault_habilitado,
  DROP COLUMN IF EXISTS ordem_abas,
  DROP COLUMN IF EXISTS foco_do_dia;