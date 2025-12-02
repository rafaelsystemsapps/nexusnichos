import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { toast } from "sonner";

interface TimeNichoTabProps {
  nichoId: string;
}

interface Membro {
  id: string;
  nome: string;
  email: string;
  role: string;
}

export function TimeNichoTab({ nichoId }: TimeNichoTabProps) {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMembros();
  }, [nichoId]);

  const fetchMembros = async () => {
    try {
      setLoading(true);
      
      // First get user_nichos for this nicho
      const { data: userNichos, error: nichoError } = await supabase
        .from("user_nichos")
        .select("user_id")
        .eq("nicho_id", nichoId);

      if (nichoError) throw nichoError;

      if (!userNichos || userNichos.length === 0) {
        setMembros([]);
        return;
      }

      const userIds = userNichos.map(un => un.user_id);

      // Fetch profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, nome, email")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Fetch roles for these users
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      if (rolesError) throw rolesError;

      // Combine the data
      const membrosFormatados: Membro[] = (profiles || []).map((profile) => {
        const userRole = roles?.find(r => r.user_id === profile.id);
        return {
          id: profile.id,
          nome: profile.nome,
          email: profile.email,
          role: userRole?.role || "colaborador",
        };
      });

      setMembros(membrosFormatados);
    } catch (error: any) {
      console.error("Erro ao carregar membros:", error);
      toast.error("Erro ao carregar membros do time");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" />
          <h2 className="text-3xl font-bold tracking-tight">Time do Nicho</h2>
        </div>
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="w-6 h-6 text-primary" />
        <h2 className="text-3xl font-bold tracking-tight">Time do Nicho</h2>
      </div>

      {membros.length === 0 ? (
        <p className="text-muted-foreground">Nenhum membro encontrado neste nicho.</p>
      ) : (
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
      )}
    </div>
  );
}
