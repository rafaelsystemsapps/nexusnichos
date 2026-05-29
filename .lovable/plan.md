# NEXUS v0.0.7.1 — App Lab Architecture Rebuild (Apps + Clients Separation)

Reestrutura o App Lab para separar **Apps** e **Clientes** como entidades distintas, com vínculo relacional (1 App → N Clientes), e três subabas: **Dashboard**, **Clientes**, **Apps**. Billing continua exclusivo B2B. Sem mudar tema, navegação externa, toggle de módulos ou demais módulos.

## Modelo relacional

```text
apps (raiz)
 └── clients (1 app → N clientes)
       └── client_billing (1:1, só B2B)
```

## 1. Banco de dados (migration)

Criar tabelas novas dedicadas (com `nicho_id` + `user_id` no padrão RLS atual via `get_user_nicho`/`has_role`):

- **app_lab_apps**: `name`, `app_type` (b2b/b2c), `category`, `country`, `status` (active/inactive/pending), `description`, `nicho_id`, `user_id`, timestamps.
- **app_lab_clients_v2** (ou reaproveitar `app_lab_clients` adicionando coluna `app_id`): adicionar `app_id uuid` referenciando o app vinculado. Para evitar perda de dados, **adiciono `app_id` à tabela `app_lab_clients` existente** e mantenho `app_type`/credenciais/status.
- **app_lab_billing**: já existe (1:1 com cliente B2B) — mantida como está.

Cada `CREATE TABLE` novo terá GRANTs (`authenticated`, `service_role`) + RLS (mesmas 4 policies por nicho) + trigger `update_updated_at_column`. Tabelas legadas `applab_apps`/`applab_account_links` permanecem intocadas (sem uso na UI).

## 2. Subnavegação interna

`AppLabWorkspace` ganha 3 abas (componente `Tabs`): **Dashboard | Clientes | Apps**. Estado de aba local, sem alterar rota.

## 3. Dashboard (aba 1)

Visão executiva leve com cards:
- Totais: total apps, total clientes, apps ativos, clientes ativos/aguardando/inativos.
- Financeiro B2B: MRR total, clientes em atraso, em dia, vencimentos próximos.
- Split B2B vs B2C.

## 4. Clientes (aba 2)

- Grid de pastas (reusa `ClientCard`), cada cliente mostra: nome, **app vinculado**, tipo, status, billing state (se B2B).
- Botão **+ Novo Cliente** → `ClientFormDialog` com:
  - Identidade: nome, tipo, país, descrição.
  - **Vinculação de App**: dropdown "Vincular app existente" OU "Criar novo app" inline (cria app e já vincula).
  - Credenciais: login, senha, observações.
  - Billing (só B2B): mensalidade, vencimento, próximo pagamento, plano.
- Filtros: nome, app vinculado, ativos, atrasados, B2B/B2C.
- `ClientDetailDialog`: identidade (com app vinculado + created_at), credenciais, billing (B2B).

## 5. Apps (aba 3)

- Grid de pastas, cada app mostra: nome, tipo, status, país, **nº de clientes vinculados**.
- Botão **+ Novo App** → `AppFormDialog`: nome, categoria, tipo, status, país, descrição, data criação.
- `AppDetailDialog` (estilo folder/subfolder): identidade do app + **clientes vinculados como subpastas** (mini-cards). Permite editar/excluir o app.
- Filtros: nome, ativos, B2B/B2C, nº clientes.

## 6. Estados visuais (padrão NEXUS)

- Ativo: normal. Inativo: opacidade reduzida. Aguardando: tom neutro/âmbar.
- Billing B2B: verde = em dia, vermelho = atrasado.

## Detalhes técnicos

**Migration** (via ferramenta de migração, com aprovação):
- `CREATE TABLE public.app_lab_apps (...)` + GRANT + RLS + trigger.
- `ALTER TABLE public.app_lab_clients ADD COLUMN app_id uuid;`

**Hooks** (`src/hooks/queries/`):
- Novo `useAppLabApps.ts`: CRUD de apps + contagem de clientes vinculados.
- Atualizar `useAppLabClients.ts`: incluir `app_id` no select/insert/update e tipo `AppLabClient.app_id`.

**Componentes** (`src/components/colaborador/applab/`):
- `AppLabWorkspace.tsx`: introduz `Tabs` (Dashboard/Clientes/Apps) e orquestra estados.
- `AppLabDashboard.tsx` (novo): cards de visão geral (consolida lógica de `AppLabStats`).
- `ClientsTab.tsx` (novo): grid + filtros + dialogs de clientes (extrai lógica atual).
- `AppsTab.tsx` (novo): grid + filtros + dialogs de apps.
- `AppCard.tsx` (novo): pasta de app com nº de clientes.
- `AppFormDialog.tsx` (novo): criar/editar app.
- `AppDetailDialog.tsx` (novo): identidade + subpastas de clientes.
- `ClientFormDialog.tsx`: adicionar seção de vinculação de app (dropdown existente / criar novo inline).
- `ClientCard.tsx`: exibir nome do app vinculado.
- Reaproveitar `AppLabFilters.tsx`/`AppLabStats.tsx` (stats migra para dashboard).

**Versão**: `src/main.tsx` → `APP_VERSION = "0.0.7.1"`.

**Protegido (não alterar)**: workspaces, module toggle, dashboard do colaborador, módulo Contas, Planner, auth, estrutura Supabase core, tema e performance.

## Resultado esperado

App Lab passa a ter Dashboard (visão geral), Clientes (pastas de clientes vinculados a apps) e Apps (pastas de apps com clientes como subpastas), com criação relacional de cliente↔app e billing apenas B2B.