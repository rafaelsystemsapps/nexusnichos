
# NEXUS v0.0.5 — Accounts & Operational Routine Rebuild

Reconstrução profunda do módulo Contas: cada conta vira uma "subpasta" navegável dentro do workspace, com dashboard próprio, checklist diário e log rápido de atividades. Remove a lógica antiga de quente/fria e simplifica status para Ativa / Desabilitada / Banida.

## 1. Banco de dados (migração Supabase)

### Refatorar `contas_redes_sociais`
- Manter a tabela e linhas existentes (compatibilidade).
- Status: continuar usando o enum atual, mas a UI passa a expor só `ativa`, `desabilitada` (mapeada para `pausada`) e `banida`. Adicionar colunas:
  - `disabled_at timestamptz null`
  - `banned_at timestamptz null`
- Remover do uso (UI) — não dropar colunas para não quebrar histórico: `status_aquecimento`, `aquecimento_ativo`, `aquecimento_meta_dias`, `aquecimento_inicio`, `media_videos`, `ultima_acao`, `proxima_acao`. Ficam dormentes no schema.
- Garantir `username` (novo) e `password` (reutilizar `senha_acesso`). Adicionar coluna `username text null` (campo @ separado de `nome_conta`).

### Novas tabelas

`account_routine_items` (checklist por conta, persistente)
- `id uuid pk`, `account_id uuid` (→ `contas_redes_sociais.id`), `nicho_id uuid`, `title text`, `status text default 'pendente'` (`pendente`/`concluida`), `completed_at timestamptz null`, `order int default 0`, `created_at`, `updated_at`.
- Reset diário **opcional via UI**: campo `recurring bool default true`. Job client-side ao abrir a conta reseta `status='pendente'` e `completed_at=null` em itens recorrentes cujo `completed_at::date < today`.

`account_logs` (registro rápido de atividade)
- `id uuid pk`, `account_id uuid`, `nicho_id uuid`, `user_id uuid`, `action_type text` (free-text com sugestões: `video_postado`, `login`, `bio`, `campanha`, `stories`, `anuncio`, `outro`), `description text null`, `created_at timestamptz default now()`.
- Index `(account_id, created_at desc)`.

### RLS (idêntico ao padrão do projeto)
- SELECT/INSERT/UPDATE/DELETE: `has_role(auth.uid(),'admin') OR nicho_id = get_user_nicho(auth.uid())`.
- `account_logs` INSERT exige `user_id = auth.uid()`.
- Triggers `update_updated_at_column` onde aplicável.

## 2. Rotas

Adicionar sub-rota navegável (sem virar slug profundo — usa o id da conta):
- `/workspace/:nichoId/contas` — grid de folder cards (lista).
- `/workspace/:nichoId/contas/:accountId` — workspace interno da conta (dashboard + rotina + log + histórico).

Atualizar `ColaboradorWorkspace.tsx` para reconhecer `subPath` começando com `contas/<id>` e renderizar `<AccountWorkspace />`.

## 3. Componentes (novos)

`src/components/colaborador/accounts/`
- `AccountsGrid.tsx` — substitui `ContasNichoTab` legado. Barra com busca por @username + filtros (Status, Plataforma, País). Grid responsivo de `AccountFolderCard`.
- `AccountFolderCard.tsx` — visual de pasta (ícone `Folder` lucide), `@username` em destaque, `nome_conta` abaixo, badge de plataforma + status. Click → navega para `/workspace/:nichoId/contas/:id`.
- `AccountFormDialog.tsx` — criar/editar conta. Campos: nome, @username, plataforma, senha (com toggle eye), país, data de criação, status. Workspace vinculado automaticamente via `nichoId` do contexto.
- `AccountWorkspace.tsx` — página interna da conta. Header com voltar + @username + plataforma + status. Seções: `AccountInfoPanel`, `AccountRoutineChecklist`, `AccountQuickLog`, `AccountTimeline`.
- `AccountInfoPanel.tsx` — plataforma, status, país, data criação, @username, senha com `PasswordField` (toggle eye, oculta por padrão). Quick actions: editar, desabilitar, marcar banida, copiar @.
- `AccountRoutineChecklist.tsx` — lista de itens (checkbox), botão "+ item", presets rápidos (postar story, subir vídeo, responder DMs, revisar bio, revisar campanha, revisar perfil, aquecer conta, validar login). Reset diário para itens `recurring`.
- `AccountQuickLog.tsx` — botão "+ Registrar atividade" abre dialog: tipo (select com presets), descrição curta opcional, salva `account_logs`.
- `AccountTimeline.tsx` — histórico cronológico: entries de `account_logs`, itens de checklist concluídos, mudanças de status (derivadas de `disabled_at`/`banned_at`/`created_at`).
- `PasswordField.tsx` (compartilhado) — input com toggle de visibilidade.

## 4. Hooks de query

`src/hooks/queries/useAccounts.ts`
- `useAccounts(nichoId, filters)` — lista com filtros e busca.
- `useAccount(accountId)` — detalhe.
- `useCreateAccount`, `useUpdateAccount`, `useDeleteAccount`, `useSetAccountStatus` (escreve `disabled_at`/`banned_at`).

`src/hooks/queries/useAccountRoutine.ts`
- `useRoutineItems(accountId)` com reset diário client-side de itens recurring antes de retornar.
- `useCreateRoutineItem`, `useToggleRoutineItem`, `useDeleteRoutineItem`.

`src/hooks/queries/useAccountLogs.ts`
- `useAccountLogs(accountId, limit)`, `useCreateAccountLog`.

Exportar em `src/hooks/queries/index.ts`.

## 5. Limpeza (remover do módulo, manter colunas no DB)

- Deletar `ContasNichoTab.tsx` antigo após migração para `AccountsGrid`.
- Remover do UI: aquecimento (fria/quente), `media_videos`, `ultima_acao`, `proxima_acao`, ordenação drag-and-drop (substituída por busca/filtros), Gmail/telefone/PIN/URL embutidos (mover para campos opcionais "Observações" se necessário — fora do escopo dessa versão).
- Limpar imports órfãos, tipos não usados, `STATUS_AQUECIMENTO`, etc.
- Remover `ContasTab` admin se referenciar campos descontinuados (verificar primeiro).

## 6. Versão & cache

- Bump `APP_VERSION` em `src/main.tsx` para `"0.0.5"`.
- Adicionar limpeza de chaves `nexus:contas:*` no boot.

## 7. Proteções

Não alterar: auth, Supabase client, PerfilContext, sidebar, tema, planner v0.0.4, AppLab, Configurações, MainLayout, edge functions, rotas raiz/admin.

## Diagrama de navegação

```text
Workspace
  └─ Contas (grid)
       ├─ + Nova Conta (dialog)
       └─ 📁 @username (folder card) ──► AccountWorkspace
                                          ├─ Info + senha (toggle)
                                          ├─ Checklist Operacional
                                          ├─ Quick Log
                                          └─ Timeline
```

## Ordem de execução

1. Migração Supabase (`account_routine_items`, `account_logs`, colunas novas em `contas_redes_sociais`).
2. Hooks (`useAccounts`, `useAccountRoutine`, `useAccountLogs`).
3. Componentes `accounts/*` + `PasswordField`.
4. Rota `/contas/:accountId` em `ColaboradorWorkspace`.
5. Substituir `ContasNichoTab` por `AccountsGrid` no entry point.
6. Bump APP_VERSION para 0.0.5 + invalidação de cache.
7. QA: criar conta, abrir folder, checklist, log, timeline, filtros, busca, toggle senha, status transitions.
