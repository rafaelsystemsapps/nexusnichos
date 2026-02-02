

## Plano: Unificar Custos e Adicionar MRR

### O Que Será Feito

1. **Unificar** os cards "Ferramentas" e "Custo Total" (que agora mostram o mesmo valor) em um único card chamado **"Custo Operacional"**
2. **Adicionar** novo card **MRR** (Monthly Recurring Revenue) - soma dos valores de contrato mensais de todos os clientes

---

### Mudança Visual

**Antes (5 cards):**
```text
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │ Clientes │ Custo    │ Custo    │ Margem   │
│ Apps     │ c/ Apps  │ Ferramen.│ TOTAL    │ Real     │
│ 12       │ 5        │ R$ 300   │ R$ 300   │ R$ 500   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
                ↑ UNIFICAR ↑
```

**Depois (5 cards):**
```text
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │ Clientes │   MRR    │ Custo    │ Margem   │
│ Apps     │ c/ Apps  │ (novo)   │ Operac.  │ Real     │
│ 12       │ 5        │ R$ 2.500 │ R$ 300   │ R$ 2.200 │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### Lógica do MRR

O MRR será calculado somando os valores de contrato de clientes com `modelo_pagamento = 'valor_fixo'`:

```typescript
// Calcular MRR (soma dos contratos mensais de valor fixo)
const mrr = clientes
  .filter(c => c.modelo_pagamento === 'valor_fixo' && c.valor_contrato)
  .reduce((acc, c) => acc + (c.valor_contrato || 0), 0);
```

Clientes com modelo "porcentagem" não entram no MRR (receita variável).

---

### Ajuste da Margem Real

A margem real passa a ser:

```typescript
// Margem = MRR - Custo Operacional (ferramentas)
const margemReal = mrr - custoMensalFerramentas;
```

---

### Modificações

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/CustosAppsTab.tsx` | Remover card "Ferramentas" separado |
| `src/components/colaborador/CustosAppsTab.tsx` | Adicionar card "MRR" (verde/teal) |
| `src/components/colaborador/CustosAppsTab.tsx` | Renomear "Custo Total" para "Custo Operacional" |
| `src/components/colaborador/CustosAppsTab.tsx` | Atualizar cálculo da margem para usar MRR |

---

### Critérios de Aceite

1. Card "MRR" exibe soma dos contratos mensais (valor_fixo)
2. Card "Custo Operacional" mostra apenas ferramentas de trabalho
3. "Margem Real" = MRR - Custo Operacional
4. Layout mantém 5 cards

