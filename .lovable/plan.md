

## Plano: Simplificar Seção de Apps para Domínios

### O Que Será Feito

Transformar a seção "Apps & Custos" do card de cliente em uma seção focada em **Domínios**, removendo campos desnecessários e mantendo a integração com o painel de Custos.

---

### Mudança Visual

**Antes:**
```text
┌────────────────────────────────────────────┐
│ Apps & Custos (2)                    [+]   │
│ Mensal: R$ 150  │ Estrutural: R$ 0 │ Marg. │
├────────────────────────────────────────────┤
│ 🔁 Lovable Pro      R$ 120/mês   [🧠][✏️][🗑]│
│    Compartilhado                           │
│    Obs: Pago em dólar...                   │
├────────────────────────────────────────────┤
│ 🧱 API Setup        R$ 30        [✏️][🗑]  │
└────────────────────────────────────────────┘
```

**Depois:**
```text
┌────────────────────────────────────────────┐
│ Domínios (1)                         [+]   │
│ Custo: R$ 50/mês                           │
├────────────────────────────────────────────┤
│ 🌐 doguetto.com.br    R$ 600/ano  [🧠][✏️][🗑]│
│                       (R$ 50/mês)          │
└────────────────────────────────────────────┘
```

---

### Campos do Formulário

| Campo | Status |
|-------|--------|
| Nome do Domínio | ✅ Mantém (renomear de `nome_app`) |
| Valor (R$) | ✅ Mantém |
| Periodicidade | ✅ Mantém (mensal, anual, único) |
| Mapa Mental URL | ✅ Mantém |
| Ativo (toggle) | ✅ Mantém |
| ~~Tipo de Custo~~ | ❌ Remove |
| ~~Rateio~~ | ❌ Remove |
| ~~Observação~~ | ❌ Remove |

---

### Modificações por Arquivo

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/ClienteAppsSection.tsx` | Renomear para "Domínios", remover cálculos de estrutural/margem, simplificar resumo para "Custo: R$ X/mês" |
| `src/components/colaborador/ClienteAppForm.tsx` | Remover campos tipo_custo, rateio, observacao; atualizar labels para "Domínio" |
| `src/components/colaborador/ClienteAppItem.tsx` | Remover badge "Compartilhado", remover observação, trocar ícone para Globe (domínio) |
| `src/hooks/queries/useClienteApps.ts` | Simplificar interface removendo campos desnecessários, manter cálculo mensal |
| `src/hooks/queries/useAllClienteApps.ts` | Remover cálculo de estrutural, manter custo mensal para o painel |
| `src/components/colaborador/CustosAppsTab.tsx` | Atualizar coluna "Total Apps" para "Total Domínios" |

---

### Banco de Dados

A tabela `client_apps` **não precisa de alteração**. Os campos `tipo_custo`, `rateio` e `observacao` continuarão existindo, mas:
- Novos registros usarão valores default
- O código simplesmente deixará de exibir/editar esses campos

---

### Integração com Painel de Custos

O cálculo do custo mensal permanece igual:
- Domínios ativos com periodicidade **mensal** → soma o valor
- Domínios ativos com periodicidade **anual** → divide por 12
- Domínios com periodicidade **único** → não entra no cálculo mensal

O painel de Custos continuará mostrando:
- Total de domínios cadastrados
- Custo mensal por cliente
- MRR vs Custo Operacional

---

### Critérios de Aceite

1. Seção renomeada de "Apps & Custos" para "Domínios"
2. Formulário mostra apenas: nome, valor, periodicidade, mapa mental, ativo
3. Item do domínio exibe apenas nome, valor e ações
4. Custo mensal continua sendo calculado e exibido no painel de Custos
5. Ícone atualizado de RefreshCw/Layers para Globe (domínio)

