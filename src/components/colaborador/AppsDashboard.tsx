import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Smartphone, Users, DollarSign, TrendingUp, Download, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface Aplicativo {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_app: string | null;
  status: string | null;
  clientes_count?: number;
  resultados?: Array<{
    id: string;
    tipo: string;
    valor: number | null;
    data: string;
  }>;
}

interface Transacao {
  id: string;
  app_id: string | null;
  preco_venda: number;
  preco_custo: number;
}

interface AppsDashboardProps {
  aplicativos: Aplicativo[];
  transacoes: Transacao[];
}

const STATUS_COLORS: Record<string, string> = {
  ideia: "hsl(var(--muted-foreground))",
  desenvolvimento: "hsl(45, 93%, 47%)",
  lancado: "hsl(217, 91%, 60%)",
  ativo: "hsl(142, 76%, 36%)",
  pausado: "hsl(0, 72%, 51%)",
};

const STATUS_LABELS: Record<string, string> = {
  ideia: "Ideia",
  desenvolvimento: "Em Dev",
  lancado: "Lançado",
  ativo: "Ativo",
  pausado: "Pausado",
};

export function AppsDashboard({ aplicativos, transacoes }: AppsDashboardProps) {
  // Métricas agregadas
  const metrics = useMemo(() => {
    const totalApps = aplicativos.length;
    const ativos = aplicativos.filter(a => a.status === "ativo" || a.status === "lancado").length;
    const totalClientes = aplicativos.reduce((acc, app) => acc + (app.clientes_count || 0), 0);
    
    // Receita de transações vinculadas a apps
    const receitaTotal = transacoes
      .filter(t => t.app_id)
      .reduce((acc, t) => acc + (t.preco_venda - t.preco_custo), 0);

    // Downloads e usuários dos resultados
    const totalDownloads = aplicativos.reduce((acc, app) => {
      const downloads = app.resultados?.filter(r => r.tipo === "download").reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      return acc + downloads;
    }, 0);

    const totalUsuarios = aplicativos.reduce((acc, app) => {
      const usuarios = app.resultados?.filter(r => r.tipo === "usuario_ativo").reduce((sum, r) => sum + (r.valor || 0), 0) || 0;
      return acc + usuarios;
    }, 0);

    return { totalApps, ativos, totalClientes, receitaTotal, totalDownloads, totalUsuarios };
  }, [aplicativos, transacoes]);

  // Dados para gráfico de receita por app
  const receitaPorApp = useMemo(() => {
    const appReceitaMap = new Map<string, { nome: string; receita: number }>();
    
    aplicativos.forEach(app => {
      appReceitaMap.set(app.id, { nome: app.nome, receita: 0 });
    });
    
    transacoes.forEach(t => {
      if (t.app_id && appReceitaMap.has(t.app_id)) {
        const current = appReceitaMap.get(t.app_id)!;
        current.receita += (t.preco_venda - t.preco_custo);
      }
    });

    return Array.from(appReceitaMap.values())
      .filter(item => item.receita > 0)
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 5);
  }, [aplicativos, transacoes]);

  // Dados para gráfico de status
  const statusDistribuicao = useMemo(() => {
    const counts: Record<string, number> = {};
    aplicativos.forEach(app => {
      const status = app.status || "ideia";
      counts[status] = (counts[status] || 0) + 1;
    });
    
    return Object.entries(counts).map(([status, count]) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      color: STATUS_COLORS[status] || "hsl(var(--muted-foreground))",
    }));
  }, [aplicativos]);

  if (aplicativos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Cards de Métricas */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Smartphone className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalApps}</p>
                <p className="text-xs text-muted-foreground">Total Apps</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.ativos}</p>
                <p className="text-xs text-muted-foreground">Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-500/10">
                <Users className="h-4 w-4 text-violet-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalClientes}</p>
                <p className="text-xs text-muted-foreground">Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  R$ {metrics.receitaTotal.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                </p>
                <p className="text-xs text-muted-foreground">Receita</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Download className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalDownloads}</p>
                <p className="text-xs text-muted-foreground">Downloads</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-border/50">
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <Star className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{metrics.totalUsuarios}</p>
                <p className="text-xs text-muted-foreground">Usuários</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Receita por App */}
        {receitaPorApp.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Receita por Aplicativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={receitaPorApp} layout="vertical" margin={{ left: 0, right: 20 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="nome" 
                      width={100} 
                      tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR")}`, "Receita"]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Bar dataKey="receita" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Distribuição por Status */}
        {statusDistribuicao.length > 0 && (
          <Card className="bg-card/50 border-border/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Status dos Apps</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribuicao}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {statusDistribuicao.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string) => [value, name]}
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legenda */}
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {statusDistribuicao.map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5">
                    <div 
                      className="w-2.5 h-2.5 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
