
# Plano: Status "Banida" para Contas

## Resumo
Adicionar uma nova opção de status "Banida" para contas de redes sociais, com comportamento especial:
- Contas banidas aparecem separadas no final da lista (seção própria)
- Contas banidas não aparecem nas tarefas de logística
- Ao gerar tarefas, apenas contas ativas são consideradas

---

## Arquitetura Atual

O sistema já possui o enum `status_conta` no banco com os valores: `ativa`, `pausada`, `banida`, `limitada`.

No frontend, existe um mapeamento simplificado:
- `ativa` → Ativa
- `pausada`/`limitada` → Risco  
- `banida` → Desativada

A proposta é criar um QUARTO status visual chamado **"Banida"** que é diferente de "Desativada".

---

## Mudanças Necessárias

### 1. Módulo de Contas (`ContasNichoTab.tsx`)

**Novo status visual:**
```
type StatusConta = "ativa" | "risco" | "desativada" | "banida";
```

**Nova configuração de status:**
- Ativa: verde (conta funcionando)
- Risco: amarelo (conta com problemas temporários)
- Desativada: vermelho (conta pausada por escolha)
- Banida: roxo/cinza escuro (conta permanentemente perdida)

**Novo filtro:**
Adicionar "Banidas" ao filtro de status

**Separação visual na lista:**
- Contas ativas/risco/desativadas aparecem na lista principal (ordenáveis)
- Contas banidas aparecem em uma seção separada abaixo com título "Contas Banidas" (sem drag-and-drop, visual mais opaco)

**Formulário:**
Adicionar opção "Banida" no select de status

---

### 2. Logística Semanal (`LogisticaSemanalTab.tsx`)

**Filtrar contas banidas:**
Na busca de contas para o filtro, excluir contas com status `banida`:
```sql
.neq("status", "banida")
```

**Templates de tarefa:**
O `TemplateForm.tsx` exibe contas para associar. Filtrar para mostrar apenas contas ativas (não banidas).

---

### 3. Template Form (`TemplateForm.tsx`)

**Receber lista de contas já filtrada** do componente pai (LogisticaSemanalTab), ou filtrar internamente.

---

## Arquivos a Modificar

| Arquivo | Mudança |
|---------|---------|
| `src/components/colaborador/ContasNichoTab.tsx` | Adicionar status "banida", separar lista, atualizar filtros |
| `src/components/colaborador/LogisticaSemanalTab.tsx` | Filtrar contas banidas na query |
| `src/components/colaborador/TemplateForm.tsx` | Passar contas filtradas (sem banidas) |
| `src/components/admin/ContasTab.tsx` | Atualizar mapeamento de status (opcional) |

---

## Detalhes Técnicos

### Mapeamento de Status
```typescript
// Novo type
type StatusConta = "ativa" | "risco" | "desativada" | "banida";

// Mapeamento do banco para frontend
const mapStatusFromDB = (status: string): StatusConta => {
  if (status === "ativa") return "ativa";
  if (status === "pausada" || status === "limitada") return "risco";
  if (status === "banida") return "banida"; // Agora mapeado diretamente
  return "ativa";
};

// Mapeamento do frontend para banco
const mapStatusToDB = (status: StatusConta): string => {
  if (status === "ativa") return "ativa";
  if (status === "risco") return "limitada";
  if (status === "desativada") return "pausada"; // Pausada = desativada voluntária
  if (status === "banida") return "banida";
  return "ativa";
};
```

### Estilo do status "Banida"
```typescript
banida: { 
  label: "Banida", 
  className: "bg-purple-900/30 text-purple-400 border-purple-500/30" 
}
```

### Separação na lista
```typescript
// Separar contas normais das banidas
const contasNormais = contasFiltradas.filter(c => mapStatusFromDB(c.status) !== "banida");
const contasBanidas = contasFiltradas.filter(c => mapStatusFromDB(c.status) === "banida");

// Renderizar duas seções:
// 1. Lista principal com drag-and-drop (contasNormais)
// 2. Seção "Cemitério" abaixo para banidas (contasBanidas) - sem drag
```

### Query na Logística
```typescript
// Buscar contas excluindo banidas
const { data: contasData } = await supabase
  .from("contas_redes_sociais")
  .select("id, nome_conta, plataforma")
  .eq("nicho_id", nichoId)
  .neq("status", "banida")  // ← Filtro adicionado
  .order("nome_conta");
```

---

## Resultado Visual Esperado

**Módulo de Contas:**
```
┌─────────────────────────────────────┐
│ Contas do Nicho                     │
├─────────────────────────────────────┤
│ ≡ @conta1 [Ativa] 🇧🇷              │
│ ≡ @conta2 [Risco] 🇧🇷              │
│ ≡ @conta3 [Desativada] 🇺🇸         │
├─────────────────────────────────────┤
│ 💀 Contas Banidas (2)               │
├─────────────────────────────────────┤
│   @contamorta1 [Banida] 🇧🇷        │
│   @contamorta2 [Banida] 🇧🇷        │
└─────────────────────────────────────┘
```

**Logística:** Só mostra contas ativas no filtro e templates
