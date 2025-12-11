import { RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useServiceWorker } from "@/hooks/useServiceWorker";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { useEffect } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function UpdatePrompt() {
  const { needRefresh, offlineReady, updateServiceWorker, close } = useServiceWorker();
  const isIOSMobile = useIsIOSMobile();

  useEffect(() => {
    if (offlineReady) {
      toast.success("App pronto para uso offline!");
    }
  }, [offlineReady]);

  if (!needRefresh) {
    return null;
  }

  // iOS Mobile - Pill notification at bottom
  if (isIOSMobile) {
    return (
      <div className="fixed bottom-24 left-4 right-4 z-50 flex justify-center ios-animate-scale-in">
        <div className="ios-glass rounded-full px-4 py-3 flex items-center gap-3 shadow-lg">
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm font-medium text-foreground">Atualização disponível</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => updateServiceWorker()}
              className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-full"
            >
              Atualizar
            </button>
            <button
              onClick={close}
              className="p-1.5 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Desktop - Top banner
  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top duration-300">
      <div className="bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/10 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-primary-foreground animate-spin" />
            <span className="text-sm font-medium text-primary-foreground">
              Nova versão disponível!
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => updateServiceWorker()}
              className="h-8 px-3 text-xs font-medium"
            >
              Atualizar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={close}
              className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dispensar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
