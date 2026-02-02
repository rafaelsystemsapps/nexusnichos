

## Plano: Adicionar Botão para Novo Modelo de Custo

### O Que Será Feito

Adicionar um botão "+" acima da seção "Domínios" no card de cliente, permitindo cadastrar outros tipos de custos além de domínios.

---

### Mudança Visual

**Depois:**
```text
┌────────────────────────────────────────────┐
│ Custos do Cliente                    [+]   │ ← NOVO: botão para adicionar custo
├────────────────────────────────────────────┤
│ 🌐 Domínios (1)                      [+]   │
│    Custo: R$ 50/mês                        │
│    ├ doguetto.com.br  R$ 600/ano          │
├────────────────────────────────────────────┤
│ 💳 Assinaturas (1)                   [+]   │ ← NOVO: nova categoria
│    Custo: R$ 30/mês                        │
│    ├ Hotmart PRO      R$ 30/mês           │
└────────────────────────────────────────────┘
```

---

### Abordagem Técnica

Adicionar um campo `categoria` na tabela `client_apps` para diferenciar tipos de custo:
- **dominio** (atual)
- **assinatura** (serviços recorrentes)
- **licenca** (software)
- **outro** (custos diversos)

O botão principal abrirá um formulário onde o usuário escolhe a categoria antes de preencher os dados.

---

### Modificações por Arquivo

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/ClienteCard.tsx` | Adicionar seção "Custos do Cliente" com botão "+" que abre o formulário com seletor de categoria |
| `src/components/colaborador/ClienteAppsSection.tsx` | Renomear para `ClienteCustosSection.tsx`, suportar múltiplas categorias, agrupar por tipo |
| `src/components/colaborador/ClienteAppForm.tsx` | Renomear para `ClienteCustoForm.tsx`, adicionar campo `categoria` com opções |
| `src/components/colaborador/ClienteAppItem.tsx` | Renomear para `ClienteCustoItem.tsx`, exibir ícone baseado na categoria |
| `src/hooks/queries/useClienteApps.ts` | Adicionar `categoria` na interface, renomear hooks |
| **Banco de Dados** | Adicionar coluna `categoria` na tabela `client_apps` |

---

### Alteração no Banco de Dados

```sql
ALTER TABLE client_apps 
ADD COLUMN categoria TEXT NOT NULL DEFAULT 'dominio';
```

Valores possíveis:
- `dominio` (padrão, para manter compatibilidade)
- `assinatura`
- `licenca`
- `outro`

---

### Ícones por Categoria

| Categoria | Ícone | Cor |
|-----------|-------|-----|
| dominio | Globe | cyan |
| assinatura | CreditCard | purple |
| licenca | Key | amber |
| outro | Package | gray |

---

### Critérios de Aceite

1. Botão "+" visível acima/junto da seção de custos
2. Formulário permite selecionar categoria do custo
3. Custos agrupados por categoria na visualização
4. Ícone diferente para cada tipo de categoria
5. Custo mensal total calculado somando todas as categorias
6. Dados existentes mantidos como "dominio"

