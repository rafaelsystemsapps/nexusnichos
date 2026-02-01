

## Plano: PATCH Modulo Gestao de Clientes e Apps

### Resumo do Patch

Simplificar o cadastro de clientes removendo campos de "Meta da Semana" e ajustando a logica de pagamento para incluir campo `ticket_valor` quando modelo for porcentagem. Garantir que todas as abas (Clientes, Aplicativos, Custos, Prospeccao) reflitam mudancas automaticamente via invalidacao centralizada do React Query.

---

### 1. Migracao de Banco de Dados

Adicionar campo `ticket_valor` na tabela `clientes`:

```sql
ALTER TABLE clientes ADD COLUMN ticket_valor numeric NULL;
```

O campo sera usado quando `modelo_pagamento = 'porcentagem'` para armazenar o valor do ticket do cliente.

**Nota**: Os campos `meta_descricao`, `meta_valor`, `meta_status` continuam no banco mas nao serao mais usados na UI.

---

### 2. Modificacoes no ClienteForm.tsx

**Remover da UI:**
- Secao inteira "Meta da Semana" (linhas 258-296)
- Campos: `meta_descricao`, `meta_valor`, `meta_status` do formData

**Ajustar secao "Pagamento":**

| Modelo | Campos Obrigatorios |
|--------|---------------------|
| Valor Fixo | `valor_contrato` (R$) |
| Porcentagem | `valor_contrato` (%), `ticket_valor` (R$) |

**Nova estrutura da secao Contrato:**

```text
┌─────────────────────────────────────────────────────────────┐
│  Contrato                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Modelo de Pagamento: Valor Fixo ▼]                        │
│                                                             │
│  Se Valor Fixo:                                             │
│    Valor Mensal (R$): [_________]  (obrigatorio)            │
│                                                             │
│  Se Porcentagem:                                            │
│    Percentual (%): [____]  (obrigatorio, 0-100)             │
│    Ticket (R$): [________]  (obrigatorio, > 0)              │
│                                                             │
│  [Aplicativo Vinculado] [URL do App] [Data Inicio]          │
└─────────────────────────────────────────────────────────────┘
```

**Validacoes:**
- Se `modelo_pagamento === "valor_fixo"`:
  - `valor_contrato` obrigatorio e > 0
- Se `modelo_pagamento === "porcentagem"`:
  - `valor_contrato` obrigatorio e entre 0 e 100
  - `ticket_valor` obrigatorio e > 0

**Payload de salvamento:**
```typescript
const payload = {
  // ... outros campos
  valor_contrato: parseFloat(formData.valor_contrato) || null,
  ticket_valor: formData.modelo_pagamento === "porcentagem" 
    ? parseFloat(formData.ticket_valor) 
    : null,
  // Remover: meta_descricao, meta_valor, meta_status
};
```

---

### 3. Modificacoes no ClienteCard.tsx

**Remover completamente:**
- Bloco "Meta da Semana" (linhas 305-318)
- Variaveis: `metaStatusConfig`, `MetaIcon`
- Imports: `Target`, `CheckCircle2`, `AlertCircle`, `XCircle`

**Ajustar exibicao de pagamento (linhas 270-301):**

```text
Se modelo_pagamento === "porcentagem":
  - Badge: "20%"
  - Texto adicional: "Ticket: R$ X" (ou "Ticket nao informado" se null)

Se modelo_pagamento === "valor_fixo":
  - Badge: "R$ 500"
```

**Nova funcao formatarValorContrato:**
```typescript
const formatarValorContrato = () => {
  if (!cliente.valor_contrato) return null;
  if (cliente.modelo_pagamento === "porcentagem") {
    return `${cliente.valor_contrato}%`;
  }
  return `R$ ${cliente.valor_contrato.toLocaleString("pt-BR")}`;
};

const formatarTicket = () => {
  if (cliente.modelo_pagamento !== "porcentagem") return null;
  if (!cliente.ticket_valor) return "Ticket nao informado";
  return `Ticket: R$ ${cliente.ticket_valor.toLocaleString("pt-BR")}`;
};
```

**Migrar delete para usar mutation hook:**

Atualmente o `handleDelete` usa supabase direto. Criar e usar hook `useDeleteCliente`:

```typescript
// Em useClientes.ts - novo hook
export function useDeleteCliente(nichoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (clienteId: string) => {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", clienteId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", nichoId] });
      toast.success("Cliente removido");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });
}
```

---

### 4. Criar hooks de Cliente (Create/Update)

Atualmente `ClienteForm` usa supabase direto. Criar hooks para centralizar invalidacao:

```typescript
// Em useClientes.ts

export function useCreateCliente(nichoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const { data, error } = await supabase
        .from("clientes")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", nichoId] });
      toast.success("Cliente criado!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });
}

export function useUpdateCliente(nichoId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: { id: string } & any) => {
      const { data, error } = await supabase
        .from("clientes")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
      queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", nichoId] });
      toast.success("Cliente atualizado!");
    },
    onError: (error: any) => {
      toast.error("Erro: " + error.message);
    },
  });
}
```

---

