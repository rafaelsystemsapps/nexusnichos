import { useEffect, useState } from "react";
import { Download, Share, MoreVertical, Plus, CheckCircle2, Smartphone, Monitor, Apple } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Platform = "ios" | "android" | "desktop" | "unknown";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function Install() {
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isInstalled, setIsInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform("ios");
    } else if (isAndroid) {
      setPlatform("android");
    } else {
      setPlatform("desktop");
    }

    // Check if already installed
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
    const isInWebAppiOS = (navigator as any).standalone === true;
    setIsInstalled(isStandalone || isInWebAppiOS);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setIsInstalled(true);
      }
    } finally {
      setDeferredPrompt(null);
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">App Instalado!</CardTitle>
            <CardDescription>
              O Nexus Nichos já está instalado no seu dispositivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-muted-foreground">
              Você pode acessá-lo diretamente pela sua tela inicial.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground font-bold text-2xl">
            N
          </div>
          <CardTitle className="text-2xl">Instalar Nexus Nichos</CardTitle>
          <CardDescription>
            Instale o app para acesso rápido e experiência otimizada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {platform === "ios" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Apple className="h-4 w-4" />
                <span>iPhone / iPad</span>
              </div>
              <ol className="space-y-4 text-sm">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    1
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Toque no botão</span>
                    <Share className="h-4 w-4 text-primary" />
                    <span className="font-medium">Compartilhar</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    2
                  </span>
                  <span>Role para baixo e selecione</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    3
                  </span>
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    <span className="font-medium">Adicionar à Tela de Início</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                    4
                  </span>
                  <span>Toque em <span className="font-medium">Adicionar</span></span>
                </li>
              </ol>
            </div>
          )}

          {platform === "android" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Smartphone className="h-4 w-4" />
                <span>Android</span>
              </div>
              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall} 
                  className="w-full" 
                  size="lg"
                  disabled={isInstalling}
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isInstalling ? "Instalando..." : "Instalar App"}
                </Button>
              ) : (
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      1
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Toque no menu</span>
                      <MoreVertical className="h-4 w-4 text-primary" />
                      <span>do navegador</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      2
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Selecione</span>
                      <Download className="h-4 w-4 text-primary" />
                      <span className="font-medium">Instalar app</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      3
                    </span>
                    <span>Confirme a instalação</span>
                  </li>
                </ol>
              )}
            </div>
          )}

          {platform === "desktop" && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Monitor className="h-4 w-4" />
                <span>Computador</span>
              </div>
              {deferredPrompt ? (
                <Button 
                  onClick={handleInstall} 
                  className="w-full" 
                  size="lg"
                  disabled={isInstalling}
                >
                  <Download className="mr-2 h-5 w-5" />
                  {isInstalling ? "Instalando..." : "Instalar App"}
                </Button>
              ) : (
                <ol className="space-y-4 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      1
                    </span>
                    <span>Procure pelo ícone de instalação na barra de endereços</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
                      2
                    </span>
                    <div className="flex items-center gap-2">
                      <span>Clique em</span>
                      <Download className="h-4 w-4 text-primary" />
                      <span className="font-medium">Instalar</span>
                    </div>
                  </li>
                </ol>
              )}
            </div>
          )}

          <div className="pt-4 border-t border-border">
            <h3 className="text-sm font-medium mb-2">Vantagens do App</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Acesso rápido pela tela inicial</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Funciona offline</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Atualizações automáticas</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Experiência em tela cheia</span>
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
