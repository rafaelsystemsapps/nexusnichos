import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Auth from "./pages/Auth";
import AdminDashboard from "./pages/AdminDashboard";
import ColaboradorWorkspace from "./pages/ColaboradorWorkspace";
import NotFound from "./pages/NotFound";
import LoadingScreen from "./components/LoadingScreen";
import NoRoleAssigned from "./components/NoRoleAssigned";
import NoNichoAssigned from "./components/NoNichoAssigned";

function ProtectedRoute({ children, requiredRole }: { children: React.ReactNode; requiredRole?: "admin" | "colaborador" }) {
  const { user, role, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) return <Navigate to="/" replace />;

  return <>{children}</>;
}

function HomePage() {
  const { user, role, nichoId, loading } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/auth" replace />;
  
  if (role === "admin") {
    return <Navigate to="/admin-dashboard" replace />;
  }
  
  if (role === "colaborador") {
    if (nichoId) {
      return <Navigate to={`/workspace/${nichoId}`} replace />;
    }
    return <Navigate to="/no-nicho" replace />;
  }
  
  // User without role
  return <Navigate to="/no-role" replace />;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/no-role" element={<NoRoleAssigned />} />
            <Route path="/no-nicho" element={<NoNichoAssigned />} />
            <Route 
              path="/admin-dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/workspace/:nichoId" 
              element={
                <ProtectedRoute requiredRole="colaborador">
                  <ColaboradorWorkspace />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
