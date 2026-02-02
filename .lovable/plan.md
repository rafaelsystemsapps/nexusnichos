
## Plano: Remover Funcionalidade "Registrar Resultado"

### O Que Será Feito

Remover completamente a funcionalidade de registrar e exibir resultados de aplicativos.

---

### Componentes Afetados

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/AplicativoCard.tsx` | Remover botão "Resultado", estado `resultadoOpen`, import do `ResultadoAppForm`, seção "Resultados Recentes" e ícone `BarChart3` |
| `src/components/colaborador/ResultadoAppForm.tsx` | Deletar arquivo (não será mais usado) |
| `src/components/colaborador/AplicativosTab.tsx` | Remover busca de resultados na tabela `resultados_app` |

---

### Mudanças Detalhadas

**AplicativoCard.tsx:**
- Remover import do `ResultadoAppForm`
- Remover import do ícone `BarChart3`
- Remover estado `resultadoOpen`
- Remover botão "Resultado" da lista de ações
- Remover seção "Resultados Recentes" do card expandido
- Remover interface `resultados` do tipo `Aplicativo`
- Remover componente `<ResultadoAppForm />` do JSX

**AplicativosTab.tsx:**
- Remover query para tabela `resultados_app`
- Remover mapeamento de resultados para aplicativos

---

### Antes e Depois (Card)

**Antes:**
```text
┌─────────────────────────────────┐
│ App   ├ Status ├ Tipo           │
├─────────────────────────────────┤
│ [App] [Repo] [Resultado]        │ ← botão removido
├─────────────────────────────────┤
│ Resultados Recentes             │ ← seção removida
│ receita: R$ 500 | 01/02         │
└─────────────────────────────────┘
```

**Depois:**
```text
┌─────────────────────────────────┐
│ App   ├ Status ├ Tipo           │
├─────────────────────────────────┤
│ [App] [Repo]                    │
└─────────────────────────────────┘
```

---

### Critérios de Aceite

1. Botão "Resultado" removido dos cards de aplicativo
2. Seção "Resultados Recentes" removida do card expandido
3. Arquivo `ResultadoAppForm.tsx` deletado
4. Query de resultados removida do `AplicativosTab.tsx`
5. Aplicação compila sem erros
