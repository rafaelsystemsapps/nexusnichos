
# NEXUS v0.0.4 — Daily Workspace Planner Rebuild

Reconstruir o módulo de Planejamento como um planner operacional diário baseado em sticky notes, persistido no Supabase, vinculado por workspace (nicho) e dia.

## 1. Banco de dados (Supabase migration)

Criar tabela `planner_notes`:

- `id` uuid pk
- `user_id` uuid (auth.users) — criador da nota
- `nicho_id` uuid (workspace ativa)
- `title` text nullable
- `description` text nullable
- `status` text default `'pendente'` (`pendente` | `concluida`)
- `due_day` date not null default `current_date` — dia ao qual a nota pertence
- `horario` time nullable — horário opcional
- `completed_at` timestamptz nullable
- `recovered_from` uuid nullable (referencia outra nota — duplicada)
- `is_recovered` boolean default false
- `archived` boolean default false
- `created_at`, `updated_at` timestamptz

RLS:
- SELECT/INSERT/UPDATE/DELETE: `has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid())`
- INSERT exige `user_id = auth.uid()`

Índices: `(nicho_id, due_day)`, `(nicho_id, status, due_day)`.
Trigger `update_updated_at_column` no UPDATE.

## 2. Remoção da lógica antiga

Remover de `planejamentotab.tsx`:
- Bloco "Vídeos hoje" (meta + contador)
- Bloco "Tarefas" baseado em localStorage
- Bloco "Ideias" baseado em localStorage
- Todas as chaves `nexus_tarefas_*`, `nexus_ideias_*`, `nexus_meta_videos_*`, `nexus_videos_hoje_*`, `nexus_data_hoje_*`

Limpeza opcional: bump `APP_VERSION` em `src/main.tsx` para `0.0.4` para invalidar essas chaves legadas no boot.

## 3. Nova arquitetura de componentes

```text
src/components/colaborador/planner/
  PlannerBoard.tsx          → board do dia atual + grid de sticky notes
  StickyNoteCard.tsx        → card individual (título, descrição, hora, checkbox)
  StickyNoteEditor.tsx      → dialog/inline editor (criar/editar)
  RecoverNotesPanel.tsx     → painel "Recuperar Notas Não Feitas" (dia anterior)
  PlannerStats.tsx          → mini dashboard (hoje + semana)
  PlannerHistory.tsx        → histórico read-only por data
src/hooks/queries/
  usePlannerNotes.ts        → queries/mutations (lista por dia, criar, toggle, recuperar, deletar)
```

`planejamentotab.tsx` vira shell:
- Header com data atual + botão **+ Nova Nota**
- `RecoverNotesPanel` (se existirem pendentes do dia anterior)
- `PlannerBoard` (grid responsivo de sticky notes do dia)
- `PlannerStats` (mini cards no rodapé)
- Acesso a `PlannerHistory` via toggle/aba secundária

## 4. Comportamento

**Criação:** botão "+ Nova Nota" abre editor inline/dialog → cria nota com `due_day = today`, `nicho_id = atual`, `user_id = auth.uid()`.

**Conclusão:** checkbox no card → UPDATE `status='concluida'`, `completed_at=now()`. Feedback visual: opacidade reduzida + ícone check + título riscado. Permanece visível no board do dia.

**Edição:** clique no card abre editor (título, descrição, horário).

**Exclusão:** ícone trash → DELETE.

**Rollover diário:**
- Queries filtram sempre por `due_day = current_date` (frontend usa `new Date()` local).
- Não há mutação automática à meia-noite — basta o filtro por dia.
- Re-fetch ao montar e ao mudar de dia detectado (interval leve checando data).

**Recuperação:**
- `RecoverNotesPanel` faz query: notas com `status='pendente'`, `due_day < today`, `archived=false`, mesmo `nicho_id`, limit ~30 mais recentes.
- Ações: "Recuperar" individual, "Recuperar selecionadas", "Recuperar todas".
- Recuperar = INSERT nova nota com mesmos `title/description/horario`, `due_day=today`, `recovered_from=<id original>`, `is_recovered=true`. Original permanece intacto (não move, duplica).

**Filtro por workspace:** o módulo opera sempre na workspace ativa (`nichoId` da rota). Não há filtro "todas" cross-workspace — fora do escopo do módulo (cada workspace tem seu planner).

## 5. Mini dashboard (`PlannerStats`)

Cards compactos calculados via queries agregadas:

- **Hoje:** criadas hoje / concluídas hoje / pendentes hoje
- **Semana (últimos 7 dias):** concluídas / recuperadas / % produtividade (`concluidas / criadas`)

Implementação: 1-2 queries `select status, is_recovered, due_day` filtradas por intervalo + agregação client-side (volumes baixos).

## 6. Histórico (`PlannerHistory`)

- Lista de dias (últimos 30) agrupados por `due_day`
- Para cada dia: total criadas, concluídas, não concluídas, recuperadas
- Read-only, expandível para ver títulos das notas
- Acesso secundário (ex: link "Ver histórico" no rodapé do board)

## 7. Visual / UX

- Grid responsivo: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`
- Sticky note: quadrado/levemente retangular, bg `bg-card` com sutil tint amarelo (`bg-yellow-50/5` no tema dark), borda arredondada, sombra leve, hover lift
- Tokens semânticos (sem cores hardcoded fora do tema)
- Mobile-friendly (toque grande no checkbox, editor em dialog full-screen no mobile)
- Animação leve ao concluir (fade + scale)
- Empty state: "Nenhuma nota hoje. Comece pelo +"

## 8. Proteção (não tocar)

Auth, Supabase client, roteamento, sidebar, tema, AppLab, Contas, Configurações, MainLayout, PerfilContext, edge functions.

## 9. Plano de execução

1. **Migration Supabase** — criar `planner_notes` + RLS + índices + trigger.
2. **Hook** `usePlannerNotes` com queries: `notesByDay`, `pendingFromPreviousDays`, `weekStats`, `historyByRange` + mutations create/update/toggle/recover/delete.
3. **Componentes** `StickyNoteCard`, `StickyNoteEditor`, `PlannerBoard`, `RecoverNotesPanel`, `PlannerStats`, `PlannerHistory`.
4. **Refatorar** `planejamentotab.tsx` para novo shell.
5. **Bump** `APP_VERSION → 0.0.4` em `main.tsx` (limpa chaves legadas).
6. **QA visual**: criar nota, concluir, recuperar do dia anterior, ver stats, ver histórico, mobile.

## Notas técnicas

- `due_day` em date local; usar `format(new Date(), 'yyyy-MM-dd')` (date-fns já presente) consistentemente em queries.
- React Query keys: `['planner', nichoId, 'day', dueDay]`, `['planner', nichoId, 'pending-prev']`, `['planner', nichoId, 'week']`, `['planner', nichoId, 'history', range]`. Invalidar coordenadamente após mutations.
- Sem realtime nesta versão (manter leve).
