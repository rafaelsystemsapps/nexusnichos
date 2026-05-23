## Objetivo

Remover toda a tela de login/senha e o Supabase Auth do app. Substituir por uma tela de seleção de perfis (estilo clássico, anos 2010) salva em localStorage. Cada perfil abre direto seu workspace.

---

## ⚠️ Aviso importante antes de prosseguir

Hoje **todas as policies RLS** das tabelas (`nichos`, `transacoes_financeiras`, `contas_redes_sociais`, `pedidos`, `lembretes`, etc.) dependem de `auth.uid()` e da tabela `user_roles`. Se removermos o Supabase Auth, **nenhuma query do app vai funcionar** — todas retornarão vazio ou erro de permissão.

Duas opções para resolver:

- **(A) Recomendado:** manter um login "invisível" — o app faz `signInAnonymously` ou autentica num único usuário compartilhado no carregamento. O usuário nunca vê tela de login, mas o backend continua funcionando. Perfis em localStorage controlam só a UI (nome, emoji, cor, qual nicho abrir).
- **(B) Quebrar tudo:** abrir as tabelas para `anon` (sem RLS). Isso expõe todos os dados financeiros, pedidos, contas etc. publicamente para qualquer pessoa com a URL pública. **Não recomendado.**

**Vou seguir com a opção (A)** — visualmente é idêntico ao PRD (zero tela de login), mas o backend continua seguro. Se preferir (B), me avise antes de implementar.

---

## Implementação

### 1. Novo `PerfilContext` (`src/contexts/PerfilContext.tsx`)

Substitui o `AuthContext`. Expõe:

- `perfis`, `perfilAtivo`, `setPerfilAtivo`, `adicionarPerfil`, `trocarPerfil`
- Persiste `perfis` em `localStorage["nexus_perfis"]` (seed com Admin e Matias se vazio)
- Persiste `perfilAtivo` em `sessionStorage["nexus_perfil_ativo"]`
- Internamente: ao montar, executa o login invisível compartilhado (opção A) — uma única vez. Expõe `ready` para o app aguardar.

### 2. `src/pages/SelecaoPerfil.tsx` (novo, substitui `Auth.tsx`)

- Fundo `#0a0a0a`, título "Nexus" centralizado
- Grade de cards 120x140, border-radius 8px, cor de fundo do perfil, emoji grande no centro, nome embaixo, badge "Admin" (`#b45309`) quando aplicável
- Card "+" tracejado (`2px dashed #444`) abre o modal de novo perfil
- Clicar num perfil: `setPerfilAtivo(p)` e navega para `/admin` (admin) ou `/workspace/:nichoId` (colaborador). Se colaborador sem `nichoId`, mostra aviso inline.

### 3. Modal "Novo Perfil"

- Campos: Nome, grid de emojis (20 opções listadas no PRD), 8 cores, Tipo (Admin/Colaborador), `nichoId` opcional para colaborador
- Botão "Criar" → `adicionarPerfil` (gera id via `crypto.randomUUID()`)
- Também permite deletar perfil (long-press / botão "x" no hover) — útil para limpar

### 4. `src/App.tsx`

- Remove `AuthProvider`, `ProtectedRoute`, `HomePage` baseado em auth
- Novo `PerfilProvider` envolvendo as rotas
- Rotas:
  - `/` → `SelecaoPerfil`
  - `/admin/*` → `AdminDashboard` direto
  - `/workspace/:nichoId/*` → `ColaboradorWorkspace` direto
  - `/install`, `/lembrete-popup/:id`, `*` (NotFound) mantidos
  - Remove `/auth`, `/no-role`, `/no-nicho`
- Pequeno guard: se rota é `/admin` ou `/workspace/...` e não há `perfilAtivo` em sessionStorage → redireciona para `/`

### 5. `src/components/layout/AppSidebar.tsx`

- Troca `useAuth()` por `usePerfilContext()`
- Mostra avatar (emoji + cor) e nome do perfil ativo
- Botão "Sair" vira "Trocar perfil" → limpa `perfilAtivo` e navega para `/`
- Role para mostrar/esconder itens de menu vem de `perfilAtivo.tipo`

### 6. Componentes que usam `useAuth().user`

`LembreteForm.tsx`, `ContasNichoTab.tsx`, `TransacaoForm.tsx`, `NichosTab.tsx`:

- Trocar `const { user } = useAuth()` por `const { data: { user } } = await supabase.auth.getUser()` quando precisar do `user.id` em inserts. Como agora todos compartilham o mesmo usuário invisível, `user.id` continua disponível.
- Onde só era usado para "está logado?", remover a checagem.

### 7. `ColaboradorWorkspace.tsx` e `AdminDashboard.tsx`

- Remove `useAuth()`
- `ColaboradorWorkspace`: pega `nichoId` só de `useParams` — sem comparar com `userNichoId`
- Onde houver UI dependente de role (ex.: botões só admin), usa `usePerfilContext().perfilAtivo.tipo`

### 8. Arquivos a deletar

- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/components/NoRoleAssigned.tsx`
- `src/components/NoNichoAssigned.tsx`

### 9. Edge functions / Supabase

- Não mexer em policies RLS (continuam válidas via login invisível)
- Não mexer em `admin-create-user`, `reset-password` etc. — ficam disponíveis mas não usados pela UI principal (Admin pode continuar usando se quiser gerenciar usuários reais no futuro)

---

## Estilo (resumo)

- Fundo `#0a0a0a`, cards 120x140 `border-radius: 8px`
- Badge Admin: `bg #b45309`, texto branco, 10px
- Botão "+": `border: 2px dashed #444`, fundo transparente, hover `#1a1a1a`
- Título "Nexus": bold, sem gradiente, fonte do sistema

---

## Validação após build

- `/` abre tela de perfis sem redirect
- Clicar em Admin → `/admin` carrega
- Clicar em Matias (sem nichoId) → mensagem pedindo configurar nichoId
- Criar novo perfil persiste após reload
- Botão "Trocar perfil" no sidebar volta para `/`
- Queries de nichos/transações continuam retornando dados (confirma que o login invisível funcionou)
