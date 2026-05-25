import { useParams, Navigate } from "react-router-dom";
import { useNicho, useInvalidateNicho } from "@/hooks/queries";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlanejamentoTab } from "@/components/colaborador/planejamentotab";
import { AccountsGrid } from "@/components/colaborador/accounts/AccountsGrid";
import { AccountWorkspace } from "@/components/colaborador/accounts/AccountWorkspace";
import { AppLabTab } from "@/components/colaborador/AppLabTab";
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

  const path = subPath ?? "";
  const accountMatch = path.match(/^contas\/([^/]+)$/);
  const contasOn = !!(nicho as any).contas_habilitado;
  const applabOn = !!(nicho as any).applab_habilitado;

  const getPageTitle = () => {
    if (!path || path === "projeto") return "Planejamento";
    if (path === "contas") return "Contas";
    if (accountMatch) return "Conta";
    if (path === "applab") return "AppLab";
    if (path === "configuracoes") return "Configurações";
    return "Workspace";
  };

  const renderContent = () => {
    if (!path || path === "projeto") return <PlanejamentoTab nichoId={nichoId!} />;
    if (path === "contas" || accountMatch) {
      if (!contasOn) return <Navigate to={`/workspace/${nichoId}`} replace />;
      return accountMatch
        ? <AccountWorkspace nichoId={nichoId!} accountId={accountMatch[1]} />
        : <AccountsGrid nichoId={nichoId!} />;
    }
    if (path === "applab") {
      if (!applabOn) return <Navigate to={`/workspace/${nichoId}`} replace />;
      return <AppLabTab nichoId={nichoId!} />;
    }
    if (path === "configuracoes") {
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
      nicho={nicho as any}
      title={getPageTitle()}
      subtitle={`Workspace: ${nicho.nome}`}
    >
      {renderContent()}
    </MainLayout>
  );
}
