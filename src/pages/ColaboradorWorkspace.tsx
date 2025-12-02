import { useEffect, useState } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardNichoTab } from "@/components/colaborador/DashboardNichoTab";
import { ConteudoBrutoTab } from "@/components/colaborador/ConteudoBrutoTab";
import { CalendarioTab } from "@/components/colaborador/CalendarioTab";
import { ConteudosListTab } from "@/components/colaborador/ConteudosListTab";
import { ContasNichoTab } from "@/components/colaborador/ContasNichoTab";
import { BibliotecaNichoTab } from "@/components/colaborador/BibliotecaNichoTab";
import { TimeNichoTab } from "@/components/colaborador/TimeNichoTab";
import { toast } from "sonner";
import LoadingScreen from "@/components/LoadingScreen";

export default function ColaboradorWorkspace() {
  const { nichoId: userNichoId } = useAuth();
  const { nichoId, "*": subPath } = useParams<{ nichoId: string; "*": string }>();
  const [nicho, setNicho] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userNichoId && nichoId && userNichoId !== nichoId) {
      toast.error("Você não tem acesso a este nicho");
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
        .maybeSingle();

      if (error) throw error;
      setNicho(data);
    } catch (error: any) {
      toast.error("Erro ao carregar nicho: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (userNichoId && nichoId && userNichoId !== nichoId) {
    return <Navigate to={`/workspace/${userNichoId}`} replace />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  if (!nicho) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg mb-4 text-muted-foreground">Nicho não encontrado.</p>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
    if (!subPath || subPath === "") return "Dashboard";
    if (subPath === "ideias") return "Conteúdo Bruto / Ideias";
    if (subPath === "calendario") return "Calendário Editorial";
    if (subPath === "conteudos") return "Pipeline de Conteúdos";
    if (subPath === "contas") return "Contas do Nicho";
    if (subPath === "biblioteca") return "Biblioteca do Nicho";
    if (subPath === "time") return "Time";
    return "Workspace";
  };

  const renderContent = () => {
    if (!subPath || subPath === "") {
      return <DashboardNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "ideias") {
      return <ConteudoBrutoTab nichoId={nichoId!} />;
    }
    if (subPath === "calendario") {
      return <CalendarioTab nichoId={nichoId!} />;
    }
    if (subPath === "conteudos") {
      return <ConteudosListTab nichoId={nichoId!} />;
    }
    if (subPath === "contas") {
      return <ContasNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "biblioteca") {
      return <BibliotecaNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "time") {
      return <TimeNichoTab nichoId={nichoId!} />;
    }
    return <DashboardNichoTab nichoId={nichoId!} />;
  };

  return (
    <MainLayout
      nichoId={nichoId}
      nichoNome={nicho.nome}
      title={getPageTitle()}
      subtitle={`Workspace: ${nicho.nome}`}
    >
      {renderContent()}
    </MainLayout>
  );
}