### 5. Atualizar Hooks de Apps para Invalidar Corretamente

Modificar `useClienteApps.ts` para invalidar tambem a query de custos consolidados:

```typescript
// useCreateClienteApp - adicionar ao onSuccess:
queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", variables.nicho_id] });

// useUpdateClienteApp - adicionar ao onSuccess:
queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", data.nicho_id] });

// useDeleteClienteApp - precisa receber nichoId como parametro:
mutationFn: async ({ id, clienteId, nichoId }: { id: string; clienteId: string; nichoId: string }) => {
  // ...
},
onSuccess: (_, variables) => {
  queryClient.invalidateQueries({ queryKey: ["cliente-apps", variables.clienteId] });
  queryClient.invalidateQueries({ queryKey: ["all-cliente-apps", variables.nichoId] });
  toast.success("App removido");
}
```

---

### 6. Atualizar useAllClienteApps.ts

Incluir `ticket_valor` na busca para exibicao futura:

```typescript
const { data: clientes, error: clientesError } = await supabase
  .from("clientes")
  .select("id, nome, status, valor_contrato, modelo_pagamento, ticket_valor")
  .eq("nicho_id", nichoId);
```

Atualizar interface:
```typescript
export interface ClienteComCustos {
  // ... existentes
  ticket_valor: number | null;
}
```

---

### 7. Atualizar CustosAppsTab.tsx

Exibir ticket quando modelo for porcentagem:

Na tabela, na coluna "Contrato":
```typescript
<TableCell className="text-right">
  {cliente.modelo_pagamento === "porcentagem" ? (
    <div className="flex flex-col items-end">
      <span>{cliente.valor_contrato}%</span>
      {cliente.ticket_valor && (
        <span className="text-xs text-muted-foreground">
          Ticket: {formatCurrency(cliente.ticket_valor)}
        </span>
      )}
    </div>
  ) : cliente.valor_contrato ? (
    formatCurrency(cliente.valor_contrato)
  ) : (
    "-"
  )}
</TableCell>
```

---

### Arquivos a Modificar

| Arquivo | Acao | Mudancas |
|---------|------|----------|
| `supabase/migrations/` | **CRIAR** | Adicionar coluna `ticket_valor` |
| `src/hooks/queries/useClientes.ts` | **MODIFICAR** | Adicionar hooks `useCreateCliente`, `useUpdateCliente`, `useDeleteCliente` |
| `src/hooks/queries/useClienteApps.ts` | **MODIFICAR** | Adicionar invalidacao de `all-cliente-apps` |
| `src/hooks/queries/useAllClienteApps.ts` | **MODIFICAR** | Incluir `ticket_valor` na query |
| `src/components/colaborador/ClienteForm.tsx` | **MODIFICAR** | Remover meta, ajustar pagamento, usar hooks |
| `src/components/colaborador/ClienteCard.tsx` | **MODIFICAR** | Remover meta, ajustar pagamento, usar hooks |
| `src/components/colaborador/CustosAppsTab.tsx` | **MODIFICAR** | Exibir ticket em clientes % |
| `src/components/colaborador/ClienteAppItem.tsx` | **MODIFICAR** | Passar nichoId para delete |
| `src/components/colaborador/ClienteAppsSection.tsx` | **VERIFICAR** | Repassar nichoId corretamente |

---

### Diagrama de Invalidacao

```text
Criar/Editar/Deletar Cliente
           │
           ├── invalidate ["clientes", nichoId]
           │       └── Atualiza: ClientesTab (lista)
           │
           └── invalidate ["all-cliente-apps", nichoId]
                   └── Atualiza: CustosAppsTab (tabela consolidada)

Criar/Editar/Deletar App do Cliente
           │
           ├── invalidate ["cliente-apps", clienteId]
           │       └── Atualiza: ClienteAppsSection (lista no card)
           │
           └── invalidate ["all-cliente-apps", nichoId]
                   └── Atualiza: CustosAppsTab (tabela consolidada)
```

---

### Criterios de Aceite

1. Criar cliente novo pede: nome, tipo, instagram e pagamento (com validacao correta)
2. Meta da semana nao aparece mais nem no form nem no card
3. Se pagamento = porcentagem, pede percentual e ticket (obrigatorios)
4. Se pagamento = valor fixo, pede valor R$ (obrigatorio) e ticket nao aparece
5. Ao salvar/editar cliente, a aba Custos atualiza imediatamente (sem refresh)
6. Ao adicionar/remover apps, a aba Custos atualiza imediatamente
7. RLS continua respeitado por nicho
8. Campo ticket_valor aparece na tabela de custos para clientes com modelo porcentagem

---

### Ordem de Implementacao

1. Migration: adicionar `ticket_valor`
2. Hooks: criar mutations de cliente e atualizar invalidacoes
3. ClienteForm: remover meta + ajustar pagamento + usar hooks
4. ClienteCard: remover meta + ajustar exibicao + usar hooks
5. useAllClienteApps: incluir ticket_valor
6. CustosAppsTab: exibir ticket
7. Testar fluxo completo de sincronizacao entre abas

