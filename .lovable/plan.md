## NEXUS v0.0.6.5 — Linked Gmail Credentials Extension

Estender credenciais da conta com Gmail vinculado, **reaproveitando** as colunas já existentes `gmail_email` e `gmail_senha` em `contas_redes_sociais`. Zero migration.

### 1. Hooks — `src/hooks/queries/useAccounts.ts`
- Adicionar `gmail_email: string | null` e `gmail_senha: string | null` à interface `AccountRow`.
- Estender `AccountInput` com os mesmos campos (opcionais).
- Persistir os campos nos payloads de `useCreateAccount` e `useUpdateAccount` (string vazia → `null`).

### 2. Form — `AccountFormDialog.tsx`
Adicionar bloco leve **"Gmail Vinculado (Opcional)"** abaixo do bloco de Senha:
- Toggle `has_linked_gmail` (Switch). Estado inicial = `!!account?.gmail_email`.
- Quando ligado: inputs `Gmail` (email) + `Senha Gmail` (`PasswordField`).
- Quando desligado: campos ocultos; no submit, enviar `gmail_email: null, gmail_senha: null` (remove vínculo).
- Quando ligado mas Gmail vazio: bloquear submit com toast.

### 3. Workspace — `AccountWorkspace.tsx`
Adicionar sub-bloco **"Gmail Access"** dentro do Info panel, abaixo da Senha, separado por divisor sutil:
- Se `account.gmail_email` existir → mostrar Gmail (com copy) + `PasswordField` readOnly/allowCopy para `gmail_senha`.
- Se não existir → estado leve: texto "Sem Gmail vinculado" + botão pequeno **"Adicionar Gmail"** que abre o `AccountFormDialog` em modo edit.

### 4. Busca — `AccountsGrid.tsx`
Incluir `gmail_email` e `login_email` no haystack do filtro de busca (sem mudar UI/placeholder).

### 5. Versão — `src/main.tsx`
- `APP_VERSION = "0.0.6.5"`.

### Protegido (não tocar)
Folder Signal System, WeeklyOperationalTracker, login_email já existente em DB, planner, sidebar, auth, RLS, tema, performance, layout geral.

### Banco
**Sem migration.** Reaproveitar `gmail_email` e `gmail_senha` (já existem na `contas_redes_sociais`). Sem nova coluna `has_linked_gmail` — derivado de `gmail_email != null`.
