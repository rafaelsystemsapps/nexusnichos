import { useState } from "react";
import { FlaskRound } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAppLabApps } from "@/hooks/queries/useAppLabApps";
import { useAppLabClients } from "@/hooks/queries/useAppLabClients";
import { AppLabDashboard } from "./AppLabDashboard";
import { ClientsTab } from "./ClientsTab";
import { AppsTab } from "./AppsTab";

interface Props {
  nichoId: string;
}

export function AppLabWorkspace({ nichoId }: Props) {
  const { data: apps = [], isLoading: appsLoading } = useAppLabApps(nichoId);
  const { data: clients = [] } = useAppLabClients(nichoId);
  const [tab, setTab] = useState("dashboard");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <FlaskRound className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">App Lab</h2>
          <p className="text-sm text-muted-foreground">Gestor relacional de apps e clientes (B2B & B2C)</p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-5">
        <TabsList>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
          <TabsTrigger value="apps">Apps</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard">
          <AppLabDashboard clients={clients} apps={apps} />
        </TabsContent>

        <TabsContent value="clientes">
          <ClientsTab nichoId={nichoId} apps={apps} />
        </TabsContent>

        <TabsContent value="apps">
          <AppsTab nichoId={nichoId} apps={apps} isLoading={appsLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
