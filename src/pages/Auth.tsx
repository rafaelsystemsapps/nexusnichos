import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Shield, Loader2, Lock } from "lucide-react";

interface Profile {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "colaborador";
  avatar_emoji: string | null;
  avatar_color: string | null;
}

// Netflix-style avatar colors
const AVATAR_COLORS = [
  "from-red-500 to-red-700",
  "from-blue-500 to-blue-700", 
  "from-green-500 to-green-700",
  "from-yellow-500 to-yellow-600",
  "from-purple-500 to-purple-700",
  "from-pink-500 to-pink-700",
  "from-cyan-500 to-cyan-700",
  "from-orange-500 to-orange-700",
];

const ADMIN_COLOR = "from-amber-400 to-amber-600";

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
      const { error } = await signIn(selectedProfile.email, password);

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

  const getAvatarColor = (index: number, isAdmin: boolean) => {
    if (isAdmin) return ADMIN_COLOR;
    return AVATAR_COLORS[index % AVATAR_COLORS.length];
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Show loading while checking auth state
  if (authLoading) {
    return (
      <div className={cn(
        "min-h-screen flex items-center justify-center bg-[#141414]",
        isIOSMobile && "ios-safe-area"
      )}>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
          <p className="text-neutral-400">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "min-h-screen flex flex-col items-center justify-center bg-[#141414]",
      isIOSMobile ? "p-4 ios-safe-area" : "p-8"
    )}>
      {/* Header */}
      <div className="text-center mb-12 animate-fade-in">
        <h1 className={cn(
          "font-bold text-white tracking-tight mb-3",
          isIOSMobile ? "text-3xl" : "text-4xl"
        )}>
          Quem está acessando?
        </h1>
        <p className="text-neutral-400 text-lg">
          Selecione seu perfil para continuar
        </p>
      </div>

      {/* Profiles Grid */}
      {loadingProfiles ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="text-center py-16 text-neutral-400">
          <p className="text-lg">Nenhum perfil encontrado</p>
        </div>
      ) : (
        <div className={cn(
          "grid gap-6 md:gap-8 w-full max-w-4xl px-4",
          profiles.length <= 2 && "grid-cols-2 max-w-lg",
          profiles.length === 3 && "grid-cols-3 max-w-2xl",
          profiles.length >= 4 && "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
        )}>
          {profiles.map((profile, index) => {
            const isAdmin = profile.role === "admin";
            const hasCustomAvatar = profile.avatar_emoji && profile.avatar_color;
            const colorClass = getAvatarColor(index, isAdmin);
            
            return (
              <button
                key={profile.id}
                onClick={() => handleProfileSelect(profile)}
                className="group flex flex-col items-center gap-3 focus:outline-none animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Avatar */}
                <div className={cn(
                  "relative w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden",
                  "transition-all duration-200 ease-out",
                  "group-hover:ring-4 group-hover:ring-white group-hover:scale-105",
                  "group-focus:ring-4 group-focus:ring-white"
                )}>
                  {hasCustomAvatar ? (
                    // Custom emoji avatar
                    <div 
                      className="w-full h-full flex items-center justify-center"
                      style={{ backgroundColor: profile.avatar_color! }}
                    >
                      <span className="text-4xl md:text-5xl">
                        {profile.avatar_emoji}
                      </span>
                    </div>
                  ) : (
                    // Default gradient avatar
                    <div className={cn(
                      "w-full h-full bg-gradient-to-br flex items-center justify-center",
                      colorClass
                    )}>
                      {isAdmin ? (
                        <Shield className="w-10 h-10 md:w-14 md:h-14 text-white/90" />
                      ) : (
                        <span className="text-2xl md:text-4xl font-bold text-white/90">
                          {getInitials(profile.nome)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Hover overlay */}
                  <div className={cn(
                    "absolute inset-0 bg-black/20 opacity-0",
                    "group-hover:opacity-100 transition-opacity duration-200"
                  )} />
                </div>

                {/* Name */}
                <span className={cn(
                  "text-neutral-400 text-sm md:text-base font-medium",
                  "group-hover:text-white transition-colors duration-200",
                  "text-center max-w-[120px] md:max-w-[160px] truncate"
                )}>
                  {profile.nome}
                </span>

                {/* Role badge */}
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-sm",
                  isAdmin 
                    ? "bg-amber-500/20 text-amber-400" 
                    : "bg-neutral-700/50 text-neutral-500"
                )}>
                  {isAdmin ? "Admin" : "Workspace"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Password Modal */}
      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className={cn(
          "sm:max-w-md bg-[#1a1a1a] border-neutral-800",
          isIOSMobile && "rounded-[20px]"
        )}>
          <DialogHeader className="text-center">
            {selectedProfile && (
              <div className="flex flex-col items-center gap-4 mb-4">
                {/* Selected profile avatar */}
                {selectedProfile.avatar_emoji && selectedProfile.avatar_color ? (
                  <div 
                    className="w-20 h-20 rounded-xl overflow-hidden flex items-center justify-center"
                    style={{ backgroundColor: selectedProfile.avatar_color }}
                  >
                    <span className="text-4xl">{selectedProfile.avatar_emoji}</span>
                  </div>
                ) : (
                  <div className={cn(
                    "w-20 h-20 rounded-xl overflow-hidden bg-gradient-to-br flex items-center justify-center",
                    getAvatarColor(
                      profiles.findIndex(p => p.id === selectedProfile.id),
                      selectedProfile.role === "admin"
                    )
                  )}>
                    {selectedProfile.role === "admin" ? (
                      <Shield className="w-10 h-10 text-white/90" />
                    ) : (
                      <span className="text-2xl font-bold text-white/90">
                        {getInitials(selectedProfile.nome)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            <DialogTitle className="text-white text-xl">
              Olá, {selectedProfile?.nome}!
            </DialogTitle>
            <DialogDescription className="text-neutral-400">
              Digite sua senha para continuar
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSignIn} className="space-y-5 mt-4">
            <div className="space-y-2">
              <Label htmlFor="password" className="text-neutral-300">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoFocus
                  className={cn(
                    "bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-500 pl-10",
                    "focus:border-white focus:ring-white/20",
                    isIOSMobile && "ios-input"
                  )}
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                className="flex-1 bg-transparent border-neutral-700 text-neutral-300 hover:bg-neutral-800 hover:text-white"
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white text-black hover:bg-neutral-200"
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
