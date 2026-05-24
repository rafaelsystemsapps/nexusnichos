import { useParams } from "react-router-dom";
import { useNicho, useInvalidateNicho } from "@/hooks/queries";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlanejamentoTab } from "@/components/colaborador/planejamentotab";
import { ContasNichoTab } from "@/components/colaborador/ContasNichoTab";
import { FinanceiroTab } from "@/components/colaborador/FinanceiroTab";
import { ConfiguracoesNichoTab } from "@/components/colaborador/ConfiguracoesNichoTab";
import LoadingScreen from "@/components/LoadingScreen";

export default function ColaboradorWorkspace() {
  const { nichoId, "*": subPath } = useParams<{ nichoId: string; "*": string }>();

  const { data: nicho, isLoading: loading } = useNicho(nichoId);
  const invalidateNicho = useInvalidateNicho(nichoId);

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
    if (!subPath || subPath === "" || subPath === "projeto") return "Planejamento";
    if (subPath === "contas") return "Contas";
    if (subPath === "financeiro") return "Financeiro";
    if (subPath === "configuracoes") return "Configurações";
    return "Workspace";
  };

  const renderContent = () => {
    if (!subPath || subPath === "" || subPath === "projeto") {
      return <PlanejamentoTab nichoId={nichoId!} />;
    }
    if (subPath === "contas") {
      return <ContasNichoTab nichoId={nichoId!} />;
    }
    if (subPath === "financeiro") {
      return <FinanceiroTab nichoId={nichoId!} />;
    }
    if (subPath === "configuracoes") {
      return (
        <ConfiguracoesNichoTab
          nichoId={nichoId!}
          nicho={nicho}
          onConfigUpdate={invalidateNicho}
        />
      );
    }
    return <PlanejamentoTab nichoId={nichoId!} />;
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
