import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface TimeNichoTabProps {
  nichoId: string;
}

export function TimeNichoTab({ nichoId }: TimeNichoTabProps) {
  const [membros, setMembros] = useState<any[]>([]);

  useEffect(() => {
    fetchMembros();
  }, [nichoId]);

  const fetchMembros = async () => {
    try {
      const { data, error } = await supabase
        .from("user_nichos")
        .select(`
          *,
          profiles(nome, email),
          user_roles:profiles!inner(user_roles(role))
        `)
        .eq("nicho_id", nichoId);

      if (error) throw error;

      const membrosFormatados = data?.map((item: any) => ({
        id: item.profiles.id,
        nome: item.profiles.nome,
        email: item.profiles.email,
        role: item.profiles.user_roles?.[0]?.role || "colaborador",
      }));

      setMembros(membrosFormatados || []);
    } catch (error: any) {
      toast.error("Erro ao carregar membros");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Time do Nicho</h2>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {membros.map((membro) => (
          <Card key={membro.id} className="border-border/50 shadow-premium hover:shadow-premium-lg transition-all duration-200 hover:border-primary/30">
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span className="text-lg">{membro.nome}</span>
                <Badge variant="secondary" className="capitalize bg-primary/20 text-primary border-0">
                  {membro.role}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{membro.email}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
