import { useEffect, useState, useCallback } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/layout/MainLayout";
import { DashboardNichoTab } from "@/components/colaborador/DashboardNichoTab";
import { ContasNichoTab } from "@/components/colaborador/ContasNichoTab";
import { TimeNichoTab } from "@/components/colaborador/TimeNichoTab";
import { FinanceiroTab } from "@/components/colaborador/FinanceiroTab";
import { PedidosTab } from "@/components/colaborador/PedidosTab";
import { ConfiguracoesNichoTab } from "@/components/colaborador/ConfiguracoesNichoTab";
import { LogisticaSemanalTab } from "@/components/colaborador/LogisticaSemanalTab";
import { RadarOportunidadesTab } from "@/components/colaborador/RadarOportunidadesTab";
import { CemiterioTab } from "@/components/colaborador/CemiterioTab";
import { MapaDependencia } from "@/components/colaborador/MapaDependencia";
import { TesteRapidoTab } from "@/components/colaborador/TesteRapidoTab";
import { LogsAprendizadoTab } from "@/components/colaborador/LogsAprendizadoTab";
import { LembretesHojeTab } from "@/components/colaborador/LembretesHojeTab";
import { ClientesTab } from "@/components/colaborador/ClientesTab";
import { AplicativosTab } from "@/components/colaborador/AplicativosTab";
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

  const fetchNicho = useCallback(async () => {
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
  }, [nichoId]);

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
    if (subPath === "contas") return "Contas do Nicho";
    if (subPath === "logistica") return "Logistica Semanal";
    if (subPath === "time") return "Time";
    if (subPath === "financeiro") return "Financeiro";
    if (subPath === "pedidos") return "Gestao de Pedidos";
    if (subPath === "radar") return "Radar de Oportunidades";
    if (subPath === "cemiterio") return "Cemiterio";
    if (subPath === "mapa-dependencia") return "Mapa de Dependencia";
    if (subPath === "testes") return "Teste Rapido";
    if (subPath === "aprendizado") return "Logs de Aprendizado";
    if (subPath === "lembretes") return "Lembretes de Hoje";
    if (subPath === "clientes") return "Gestao de Clientes";
    if (subPath === "apps") return "Aplicativos";
    if (subPath === "configuracoes") return "Configuracoes";
    return "Workspace";
  };

  const renderContent = () => {
    if (!subPath || subPath === "") {
      return <DashboardNichoTab nichoId={nichoId!} alertasHabilitado={nicho.alertas_habilitado} />;
    }
    if (subPath === "contas" && nicho.contas_habilitado !== false) {
      return <ContasNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "logistica") {
      return <LogisticaSemanalTab nichoId={nichoId!} />;
    }
    if (subPath === "time" && nicho.time_habilitado !== false) {
      return <TimeNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "financeiro" && nicho.financeiro_habilitado) {
      return <FinanceiroTab nichoId={nichoId!} />;
    }
    if (subPath === "pedidos" && nicho.pedidos_habilitado) {
      return <PedidosTab nichoId={nichoId!} />;
    }
    if (subPath === "radar" && nicho.radar_habilitado) {
      return <RadarOportunidadesTab nichoId={nichoId!} />;
    }
    if (subPath === "cemiterio" && nicho.cemiterio_habilitado) {
      return <CemiterioTab nichoId={nichoId!} />;
    }
    if (subPath === "mapa-dependencia" && nicho.mapa_dependencia_habilitado) {
      return <MapaDependencia nichoId={nichoId!} />;
    }
    if (subPath === "testes" && nicho.teste_rapido_habilitado) {
      return <TesteRapidoTab nichoId={nichoId!} />;
    }
    if (subPath === "aprendizado" && nicho.logs_aprendizado_habilitado) {
      return <LogsAprendizadoTab nichoId={nichoId!} />;
    }
    if (subPath === "lembretes" && nicho.lembretes_hoje_habilitado) {
      return <LembretesHojeTab nichoId={nichoId!} />;
    }
    if (subPath === "clientes" && nicho.clientes_habilitado) {
      return <ClientesTab nichoId={nichoId!} />;
    }
    if (subPath === "apps" && nicho.apps_habilitado) {
      return <AplicativosTab nichoId={nichoId!} />;
    }
    if (subPath === "configuracoes") {
      return (
        <ConfiguracoesNichoTab 
          nichoId={nichoId!} 
          nicho={nicho} 
          onConfigUpdate={fetchNicho} 
        />
      );
    }
    return <DashboardNichoTab nichoId={nichoId!} />;
  };

  return (
    <MainLayout
      nichoId={nichoId}
      nichoNome={nicho.nome}
      title={getPageTitle()}
      subtitle={`Workspace: ${nicho.nome}`}
      dashboardHabilitado={nicho.dashboard_habilitado}
      contasHabilitado={nicho.contas_habilitado}
      financeiroHabilitado={nicho.financeiro_habilitado}
      pedidosHabilitado={nicho.pedidos_habilitado}
      radarHabilitado={nicho.radar_habilitado}
      cemiterioHabilitado={nicho.cemiterio_habilitado}
      mapaDependenciaHabilitado={nicho.mapa_dependencia_habilitado}
      testeRapidoHabilitado={nicho.teste_rapido_habilitado}
      logsAprendizadoHabilitado={nicho.logs_aprendizado_habilitado}
      lembretesHojeHabilitado={nicho.lembretes_hoje_habilitado}
      timeHabilitado={nicho.time_habilitado}
      clientesHabilitado={nicho.clientes_habilitado}
      appsHabilitado={nicho.apps_habilitado}
      ordemAbas={nicho.ordem_abas}
    >
      {renderContent()}
    </MainLayout>
  );
}
