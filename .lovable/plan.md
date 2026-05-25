## NEXUS v0.0.6.6 — Workspace Module Toggle Functional Fix

O toggle em **Configurações → Módulos** já persiste corretamente no banco (`nichos.contas_habilitado`, `nichos.applab_habilitado`) e invalida a query. O bug real é que **a navegação e o roteamento ignoram essas flags**: Contas e AppLab aparecem sempre na navbar e respondem a URLs mesmo quando desabilitados.

### Diagnóstico
- `AppSidebar` monta `navItems` com Contas/AppLab fixos, sem ler `nicho`.
- `ColaboradorWorkspace.renderContent()` despacha rotas sem checar flags — usuário pode acessar `/contas` por URL mesmo com módulo OFF.
- `ConfiguracoesNichoTab.handleToggle` já tem optimistic update + rollback + invalidate. Mantém.

### Mudanças

1. **`AppSidebar.tsx`**
   - Aceitar prop opcional `nicho?: { contas_habilitado?: boolean; applab_habilitado?: boolean }`.
   - Filtrar `navItems` no `useMemo`:
     - Planejamento e Config sempre visíveis.
     - Contas só se `nicho?.contas_habilitado`.
     - AppLab só se `nicho?.applab_habilitado`.

2. **`MainLayout.tsx`**
   - Adicionar prop opcional `nicho` e repassar para `<AppSidebar nicho={nicho} ... />`.

3. **`ColaboradorWorkspace.tsx`**
   - Passar `nicho` para `<MainLayout nicho={nicho} ... />`.
   - Em `renderContent()`: se `path` começa com `contas` e `!nicho.contas_habilitado` → `<Navigate to={\`/workspace/${nichoId}\`} replace />`. Mesma regra para `applab` / `!nicho.applab_habilitado`. Bloqueia acesso direto por URL.

4. **Versão — `src/main.tsx`**
   - `APP_VERSION = "0.0.6.6"`.

### Protegido
Planner, Contas (módulo), AppLab (módulo), Configurações, signal layer das pastas, Supabase/RLS, auth, tema, layout visual. Sem migration.

### Resultado
Desativar Contas → some da navbar + URL `/contas` redireciona para Planejamento. Reativar → reaparece. Persiste após refresh (já vinha do DB; agora a UI honra).
