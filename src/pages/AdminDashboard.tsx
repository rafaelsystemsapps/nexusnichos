import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LogOut, Plus } from "lucide-react";
import { NichosTab } from "@/components/admin/NichosTab";
import { UsuariosTab } from "@/components/admin/UsuariosTab";
import { ConteudosTab } from "@/components/admin/ConteudosTab";
import { ContasTab } from "@/components/admin/ContasTab";
import { DashboardOverview } from "@/components/admin/DashboardOverview";

export default function AdminDashboard() {
  const { signOut, user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-surface backdrop-blur-sm">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Nexus Nichos</h1>
            <p className="text-sm text-muted-foreground mt-1">Painel Administrativo</p>
          </div>
          <Button variant="outline" onClick={signOut} className="border-border/50">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full max-w-3xl mb-8 bg-card/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Visão Geral</TabsTrigger>
            <TabsTrigger value="nichos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Nichos</TabsTrigger>
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Usuários</TabsTrigger>
            <TabsTrigger value="conteudos" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Conteúdos</TabsTrigger>
            <TabsTrigger value="contas" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Contas</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <DashboardOverview />
          </TabsContent>

          <TabsContent value="nichos">
            <NichosTab />
          </TabsContent>

          <TabsContent value="usuarios">
            <UsuariosTab />
          </TabsContent>

          <TabsContent value="conteudos">
            <ConteudosTab />
          </TabsContent>

          <TabsContent value="contas">
            <ContasTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
