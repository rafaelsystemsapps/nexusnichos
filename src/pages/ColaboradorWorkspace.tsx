import { useParams, Navigate } from "react-router-dom";
import { useNicho, useInvalidateNicho } from "@/hooks/queries";
import { useAuthReady } from "@/hooks/useAuthReady";
import { MainLayout } from "@/components/layout/MainLayout";
import { PlanejamentoTab } from "@/components/colaborador/planejamentotab";
import { AccountsGrid } from "@/components/colaborador/accounts/AccountsGrid";
import { AccountWorkspace } from "@/components/colaborador/accounts/AccountWorkspace";
import { AppLabTab } from "@/components/colaborador/AppLabTab";
import { ConfiguracoesNichoTab } from "@/components/colaborador/ConfiguracoesNichoTab";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/ui/button";
import LoadingScreen from "@/components/LoadingScreen";

export default function ColaboradorWorkspace() {
  const { nichoId, "*": subPath } = useParams<{ nichoId: string; "*": string }>();

  const { ready: authReady } = useAuthReady();
  const { data: nicho, isLoading, isError, refetch, isSuccess } = useNicho(nichoId);
  const invalidateNicho = useInvalidateNicho(nichoId);

  // Sessão ainda subindo ou query carregando → loading, nunca erro prematuro.
  if (!authReady || isLoading) {
    return <LoadingScreen />;
  }

  // Erro real de rede/RLS → permite tentar novamente (não mascara como "não encontrado").
  if (isError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">Não foi possível carregar a workspace.</p>
          <Button variant="outline" onClick={() => refetch()}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  // Só renderiza "não encontrado" quando a query terminou com sucesso e retornou nada.
  if (isSuccess && !nicho) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg mb-4 text-muted-foreground">Nicho não encontrado.</p>
        </div>
      </div>
    );
  }

  // Estado intermediário (idle) → loading seguro.
  if (!nicho) {
    return <LoadingScreen />;
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
