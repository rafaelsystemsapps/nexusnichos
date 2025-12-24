import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { User, Shield, Loader2, ArrowLeft } from "lucide-react";

interface Profile {
  id: string;
  nome: string;
  role: "admin" | "colaborador";
}

export default function Auth() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const { user, role, nichoId, loading: authLoading, roleChecked, signIn } = useAuth();
  const navigate = useNavigate();
  const isIOSMobile = useIsIOSMobile();

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
  }, []);

  // Auto-redirect logged-in users
  useEffect(() => {
    if (!authLoading && user && roleChecked) {
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "colaborador") {
        if (nichoId) {
          navigate(`/workspace/${nichoId}`, { replace: true });
        } else {
          toast.error("Você ainda não foi atribuído a um nicho. Contate o administrador.");
        }
      } else if (role === null) {
        toast.error("Sua conta ainda não foi configurada. Contate o administrador.");
      }
    }
  }, [user, role, nichoId, authLoading, roleChecked, navigate]);

  const fetchProfiles = async () => {
    try {
      setLoadingProfiles(true);
      const { data, error } = await supabase.functions.invoke("list-profiles");
      
      if (error) {
        console.error("Error fetching profiles:", error);
        toast.error("Erro ao carregar perfis");
        return;
      }

      setProfiles(data || []);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Erro ao carregar perfis");
    } finally {
      setLoadingProfiles(false);
    }
  };

  const handleProfileSelect = (profile: Profile) => {
    setSelectedProfile(profile);
    setPassword("");
    setShowPasswordModal(true);
  };

  const handleCloseModal = () => {
    setShowPasswordModal(false);
    setSelectedProfile(null);
    setPassword("");
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    setLoading(true);

    try {
      // First, get the email for this profile (using service role via edge function would be safer, 
      // but since we're already authenticated flow, we can use a direct query with the profile id)
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", selectedProfile.id)
        .single();

      if (profileError || !profileData?.email) {
        toast.error("Erro ao buscar dados do perfil");
        setLoading(false);
        return;
      }

      const { error } = await signIn(profileData.email, password);

      if (error) {
        toast.error("Senha incorreta");
        setLoading(false);
      } else {
        toast.success("Login realizado com sucesso!");
        handleCloseModal();
      }
    } catch (err) {
      console.error("Sign in error:", err);
      toast.error("Erro ao fazer login");
      setLoading(false);
    }
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-background",
        isIOSMobile && "ios-safe-area"
      )}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex items-center justify-center bg-background",
      isIOSMobile ? "p-4 ios-safe-area" : "p-4"
    )}>
      <Card className={cn(
        "w-full border-border/50",
        isIOSMobile 
          ? "max-w-full rounded-[20px] shadow-lg ios-animate-scale-in" 
          : "max-w-md shadow-premium-lg"
      )}>
        <CardHeader className={cn(
          "text-center",
          isIOSMobile ? "space-y-2 pb-4 pt-6" : "space-y-3 pb-6"
        )}>
          <CardTitle className={cn(
            "font-bold tracking-tight",
            isIOSMobile ? "text-2xl" : "text-3xl"
          )}>
            Nexus Nichos
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground",
            isIOSMobile ? "text-sm" : "text-base"
          )}>
            Selecione seu perfil para continuar
          </CardDescription>
        </CardHeader>
        
        <CardContent className={cn(
          isIOSMobile ? "px-4 pb-6" : "px-6 pb-6"
        )}>
          {loadingProfiles ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>Nenhum perfil encontrado</p>
            </div>
          ) : (
            <div className="space-y-2">
              {profiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => handleProfileSelect(profile)}
                  className={cn(
                    "w-full flex items-center gap-3 p-4 rounded-lg border border-border/50",
                    "bg-card hover:bg-accent/50 transition-colors",
                    "text-left focus:outline-none focus:ring-2 focus:ring-primary/50"
                  )}
                >
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full",
                    profile.role === "admin" 
                      ? "bg-primary/10 text-primary" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {profile.role === "admin" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {profile.nome}
                    </p>
                  </div>
                  
                  <Badge 
                    variant={profile.role === "admin" ? "default" : "secondary"}
                    className="shrink-0"
                  >
                    {profile.role === "admin" ? "Admin" : "Workspace"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className={cn(
          "sm:max-w-md",
          isIOSMobile && "rounded-[20px]"
        )}>
          <DialogHeader>
            <DialogTitle className="text-center">
              Olá, {selectedProfile?.nome}!
            </DialogTitle>
            <DialogDescription className="text-center">
              Digite sua senha para continuar
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSignIn} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoFocus
                className={cn(isIOSMobile && "ios-input")}
              />
            </div>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="submit"
                className="flex-1"
                disabled={loading || !password}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
