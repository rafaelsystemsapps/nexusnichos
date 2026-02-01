

## Plano: Sistema de Aquecimento Manual com Métrica de Última Atividade

### Resumo

Substituir o sistema automático de aquecimento de contas (baseado em dias e progresso) por um sistema manual simples onde o usuário define se a conta está "fria" ou "quente". Além disso, integrar com o módulo de Logística para exibir a data da última tarefa concluída associada à conta.

---

### Mudanças no Modelo de Dados

#### 1. Campos a MANTER na tabela `contas_redes_sociais`

| Campo | Novo Uso |
|-------|----------|
| `status_aquecimento` | Armazenar o status manual: "fria" ou "quente" |

#### 2. Campos a IGNORAR (não deletar, mas parar de usar)

| Campo | Motivo |
|-------|--------|
| `aquecimento_ativo` | Sistema automático removido |
| `aquecimento_meta_dias` | Sistema automático removido |
| `aquecimento_inicio` | Sistema automático removido |

Nota: Os campos ficam no banco (evita migration destrutiva), mas o frontend para de usá-los.

#### 3. Novo Campo (opcional via migration)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `ultima_tarefa_concluida` | `timestamp` | Cache da última tarefa concluída (opcional, pode ser calculado em runtime) |

**Recomendação**: Calcular em runtime para evitar complexidade de sync.

---

### Arquivo: `src/components/colaborador/ContasNichoTab.tsx`

#### Remover

1. **Tipos e constantes do sistema automático:**
   - `PLANOS_AQUECIMENTO` (linhas 126-131)
   - Lógica de `calcularFaseAquecimento` (linhas 174-195)
   - Lógica de `calcularDiasAquecendo` (linhas 198-202)
   - Lógica de `calcularProgressoAquecimento` (linhas 205-210)

2. **Interface e props:**
   - `onToggleAquecimento` e `onSelectPlano` do `SortableContaItemProps`
   - Props relacionadas no componente `SortableContaItem`

3. **UI de progresso:**
   - Barra de progresso do aquecimento (linhas 298-318)
   - Aviso "Definir plano de aquecimento" (linhas 321-325)
   - Dropdown de planos de aquecimento (linhas 373-429)
   - Badge de aquecida (linhas 432-436)

4. **Handlers:**
   - `handleToggleAquecimento` (linhas 696-721)
   - `handleSelectPlano` (linhas 724-738)

5. **Form fields:**
   - Campos de aquecimento no formulário (`aquecimento_meta_dias`, `aquecimento_ativo`)

#### Modificar

1. **Novo tipo de aquecimento manual:**
```typescript
type StatusAquecimento = "fria" | "quente";

const AQUECIMENTO_CONFIG: Record<StatusAquecimento, { 
  label: string; 
  icon: React.ReactNode; 
  className: string;
}> = {
  fria: { 
    label: "Fria", 
    icon: <Snowflake className="h-3 w-3" />,
    className: "bg-sky-500/20 text-sky-400 border-sky-500/30" 
  },
  quente: { 
    label: "Quente", 
    icon: <Flame className="h-3 w-3" />,
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30" 
  },
};
```

2. **Novo filtro simplificado:**
```typescript
const AQUECIMENTO_FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "fria", label: "❄️ Fria" },
  { value: "quente", label: "🔥 Quente" },
];
```

3. **Estado do formulário:**
```typescript
// Adicionar ao formData
status_aquecimento: "fria" as StatusAquecimento,

// Remover do formData
// aquecimento_meta_dias
// aquecimento_ativo
```

4. **Buscar última tarefa concluída por conta:**
```typescript
// Nova função para buscar última atividade
const [ultimasTarefas, setUltimasTarefas] = useState<Record<string, string>>({});

const fetchUltimasTarefas = async () => {
  // Buscar tarefas concluídas agrupadas por conta_id via template
  const { data: templatesComConta } = await supabase
    .from("tarefa_templates")
    .select("id, conta_id")
    .eq("nicho_id", nichoId)
    .not("conta_id", "is", null);

  if (!templatesComConta?.length) return;

  const templatePorConta: Record<string, string[]> = {};
  templatesComConta.forEach(t => {
    if (t.conta_id) {
      if (!templatePorConta[t.conta_id]) templatePorConta[t.conta_id] = [];
      templatePorConta[t.conta_id].push(t.id);
    }
  });

  const ultimasMap: Record<string, string> = {};
  
  for (const [contaId, templateIds] of Object.entries(templatePorConta)) {
    const { data } = await supabase
      .from("tarefa_diaria")
      .select("data, updated_at")
      .in("template_id", templateIds)
      .eq("status", "concluida")
      .order("updated_at", { ascending: false })
      .limit(1);
    
    if (data?.[0]) {
      ultimasMap[contaId] = data[0].updated_at;
    }
  }
  
  setUltimasTarefas(ultimasMap);
};
```

