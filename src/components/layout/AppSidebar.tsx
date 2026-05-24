import { useMemo, memo } from "react";
import { useLocation, Link } from "react-router-dom";
import { usePerfilContext } from "@/contexts/PerfilContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import {
  Settings,
  LayoutDashboard,
  Cog,
  ClipboardList,
  AtSign,
  FlaskRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SeletorPerfil } from "./SeletorPerfil";

interface AppSidebarProps {
  nichoId?: string;
  nichoNome?: string;
}

function AppSidebarComponent({ nichoId, nichoNome }: AppSidebarProps) {
  const location = useLocation();
  const { perfilAtivo } = usePerfilContext();
  const isAdmin = perfilAtivo?.tipo === "admin";
  const isIOSMobile = useIsIOSMobile();

  const navItems = useMemo(() => {
    if (isAdmin) {
      return [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { title: "Nichos", href: "/admin/nichos", icon: Settings },
        { title: "Configurações", href: "/admin/configuracoes", icon: Cog },
      ];
    }
    return [
      { title: "Planejamento", href: `/workspace/${nichoId}`, icon: ClipboardList },
      { title: "Contas", href: `/workspace/${nichoId}/contas`, icon: AtSign },
      { title: "AppLab", href: `/workspace/${nichoId}/applab`, icon: FlaskRound },
      { title: "Config", href: `/workspace/${nichoId}/configuracoes`, icon: Settings },
    ];
  }, [isAdmin, nichoId]);

  const mobileNavItems = useMemo(() => navItems.slice(0, 5), [navItems]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    if (href.match(/^\/workspace\/[^/]+$/)) {
      return location.pathname === href || location.pathname === href + "/projeto";
    }
    return location.pathname.startsWith(href);
  };

  if (isIOSMobile) {
    return (
      <>
        <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-border/30 h-12 flex items-center justify-between px-3">
          <span className="text-sm font-bold text-foreground">Nexus</span>
          <SeletorPerfil />
        </header>
        <nav className="ios-tab-bar flex items-center justify-around px-2">
          {mobileNavItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "ios-tab-item",
                isActive(item.href) && "active"
              )}
            >
              <item.icon className="ios-tab-icon" />
              <span className="ios-tab-label">{item.title}</span>
            </Link>
          ))}
        </nav>
      </>
    );
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-border/30">
      <div className="flex items-center justify-between px-6 h-14">
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-foreground">Nexus Nichos</span>
          {nichoNome && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-primary">{nichoNome}</span>
            </>
          )}
          {isAdmin && (
            <>
              <span className="text-muted-foreground">/</span>
              <span className="text-sm text-primary">Admin</span>
            </>
          )}
        </div>

        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200",
                isActive(item.href)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </Link>
          ))}
        </nav>

        <SeletorPerfil />
      </div>
    </header>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
