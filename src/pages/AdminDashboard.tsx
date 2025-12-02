import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NichosTab } from "@/components/admin/NichosTab";
import { UsuariosTab } from "@/components/admin/UsuariosTab";
import { ConteudosTab } from "@/components/admin/ConteudosTab";
import { ContasTab } from "@/components/admin/ContasTab";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export default function AdminDashboard() {
  const { "*": subPath } = useParams<{ "*": string }>();

  const getPageTitle = () => {
    if (!subPath || subPath === "") return "Dashboard";
    if (subPath === "nichos") return "Gerenciar Nichos";
    if (subPath === "usuarios") return "Gerenciar Usuários";
    if (subPath === "conteudos") return "Todos os Conteúdos";
    if (subPath === "contas") return "Todas as Contas";
    return "Painel Administrativo";
  };

  const renderContent = () => {
    if (!subPath || subPath === "") {
      return <DashboardOverview />;
    }
    if (subPath === "nichos") {
      return <NichosTab />;
    }
    if (subPath === "usuarios") {
      return <UsuariosTab />;
    }
    if (subPath === "conteudos") {
      return <ConteudosTab />;
    }
    if (subPath === "contas") {
      return <ContasTab />;
    }
    return <DashboardOverview />;
  };

  return (
    <MainLayout title={getPageTitle()} subtitle="Painel Administrativo">
      {renderContent()}
    </MainLayout>
  );
}
