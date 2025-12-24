import { useParams } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { NichosTab } from "@/components/admin/NichosTab";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export default function AdminDashboard() {
  const { "*": subPath } = useParams<{ "*": string }>();

  const getPageTitle = () => {
    if (!subPath || subPath === "") return "Dashboard";
    if (subPath === "nichos") return "Gerenciar Nichos";
    return "Painel Administrativo";
  };

  const renderContent = () => {
    if (!subPath || subPath === "") {
      return <DashboardOverview />;
    }
    if (subPath === "nichos") {
      return <NichosTab />;
    }
    return <DashboardOverview />;
  };

  return (
    <MainLayout title={getPageTitle()} subtitle="Painel Administrativo">
      {renderContent()}
    </MainLayout>
  );
}
