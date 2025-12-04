import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, PauseCircle, AlertTriangle, Share2 } from "lucide-react";

interface DashboardNichoTabProps {
  nichoId: string;
}

interface ContaResumo {
  id: string;
  nome_conta: string;
  plataforma: string;
  status: string;
  status_aquecimento: string;
  media_videos: number;
}

export function DashboardNichoTab({ nichoId }: DashboardNichoTabProps) {
  const [contas, setContas] = useState<ContaResumo[]>([]);
  const [contasStats, setContasStats] = useState({
    ativas: 0,
    pausadas: 0,
    banidas: 0,
    limitadas: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [nichoId]);

  const fetchDashboardData = async () => {
    try {
      const { data: contasData } = await supabase
        .from("contas_redes_sociais")
        .select("id, nome_conta, plataforma, status, status_aquecimento, media_videos")
        .eq("nicho_id", nichoId)
        .order("nome_conta");

      const contasList = contasData || [];
      setContas(contasList);

      const ativas = contasList.filter((c) => c.status === "ativa").length;
      const pausadas = contasList.filter((c) => c.status === "pausada").length;
      const banidas = contasList.filter((c) => c.status === "banida").length;
      const limitadas = contasList.filter((c) => c.status === "limitada").length;

      setContasStats({
        ativas,
        pausadas,
        banidas,
        limitadas,
        total: contasList.length,
      });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: "default" | "secondary" | "outline" | "destructive"; label: string }> = {
      ativa: { variant: "default", label: "Ativa" },
      pausada: { variant: "secondary", label: "Pausada" },
      banida: { variant: "destructive", label: "Banida" },
      limitada: { variant: "outline", label: "Limitada" },
    };

    const { variant, label } = config[status] || { variant: "secondary", label: status };

    return (
      <Badge variant={variant} className="text-xs">
        {label}
      </Badge>
    );
  };

  const getAquecimentoBadge = (status: string | null) => {
    if (!status) return null;
    
    const config: Record<string, string> = {
      aquecida: "bg-green-500/10 text-green-500",
      media: "bg-yellow-500/10 text-yellow-500",
      fria: "bg-blue-500/10 text-blue-500",
      inativa: "bg-muted text-muted-foreground",
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs ${config[status] || config.media}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Share2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.total}</p>
                <p className="text-xs text-muted-foreground">Total de contas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.ativas}</p>
                <p className="text-xs text-muted-foreground">Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <PauseCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.pausadas}</p>
                <p className="text-xs text-muted-foreground">Pausadas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.banidas}</p>
                <p className="text-xs text-muted-foreground">Banidas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-orange-500/10">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.limitadas}</p>
                <p className="text-xs text-muted-foreground">Limitadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Contas */}
      <Card className="border-border/50 shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Share2 className="h-5 w-5 text-primary" />
            Visão Geral das Contas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {contas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma conta cadastrada ainda.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className="p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors border border-border/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm truncate flex-1">@{conta.nome_conta}</p>
                    {getStatusBadge(conta.status)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-muted-foreground capitalize">{conta.plataforma}</span>
                    {getAquecimentoBadge(conta.status_aquecimento)}
                    {conta.media_videos > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {conta.media_videos} vídeos/sem
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
