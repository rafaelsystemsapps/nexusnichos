import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, PauseCircle, AlertTriangle, Share2 } from "lucide-react";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isIOSMobile = useIsIOSMobile();

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

  const statsCards = [
    { key: "total", value: contasStats.total, label: "Total de contas", icon: Share2, bgColor: "bg-primary/10", iconColor: "text-primary" },
    { key: "ativas", value: contasStats.ativas, label: "Ativas", icon: CheckCircle, bgColor: "bg-green-500/10", iconColor: "text-green-500" },
    { key: "pausadas", value: contasStats.pausadas, label: "Pausadas", icon: PauseCircle, bgColor: "bg-yellow-500/10", iconColor: "text-yellow-500" },
    { key: "banidas", value: contasStats.banidas, label: "Banidas", icon: AlertTriangle, bgColor: "bg-destructive/10", iconColor: "text-destructive" },
    { key: "limitadas", value: contasStats.limitadas, label: "Limitadas", icon: AlertTriangle, bgColor: "bg-orange-500/10", iconColor: "text-orange-500" },
  ];

  return (
    <div className={cn(
      isIOSMobile ? "space-y-4" : "space-y-6"
    )}>
      {/* Stats Cards */}
      <div className={cn(
        "grid gap-3",
        isIOSMobile ? "grid-cols-2" : "grid-cols-2 md:grid-cols-5 gap-4"
      )}>
        {statsCards.map((card) => (
          <Card 
            key={card.key} 
            className={cn(
              "border-border/50",
              isIOSMobile 
                ? "ios-card p-3 ios-animate-fade-in" 
                : "shadow-premium"
            )}
          >
            <CardContent className={cn(
              isIOSMobile ? "p-0" : "pt-4"
            )}>
              <div className={cn(
                "flex items-center",
                isIOSMobile ? "gap-2" : "gap-3"
              )}>
                <div className={cn(
                  "rounded-lg",
                  card.bgColor,
                  isIOSMobile ? "p-1.5" : "p-2"
                )}>
                  <card.icon className={cn(
                    card.iconColor,
                    isIOSMobile ? "h-4 w-4" : "h-5 w-5"
                  )} />
                </div>
                <div>
                  <p className={cn(
                    "font-bold",
                    isIOSMobile ? "ios-value" : "text-2xl"
                  )}>
                    {card.value}
                  </p>
                  <p className={cn(
                    "text-muted-foreground",
                    isIOSMobile ? "ios-subtitle" : "text-xs"
                  )}>
                    {card.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lista de Contas */}
      <Card className={cn(
        "border-border/50",
        isIOSMobile ? "ios-card" : "shadow-premium"
      )}>
        <CardHeader className={cn(
          isIOSMobile ? "p-3 pb-2" : "pb-3"
        )}>
          <CardTitle className={cn(
            "flex items-center gap-2",
            isIOSMobile ? "text-base" : "text-lg"
          )}>
            <Share2 className={cn(
              "text-primary",
              isIOSMobile ? "h-4 w-4" : "h-5 w-5"
            )} />
            Visão Geral das Contas
          </CardTitle>
        </CardHeader>
        <CardContent className={isIOSMobile ? "p-3 pt-0" : undefined}>
          {contas.length === 0 ? (
            <p className={cn(
              "text-muted-foreground",
              isIOSMobile ? "ios-subtitle" : "text-sm"
            )}>
              Nenhuma conta cadastrada ainda.
            </p>
          ) : (
            <div className={cn(
              "grid gap-2",
              isIOSMobile ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3 gap-3"
            )}>
              {contas.map((conta) => (
                <div
                  key={conta.id}
                  className={cn(
                    "rounded-lg bg-surface hover:bg-surface-hover transition-colors border border-border/30",
                    isIOSMobile 
                      ? "p-2.5 ios-animate-fade-in" 
                      : "p-3"
                  )}
                >
                  <div className={cn(
                    "flex items-start justify-between gap-2",
                    isIOSMobile ? "mb-1" : "mb-2"
                  )}>
                    <p className={cn(
                      "font-medium truncate flex-1",
                      isIOSMobile ? "text-sm" : "text-sm"
                    )}>
                      @{conta.nome_conta}
                    </p>
                    {getStatusBadge(conta.status)}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn(
                      "text-muted-foreground capitalize",
                      isIOSMobile ? "text-[11px]" : "text-xs"
                    )}>
                      {conta.plataforma}
                    </span>
                    {getAquecimentoBadge(conta.status_aquecimento)}
                    {conta.media_videos > 0 && (
                      <span className={cn(
                        "text-muted-foreground",
                        isIOSMobile ? "text-[11px]" : "text-xs"
                      )}>
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
