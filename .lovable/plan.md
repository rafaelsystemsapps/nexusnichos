# NEXUS v0.0.7.2 — Stability & Context Recovery Fix

## Diagnóstico (causa raiz confirmada)

O erro **"Nicho não encontrado"** não é um problema de dados — é uma **race condition de autenticação**:

1. `PerfilProvider` faz o login compartilhado de forma assíncrona (`garantirSessao()` em `useEffect`).
2. Ao mesmo tempo, `ColaboradorWorkspace` monta e dispara `useNicho` com `enabled: !!nichoId` — ou seja, **imediatamente**, sem esperar a sessão.
3. Sem sessão, o RLS bloqueia a leitura: `nichos` volta vazio. Como o código usa `.maybeSingle()`, isso retorna `data: null` **sem erro**.
4. React Query marca `isLoading = false` com `nicho = null` → renderiza "Nicho não encontrado" mesmo o nicho existindo.

Após o login concluir, nada re-dispara a query a tempo de forma confiável, e em reloads o timing muda → erro "aleatório". O mesmo timing atinge AppLab/Contas (queries disparando antes da sessão).

A **dupla renderização** em desenvolvimento vem do `React.StrictMode` (comportamento intencional do React em dev, não ocorre em produção). O patch não vai removê-lo, mas vai eliminar os efeitos colaterais reais (fetches duplicados / fallback prematuro).

## O que vai ser feito

### 1. Sinal global de "auth pronta" (`useAuthReady`)
- Criar `src/hooks/useAuthReady.ts`: um hook leve baseado em React Query (`queryKey: ["auth-session"]`) que executa `garantirSessao()` + `supabase.auth.getSession()` uma única vez e expõe `{ ready, userId }`.
- `PerfilProvider` passa a consumir o mesmo mecanismo (fonte única de verdade da sessão), removendo a duplicação de lógica de login e o `ready` local solto.

### 2. Gating de TODAS as queries dependentes da sessão
Adicionar a condição de sessão pronta ao `enabled` de cada query que depende de RLS:
- `useNicho` → `enabled: ready && !!nichoId`
- `useAppLabApps`, `useAppLabClients` → `enabled: ready && !!nichoId`
- `useAccounts`, `useAccountTasks`, `useAccountLogs`, `useWorkspaceLinks`, `usePlannerNotes` → mesmo padrão

Assim nenhuma query roda antes de a sessão existir, eliminando o vazio causado pelo RLS.

### 3. Distinguir "carregando" de "inexistente" no `ColaboradorWorkspace`
Lógica atual rende erro cedo demais. Nova ordem:
```text
if (!authReady)            -> LoadingScreen   (sessão ainda subindo)
if (nicho query loading)   -> LoadingScreen
if (query success && null) -> "Nicho não encontrado"  (realmente inexistente)
if (query error)           -> estado de erro com botão "Tentar novamente"
```
Só renderiza o erro quando a query **terminou com sucesso** e retornou `null` — nunca durante loading/idle.

### 4. Guards defensivos nos componentes relacionais (App Lab)
- `AppLabWorkspace` / `AppsTab` / `ClientsTab` / `AppDetailDialog`: não montar grids/subpastas enquanto `apps`/`clients` ainda carregam; mostrar skeleton/placeholder leve.
- Verificar `app_id` / `client_id` antes de renderizar pastas vinculadas (evita render com IDs indefinidos).

### 5. Reduzir rerender em cascata (App Lab relacional)
- Memoizar listas derivadas (clientes por app, contagens, métricas do dashboard) com `useMemo`.
- Estabilizar handlers com `useCallback` onde passados a filhos.
- Garantir `key` estável em todos os `.map` de pastas/subpastas.

### 6. Error Boundary
- Criar `src/components/ErrorBoundary.tsx` (classe, com fallback de "algo deu errado / recarregar").
- Envolver o conteúdo do `MainLayout` (renderContent) — protege App Lab, Contas, Workspace e views relacionais de crash total; um módulo que falhe não derruba a workspace inteira.

### 7. Versão
- `src/main.tsx`: `APP_VERSION = "0.0.7.2"`.

## Arquivos afetados

**Criar**
- `src/hooks/useAuthReady.ts`
- `src/components/ErrorBoundary.tsx`

**Editar**
- `src/contexts/PerfilContext.tsx` (usar fonte única de sessão)
- `src/hooks/queries/useNicho.ts`, `useAppLabApps.ts`, `useAppLabClients.ts`, `useAccounts.ts`, `useAccountTasks.ts`, `useAccountLogs.ts`, `useWorkspaceLinks.ts`, `usePlannerNotes.ts` (gating em `enabled`)
- `src/pages/ColaboradorWorkspace.tsx` (loading vs not-found vs error)
- `src/components/layout/MainLayout.tsx` (ErrorBoundary ao redor do conteúdo)
- `src/components/colaborador/applab/AppLabWorkspace.tsx`, `AppsTab.tsx`, `ClientsTab.tsx`, `AppDetailDialog.tsx` (guards + memoization)
- `src/main.tsx` (versão)

## Regras de proteção (não alterar comportamento)
- App Lab, Planner, Contas, rotina operacional, auth/login invisível compartilhado, Supabase/Lovable Cloud, workspaces, tema e toggles de módulo permanecem funcionalmente idênticos.
- Sem rebuild visual. Sem mudanças de schema/migração. Sem mascarar erro — apenas corrigir a ordem de render e o timing das queries.

## Resultado esperado
- Fim do "Nicho não encontrado" falso (queries esperam a sessão).
- Fim de fetches duplicados/fallback prematuro; render previsível.
- Módulos isolados por error boundary (sem crash total).
- App Lab relacional estável, sem rerender em cascata.
