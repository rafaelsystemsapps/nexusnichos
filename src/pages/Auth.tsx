import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { user, role, nichoId, loading: authLoading, signIn } = useAuth();
  const navigate = useNavigate();
  const isIOSMobile = useIsIOSMobile();

  // Auto-redirect logged-in users
  useEffect(() => {
    if (!authLoading && user) {
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
  }, [user, role, nichoId, authLoading, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast.error("Erro ao fazer login: " + error.message);
      setLoading(false);
    } else {
      toast.success("Login realizado com sucesso!");
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
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
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
          isIOSMobile ? "space-y-2 pb-6 pt-6" : "space-y-3 pb-8"
        )}>
          <CardTitle className={cn(
            "font-bold tracking-tight",
            isIOSMobile ? "text-2xl" : "text-4xl"
          )}>
            Nexus Nichos
          </CardTitle>
          <CardDescription className={cn(
            "text-muted-foreground",
            isIOSMobile ? "text-sm" : "text-base"
          )}>
            Sistema de gestão de conteúdo orgânico
          </CardDescription>
        </CardHeader>
        <CardContent className={isIOSMobile ? "px-5 pb-6" : undefined}>
          <form onSubmit={handleSignIn} className={cn(
            isIOSMobile ? "space-y-5" : "space-y-4"
          )}>
            <div className="space-y-2">
              <Label htmlFor="login-email" className={cn(
                isIOSMobile && "ios-title"
              )}>
                Email
              </Label>
              <Input
                id="login-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={cn(
                  isIOSMobile && "ios-input"
                )}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-password" className={cn(
                isIOSMobile && "ios-title"
              )}>
                Senha
              </Label>
              <Input
                id="login-password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn(
                  isIOSMobile && "ios-input"
                )}
              />
            </div>

            <Button 
              type="submit" 
              className={cn(
                "w-full",
                isIOSMobile && "ios-button mt-6"
              )} 
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
