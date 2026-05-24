## NEXUS v0.0.6.3 — Operational Signal Layer + Folder Status UX

Refinamento visual do módulo Contas. Sem rebuild, sem migrations, sem novas tabelas.

---

### 1. Folder Signal System (tela de Contas)

Cada `AccountFolderCard` passa a refletir o status operacional do dia atual via cor de borda.

**Estados derivados (por conta, no dia de hoje):**
- `pending` → ao menos 1 task ativa com `account_task_days.status = 'pending'` hoje → **borda amarela**
- `completed` → todas as tasks ativas do dia com `status = 'success'` → **borda verde**
- `neutral` → nenhuma task ativa vinculada → **borda padrão**

**Conta inativa/banida:** mesma cor + `opacity-60`, mantém clicável.

**Onde calcular:**
- Novo hook leve `useAccountsOperationalStatus(nichoId)` em `src/hooks/queries/useAccountTasks.ts`.
- Uma única query batched: busca `account_tasks` ativas do nicho + `account_task_days` da `week_reference` atual no `weekday` de hoje.
- Reduz em memória para `Map<accountId, 'pending' | 'completed' | 'neutral'>`.
- Cache React Query, invalidado pelas mutations já existentes (toggle de day status, create/delete task).

**Aplicação em `AccountFolderCard.tsx`:**
- Recebe prop `operationalStatus`.
- Classes condicionais via `cn()` na borda:
  - pending → `border-yellow-500/60 hover:border-yellow-400`
  - completed → `border-emerald-500/60 hover:border-emerald-400`
  - neutral → mantém atual
- Opacidade: `status !== 'ativa' && 'opacity-60'`.

**`AccountsGrid.tsx`:** chama o hook e passa o status para cada card.

---

### 2. Workspace da conta — limpeza e respiro

**`AccountWorkspace.tsx`:**

- **Remover** o `<AccountTimeline />` da coluna lateral (histórico vazio = ruído). O componente fica no repo mas sem uso; pode ser reintegrado depois.
- **Reorganizar grid:** trocar `lg:grid-cols-3` (2+1) por layout que dá mais espaço à rotina:
  - Tracker em largura cheia (`col-span-full`) ou `lg:grid-cols-4` com tracker em 3 e QuickLog em 1.
  - QuickLog vai para baixo (ou lateral menor), priorizando a Rotina.
- Resultado: caixa de Rotina Operacional visualmente maior, mais respiro.

---

### 3. Micro briefing na Rotina Operacional

Em `WeeklyOperationalTracker.tsx`, adicionar no topo (acima do `TrackerHeader`):

```
Como funciona
Adicione tarefas recorrentes e marque sua execução durante a semana.
Pendências ajudam a visualizar o que ainda precisa ser feito por conta.
```

Estilo: `text-xs text-muted-foreground`, título em `font-medium text-foreground/80`. Subtle, não compete com as tasks.

---

### 4. Reduzir peso do histórico dentro da rotina

- O `TrackerHistory` (últimas 8 semanas) deixa de ser renderizado inline no tracker principal.
- Substituir por um botão discreto `Ver histórico` que abre um `<Sheet>` ou `<Dialog>` sob demanda.
- Histórico continua salvo no banco (sem mudança de dados).

---

### Arquivos a editar

- `src/hooks/queries/useAccountTasks.ts` — novo `useAccountsOperationalStatus(nichoId)`.
- `src/hooks/queries/index.ts` — export do novo hook.
- `src/components/colaborador/accounts/AccountsGrid.tsx` — consumir hook, passar status.
- `src/components/colaborador/accounts/AccountFolderCard.tsx` — borda condicional + opacidade.
- `src/components/colaborador/accounts/AccountWorkspace.tsx` — remover Timeline, reorganizar grid.
- `src/components/colaborador/accounts/tracker/WeeklyOperationalTracker.tsx` — micro briefing + histórico em sheet.

### Protegido (não tocar)

Auth, Supabase, planner, AppLab, sidebar, tema, edge functions, schema, RLS, login email, username/senha, navegação de pastas, lógica do tracker semanal (apenas reposicionamento do histórico).

### Versão

`APP_VERSION = "0.0.6.3"` em `src/main.tsx`.
