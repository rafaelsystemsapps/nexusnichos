import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";

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
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar nichoId={nichoId} nichoNome={nichoNome} financeiroHabilitado={financeiroHabilitado} pedidosHabilitado={pedidosHabilitado} />
      
      <main className="pt-14 min-h-screen">
        {(title || subtitle) && (
          <header className="border-b border-border/30 bg-surface/50 backdrop-blur-sm sticky top-14 z-30">
            <div className="px-8 py-6">
              {title && <h1 className="text-2xl font-bold tracking-tight">{title}</h1>}
              {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
            </div>
          </header>
        )}
        
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
