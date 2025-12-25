import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsIOSMobile } from "@/hooks/use-mobile";

interface MapaDependenciaProps {
  nichoId: string;
}

interface PlataformaConcentracao {
  plataforma: string;
  count: number;
  percentual: number;
}

interface DependenciaData {
  totalContasAtivas: number;
  plataformas: PlataformaConcentracao[];
  tiposConteudo: { tipo: string; count: number; percentual: number }[];
}

export function MapaDependencia({ nichoId }: MapaDependenciaProps) {
  const [data, setData] = useState<DependenciaData | null>(null);
  const [loading, setLoading] = useState(true);
  const isIOSMobile = useIsIOSMobile();

  useEffect(() => {
    calcularDependencias();
  }, [nichoId]);

  const calcularDependencias = async () => {
    try {
      // Buscar contas ativas
      const { data: contas, error: contasError } = await supabase
        .from("contas_redes_sociais")
        .select("plataforma, tipo_conteudo, status")
        .eq("nicho_id", nichoId)
        .eq("status", "ativa");

      if (contasError) throw contasError;

      const contasAtivas = contas || [];
      const totalContasAtivas = contasAtivas.length;

      // Calcular concentração por plataforma
      const plataformaCount: Record<string, number> = {};
      contasAtivas.forEach((conta) => {
        const plat = conta.plataforma || "outros";
        plataformaCount[plat] = (plataformaCount[plat] || 0) + 1;
      });

      const plataformas: PlataformaConcentracao[] = Object.entries(plataformaCount)
        .map(([plataforma, count]) => ({
          plataforma,
          count,
          percentual: totalContasAtivas > 0 ? Math.round((count / totalContasAtivas) * 100) : 0,
        }))
        .sort((a, b) => b.percentual - a.percentual);

      // Calcular concentração por tipo de conteúdo
      const tipoCount: Record<string, number> = {};
      contasAtivas.forEach((conta) => {
        const tipo = conta.tipo_conteudo || "não definido";
        tipoCount[tipo] = (tipoCount[tipo] || 0) + 1;
      });

      const tiposConteudo = Object.entries(tipoCount)
        .map(([tipo, count]) => ({
          tipo,
          count,
          percentual: totalContasAtivas > 0 ? Math.round((count / totalContasAtivas) * 100) : 0,
        }))
        .sort((a, b) => b.percentual - a.percentual);

      setData({
        totalContasAtivas,
        plataformas,
        tiposConteudo,
      });
    } catch (error) {
      console.error("Erro ao calcular dependências:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatPlataforma = (plat: string) => {
    const nomes: Record<string, string> = {
      tiktok: "TikTok",
      instagram: "Instagram",
      youtube: "YouTube",
      facebook: "Facebook",
      twitter: "Twitter/X",
      linkedin: "LinkedIn",
      outros: "Outros",
    };
    return nomes[plat] || plat;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Calculando dependências...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground text-sm">Erro ao carregar dados.</p>
      </div>
    );
  }

  const temRiscoPlataforma = data.plataformas.some((p) => p.percentual > 70);
  const temRiscoAtivos = data.totalContasAtivas <= 2;
  const temRiscoTipo = data.tiposConteudo.some((t) => t.percentual > 80);

  return (
    <div className={cn("space-y-6", isIOSMobile && "space-y-4")}>
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
          Mapa de Dependência
        </h2>
        <p className="text-xs text-muted-foreground/70">
          "Onde estou frágil sem perceber?"
        </p>
      </div>

      {/* Sem dados */}
      {data.totalContasAtivas === 0 && (
        <Card className="border-border/30 bg-muted/20">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground text-sm">
              Nenhuma conta ativa cadastrada.
            </p>
          </CardContent>
        </Card>
      )}

      {data.totalContasAtivas > 0 && (
        <>
          {/* Concentração por Plataforma */}
          <Card className={cn(
            "border-border/30",
            temRiscoPlataforma ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                Concentração por Plataforma
                {temRiscoPlataforma && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {data.plataformas.map((plat) => (
                <div key={plat.plataforma} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className={cn(
                      plat.percentual > 70 ? "text-amber-500 font-medium" : "text-foreground"
                    )}>
                      {formatPlataforma(plat.plataforma)}
                    </span>
                    <span className={cn(
                      "font-bold",
                      plat.percentual > 70 ? "text-amber-500" : "text-muted-foreground"
                    )}>
                      {plat.percentual}%
                    </span>
                  </div>
                  <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        plat.percentual > 70 ? "bg-amber-500/60" : "bg-muted-foreground/30"
                      )}
                      style={{ width: `${plat.percentual}%` }}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Dependência de Ativos */}
          <Card className={cn(
            "border-border/30",
            temRiscoAtivos ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                Dependência de Ativos
                {temRiscoAtivos && (
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className={cn(
                  "text-3xl font-bold",
                  temRiscoAtivos ? "text-amber-500" : "text-foreground"
                )}>
                  {data.totalContasAtivas}
                </span>
                <span className="text-muted-foreground text-sm">
                  {data.totalContasAtivas === 1 ? "conta ativa" : "contas ativas"}
                </span>
              </div>
              {temRiscoAtivos && (
                <p className="text-xs text-amber-500/80 mt-2">
                  {data.totalContasAtivas === 1 
                    ? "Se esta conta cair, 100% da operação morre." 
                    : "Se uma cair, 50% da operação morre."}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Concentração por Tipo de Conteúdo */}
          {data.tiposConteudo.length > 0 && data.tiposConteudo[0].tipo !== "não definido" && (
            <Card className={cn(
              "border-border/30",
              temRiscoTipo ? "bg-amber-500/5 border-amber-500/20" : "bg-muted/20"
            )}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium uppercase tracking-wide text-muted-foreground flex items-center gap-2">
                  Concentração por Tipo
                  {temRiscoTipo && (
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.tiposConteudo.slice(0, 4).map((tipo) => (
                  <div key={tipo.tipo} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className={cn(
                        tipo.percentual > 80 ? "text-amber-500 font-medium" : "text-foreground"
                      )}>
                        {tipo.tipo}
                      </span>
                      <span className={cn(
                        "font-bold",
                        tipo.percentual > 80 ? "text-amber-500" : "text-muted-foreground"
                      )}>
                        {tipo.percentual}%
                      </span>
                    </div>
                    <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          tipo.percentual > 80 ? "bg-amber-500/60" : "bg-muted-foreground/30"
                        )}
                        style={{ width: `${tipo.percentual}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
