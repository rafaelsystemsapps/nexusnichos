# Plano — Nexus v2: Entrada direta + Seletor de perfil no header

## Objetivo
Abrir o app já em `/admin` sem nenhuma tela intermediária. Trocar de perfil pelo header (canto superior direito), com a lista vinda das tabelas `profiles` + `user_roles` + `user_nichos`. Manter o "login invisível" atual (signIn em background com o usuário compartilhado) para que as RLS continuem funcionando — usuário nunca vê senha.

---

## Comportamento

- `/` → `Navigate to="/admin" replace` (sem guard, sem loading visível além do bootstrap da sessão compartilhada).
- Header (presente em admin e workspace): avatar + nome do perfil ativo + chevron. Clique abre dropdown com todos os perfis (admins primeiro). Selecionar um perfil:
  - `admin` → navega para `/admin`
  - `colaborador` com `nichoId` → navega para `/workspace/:nichoId`
  - `colaborador` sem `nichoId` → toast de aviso, sem navegar.
- Perfil ativo persistido em `localStorage["nexus_perfil_ativo"]`. Sem `sessionStorage`. Default na 1ª visita: primeiro admin retornado.
- Nenhum `ProtectedRoute`, nenhuma checagem de auth na UI, nenhuma tela `/auth`, nenhum botão "Sair".

---

## Arquivos a alterar

### Reescrever
- `src/contexts/PerfilContext.tsx` — remove a lista local em `localStorage["nexus_perfis"]` e a lógica de adicionar/remover perfil. Agora:
  - Faz `garantirSessao()` (signIn invisível com `rafael.workbiz@gmail.com` / `Admin2902`) no mount.
  - Após a sessão estar pronta, busca perfis em paralelo:
    - `profiles` → `id, nome, avatar_emoji, avatar_color`
    - `user_roles` → `user_id, role`
    - `user_nichos` → `user_id, nicho_id`
  - Monta `Perfil[] = { id, nome, role, nichoId, emoji, cor }`, ordenando admins primeiro.
  - Lê/grava perfil ativo em `localStorage["nexus_perfil_ativo"]`. Se nada salvo, escolhe o primeiro admin.
  - Expõe: `{ perfis, perfilAtivo, setPerfilAtivo, loadingPerfis, ready }`.
- `src/App.tsx` — remove `PerfilGuard` e `RootGate`. Mantém `PerfilProvider` (precisa estar lá para o header funcionar). Rotas:
  - `/` → `<Navigate to="/admin" replace />`
  - `/admin/*` → `AdminDashboard`
  - `/workspace/:nichoId/*` → `ColaboradorWorkspace`
  - `/install`, `/lembrete-popup/:id`, `*` → mesmos de hoje.

### Criar
- `src/components/layout/SeletorPerfil.tsx` — botão (avatar 32px com emoji ou inicial + nome + `chevron-down`) usando `DropdownMenu` do shadcn. Itens: avatar + nome + badge (`Admin` âmbar / `Workspace` azul). Item ativo destacado. Ao clicar, chama `setPerfilAtivo()` e `navigate()`.

### Modificar
- `src/components/layout/MainLayout.tsx` — adiciona `<SeletorPerfil />` no canto superior direito do `<header>`, tanto no layout iOS quanto desktop. Header passa a ser renderizado mesmo sem `title/subtitle` (uma barra fina) para garantir presença em todas as páginas.
- `src/components/layout/AppSidebar.tsx` — remove qualquer referência a `signOut`, "Sair"/"Trocar perfil" e botão de logout. `isAdmin` continua vindo de `usePerfilContext().perfilAtivo?.role === "admin"`.
- `src/pages/ColaboradorWorkspace.tsx` — garante que `nichoId` vem só de `useParams`, sem qualquer validação cruzada com auth.
- `src/pages/SelecaoPerfil.tsx` — **deletar** (não é mais usado).
- `src/components/LoadingScreen.tsx` — mantém, usado durante o boot do contexto se necessário.

### Não tocar
- `src/integrations/supabase/client.ts`, `types.ts`, `.env`
- Edge functions, RLS, schema do banco
- Hooks de query, componentes de tabs, formulários

---

## Detalhes técnicos

- **Sessão compartilhada**: o PRD pede "nunca pedir senha". Resolvido pelo `garantirSessao()` em `PerfilContext` — o usuário compartilhado é admin no Supabase, então `profiles` + `user_roles` + `user_nichos` retornam todos os registros sob as policies existentes. Nenhuma RLS muda.
- **Perfil ativo ≠ usuário autenticado**: a sessão Supabase é sempre o admin compartilhado. O "perfil" no header é apenas um indicador de UI + roteamento (admin vs workspace). Inserts continuam atribuídos ao usuário compartilhado via `auth.uid()`.
- **Estilo do dropdown**: `bg-[#1a1a1a]`, `border-[#333]`, texto `text-white`, badge admin `bg-[#b45309]`, badge workspace `bg-[#1d4ed8]`. Transição só de `opacity`.
- **Avatar fallback**: se `avatar_emoji` ausente, mostra inicial do nome em círculo com `avatar_color` (ou cinza neutro).

---

## Validação
1. Abrir `/` → redireciona para `/admin` sem flicker de login.
2. Header mostra avatar do primeiro admin.
3. Dropdown lista todos os perfis com badges corretas.
4. Selecionar colaborador com nicho → vai para `/workspace/:nichoId` e dados carregam.
5. Recarregar → perfil ativo persiste.
6. Nenhuma rota antiga (`/auth`, `/`) mostra tela de seleção/login.