5. **UI do card da conta:**
```typescript
// Substituir barra de progresso por:
{/* Status de aquecimento manual + Última atividade */}
<div className="flex items-center gap-2 mt-1">
  {getAquecimentoDisplay(conta.status_aquecimento)}
  {ultimasTarefas[conta.id] && (
    <span className="text-xs text-muted-foreground">
      Última tarefa: {formatDistanceToNow(new Date(ultimasTarefas[conta.id]), { addSuffix: true, locale: ptBR })}
    </span>
  )}
</div>
```

6. **Toggle rápido de aquecimento:**
```typescript
// Novo handler simples
const handleToggleAquecimento = async (conta: any) => {
  const novoStatus = conta.status_aquecimento === "quente" ? "fria" : "quente";
  
  const { error } = await supabase
    .from("contas_redes_sociais")
    .update({ status_aquecimento: novoStatus })
    .eq("id", conta.id);

  if (error) {
    toast.error("Erro: " + error.message);
    return;
  }
  
  toast.success(`Conta marcada como ${novoStatus}!`);
  fetchContas();
};
```

7. **Botão de toggle no card:**
```typescript
// Substituir dropdown complexo por botão simples
<Button
  variant="ghost"
  size="icon"
  onClick={() => handleToggleAquecimento(conta)}
  className={cn(
    "h-8 w-8",
    conta.status_aquecimento === "quente" 
      ? "text-orange-400 hover:text-orange-300" 
      : "text-sky-400 hover:text-sky-300"
  )}
  title={conta.status_aquecimento === "quente" ? "Marcar como fria" : "Marcar como quente"}
>
  {conta.status_aquecimento === "quente" 
    ? <Flame className="h-4 w-4" /> 
    : <Snowflake className="h-4 w-4" />}
</Button>
```

8. **Formulário de edição:**
```typescript
// Adicionar select simples para status de aquecimento
<div>
  <Label className="text-xs">Aquecimento</Label>
  <Select
    value={formData.status_aquecimento}
    onValueChange={(value) => setFormData({ ...formData, status_aquecimento: value as StatusAquecimento })}
  >
    <SelectTrigger className="h-9">
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="fria">❄️ Fria</SelectItem>
      <SelectItem value="quente">🔥 Quente</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

### Fluxo de Dados

```text
┌─────────────────────────────────────────────────────────────┐
│                    CONTAS SOCIAIS                           │
├─────────────────────────────────────────────────────────────┤
│  @usuario1 [TikTok]                                         │
│  ❄️ Fria  •  Última tarefa: há 3 dias                       │
│                                                             │
│  @usuario2 [Instagram]                                      │
│  🔥 Quente  •  Última tarefa: há 2 horas                    │
│                                                             │
│  @usuario3 [TikTok]                                         │
│  ❄️ Fria  •  Sem tarefas recentes                           │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              LOGÍSTICA SEMANAL                              │
├─────────────────────────────────────────────────────────────┤
│  Template: "Postar vídeo" → conta_id: @usuario2             │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐                │
│  │ Seg │ Ter │ Qua │ Qui │ Sex │ Sáb │ Dom │                │
│  │  ✅ │  ✅ │  ⏳ │  ○  │  ○  │  ○  │  ○  │                │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘                │
│  Quando tarefa é concluída → atualiza "última tarefa"       │
└─────────────────────────────────────────────────────────────┘
```

---

### Arquivos Afetados

| Arquivo | Ação | Detalhes |
|---------|------|----------|
| `src/components/colaborador/ContasNichoTab.tsx` | **MODIFICAR** | Remover sistema automático, adicionar toggle manual e métrica de última tarefa |

---

### Critérios de Aceite

1. Toggle de aquecimento alterna entre "fria" e "quente" com um clique
2. Badge mostra ❄️ ou 🔥 conforme status atual
3. Filtro funciona para fria/quente
4. "Última tarefa" mostra tempo relativo (ex: "há 2 dias")
5. Contas sem tarefas associadas mostram "Sem tarefas recentes"
6. Formulário permite definir status inicial ao criar/editar
7. Performance: busca de últimas tarefas não trava a UI
8. Sem regressão: demais funcionalidades de contas continuam funcionando

---

### Nota sobre Migration

**Não é necessária migration.** O campo `status_aquecimento` já existe na tabela com default `'media'::text`. Apenas precisamos:

1. Atualizar registros existentes de `'media'` para `'fria'` (pode ser feito via query manual ou automaticamente no frontend)
2. Parar de usar os campos `aquecimento_*` do sistema automático

Se preferir migration para limpar dados:
```sql
-- Normalizar valores existentes
UPDATE contas_redes_sociais 
SET status_aquecimento = 'fria' 
WHERE status_aquecimento NOT IN ('fria', 'quente');
```

