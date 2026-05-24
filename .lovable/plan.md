
# NEXUS v0.0.2 — Patch de Simplificação Estrutural

## Decisões confirmadas
- **PP Library = AppLab** → preservar intacto (vira a 4ª aba do workspace).
- **Remover Financeiro** completamente (apesar de ser uma aba atual).
- **Abas finais do workspace:** Planejamento, Contas, AppLab, Configurações.
- **Banco:** DROP estrutural completo (perda permanente de dados).

---

## 1. Módulos removidos (frontend + DB)

| Módulo | Componentes principais | Tabelas DB |
|---|---|---|
| Financeiro | `FinanceiroTab`, `FinanceiroResumoCards`, `TransacaoForm`, `TransacoesTable`, `LucroPorMembroTable`, `CustosAppsTab`, `FerramentaTrabalhoForm/Table`, `ClienteCustoForm/Item/Section`, `ProdutoForm`, `ProdutosList` | `transacoes_financeiras`, `ferramentas_trabalho`, `client_apps`, `produtos`, `resultados_app` |
| Pedidos | `PedidosTab`, `PedidoForm`, `PedidosTable`, `PedidosResumoCards` | `pedidos` |
| Gestão de Time | `TimeNichoTab` | `membros_time` |
| Radar Oportunidades | `RadarOportunidadesTab`, `RadarItemCard/Form` | `radar_oportunidades` |
| Offer Vault | `OfferVaultTab`, `OfferCard/Form` | `offer_vault` |
| Alertas de Risco | hook `useAvisoPendencia` + flag `alertas_habilitado` | — |
| Mapa de Dependência | `MapaDependencia` | — |
| Teste Rápido | `TesteRapidoTab`, `TesteRapidoForm` | — |
| Logs de Aprendizado | `LogsAprendizadoTab`, `LogAprendizadoForm` | `logs_aprendizado` |
| Lembrete de Hoje | `LembretesHojeTab`, `LembreteForm/Item/Popup` | `lembretes_hoje` |
| Cemitério | `CemiterioTab`, `CemiterioItemCard/Form` | `cemiterio` |
| Clientes (não citado, fora do escopo "manter") | `ClientesTab`, `ClienteCard/Form`, `TarefaClienteItem`, `ProspectsTab`, `ProspectCard/Form`, `ProjetoTab` | `clientes`, `cliente_templates`, `tarefas_cliente`, `prospects` |
| Conteúdo / Logística | `LogisticaSemanalTab`, `TemplateForm` | `conteudos`, `conteudo_bruto`, `subtarefas_conteudo`, `semana_logistica`, `tarefa_diaria`, `tarefa_templates`, `biblioteca_nicho` |
| Aplicativos legado | `AplicativoCard/Form/Tab`, `AppsDashboard` | `aplicativos` |

**Preservados (intactos):**
- AppLab: `AppLabTab`, `AppLabCard/Form`, `AppLabLinksManager` + tabelas `applab_apps`, `applab_account_links`
- Planejamento: `planejamentotab.tsx` (localStorage, sem DB)
- Contas: `ContasNichoTab` + `contas_redes_sociais`
- Configurações: `ConfiguracoesNichoTab` (após limpeza dos toggles obsoletos)
- Infra: auth, `profiles`, `user_roles`, `user_nichos`, `nichos`, PWA, layout, tema, edge functions de admin

---

## 2. Execução — Frontend

**Rotas (`ColaboradorWorkspace.tsx`):**
```
/workspace/:id          → PlanejamentoTab
/workspace/:id/contas   → ContasNichoTab
/workspace/:id/applab   → AppLabTab  (NOVO)
/workspace/:id/configuracoes → ConfiguracoesNichoTab
```
Remover rota `/financeiro`. Remover `/lembrete-popup/:id` do `App.tsx`.

**Sidebar (`AppSidebar.tsx`):**
- `ABAS_SIMPLES = ["contas", "planejamento", "applab", "configuracoes"]`
- Remover ícone `Wallet`/aba financeiro do `abaConfig`
- Limpar props não usadas (`pedidosHabilitado`, `radarHabilitado`, `cemiterioHabilitado`, etc.)

**Configurações (`ConfiguracoesNichoTab.tsx`):**
- Remover do `MODULOS_CONFIG`: financeiro, pedidos, radar, cemiterio, time, mapa_dependencia, teste_rapido, logs_aprendizado, alertas, clientes, apps, offer_vault, lembretes_hoje
- Manter: contas, applab
- Remover `OrdemAbasEditor` (abas agora fixas)

**Arquivos a deletar:** todos os componentes listados na tabela acima + hooks `useClientes`, `useProspects`, `useClienteApps`, `useAllClienteApps`, `useFerramentasTrabalho`, `useOfferVault`, `useAvisoPendencia`. Atualizar `src/hooks/queries/index.ts`.

**`MainLayout`:** remover injeção de `<LembretePopup>` global se existir.

**`App.tsx`:** remover imports de `LembretePopup` e rota associada.

---

## 3. Execução — Banco (migration única)

```sql
-- Drop tabelas dos módulos removidos
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

-- Drop functions órfãs
DROP FUNCTION IF EXISTS public.marcar_tarefas_nao_concluidas() CASCADE;
DROP FUNCTION IF EXISTS public.encerrar_lembretes_dia() CASCADE;
DROP FUNCTION IF EXISTS public.reset_tarefas_cliente_semanal() CASCADE;

-- Drop colunas obsoletas em nichos
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

-- Edge function weekly-logistics-cron será deletada via tool
```

Edge function `weekly-logistics-cron` removida (depende de tarefa_diaria).

---

## 4. Pós-remoção
- Limpar imports quebrados em `index.ts`, `App.tsx`, `ColaboradorWorkspace.tsx`, `AppSidebar.tsx`, `MainLayout.tsx`
- Regenerar tipos Supabase será automático após migration
- Verificar build TS para warnings

## 5. Memória
Atualizar `mem://index.md` removendo referências a módulos extintos e listando-os como permanentemente removidos.

---

## Riscos
- **Perda total de dados** em todas as tabelas dropadas. Sem rollback.
- AppLab depende apenas de `contas_redes_sociais` (via `applab_account_links.conta_id`) — preservado.
- Edge functions `create-user`, `list-profiles`, `reset-password`, `delete-user` intactas.

Pronto para implementar quando aprovar.
