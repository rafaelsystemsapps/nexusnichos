# 📚 Documentação Completa do Sistema

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Arquitetura](#arquitetura)
3. [Autenticação e Autorização](#autenticação-e-autorização)
4. [Banco de Dados](#banco-de-dados)
5. [Funcionalidades por Módulo](#funcionalidades-por-módulo)
6. [Guia do Administrador](#guia-do-administrador)
7. [Guia do Colaborador](#guia-do-colaborador)
8. [Edge Functions](#edge-functions)
9. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Sistema de gestão multi-nicho para gerenciamento de:
- **Contas de Redes Sociais** - TikTok, Instagram, YouTube, etc.
- **Conteúdos** - Planejamento e produção de conteúdo
- **Logística Semanal** - Tarefas diárias e templates
- **Financeiro** - Transações, produtos e lucros
- **Pedidos** - Gestão de pedidos e status
- **Time** - Membros e funções

### Stack Tecnológico

| Camada | Tecnologia |
|--------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Estilização | Tailwind CSS + shadcn/ui |
| Estado | TanStack Query (React Query) |
| Roteamento | React Router v6 |
| Backend | Supabase (Lovable Cloud) |
| Autenticação | Supabase Auth |
| Banco de Dados | PostgreSQL |

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
├─────────────────────────────────────────────────────────────┤
│  src/                                                        │
│  ├── components/                                             │
│  │   ├── admin/          # Componentes do painel admin      │
│  │   ├── colaborador/    # Componentes do workspace         │
│  │   ├── layout/         # Sidebar, MainLayout              │
│  │   ├── pwa/            # UpdatePrompt para PWA            │
│  │   └── ui/             # Componentes shadcn/ui            │
│  ├── contexts/                                               │
│  │   └── AuthContext.tsx # Gerenciamento de autenticação    │
│  ├── hooks/              # Custom hooks                      │
│  ├── pages/              # Páginas da aplicação             │
│  └── integrations/                                           │
│      └── supabase/       # Cliente e tipos Supabase         │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                               │
├─────────────────────────────────────────────────────────────┤
│  supabase/                                                   │
│  ├── functions/                                              │
│  │   └── create-user/    # Edge Function para criar usuários│
│  ├── migrations/         # Migrações do banco de dados      │
│  └── config.toml         # Configuração do Supabase         │
└─────────────────────────────────────────────────────────────┘
```

### Fluxo de Dados

```
Usuário → React App → Supabase Client → PostgreSQL
                ↓
         Auth Context (JWT)
                ↓
         RLS Policies (Segurança)
```

---

## 🔐 Autenticação e Autorização

### Fluxo de Login

```
1. Usuário entra com email/senha
         ↓
2. Supabase Auth valida credenciais
         ↓
3. AuthContext.fetchUserRole() busca:
   - Role do usuário (admin/colaborador)
   - Nicho associado (se colaborador)
         ↓
4. Redirecionamento automático:
   - Admin → /admin
   - Colaborador → /workspace/{nichoId}
   - Sem role → /no-role
   - Sem nicho → /no-nicho
```

### Roles do Sistema

| Role | Descrição | Acesso |
|------|-----------|--------|
| `admin` | Administrador geral | Todos os nichos, gestão de usuários |
| `colaborador` | Membro de um nicho | Apenas seu nicho atribuído |

### Tabelas de Autorização

```sql
-- Roles dos usuários
user_roles (
  id, user_id, role, created_at
)

-- Associação usuário-nicho
user_nichos (
  id, user_id, nicho_id, created_at
)
```

### Função de Verificação de Role

```sql
-- Usada em todas as políticas RLS
public.has_role(_user_id uuid, _role app_role) → boolean
```

### Função de Obter Nicho do Usuário

```sql
-- Retorna o nicho_id do usuário atual
public.get_user_nicho(_user_id uuid) → uuid
```

---

## 🗄️ Banco de Dados

### Diagrama de Entidades

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   profiles   │     │  user_roles  │     │ user_nichos  │
│──────────────│     │──────────────│     │──────────────│
│ id (PK)      │←────│ user_id      │     │ user_id      │
│ nome         │     │ role         │     │ nicho_id     │────┐
│ email        │     └──────────────┘     └──────────────┘    │
│ data_entrada │                                               │
└──────────────┘                                               │
                                                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                            nichos                                 │
│──────────────────────────────────────────────────────────────────│
│ id (PK) │ nome │ descricao │ financeiro_habilitado │ pedidos_... │
└──────────────────────────────────────────────────────────────────┘
         │
         │ nicho_id (FK)
         ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                              TABELAS POR NICHO                                       │
├─────────────────┬─────────────────┬─────────────────┬─────────────────┬─────────────┤
│ contas_redes_   │   conteudos     │ membros_time    │   produtos      │   pedidos   │
│ sociais         │                 │                 │                 │             │
├─────────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┤
│ transacoes_     │ biblioteca_     │ tarefa_         │ semana_         │ conteudo_   │
│ financeiras     │ nicho           │ templates       │ logistica       │ bruto       │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┴─────────────┘
```

### Tabelas Principais

#### `nichos`
Representa um nicho/projeto no sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nome | text | Nome do nicho |
| descricao | text | Descrição opcional |
| financeiro_habilitado | boolean | Se módulo financeiro está ativo |
| pedidos_habilitado | boolean | Se módulo de pedidos está ativo |
| observacoes | text | Notas adicionais |

#### `profiles`
Perfil de cada usuário do sistema.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | ID do usuário (auth.users) |
| nome | text | Nome completo |
| email | text | Email do usuário |
| data_entrada | timestamp | Data de entrada no sistema |
| observacoes | text | Notas adicionais |

#### `contas_redes_sociais`
Contas de redes sociais gerenciadas.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| nome_conta | text | Nome/handle da conta |
| plataforma | enum | tiktok, instagram, youtube, etc. |
| status | enum | ativa, pausada, banida, limitada |
| url_conta | text | URL da conta |
| responsavel_id | uuid | Membro responsável |
| media_videos | integer | Média de vídeos |
| tipo_conteudo | text | Tipo de conteúdo |
| status_aquecimento | text | Status de aquecimento |

#### `conteudos`
Conteúdos planejados/produzidos.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| titulo | text | Título do conteúdo |
| descricao | text | Descrição |
| data_postagem | date | Data planejada |
| canal | enum | Plataforma de destino |
| tipo_midia | enum | video, imagem, carrossel, texto |
| status | enum | planejado, em_producao, publicado |
| responsavel_id | uuid | Responsável |
| anexo_url | text | URL do arquivo |

#### `membros_time`
Membros do time de cada nicho.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| nome | text | Nome do membro |
| funcao | text | Função/cargo |
| especialidade | text | Especialidade |
| contato | text | Contato (WhatsApp, etc.) |

#### `pedidos`
Pedidos gerenciados pelo nicho.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| pedido_id | text | ID do pedido (visível) |
| nicho_id | uuid | FK para nichos |
| cliente_nome | text | Nome do cliente |
| produto | text | Produto |
| cor | text | Cor do produto |
| valor | numeric | Valor do pedido |
| status | enum | pendente, enviado, cancelado |
| data_pedido | date | Data do pedido |
| data_envio | timestamp | Data de envio |
| processado_por_id | uuid | Membro que processou |

#### `produtos`
Catálogo de produtos do nicho.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| nome | text | Nome do produto |
| descricao | text | Descrição |
| preco_custo_padrao | numeric | Preço de custo |
| preco_venda_padrao | numeric | Preço de venda |
| ativa | boolean | Se está ativo |

#### `transacoes_financeiras`
Transações do módulo financeiro.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| user_id | uuid | Usuário que registrou |
| produto_nome | text | Nome do produto |
| preco_custo | numeric | Preço de custo |
| preco_venda | numeric | Preço de venda |
| membro_time_id | uuid | Membro responsável |
| data_transacao | date | Data da transação |

#### `semana_logistica`
Semanas de logística para organização.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| semana_numero | integer | Número da semana |
| ano | integer | Ano |
| semana_inicio | date | Data de início |
| semana_fim | date | Data de fim |
| status | text | Status da semana |

#### `tarefa_templates`
Templates de tarefas recorrentes.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| nicho_id | uuid | FK para nichos |
| titulo | text | Título da tarefa |
| descricao | text | Descrição |
| conta_id | uuid | Conta associada |
| ordem | integer | Ordem de exibição |
| ativa | boolean | Se está ativo |

#### `tarefa_diaria`
Tarefas diárias geradas a partir de templates.

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Identificador único |
| semana_id | uuid | FK para semana_logistica |
| template_id | uuid | FK para tarefa_templates |
| dia_semana | integer | Dia da semana (0-6) |
| data | date | Data da tarefa |
| status | enum | pendente, em_andamento, concluida, nao_concluida |
| responsavel_id | uuid | Responsável |

### Enums do Sistema

```sql
-- Roles de usuário
app_role: 'admin', 'colaborador'

-- Plataformas sociais
plataforma_social: 'tiktok', 'instagram', 'youtube', 'facebook', 'twitter', 'linkedin', 'outros'

-- Status de conta
status_conta: 'ativa', 'pausada', 'banida', 'limitada'

-- Status de conteúdo
status_conteudo: 'planejado', 'em_producao', 'publicado'

-- Status de pedido
status_pedido: 'pendente', 'enviado', 'cancelado'

-- Status de tarefa
status_tarefa: 'pendente', 'em_andamento', 'concluida', 'nao_concluida'

-- Tipo de mídia
tipo_midia: 'video', 'imagem', 'carrossel', 'texto'
```

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado com políticas baseadas em:

1. **Admins** - Acesso total via `has_role(auth.uid(), 'admin')`
2. **Colaboradores** - Acesso apenas ao seu nicho via `nicho_id = get_user_nicho(auth.uid())`

Exemplo de política:
```sql
CREATE POLICY "Colaboradores podem ver dados do seu nicho"
ON public.contas_redes_sociais
FOR SELECT
USING (
  has_role(auth.uid(), 'admin')
  OR nicho_id = get_user_nicho(auth.uid())
);
```

---

## 🎛️ Funcionalidades por Módulo

### 📊 Dashboard do Nicho
- Resumo de contas por plataforma
- Status de aquecimento das contas
- Métricas rápidas

### 👥 Contas de Redes Sociais
- CRUD completo de contas
- Filtros por plataforma e status
- Atribuição de responsáveis
- Status de aquecimento

### 📝 Conteúdos
- Planejamento de conteúdo
- Pipeline de produção
- Subtarefas por conteúdo
- Anexos e URLs

### 📅 Logística Semanal
- Templates de tarefas recorrentes
- Geração automática de tarefas por semana
- Status de conclusão por dia
- Visualização semanal

### 💰 Financeiro (se habilitado)
- Registro de transações
- Cálculo de lucro (venda - custo)
- Lucro por membro do time
- Produtos com preços padrão

### 📦 Pedidos (se habilitado)
- Gestão de pedidos
- Status: pendente → enviado → cancelado
- Filtros e busca
- Atribuição a membros

### 👥 Time do Nicho
- Cadastro de membros
- Funções e especialidades
- Contatos

### ⚙️ Configurações do Nicho
- Biblioteca de conhecimento
- Documentos e tutoriais
- Organização por categorias

---

## 👨‍💼 Guia do Administrador

### Acesso
- URL: `/admin`
- Requer role: `admin`

### Funcionalidades

#### 1. Dashboard
- Visão geral de todos os nichos
- Estatísticas globais

#### 2. Gestão de Usuários
- Criar novos usuários (via Edge Function)
- Atribuir roles (admin/colaborador)
- Atribuir nicho a colaboradores
- Editar/excluir usuários

**Fluxo de criação de usuário:**
```
1. Admin preenche: nome, email, senha, role
2. Se colaborador: seleciona nicho
3. Sistema cria via Edge Function:
   - Usuário em auth.users
   - Perfil em profiles
   - Role em user_roles
   - Associação em user_nichos (se colaborador)
```

#### 3. Gestão de Nichos
- Criar novos nichos
- Habilitar/desabilitar módulos (financeiro, pedidos)
- Editar configurações
- Visualizar colaboradores por nicho

#### 4. Conteúdos (Visão Global)
- Ver conteúdos de todos os nichos
- Filtrar por nicho

---

## 👤 Guia do Colaborador

### Acesso
- URL: `/workspace/{nichoId}`
- Requer role: `colaborador`
- Acesso apenas ao nicho atribuído

### Navegação (Sidebar)

```
📊 Dashboard
👥 Contas
📝 Conteúdos
📅 Logística
💰 Financeiro*
📦 Pedidos*
👥 Time
⚙️ Configurações

* Módulos opcionais (habilitados por nicho)
```

### Funcionalidades Detalhadas

#### Dashboard
- Cards com resumo de contas por plataforma
- Status de aquecimento (média/bom/ótimo)
- Acesso rápido a outras seções

#### Contas
- Lista de todas as contas do nicho
- Adicionar nova conta
- Editar/excluir conta
- Filtrar por status e plataforma

#### Conteúdos
- Calendário de conteúdos
- Adicionar novo conteúdo
- Gerenciar subtarefas
- Atualizar status de produção

#### Logística Semanal
- Visualização por semana
- Templates de tarefas
- Marcar tarefas como concluídas
- Navegação entre semanas

#### Financeiro
- Registrar transações
- Selecionar produto (preço auto-preenchido)
- Atribuir a membro do time
- Ver lucro por membro
- Gerenciar catálogo de produtos

#### Pedidos
- Lista de pedidos
- Adicionar novo pedido
- Atualizar status (pendente → enviado)
- Filtrar e buscar

#### Time
- Lista de membros
- Adicionar/editar membros
- Funções e contatos

#### Configurações
- Biblioteca do nicho
- Adicionar documentos/tutoriais
- Organizar por categoria

---

## ⚡ Edge Functions

### `create-user`

**Propósito:** Criar usuários de forma segura pelo admin sem ser deslogado.

**Endpoint:** `POST /functions/v1/create-user`

**Headers requeridos:**
```
Authorization: Bearer {supabase_access_token}
Content-Type: application/json
```

**Body:**
```json
{
  "email": "usuario@email.com",
  "password": "senha123",
  "nome": "Nome do Usuário",
  "role": "colaborador",
  "nichoId": "uuid-do-nicho" // opcional, apenas para colaborador
}
```

**Resposta de sucesso:**
```json
{
  "user": { "id": "uuid", "email": "..." },
  "message": "Usuário criado com sucesso"
}
```

**Erros possíveis:**
- 400: Dados faltando
- 403: Não é admin
- 500: Erro ao criar usuário

**Fluxo interno:**
```
1. Verifica se requisitante é admin
2. Cria usuário via supabaseAdmin.auth.admin.createUser()
3. Cria perfil em profiles
4. Cria role em user_roles
5. Se colaborador, cria associação em user_nichos
```

---

## 🔧 Troubleshooting

### Problema: "Sua conta ainda não foi configurada"

**Causa:** Usuário existe em auth.users mas não tem role ou nicho.

**Solução:**
1. Admin acessa painel de usuários
2. Verifica se usuário tem role atribuído
3. Se colaborador, verifica se tem nicho atribuído
4. Corrige manualmente se necessário

### Problema: Colaborador não vê dados

**Causa:** RLS bloqueando acesso.

**Verificar:**
1. Usuário tem role `colaborador` em user_roles?
2. Usuário tem nicho em user_nichos?
3. nicho_id corresponde aos dados?

### Problema: Admin criando usuário é deslogado

**Causa:** Usando `supabase.auth.signUp()` diretamente.

**Solução:** Usar Edge Function `create-user` que usa `supabaseAdmin`.

### Problema: Módulo não aparece no menu

**Causa:** Módulo não habilitado para o nicho.

**Solução:**
1. Admin acessa gestão de nichos
2. Habilita `financeiro_habilitado` ou `pedidos_habilitado`

### Problema: Tarefa não aparece na logística

**Causa:** Template inativo ou semana não gerada.

**Verificar:**
1. Template está ativo?
2. Semana existe em semana_logistica?
3. Tarefas foram geradas em tarefa_diaria?

---

## 📱 PWA (Progressive Web App)

O sistema suporta instalação como PWA:

- **iOS:** Safari → Compartilhar → Adicionar à Tela de Início
- **Android:** Chrome → Menu → Instalar aplicativo

### UpdatePrompt
Componente que notifica usuários sobre atualizações disponíveis.

---

## 🔒 Segurança

### Práticas Implementadas

1. **Row Level Security (RLS)** - Todas as tabelas protegidas
2. **Roles separados** - Nunca em profiles, sempre em user_roles
3. **Edge Functions com service_role** - Para operações administrativas
4. **JWT validation** - Em todas as requisições autenticadas
5. **CORS configurado** - Headers apropriados nas Edge Functions

### Não Fazer

❌ Armazenar roles no localStorage
❌ Hardcode de credenciais
❌ Bypass de RLS no cliente
❌ Expor service_role key no frontend

---

## 📞 Suporte

Para questões técnicas ou bugs, verificar:
1. Console do navegador (F12)
2. Network requests
3. Logs das Edge Functions no Lovable Cloud

---

*Documentação gerada em 24/12/2024*
