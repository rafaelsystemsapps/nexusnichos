import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  Calendar,
  FileText,
  Share2,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronLeft,
  Lightbulb,
  BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface AppSidebarProps {
  nichoId?: string;
  nichoNome?: string;
}

export function AppSidebar({ nichoId, nichoNome }: AppSidebarProps) {
  const location = useLocation();
  const { role, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = role === "admin";

  const navItems: NavItem[] = isAdmin
    ? [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { title: "Nichos", href: "/admin/nichos", icon: Settings },
        { title: "Usuários", href: "/admin/usuarios", icon: Users },
        { title: "Conteúdos", href: "/admin/conteudos", icon: FileText },
        { title: "Contas", href: "/admin/contas", icon: Share2 },
      ]
    : [
        { title: "Dashboard", href: `/workspace/${nichoId}`, icon: LayoutDashboard },
        { title: "Ideias", href: `/workspace/${nichoId}/ideias`, icon: Lightbulb },
        { title: "Calendário", href: `/workspace/${nichoId}/calendario`, icon: Calendar },
        { title: "Pipeline", href: `/workspace/${nichoId}/conteudos`, icon: FileText },
        { title: "Contas", href: `/workspace/${nichoId}/contas`, icon: Share2 },
        { title: "Biblioteca", href: `/workspace/${nichoId}/biblioteca`, icon: BookOpen },
        { title: "Time", href: `/workspace/${nichoId}/time`, icon: Users },
      ];

  const isActive = (href: string) => {
    if (href === `/workspace/${nichoId}` || href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-black border-r border-border/30 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/30">
        {!collapsed && (
          <div className="flex flex-col">
            <span className="text-lg font-bold text-foreground">Nexus Nichos</span>
            {nichoNome && (
              <span className="text-xs text-primary truncate max-w-[180px]">{nichoNome}</span>
            )}
            {isAdmin && (
              <span className="text-xs text-primary">Administrador</span>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCollapsed(!collapsed)}
          className="h-8 w-8 hover:bg-surface-hover"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
              isActive(item.href)
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:bg-surface-hover hover:text-foreground"
            )}
          >
            <item.icon
              className={cn(
                "h-5 w-5 flex-shrink-0",
                isActive(item.href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
              )}
            />
            {!collapsed && <span className="text-sm font-medium">{item.title}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border/30">
        <button
          onClick={signOut}
          className={cn(
            "flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-all duration-200",
            "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
          )}
        >
          <LogOut className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sair</span>}
        </button>
      </div>
    </aside>
  );
}
