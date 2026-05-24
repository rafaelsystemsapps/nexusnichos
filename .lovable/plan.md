## NEXUS v0.0.6 — Weekly Operational Tracker Rebuild

### 1. Card de conta — País visível

`AccountFolderCard.tsx`: ao lado do badge de status, renderizar badge de país.
- Usar mapa `PAISES` (já existente em `AccountFormDialog`) movido para `src/lib/paises.ts` para reuso.
- Mostrar bandeira emoji + sigla (ex.: `🇧🇷 BR`). Fallback: texto puro do código.

### 2. Banco — novas tabelas (migration)

Remover dependência do checklist antigo (mantém `account_routine_items` no banco por enquanto para não perder dados, mas UI deixa de usar; pode ser removido depois).

Novas tabelas:

`account_tasks`
- `id`, `account_id`, `nicho_id`, `user_id`
- `task_name text not null`
- `is_active boolean default true`
- `created_at`, `updated_at`

`account_task_days`
- `id`, `task_id` (fk lógico), `account_id`, `nicho_id`
- `week_reference date` (segunda-feira ISO da semana)
- `weekday smallint` (0=Seg ... 6=Dom)
- `status text` check in (`pending`,`success`,`failed`) default `pending`
- `completed_at timestamptz`
- unique (`task_id`, `week_reference`, `weekday`)

RLS (mesmo padrão das outras tabelas):
- SELECT/UPDATE/DELETE: `has_role(admin) OR nicho_id = get_user_nicho(uid)`
- INSERT: idem + para `account_tasks` exigir `user_id = auth.uid()`

Índices: `(account_id)`, `(task_id, week_reference)`.

### 3. Lógica de viradas e reset semanal

Sem cron — feito client-side ao abrir a rotina:
- **Início de semana** = segunda-feira local (helper `weekStart(date)`).
- Ao carregar `useAccountTasks(accountId)`, garantir que existam linhas em `account_task_days` para a semana corrente (lazy upsert: cria as 7 linhas `pending` quando faltam ao marcar/visualizar). Estratégia: gerar dias on-demand no clique; para a grid, calcular do array recebido e tratar ausentes como `pending`.
- **Virada diária (cinza→vermelho)**: ao montar e em `setInterval` (a cada 60s e quando o dia muda), para cada dia da semana corrente **anterior a hoje** cujo status seja `pending`, fazer UPDATE em lote para `failed`. Não tocar dias futuros nem dias já `success`/`failed`.
- **Reset semanal**: nada a apagar. Nova semana = novo `week_reference`; histórico anterior permanece intacto.

### 4. UI — Weekly Operational Tracker (substitui `AccountRoutineChecklist`)

Novo componente `WeeklyOperationalTracker.tsx` em `src/components/colaborador/accounts/tracker/`:

Layout:
```
[Header: "Rotina Operacional"  + Filtros + Busca + (+ Adicionar Tarefa)]

Tarefa                           Seg  Ter  Qua  Qui  Sex  Sáb  Dom
─────────────────────────────────────────────────────────────────
Postar 3 vídeos                   ●    ●    ○    ○    ○    ○    ○
Revisar anúncios                  ●    ✕    ○    ○    ○    ○    ○
[+ Adicionar tarefa]
```

Bolinhas:
- cinza (`bg-muted`) = pending (clicável → success)
- verde (`bg-emerald-500`) = success (clicável → pending para correção)
- vermelho (`bg-red-500`) = failed (clicável → success se quiser corrigir)
- Dia atual destacado com ring sutil; dias futuros desabilitados (não clicáveis).

Sub-componentes:
- `TrackerHeader.tsx` — busca + filtros (ativas/inativas/concluídas semana/falhadas/todas) + botão `+ Adicionar Tarefa`.
- `TaskRow.tsx` — nome editável (popover), botão pause/ativar, deletar, 7 `DayDot`.
- `DayDot.tsx` — bolinha de status.
- `AddTaskInline.tsx` — input rápido com presets ("Postar 3 vídeos", "Revisar anúncios", "Responder comentários", "Subir stories", "Revisar DMs").

### 5. Mini dashboard inferior

