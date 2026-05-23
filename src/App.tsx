import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PerfilProvider, usePerfilContext } from "@/contexts/PerfilContext";
import { UpdatePrompt } from "@/components/pwa/UpdatePrompt";
import SelecaoPerfil from "./pages/SelecaoPerfil";
import AdminDashboard from "./pages/AdminDashboard";
import ColaboradorWorkspace from "./pages/ColaboradorWorkspace";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import { LembretePopup } from "./components/colaborador/LembretePopup";

function PerfilGuard({ children }: { children: React.ReactNode }) {
  const { perfilAtivo, ready } = usePerfilContext();
  if (!ready) return <LoadingScreen />;
  if (!perfilAtivo) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function RootGate() {
  const { ready } = usePerfilContext();
  if (!ready) return <LoadingScreen />;
  return <SelecaoPerfil />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <UpdatePrompt />
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PerfilProvider>
          <Routes>
            <Route path="/" element={<RootGate />} />
            <Route path="/install" element={<Install />} />
            <Route path="/lembrete-popup/:id" element={<LembretePopup />} />
            <Route
              path="/admin/*"
              element={
                <PerfilGuard>
                  <AdminDashboard />
                </PerfilGuard>
              }
            />
            <Route
              path="/workspace/:nichoId/*"
              element={
                <PerfilGuard>
                  <ColaboradorWorkspace />
                </PerfilGuard>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PerfilProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
