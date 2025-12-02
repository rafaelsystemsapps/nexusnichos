import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format, isAfter, isBefore, startOfWeek, endOfWeek, addDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardNichoTabProps {
  nichoId: string;
}

export function DashboardNichoTab({ nichoId }: DashboardNichoTabProps) {
  const [conteudosSemana, setConteudosSemana] = useState<any[]>([]);
  const [conteudosAtrasados, setConteudosAtrasados] = useState<any[]>([]);
  const [proximosPrazos, setProximosPrazos] = useState<any[]>([]);
  const [contasStats, setContasStats] = useState({ ativas: 0, pausadas: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [nichoId]);

  const fetchDashboardData = async () => {
    try {
      const hoje = new Date();
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
      const fimSemana = endOfWeek(hoje, { weekStartsOn: 1 });
      const proximosDias = addDays(hoje, 7);

      // Conteúdos da semana
      const { data: semanaData } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .gte("data_postagem", format(inicioSemana, "yyyy-MM-dd"))
        .lte("data_postagem", format(fimSemana, "yyyy-MM-dd"))
        .order("data_postagem", { ascending: true });

      setConteudosSemana(semanaData || []);

      // Conteúdos atrasados
      const { data: atrasadosData } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .lt("data_postagem", format(hoje, "yyyy-MM-dd"))
        .neq("status", "publicado")
        .order("data_postagem", { ascending: true });

      setConteudosAtrasados(atrasadosData || []);

      // Próximos prazos
      const { data: prazosData } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .gte("data_postagem", format(hoje, "yyyy-MM-dd"))
        .lte("data_postagem", format(proximosDias, "yyyy-MM-dd"))
        .neq("status", "publicado")
        .order("data_postagem", { ascending: true })
        .limit(5);

      setProximosPrazos(prazosData || []);

      // Contas stats
      const { data: contasData } = await supabase
        .from("contas_redes_sociais")
        .select("status")
        .eq("nicho_id", nichoId);

      const ativas = contasData?.filter((c) => c.status === "ativa").length || 0;
      const pausadas = contasData?.filter((c) => c.status !== "ativa").length || 0;
      setContasStats({ ativas, pausadas });
    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      planejado: "secondary",
      em_producao: "default",
      publicado: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize text-xs">
        {status.replace("_", " ")}
      </Badge>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{conteudosSemana.length}</p>
                <p className="text-xs text-muted-foreground">Esta semana</p>
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
                <p className="text-2xl font-bold">{conteudosAtrasados.length}</p>
                <p className="text-xs text-muted-foreground">Atrasados</p>
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
                <p className="text-xs text-muted-foreground">Contas ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-premium">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Clock className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contasStats.pausadas}</p>
                <p className="text-xs text-muted-foreground">Contas pausadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Conteúdos Atrasados */}
        <Card className="border-border/50 shadow-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Conteúdos Atrasados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {conteudosAtrasados.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum conteúdo atrasado!</p>
            ) : (
              <div className="space-y-3">
                {conteudosAtrasados.slice(0, 5).map((conteudo) => (
                  <div
                    key={conteudo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{conteudo.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conteudo.data_postagem), "dd/MM", { locale: ptBR })} • {conteudo.canal}
                      </p>
                    </div>
                    {getStatusBadge(conteudo.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Próximos Prazos */}
        <Card className="border-border/50 shadow-premium">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Próximos Prazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {proximosPrazos.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum prazo próximo.</p>
            ) : (
              <div className="space-y-3">
                {proximosPrazos.map((conteudo) => (
                  <div
                    key={conteudo.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{conteudo.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(conteudo.data_postagem), "dd/MM", { locale: ptBR })} • {conteudo.canal}
                      </p>
                    </div>
                    {getStatusBadge(conteudo.status)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conteúdos da Semana */}
      <Card className="border-border/50 shadow-premium">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Conteúdos da Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          {conteudosSemana.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum conteúdo planejado para esta semana.</p>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {conteudosSemana.map((conteudo) => (
                <div
                  key={conteudo.id}
                  className="p-3 rounded-lg bg-surface hover:bg-surface-hover transition-colors border border-border/30"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="font-medium text-sm truncate flex-1">{conteudo.titulo}</p>
                    {getStatusBadge(conteudo.status)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(conteudo.data_postagem), "EEEE, dd/MM", { locale: ptBR })}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize mt-1">
                    {conteudo.canal} • {conteudo.profiles?.nome || "Sem responsável"}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
