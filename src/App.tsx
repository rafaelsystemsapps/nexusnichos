import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PerfilProvider } from "@/contexts/PerfilContext";

import AdminDashboard from "./pages/AdminDashboard";
import ColaboradorWorkspace from "./pages/ColaboradorWorkspace";
import Install from "./pages/Install";
import NotFound from "./pages/NotFound";

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
            <Route path="/" element={<Navigate to="/admin" replace />} />
            <Route path="/install" element={<Install />} />
            <Route path="/admin/*" element={<AdminDashboard />} />
            <Route path="/workspace/:nichoId/*" element={<ColaboradorWorkspace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PerfilProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