`TrackerStats.tsx` abaixo da grid, 3 micro cards:
- **Hoje**: concluídas / pendentes / falhas
- **Semana**: total verdes, total vermelhos, taxa execução %, streak atual, melhor streak
- **Performance**: % consistência (success / total marcáveis até hoje), % falha, % execução

Cálculo client-side a partir dos dados já carregados (sem nova tabela `metrics`). Streak = dias consecutivos com ≥1 success (calculado nas últimas N semanas).

### 6. Histórico semanal (somente leitura)

Aba/seção `TrackerHistory.tsx` (collapse "Semanas anteriores"):
- Lista as últimas 8 semanas (`week_reference` distintos), com: período, total verdes, vermelhos, taxa.
- Expandindo mostra grid read-only da semana.

### 7. Hooks

Novo `src/hooks/queries/useAccountTasks.ts`:
- `useAccountTasks(accountId)` → tarefas + dias da semana corrente.
- `useCreateTask`, `useUpdateTask`, `useToggleTaskActive`, `useDeleteTask`.
- `useSetDayStatus(task_id, week_reference, weekday, status)` — upsert.
- `useAutoFailPastPendings(accountId)` — executa o varredura cinza→vermelho.
- `useTaskHistory(accountId, weeks=8)`.
- `useTrackerStats(accountId)` — derivado em memória.

Exportar em `src/hooks/queries/index.ts`. Remover exports do checklist antigo (`useRoutineItems` etc.) **após** removida a UI.

### 8. Integração no `AccountWorkspace`

- Substituir `<AccountRoutineChecklist />` por `<WeeklyOperationalTracker accountId nichoId />`.
- Manter `AccountQuickLog` + `AccountTimeline` intactos.
- Layout: tracker ocupa coluna principal (full width em mobile, 2/3 em desktop), Log+Timeline ao lado.

### 9. Limpeza

Após nova UI funcionando:
- Deletar `AccountRoutineChecklist.tsx`.
- Remover `useRoutineItems`/mutations correlatas do `useAccountRoutine.ts` e do barrel `index.ts`.
- Manter tabela `account_routine_items` no banco por segurança (não dropar para evitar perda).

### 10. Versão e cache

`src/main.tsx`:
- `APP_VERSION = "0.0.6"`
- Adicionar limpeza de chaves legadas `nexus_routine_*` no boot sweep (defensivo).

### 11. Proteções

Não alterar: auth, Supabase client/types (auto), planner v0.0.4, AppLab, sidebar/MainLayout, edge functions, rotas raiz/admin, tema, navegação de pastas de contas, AccountQuickLog/Timeline.

### Arquivos

**Criados**
- `supabase/migrations/<ts>_nexus_v006_tracker.sql`
- `src/lib/paises.ts`
- `src/hooks/queries/useAccountTasks.ts`
- `src/components/colaborador/accounts/tracker/WeeklyOperationalTracker.tsx`
- `src/components/colaborador/accounts/tracker/TrackerHeader.tsx`
- `src/components/colaborador/accounts/tracker/TaskRow.tsx`
- `src/components/colaborador/accounts/tracker/DayDot.tsx`
- `src/components/colaborador/accounts/tracker/AddTaskInline.tsx`
- `src/components/colaborador/accounts/tracker/TrackerStats.tsx`
- `src/components/colaborador/accounts/tracker/TrackerHistory.tsx`

**Editados**
- `src/components/colaborador/accounts/AccountFolderCard.tsx` (badge país)
- `src/components/colaborador/accounts/AccountFormDialog.tsx` (importar PAISES de `src/lib/paises.ts`)
- `src/components/colaborador/accounts/AccountWorkspace.tsx` (trocar checklist)
- `src/hooks/queries/index.ts`
- `src/main.tsx` (versão + sweep)

**Deletados (após validação)**
- `src/components/colaborador/accounts/AccountRoutineChecklist.tsx`
- (parcial) limpeza em `src/hooks/queries/useAccountRoutine.ts`

### Resultado esperado

Tracker semanal estilo Notion por conta, com viradas automáticas cinza→vermelho ao fim do dia, histórico preservado por `week_reference`, mini analytics leves, badge de país em cada folder.
