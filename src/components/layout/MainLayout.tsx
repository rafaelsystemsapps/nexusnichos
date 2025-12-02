import { ReactNode } from "react";
import { AppSidebar } from "./AppSidebar";
import { cn } from "@/lib/utils";

interface MainLayoutProps {
  children: ReactNode;
  nichoId?: string;
  nichoNome?: string;
  title?: string;
  subtitle?: string;
}

export function MainLayout({ children, nichoId, nichoNome, title, subtitle }: MainLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar nichoId={nichoId} nichoNome={nichoNome} />
      
      <main className="ml-64 min-h-screen transition-all duration-300">
        {(title || subtitle) && (
          <header className="border-b border-border/30 bg-surface/50 backdrop-blur-sm sticky top-0 z-30">
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
