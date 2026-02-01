

## Plano: Adicionar Ferramentas de Trabalho ao Modulo de Custos

### Contexto e Objetivo

Atualmente a aba **Custos** mostra apenas os apps/servicos vinculados a clientes especificos. Voce quer adicionar uma secao para registrar **ferramentas gerais de trabalho** que voce paga mensalmente para operar o negocio (ex: Figma, Canva Pro, ChatGPT Plus, domínios, etc).

Essas ferramentas conversam com o custo por cliente para calcular a margem real do negocio.

---

### Estrutura Visual Proposta

```text
┌─────────────────────────────────────────────────────────────────┐
│  ABA CUSTOS                                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [Cards de Resumo - Atualizados]                                │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐       │
│  │ Apps     │ Clientes │ Custo    │ Custo    │ Custo    │       │
│  │ Total    │ c/ Apps  │ Clientes │ Ferramen.│ TOTAL    │       │
│  │ 12       │ 5        │ R$ 800   │ R$ 300   │ R$ 1.100 │       │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘       │
│                                                                 │
│  ╔═══════════════════════════════════════════════════════════╗  │
│  ║  NOVO: Ferramentas de Trabalho                    [+ Add] ║  │
│  ╠═══════════════════════════════════════════════════════════╣  │
│  ║  Ferramenta      │ Valor     │ Periodicidade │ Acoes      ║  │
│  ║─────────────────────────────────────────────────────────  ║  │
│  ║  Figma Pro       │ R$ 75/mes │ Mensal        │ [✏️] [🗑️] ║  │
│  ║  Canva Pro       │ R$ 55/mes │ Mensal        │ [✏️] [🗑️] ║  │
│  ║  ChatGPT Plus    │ R$ 100/mes│ Mensal        │ [✏️] [🗑️] ║  │
│  ║  Dominio .com    │ R$ 50/ano │ Anual         │ [✏️] [🗑️] ║  │
│  ╚═══════════════════════════════════════════════════════════╝  │
│                                                                 │
│  [Tabela Existente: Custos por Cliente]                         │
│  ...                                                            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### O Que Sera Criado

#### 1. Nova Tabela: `ferramentas_trabalho`

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `id` | uuid | ID unico |
| `nicho_id` | uuid | Vinculo ao nicho (FK) |
| `nome` | text | Nome da ferramenta |
| `valor` | numeric | Valor do custo |
| `periodicidade` | text | `mensal` ou `anual` |
| `categoria` | text | Categoria (opcional): `design`, `ia`, `infra`, `marketing`, `outros` |
| `ativo` | boolean | Se esta ativo |
| `observacao` | text | Notas adicionais |
| `created_at` | timestamp | Data de criacao |
| `updated_at` | timestamp | Data de atualizacao |

RLS: Colaboradores podem criar/ver/editar/deletar apenas no seu nicho.

---

#### 2. Novos Componentes

| Componente | Funcao |
|------------|--------|
| `FerramentaTrabalhoForm.tsx` | Modal para adicionar/editar ferramenta |
| `FerramentaTrabalhoTable.tsx` | Tabela listando ferramentas |

---

#### 3. Modificacoes no CustosAppsTab.tsx

- Adicionar secao "Ferramentas de Trabalho" antes da tabela de clientes
- Atualizar cards de resumo para incluir:
  - **Custo Ferramentas**: soma mensal das ferramentas (anual / 12)
  - **Custo Total**: Custo Clientes + Custo Ferramentas
- Calcular nova margem real considerando ferramentas

---

#### 4. Hook de Dados

Novo hook `useFerramentasTrabalho.ts`:
- Listar ferramentas do nicho
- Criar, atualizar, deletar ferramentas
- Calcular custo mensal total das ferramentas

---

### Fluxo de Uso

1. Usuario acessa aba **Custos**
2. Ve cards de resumo com custos de clientes + ferramentas
3. Clica em **+ Ferramenta** para adicionar nova ferramenta
4. Preenche: Nome, Valor, Periodicidade, Categoria (opcional)
5. Ferramenta aparece na tabela
6. Custo e refletido nos totais automaticamente

---

### Arquivos a Criar/Modificar

| Acao | Arquivo |
|------|---------|
| Criar | `supabase/migrations/xxx_create_ferramentas_trabalho.sql` |
| Criar | `src/hooks/queries/useFerramentasTrabalho.ts` |
| Criar | `src/components/colaborador/FerramentaTrabalhoForm.tsx` |
| Criar | `src/components/colaborador/FerramentaTrabalhoTable.tsx` |
| Modificar | `src/components/colaborador/CustosAppsTab.tsx` |
| Atualizar | `src/hooks/queries/useAllClienteApps.ts` (opcional: integrar totais) |

---

### Secao Tecnica

**Migracao SQL:**
```sql
CREATE TABLE ferramentas_trabalho (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nicho_id uuid NOT NULL REFERENCES nichos(id) ON DELETE CASCADE,
  nome text NOT NULL,
  valor numeric NOT NULL DEFAULT 0,
  periodicidade text NOT NULL DEFAULT 'mensal',
  categoria text DEFAULT 'outros',
  ativo boolean NOT NULL DEFAULT true,
  observacao text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ferramentas_trabalho ENABLE ROW LEVEL SECURITY;

-- Politicas RLS padrao do nicho
```

**Calculo de Custo Mensal:**
```typescript
const custoMensalFerramentas = ferramentas
  .filter(f => f.ativo)
  .reduce((acc, f) => {
    const valor = f.periodicidade === 'anual' ? f.valor / 12 : f.valor;
    return acc + valor;
  }, 0);
```

---

### Criterios de Aceite

1. Tabela `ferramentas_trabalho` criada no banco
2. Formulario permite adicionar/editar ferramentas
3. Tabela exibe ferramentas com acoes de editar/excluir
4. Cards de resumo mostram custo de ferramentas separado
5. Custo total soma ferramentas + apps de clientes
6. Ferramentas inativas nao contam no custo

