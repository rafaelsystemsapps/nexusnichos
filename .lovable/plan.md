
## Plano: Remover Módulo Dashboard do Sistema

### Resumo

Remover completamente o módulo Dashboard do Colaborador, incluindo o componente, hooks associados, referências na sidebar, rotas e configurações. A rota raiz do workspace (`/workspace/:nichoId`) passará a redirecionar para a primeira aba habilitada.

---

### Arquivos Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/DashboardNichoTab.tsx` | **DELETAR** |
| `src/components/colaborador/FocoDoDia.tsx` | **DELETAR** |
| `src/components/colaborador/AlertasRisco.tsx` | **DELETAR** |
| `src/hooks/queries/useDashboardTarefas.ts` | **DELETAR** |
| `src/hooks/queries/index.ts` | **MODIFICAR** - remover export do useDashboardTarefas |
| `src/pages/ColaboradorWorkspace.tsx` | **MODIFICAR** - remover import/uso do Dashboard e ajustar fallback |
| `src/components/layout/AppSidebar.tsx` | **MODIFICAR** - remover configuração do Dashboard da navegação |
| `src/components/layout/MainLayout.tsx` | **MODIFICAR** - remover prop dashboardHabilitado |
| `src/components/colaborador/ConfiguracoesNichoTab.tsx` | **MODIFICAR** - remover módulo Dashboard da lista |

---

### Detalhamento Técnico

#### 1. Deletar Componentes do Dashboard

Remover os seguintes arquivos:
- `src/components/colaborador/DashboardNichoTab.tsx`
- `src/components/colaborador/FocoDoDia.tsx`
- `src/components/colaborador/AlertasRisco.tsx`

#### 2. Deletar Hook de Tarefas do Dashboard

Remover:
- `src/hooks/queries/useDashboardTarefas.ts`

#### 3. Atualizar `src/hooks/queries/index.ts`

Remover a linha:
```typescript
export * from "./useDashboardTarefas";
```

#### 4. Atualizar `src/pages/ColaboradorWorkspace.tsx`

**Remover imports:**
```typescript
import { DashboardNichoTab } from "@/components/colaborador/DashboardNichoTab";
```

**Modificar `getPageTitle()`:**
```typescript
// ANTES
if (!subPath || subPath === "") return "Dashboard";

// DEPOIS
// Remover linha do Dashboard - a rota raiz vai redirecionar
```

**Modificar `renderContent()`:**
```typescript
// ANTES
if (!subPath || subPath === "") {
  return <DashboardNichoTab nichoId={nichoId!} alertasHabilitado={nicho.alertas_habilitado} />;
}
// ...
return <DashboardNichoTab nichoId={nichoId!} />;

// DEPOIS
// Rota raiz vai mostrar primeira aba disponível ou Contas como fallback
if (!subPath || subPath === "") {
  // Redirecionar para primeira aba habilitada
  if (nicho.contas_habilitado !== false) {
    return <ContasNichoTab nichoId={nichoId!} />;
  }
  if (nicho.time_habilitado !== false) {
    return <TimeNichoTab nichoId={nichoId!} />;
  }
  // Fallback: Configurações (sempre disponível)
  return <ConfiguracoesNichoTab nichoId={nichoId!} nicho={nicho} onConfigUpdate={invalidateNicho} />;
}
// ...
// Remover fallback final que usava DashboardNichoTab
return <ConfiguracoesNichoTab nichoId={nichoId!} nicho={nicho} onConfigUpdate={invalidateNicho} />;
```

**Remover prop na chamada MainLayout:**
```typescript
dashboardHabilitado={nicho.dashboard_habilitado}
```

#### 5. Atualizar `src/components/layout/AppSidebar.tsx`

**Remover do DEFAULT_ORDER:**
```typescript
const DEFAULT_ORDER = [
  // "dashboard", // REMOVER
  "contas",
  "logistica",
  // ...resto
];
```

**Remover da interface AppSidebarProps:**
```typescript
// REMOVER
dashboardHabilitado?: boolean;
```

**Remover do abaConfig:**
```typescript
const abaConfig = useMemo(() => ({
  // dashboard: { ... }, // REMOVER ESTA LINHA
  contas: { ... },
  // ...resto
}), [...]);
```

**Atualizar href do primeiro item (para que isActive funcione):**
A lógica de `isActive` que verificava `/workspace/${nichoId}` como rota raiz do Dashboard deve ser ajustada para apontar para "contas" ou removida.

#### 6. Atualizar `src/components/layout/MainLayout.tsx`

**Remover da interface:**
```typescript
// REMOVER
dashboardHabilitado?: boolean;
```

**Remover do destructuring da função:**
```typescript
export function MainLayout({ 
  children, 
  nichoId, 
  nichoNome, 
  title, 
  subtitle, 
  // dashboardHabilitado, // REMOVER
  contasHabilitado,
  // ...resto
}: MainLayoutProps) {
```

**Remover da chamada do AppSidebar:**
```typescript
<AppSidebar 
  nichoId={nichoId} 
  nichoNome={nichoNome} 
  // dashboardHabilitado={dashboardHabilitado} // REMOVER
  contasHabilitado={contasHabilitado}
  // ...resto
/>
```

#### 7. Atualizar `src/components/colaborador/ConfiguracoesNichoTab.tsx`

**Remover do MODULOS_CONFIG:**
```typescript
const MODULOS_CONFIG = [
  // REMOVER TODO ESTE BLOCO:
  // {
  //   id: "dashboard",
  //   dbField: "dashboard_habilitado",
  //   label: "Dashboard",
  //   description: "Visão geral do workspace com foco do dia e alertas",
  //   icon: LayoutDashboard,
  //   color: "blue",
  // },
  {
    id: "financeiro",
    // ...resto
  },
```

**Remover import não usado:**
```typescript
// Se LayoutDashboard não for mais usado em outro lugar, remover do import
import { 
  DollarSign, 
  Settings, 
  // ...
  // LayoutDashboard, // REMOVER SE NÃO USADO
```

**Remover da interface nicho:**
```typescript
nicho: {
  // dashboard_habilitado?: boolean; // REMOVER
  financeiro_habilitado: boolean;
  // ...resto
```

---

### Banco de Dados

**Nenhuma migration necessária.** O campo `dashboard_habilitado` na tabela `nichos` pode permanecer (não causa impacto) ou ser removido posteriormente em uma limpeza de schema.

---

### Comportamento Após Remoção

| Cenário | Comportamento Novo |
|---------|-------------------|
| Acesso `/workspace/:id` (rota raiz) | Mostra Contas (ou primeira aba habilitada) |
| Sidebar Desktop | Dashboard não aparece mais na navegação |
| Tab Bar Mobile | Dashboard não aparece mais |
| Configurações | Toggle do Dashboard não aparece mais |
| Rota inexistente | Fallback para Configurações (ao invés de Dashboard) |

---

### Critérios de Aceite

1. Nenhum link ou referência ao Dashboard aparece na UI
2. Arquivos deletados não causam erros de build
3. Rota raiz `/workspace/:id` carrega Contas (ou primeira aba disponível)
4. Configurações não mostra toggle de Dashboard
5. Navegação desktop/mobile funciona sem erros
6. Sem console errors relacionados a imports faltantes

---

### Nota de Segurança

A remoção é apenas frontend - os dados de `dashboard_habilitado`, `foco_do_dia` e tarefas continuam no banco. Não há risco de perda de dados. Se no futuro quiser reativar, basta restaurar os componentes.
