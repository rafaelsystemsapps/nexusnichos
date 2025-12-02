import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FolderKanban, FileText, Share2 } from "lucide-react";

export function DashboardOverview() {
  const [stats, setStats] = useState({
    nichos: 0,
    usuarios: 0,
    conteudos: 0,
    contas: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [nichosRes, usersRes, conteudosRes, contasRes] = await Promise.all([
        supabase.from("nichos").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("conteudos").select("id", { count: "exact", head: true }),
        supabase.from("contas_redes_sociais").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        nichos: nichosRes.count || 0,
        usuarios: usersRes.count || 0,
        conteudos: conteudosRes.count || 0,
        contas: contasRes.count || 0,
      });
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
    }
  };

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total de Nichos</CardTitle>
          <FolderKanban className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.nichos}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Usuários</CardTitle>
          <Users className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.usuarios}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Conteúdos</CardTitle>
          <FileText className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.conteudos}</div>
        </CardContent>
      </Card>

      <Card className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-300 hover:border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Contas Sociais</CardTitle>
          <Share2 className="h-5 w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold tracking-tight">{stats.contas}</div>
        </CardContent>
      </Card>
    </div>
  );
}
