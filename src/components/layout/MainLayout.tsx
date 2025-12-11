import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  nichoId?: string;
  nichoNome?: string;
  title?: string;
  subtitle?: string;
  financeiroHabilitado?: boolean;
  pedidosHabilitado?: boolean;
}

export function MainLayout({ children, nichoId, nichoNome, title, subtitle, financeiroHabilitado, pedidosHabilitado }: MainLayoutProps) {
  const isIOSMobile = useIsIOSMobile();

  return (
    <div className={cn(
      "min-h-screen bg-background",
      isIOSMobile && "ios-safe-area"
    )}>
      <AppSidebar nichoId={nichoId} nichoNome={nichoNome} financeiroHabilitado={financeiroHabilitado} pedidosHabilitado={pedidosHabilitado} />
      
      <main className={cn(
        "min-h-screen",
        isIOSMobile ? "pt-4 pb-24" : "pt-14"
      )}>
        {(title || subtitle) && (
          <header className={cn(
            "border-b border-border/30 bg-surface/50 backdrop-blur-sm z-30",
            isIOSMobile 
              ? "px-4 py-3" 
              : "sticky top-14 px-8 py-6"
          )}>
            {title && (
              <h1 className={cn(
                "font-bold tracking-tight",
                isIOSMobile ? "text-lg" : "text-2xl"
              )}>
                {title}
              </h1>
            )}
            {subtitle && (
              <p className={cn(
                "text-muted-foreground mt-0.5",
                isIOSMobile ? "text-xs" : "text-sm"
              )}>
                {subtitle}
              </p>
            )}
          </header>
        )}
        
        <div className={cn(
          isIOSMobile ? "p-4" : "p-8"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}
