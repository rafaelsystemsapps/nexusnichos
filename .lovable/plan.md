

## Plano: Patch Logística Semanal - Visão Mensal com Métricas

### Resumo

Adicionar ao componente `LogisticaSemanalTab` uma camada de navegação mensal com card de métricas consolidadas, mantendo a visão semanal atual 100% funcional.

---

### Arquitetura da Solução

```text
┌─────────────────────────────────────────────────────────────────┐
│  BARRA NAVEGAÇÃO MENSAL                                         │
│  [ < ]   "Fevereiro 2026"   [ > ]   [Mês Atual]                │
├─────────────────────────────────────────────────────────────────┤
│  CARD MÉTRICAS MENSAIS                                          │
│  ┌─────────┬─────────────┬─────────────┬──────────┬───────────┐ │
│  │ Total   │ Concluídas  │ % Conclusão │ Pendente │ Não Concl.│ │
│  │   127   │     89      │    70.1%    │    23    │    15     │ │
│  └─────────┴─────────────┴─────────────┴──────────┴───────────┘ │
├─────────────────────────────────────────────────────────────────┤
│  HEADER SEMANAL (existente - inalterado)                        │
│  Semana 5 • 27/01 - 02/02/2026   [<] [Hoje] [>] [Gerar]        │
├─────────────────────────────────────────────────────────────────┤
│  GRID SEMANAL (existente - inalterado)                          │
│  ...tabela com tarefas por dia...                               │
└─────────────────────────────────────────────────────────────────┘
```

---

### Detalhamento Técnico

#### 1. Novos Imports

Adicionar ao bloco de imports existente:

```typescript
import { startOfMonth, endOfMonth, addMonths } from "date-fns";
import { Calendar } from "lucide-react";
```

#### 2. Novos Estados

Adicionar junto aos estados existentes:

```typescript
// Navegação mensal
const [monthOffset, setMonthOffset] = useState(0);

// Métricas do mês
const [metricasMes, setMetricasMes] = useState({
  total: 0,
  concluida: 0,
  pendente: 0,
  em_andamento: 0,
  nao_concluida: 0,
  percentual: 0,
});

// Loading state separado para métricas
const [loadingMetricasMes, setLoadingMetricasMes] = useState(false);
```

#### 3. Helper getMonthDates

```typescript
const getMonthDates = useCallback(() => {
  const base = new Date();
  const mesReferencia = addMonths(base, monthOffset);
  const inicioMes = startOfMonth(mesReferencia);
  const fimMes = endOfMonth(mesReferencia);
  return { mesReferencia, inicioMes, fimMes };
}, [monthOffset]);
```

#### 4. Função fetchMetricasMes

**Estratégia de query:** Como `tarefa_diaria` não tem `nicho_id` diretamente, buscar primeiro os IDs de `semana_logistica` do nicho que estão no range do mês, depois buscar tarefas por `semana_id IN (...)`.

```typescript
const fetchMetricasMes = useCallback(async () => {
  if (!nichoId) return;
  setLoadingMetricasMes(true);

  try {
    const { inicioMes, fimMes } = getMonthDates();
    const inicioStr = format(inicioMes, "yyyy-MM-dd");
    const fimStr = format(fimMes, "yyyy-MM-dd");

    // 1) Buscar semanas do nicho que intersectam com o mês
    const { data: semanasData, error: semanasError } = await supabase
      .from("semana_logistica")
      .select("id")
      .eq("nicho_id", nichoId)
      .or(`semana_inicio.lte.${fimStr},semana_fim.gte.${inicioStr}`);

    if (semanasError) throw semanasError;

    if (!semanasData || semanasData.length === 0) {
      setMetricasMes({ total: 0, concluida: 0, pendente: 0, em_andamento: 0, nao_concluida: 0, percentual: 0 });
      return;
    }

    const semanaIds = semanasData.map((s) => s.id);

    // 2) Buscar tarefas dessas semanas no range de datas do mês
    const { data: tarefasData, error: tarefasError } = await supabase
      .from("tarefa_diaria")
      .select("id, status, data")
      .in("semana_id", semanaIds)
      .gte("data", inicioStr)
      .lte("data", fimStr);

    if (tarefasError) throw tarefasError;

    // 3) Calcular métricas
    const metricas = (tarefasData || []).reduce(
      (acc, t) => {
        acc.total += 1;
        if (t.status === "concluida") acc.concluida += 1;
        else if (t.status === "pendente") acc.pendente += 1;
        else if (t.status === "em_andamento") acc.em_andamento += 1;
        else if (t.status === "nao_concluida") acc.nao_concluida += 1;
        return acc;
      },
      { total: 0, concluida: 0, pendente: 0, em_andamento: 0, nao_concluida: 0, percentual: 0 }
    );

    metricas.percentual = metricas.total > 0 
      ? Math.round((metricas.concluida / metricas.total) * 100 * 10) / 10 
      : 0;

    setMetricasMes(metricas);
  } catch (error: any) {
    toast.error("Erro ao carregar métricas do mês: " + error.message);
  } finally {
    setLoadingMetricasMes(false);
  }
}, [nichoId, getMonthDates]);
```

