import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NichosTab } from "@/components/admin/NichosTab";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { ConfiguracoesAdminTab } from "@/components/admin/ConfiguracoesAdminTab";

export default function AdminDashboard() {
  const { "*": subPath } = useParams<{ "*": string }>();

  const getPageTitle = () => {
    if (!subPath || subPath === "") return "Dashboard";
    if (subPath === "nichos") return "Gerenciar Nichos";
    if (subPath === "configuracoes") return "Configurações";
    return "Painel Administrativo";
  };

  const renderContent = () => {
    if (!subPath || subPath === "") {
      return <DashboardOverview />;
    }
    if (subPath === "nichos") {
      return <NichosTab />;
    }
    if (subPath === "configuracoes") {
      return <ConfiguracoesAdminTab />;
    }
    return <DashboardOverview />;
  };

  return (
    <MainLayout title={getPageTitle()} subtitle="Painel Administrativo">
      {renderContent()}
    </MainLayout>
  );
}
