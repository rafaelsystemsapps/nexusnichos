## NEXUS v0.0.6.4 — Remove "Registrar Atividade" do módulo Contas

Patch puramente de UI/limpeza. Remove o painel **AccountQuickLog** (Registrar Atividade) da tela da conta, deixando a Rotina Operacional ocupar todo o espaço.

### Mudanças

1. **`AccountWorkspace.tsx`**
   - Remover import e render de `<AccountQuickLog />`.
   - Ajustar grid: trocar `xl:grid-cols-4` (3+1) por layout full-width para o `WeeklyOperationalTracker`.

2. **`main.tsx`**
   - `APP_VERSION = "0.0.6.4"`.

3. **Arquivos mantidos (não deletar)**
   - `AccountQuickLog.tsx` e `useAccountLogs.ts` permanecem no repo (sem referências), caso queira reintroduzir depois. Posso deletar se preferir limpeza total — me avise.

### Protegido / não tocar
- Folder Signal System, Weekly Tracker, login email, username/senha, navegação de pastas, auth, Supabase, RLS, planner, tema, sidebar.

### Resultado
Tela da conta = só credenciais + Rotina Operacional ampliada. Sem ruído de "Registrar Atividade".