#### 5. useEffect para Métricas Mensais

```typescript
useEffect(() => {
  fetchMetricasMes();
}, [fetchMetricasMes]);
```

#### 6. UI - Barra de Navegação Mensal + Card de Métricas

Inserir **acima** do header existente (linha 428):

```tsx
{/* Navegação Mensal e Métricas */}
<div className="space-y-4">
  {/* Barra de navegação do mês */}
  <div className="flex items-center justify-center gap-4">
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => setMonthOffset((m) => m - 1)}
    >
      <ChevronLeft className="h-4 w-4" />
    </Button>
    <div className="flex items-center gap-2 min-w-[180px] justify-center">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <span className="text-lg font-semibold capitalize">
        {format(getMonthDates().mesReferencia, "MMMM yyyy", { locale: ptBR })}
      </span>
    </div>
    <Button 
      variant="outline" 
      size="icon" 
      onClick={() => setMonthOffset((m) => m + 1)}
    >
      <ChevronRight className="h-4 w-4" />
    </Button>
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setMonthOffset(0)}
      disabled={monthOffset === 0}
    >
      Mês Atual
    </Button>
  </div>

  {/* Card de métricas mensais */}
  <Card>
    <CardHeader className="pb-2">
      <CardTitle className="text-base flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Resumo do Mês
      </CardTitle>
    </CardHeader>
    <CardContent>
      {loadingMetricasMes ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <div className="text-2xl font-bold">{metricasMes.total}</div>
            <div className="text-xs text-muted-foreground">Total</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-green-500/10">
            <div className="text-2xl font-bold text-green-500">
              {metricasMes.concluida}
            </div>
            <div className="text-xs text-muted-foreground">Concluídas</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <div className="text-2xl font-bold text-primary">
              {metricasMes.percentual}%
            </div>
            <div className="text-xs text-muted-foreground">Conclusão</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-yellow-500/10">
            <div className="text-2xl font-bold text-yellow-500">
              {metricasMes.pendente + metricasMes.em_andamento}
            </div>
            <div className="text-xs text-muted-foreground">Pendentes</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-destructive/10">
            <div className="text-2xl font-bold text-destructive">
              {metricasMes.nao_concluida}
            </div>
            <div className="text-xs text-muted-foreground">Não Concluídas</div>
          </div>
        </div>
      )}
    </CardContent>
  </Card>
</div>
```

---

### Critérios de Aceite

| Critério | Validação |
|----------|-----------|
| Mês atual exibido em português | Ao abrir, mostra "fevereiro 2026" (capitalize, ptBR) |
| Navegação < > funciona | Botões mudam mês e recarregam métricas |
| Botão "Mês Atual" reseta | Volta para monthOffset=0 |
| Métricas corretas | Total, Concluídas, %, Pendentes, Não Concluídas batem com DB |
| Mês sem tarefas | Todos os valores mostram 0 |
| Visão semanal intacta | Grid semanal continua funcionando sem regressão |
| Isolamento por nicho | Query usa semana_logistica para filtrar por nicho (RLS respeitado) |
| Loading state | Skeleton aparece enquanto carrega métricas |

---

### Segurança

- **RLS mantida**: A query passa por `semana_logistica` que tem RLS habilitado com `get_user_nicho()`, garantindo que apenas tarefas do nicho do usuário sejam retornadas.
- **Sem bypass**: Não há acesso direto a `tarefa_diaria` sem filtro por semana pertencente ao nicho.

---

### Arquivos Modificados

| Arquivo | Ação |
|---------|------|
| `src/components/colaborador/LogisticaSemanalTab.tsx` | Modificar (adicionar estados, funções e UI) |

Nenhuma migration de banco necessária.

