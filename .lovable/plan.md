## NEXUS v0.0.3 — Boot & Legacy State Fix

### Root cause

O app abre exibindo uma versão antiga porque o **service worker PWA está em `registerType: "prompt"`** (`vite.config.ts`). O SW serve o bundle anterior do cache e só substitui depois que o usuário clica em "Atualizar" no `UpdatePrompt`. Como o usuário interage via chat → novo build → refresh → SW atualiza, parece que "só atualiza após interação no chat".

Secundariamente: não há boot version-check para invalidar `localStorage` legado (perfil ativo, metas/tarefas do Planejamento) quando a estrutura muda entre versões.

Não há `LegacyLayout`, `OldDashboard`, `DashboardV1`, rotas mortas nem stores Zustand persistentes — a auditoria das seções 1–5 do PRD não encontrou código legado residual após o v0.0.2. O foco real desta correção é PWA + reset controlado de estado.

### Mudanças

**1. PWA: auto-update silencioso (`vite.config.ts`)**
- Trocar `registerType: "prompt"` → `registerType: "autoUpdate"`.
- Adicionar `workbox.navigateFallbackDenylist: [/^\/~oauth/, /^\/api/]`.
- Adicionar runtime caching `NetworkFirst` para navegações HTML (`request.mode === "navigate"`) com `networkTimeoutSeconds: 3`, para nunca travar em shell antigo.
- Manter `cleanupOutdatedCaches: true`.

**2. Service worker hook (`src/hooks/useServiceWorker.ts`)**
- Com `autoUpdate`, `onNeedRefresh` não dispara — o SW novo ativa sozinho no próximo load. Remover lógica de `needRefresh` e `updateServiceWorker`, manter só `offlineReady` e `checkForUpdates` (polling 1h preservado).
- Guard: não registrar SW em iframe nem em hosts `id-preview--*` / `lovableproject.com` (evita preview servir build velha).

**3. Remover UpdatePrompt visual (`src/App.tsx`, `src/components/pwa/UpdatePrompt.tsx`)**
- Deletar `UpdatePrompt.tsx` (não há mais prompt — update é automático).
- Remover `<UpdatePrompt />` de `App.tsx`.
- Manter toast de `offlineReady` migrando para um efeito leve em `App.tsx` (opcional, baixo ruído).

**4. Boot version-check (`src/main.tsx`)**
- Definir `const APP_VERSION = "0.0.3"`.
- No boot, comparar com `localStorage.getItem("nexus_app_version")`. Se diferente:
  - Limpar chaves legadas: `nexus_perfil_ativo`, `nexus:meta:*`, `nexus:data:*`, `nexus:videosHoje:*`, `nexus:tarefas:*`, `nexus:ideias:*` (varrer prefixos `nexus:` e `nexus_planejamento_*`).
  - **Preservar** chaves de auth Supabase (`sb-*`) e qualquer chave começando com `supabase.`.
  - Gravar nova versão.
- Tentar `navigator.serviceWorker.getRegistrations()` e chamar `.update()` em cada um (best-effort) para forçar checagem.

**5. Cache HTTP (`index.html`)**
- Adicionar `<meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate" />` no `<head>` como reforço (o proxy Lovable já faz isso, mas previne caches intermediários em produção).

**6. Limpeza pós-correção**
- Verificar imports órfãos após remoção de `UpdatePrompt`.
- Confirmar build TS limpo.

### Não tocado (proteções)
- Auth/Supabase client, `PerfilContext` (lógica preservada — só as chaves antigas são limpas no bump de versão), rotas existentes (`/admin`, `/workspace/:id/*`, `/install`), tema, sidebar, AppLab, módulos atuais, banco.

### Arquivos
- editar: `vite.config.ts`, `src/hooks/useServiceWorker.ts`, `src/App.tsx`, `src/main.tsx`, `index.html`
- deletar: `src/components/pwa/UpdatePrompt.tsx`

### Resultado
Após esse patch, ao publicar uma nova versão, qualquer usuário que abrir o app receberá o novo bundle no próximo load (sem clicar em "Atualizar"), e o estado local incompatível com a versão nova é descartado automaticamente — sem perder login.
