

## Plano: Remover Card "Custo Clientes" da Aba Custos

### O Que Será Feito

Remover o card "Custo Clientes" do grid de resumo, pois os custos operacionais já estão representados pelas Ferramentas de Trabalho.

---

### Mudança Visual

**Antes (6 cards):**
```text
┌──────────┬──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │ Clientes │ Custo    │ Custo    │ Custo    │ Margem   │
│ Apps     │ c/ Apps  │ Clientes │ Ferramen.│ TOTAL    │ Real     │
│ 12       │ 5        │ R$ 800   │ R$ 300   │ R$ 1.100 │ R$ 500   │
└──────────┴──────────┴──────────┴──────────┴──────────┴──────────┘
                         ↑ REMOVER
```

**Depois (5 cards):**
```text
┌──────────┬──────────┬──────────┬──────────┬──────────┐
│ Total    │ Clientes │ Custo    │ Custo    │ Margem   │
│ Apps     │ c/ Apps  │ Ferramen.│ TOTAL    │ Real     │
│ 12       │ 5        │ R$ 300   │ R$ 300   │ R$ 500   │
└──────────┴──────────┴──────────┴──────────┴──────────┘
```

---

### Modificações

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/CustosAppsTab.tsx` | Remover card "Custo Clientes" (linhas 82-92) |
| `src/components/colaborador/CustosAppsTab.tsx` | Ajustar grid para 5 colunas no desktop |
| `src/components/colaborador/CustosAppsTab.tsx` | Atualizar cálculo do Custo Total para usar apenas ferramentas |

---

### Ajustes de Cálculo

O "Custo Total" passará a ser apenas o custo das ferramentas:
```typescript
// Antes
const custoTotal = totais.custo_mensal_total + custoMensalFerramentas;

// Depois
const custoTotal = custoMensalFerramentas;
```

A tabela de "Custos por Cliente" continua exibindo os custos de apps por cliente (para controle individual), mas o resumo geral focará nas ferramentas de trabalho.

---

### Critérios de Aceite

1. Card "Custo Clientes" removido do grid
2. Grid ajustado para 5 colunas
3. Custo Total reflete apenas ferramentas de trabalho

