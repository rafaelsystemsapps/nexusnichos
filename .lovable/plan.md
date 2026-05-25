## NEXUS v0.0.7.0 — App Lab Rebuild: App Portfolio & Client Manager

Reestrutura completa do módulo App Lab. O módulo atual (apps de teste com vínculos a contas e durações de teste) será substituído por um gestor de **Clientes/Apps** com separação B2B (com billing) vs B2C (portfólio).

Sem mudanças em: sidebar toggle logic, Contas, Planner, Auth, tema, Dashboard, workspace routing. Reaproveita o mesmo padrão visual do módulo Contas (cards/pastas, status com opacidade).

---

### 1. Banco de dados (migration)

**Tabelas atuais a manter intactas** (dados legados não serão migrados automaticamente — código antigo deixa de ler):
- `applab_apps`, `applab_account_links` permanecem no schema mas não são mais usadas. (Decisão: não dropar para não perder dados; futuras limpezas manuais.)

**Novas tabelas:**

`app_lab_clients`
- `id uuid PK`
- `nicho_id uuid NOT NULL` (workspace)
- `user_id uuid NOT NULL` (criador)
- `name text NOT NULL`
- `app_type text NOT NULL` (`b2b` | `b2c`)
- `status text NOT NULL DEFAULT 'pending'` (`active` | `inactive` | `pending`)
- `country text` (default `BR`)
- `description text`
- `login_email text`
- `password text`
- `notes text`
- `created_at`, `updated_at` (trigger updated_at)

RLS (mesmo padrão das outras tabelas do nicho):
- SELECT/INSERT/UPDATE/DELETE: `has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid())`
- INSERT exige `user_id = auth.uid()`

`app_lab_billing` (1:1 opcional com client B2B)
- `id uuid PK`
- `client_id uuid NOT NULL UNIQUE`
- `nicho_id uuid NOT NULL` (denormalizado para RLS direta)
- `monthly_value numeric(12,2)`
- `due_date date` (vencimento atual)
- `next_payment date` (próximo)
- `plan text`
- `billing_status text` (`em_dia` | `atrasado`) — derivado dinamicamente, mas armazenado como cache opcional
- `created_at`, `updated_at`

RLS por `nicho_id` (mesmo padrão). Trigger `updated_at`.

Index: `app_lab_clients(nicho_id)`, `app_lab_billing(client_id)`.

---

### 2. Frontend — estrutura de arquivos

Novos:
- `src/components/colaborador/applab/AppLabWorkspace.tsx` — container (header, stats, filtros, grid, modais)
- `src/components/colaborador/applab/ClientCard.tsx` — folder/card consistente com `AccountFolderCard`
- `src/components/colaborador/applab/ClientFormDialog.tsx` — criar/editar cliente, com seção billing condicional a B2B
- `src/components/colaborador/applab/ClientDetailDialog.tsx` — pasta aberta (Identity / Credenciais / Billing condicional)
- `src/components/colaborador/applab/AppLabStats.tsx` — mini cards (total, ativos, inativos, aguardando, B2B/B2C, MRR, em dia, atrasados)
- `src/components/colaborador/applab/AppLabFilters.tsx` — busca + chips de filtro
- `src/hooks/queries/useAppLabClients.ts` — query/mutations dos clients + join opcional com billing
- `src/lib/applab-billing.ts` — helpers `computeBillingStatus(billing)`, `daysUntil(date)`

Modificados:
- `src/components/colaborador/AppLabTab.tsx` — substitui por wrapper que renderiza `<AppLabWorkspace nichoId={...} />`. Arquivos legados (`AppLabCard.tsx`, `AppLabForm.tsx`, `AppLabLinksManager.tsx`) deletados.
- `src/main.tsx` — `APP_VERSION = "0.0.7.0"`.

Sidebar/routing: **nenhuma mudança**. O item AppLab já é exibido condicionalmente via `nicho.applab_habilitado` (v0.0.6.6) e a rota `/applab` continua apontando para o tab.

---

### 3. UX/Comportamento

**Tela inicial (`AppLabWorkspace`):**
- Header com título "App Lab" + botão `+ Novo Cliente / App` no canto direito.
- `AppLabStats` no topo (mini cards leves, sem dashboard pesado):
  - Totais: total, ativos, inativos, aguardando
  - Split: B2B / B2C
  - Receita (só se houver B2B): MRR (soma `monthly_value` de B2B ativos), em dia, atrasados
- `AppLabFilters`: busca por nome + chips (Todos · B2B · B2C · Ativos · Inativos · Aguardando · Em dia · Atrasados)
- Grid de `ClientCard`s

**Card (`ClientCard`):**
- Visual idêntico ao `AccountFolderCard` (pasta)
- Mostra: nome, badge tipo (B2B/B2C), badge status, país (bandeira via `lib/paises`)
- Aplica opacidade:
  - `pending` → tom neutro/cinza
  - `active` → normal
  - `inactive` → `opacity-60`
- Se B2B: badge billing (🟢 Em dia / 🔴 Atrasado) + "vence em X dias" se `next_payment` definido
- Click → abre `ClientDetailDialog`

**ClientFormDialog (criar/editar):**
- Seções:
  1. **Identidade**: nome, tipo (radio B2B/B2C), descrição, país (Select PAISES), data de criação
  2. **Credenciais**: login/email, senha (`PasswordField`), observação
  3. **Status**: select (ativo / inativo / aguardando)
  4. **Billing** (só visível se tipo = B2B): valor mensal, vencimento, próximo pagamento, plano
- Validação zod
- Ao salvar B2B: upsert em `app_lab_clients` + upsert em `app_lab_billing` (mesma transação via 2 calls sequenciais). Ao trocar para B2C, deletar registro de billing.

**ClientDetailDialog:**
- Abre a "pasta" — view detalhada com seções: App Identity, Credenciais, Billing (B2B only)
- Botões: Editar, Excluir
- Billing mostra status calculado em runtime

**Billing logic** (`computeBillingStatus`):
- Se `due_date` < hoje → `atrasado`
- Senão → `em_dia`
- `daysUntil(next_payment)` → label "vence em N dias" (ou "vence hoje" / "vencido há N dias")

---

### 4. Filtros

Estado local: `searchTerm`, `typeFilter`, `statusFilter`, `billingFilter`. Aplicados no `useMemo` em cima dos clients carregados.

---

### 5. Stats

Calculados em `useMemo` no `AppLabWorkspace` a partir da lista carregada (join com billing). MRR = soma de `monthly_value` apenas de B2B `active`.

---

### 6. Regras de proteção

Não tocar: `AppSidebar`, `MainLayout`, `ColaboradorWorkspace` routing, `ConfiguracoesNichoTab` toggle, módulos Contas/Planner, auth, tema, tabelas `nichos`/`contas_redes_sociais`/`planner_notes`.

---

### Ordem de execução

1. Migration (criar `app_lab_clients`, `app_lab_billing`, RLS, triggers `updated_at`) — **aguardar aprovação do usuário**.
2. Criar hooks + lib helpers.
3. Criar componentes novos (Workspace, Card, Form, Detail, Stats, Filters).
4. Substituir `AppLabTab.tsx` por wrapper.
5. Deletar arquivos legados.
6. Bump `APP_VERSION` para `0.0.7.0`.
7. Validar visual em `/workspace/{id}/applab` e fluxo criar B2B/B2C.

---

### Decisão pendente (apenas confirme antes da implementação)

- **Dados antigos** em `applab_apps` / `applab_account_links` serão **abandonados** (tabelas permanecem no banco, sem UI). OK? Se preferir dropar essas tabelas, incluo no migration.
