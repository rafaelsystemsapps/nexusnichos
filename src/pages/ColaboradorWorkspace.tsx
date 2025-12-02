import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
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
import LoadingScreen from "@/components/LoadingScreen";

export default function ColaboradorWorkspace() {
  const { signOut, user, nichoId: userNichoId } = useAuth();
  const { nichoId } = useParams<{ nichoId: string }>();
  const [nicho, setNicho] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Validate access: colaborador can only access their assigned nicho
  useEffect(() => {
    if (userNichoId && nichoId && userNichoId !== nichoId) {
      toast.error("Você não tem acesso a este nicho");
      // Redirect will be handled by Navigate below
    }
  }, [userNichoId, nichoId]);

  useEffect(() => {
    fetchNicho();
  }, [nichoId]);

  const fetchNicho = async () => {
    if (!nichoId) return;

    try {
      const { data, error } = await supabase
        .from("nichos")
        .select("*")
        .eq("id", nichoId)
        .single();

      if (error) throw error;

      setNicho(data);
    } catch (error: any) {
      toast.error("Erro ao carregar nicho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Redirect if trying to access wrong nicho
  if (userNichoId && nichoId && userNichoId !== nichoId) {
    return <Navigate to={`/workspace/${userNichoId}`} replace />;
  }

  if (loading) {
    return <LoadingScreen />;
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
            <CalendarioTab nichoId={nichoId!} />
          </TabsContent>

          <TabsContent value="conteudos">
            <ConteudosListTab nichoId={nichoId!} />
          </TabsContent>

          <TabsContent value="contas">
            <ContasNichoTab nichoId={nichoId!} />
          </TabsContent>

          <TabsContent value="time">
            <TimeNichoTab nichoId={nichoId!} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
