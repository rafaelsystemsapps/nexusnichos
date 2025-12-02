import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut } from "lucide-react";
import { CalendarioTab } from "@/components/colaborador/CalendarioTab";
import { ConteudosListTab } from "@/components/colaborador/ConteudosListTab";
import { ContasNichoTab } from "@/components/colaborador/ContasNichoTab";
import { TimeNichoTab } from "@/components/colaborador/TimeNichoTab";
import { toast } from "sonner";

export default function ColaboradorWorkspace() {
  const { signOut, user } = useAuth();
  const [nicho, setNicho] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNichoDoColaborador();
  }, [user]);

  const fetchNichoDoColaborador = async () => {
    if (!user) return;

    try {
      const { data: userNicho, error: nichoError } = await supabase
        .from("user_nichos")
        .select("nicho_id, nichos(*)")
        .eq("user_id", user.id)
        .single();

      if (nichoError) throw nichoError;

      setNicho(userNicho.nichos);
    } catch (error: any) {
      toast.error("Erro ao carregar nicho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!nicho) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg mb-4">Você ainda não foi atribuído a um nicho.</p>
          <Button onClick={signOut}>Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-surface backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nexus Nichos</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Workspace: <span className="font-semibold text-primary">{nicho.nome}</span>
            </p>
          </div>
          <Button variant="outline" onClick={signOut} className="border-border/50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs defaultValue="calendario">
          <TabsList className="grid grid-cols-4 w-full max-w-2xl mb-8 bg-card/50 p-1">
            <TabsTrigger value="calendario" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Calendário</TabsTrigger>
            <TabsTrigger value="conteudos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Conteúdos</TabsTrigger>
            <TabsTrigger value="contas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contas</TabsTrigger>
            <TabsTrigger value="time" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Time</TabsTrigger>
          </TabsList>

          <TabsContent value="calendario">
            <CalendarioTab nichoId={nicho.id} />
          </TabsContent>

          <TabsContent value="conteudos">
            <ConteudosListTab nichoId={nicho.id} />
          </TabsContent>

          <TabsContent value="contas">
            <ContasNichoTab nichoId={nicho.id} />
          </TabsContent>

          <TabsContent value="time">
            <TimeNichoTab nichoId={nicho.id} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
