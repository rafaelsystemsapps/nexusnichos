import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderKanban, Users, Share2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Stats {
  nichos: number;
  usuarios: number;
  contas: number;
  contasPorStatus: {
    ativa: number;
    pausada: number;
    banida: number;
    limitada: number;
  };
}

export function DashboardOverview() {
  const [stats, setStats] = useState<Stats>({
    nichos: 0,
    usuarios: 0,
    contas: 0,
    contasPorStatus: { ativa: 0, pausada: 0, banida: 0, limitada: 0 },
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [nichosRes, profilesRes, contasRes] = await Promise.all([
        supabase.from("nichos").select("*", { count: "exact", head: true }),
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("contas_redes_sociais").select("status"),
      ]);

      const contasPorStatus = {
        ativa: contasRes.data?.filter((c: any) => c.status === "ativa").length || 0,
        pausada: contasRes.data?.filter((c: any) => c.status === "pausada").length || 0,
        banida: contasRes.data?.filter((c: any) => c.status === "banida").length || 0,
        limitada: contasRes.data?.filter((c: any) => c.status === "limitada").length || 0,
      };

      setStats({
        nichos: nichosRes.count || 0,
        usuarios: profilesRes.count || 0,
        contas: contasRes.data?.length || 0,
        contasPorStatus,
      });
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const mainCards = [
    { title: "Total de Nichos", value: stats.nichos, icon: FolderKanban, color: "text-blue-400" },
    { title: "Usuários", value: stats.usuarios, icon: Users, color: "text-green-400" },
    { title: "Contas Sociais", value: stats.contas, icon: Share2, color: "text-orange-400" },
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
          <p className="text-muted-foreground mt-1">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Visão Geral</h2>
        <p className="text-muted-foreground mt-1">Resumo de todas as operações</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {mainCards.map((card) => (
          <Card key={card.title} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-200 hover:border-primary/20">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className={`h-5 w-5 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{card.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 shadow-premium">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Clock className="h-5 w-5 text-primary" />
            Contas por Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Ativas</span>
            <Badge variant="default" className="bg-green-500/20 text-green-400 border-0">{stats.contasPorStatus.ativa}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Pausadas</span>
            <Badge variant="secondary">{stats.contasPorStatus.pausada}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Banidas</span>
            <Badge variant="destructive">{stats.contasPorStatus.banida}</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Limitadas</span>
            <Badge variant="outline">{stats.contasPorStatus.limitada}</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
