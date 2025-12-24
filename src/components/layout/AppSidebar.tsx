import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import {
  FileText,
  Share2,
  Users,
  Settings,
  LogOut,
  LayoutDashboard,
  DollarSign,
  CalendarCheck,
  Package,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppSidebarProps {
  nichoId?: string;
  nichoNome?: string;
  financeiroHabilitado?: boolean;
  pedidosHabilitado?: boolean;
}

export function AppSidebar({ nichoId, nichoNome, financeiroHabilitado, pedidosHabilitado }: AppSidebarProps) {
  const location = useLocation();
  const { role, signOut } = useAuth();
  const isAdmin = role === "admin";
  const isIOSMobile = useIsIOSMobile();

  const colaboradorNavItems: NavItem[] = [
    { title: "Dashboard", href: `/workspace/${nichoId}`, icon: LayoutDashboard },
    { title: "Contas", href: `/workspace/${nichoId}/contas`, icon: Share2 },
    { title: "Logística", href: `/workspace/${nichoId}/logistica`, icon: CalendarCheck },
    { title: "Time", href: `/workspace/${nichoId}/time`, icon: Users },
  ];

  // Adiciona Financeiro se habilitado
  if (financeiroHabilitado) {
    colaboradorNavItems.push({
      title: "Financeiro",
      href: `/workspace/${nichoId}/financeiro`,
      icon: DollarSign,
    });
  }

  // Adiciona Pedidos se habilitado
  if (pedidosHabilitado) {
    colaboradorNavItems.push({
      title: "Pedidos",
      href: `/workspace/${nichoId}/pedidos`,
      icon: Package,
    });
  }

  // Sempre adiciona Configurações no final
  colaboradorNavItems.push({
    title: "Configurações",
    href: `/workspace/${nichoId}/configuracoes`,
    icon: Settings,
  });

  const navItems: NavItem[] = isAdmin
    ? [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { title: "Nichos", href: "/admin/nichos", icon: Settings },
        { title: "Usuários", href: "/admin/usuarios", icon: Users },
      ]
    : colaboradorNavItems;

  // Limita itens na tab bar mobile (máximo 5)
  const mobileNavItems = navItems.slice(0, 5);

  const isActive = (href: string) => {
    if (href === `/workspace/${nichoId}` || href === "/admin") {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  // iOS Mobile Bottom Tab Bar
  if (isIOSMobile) {
    return (
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
        <button
          onClick={signOut}
          className="ios-tab-item"
        >
          <LogOut className="ios-tab-icon" />
          <span className="ios-tab-label">Sair</span>
        </button>
      </nav>
    );
  }

  // Desktop Header Navigation
  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-black border-b border-border/30">
      <div className="flex items-center justify-between px-6 h-14">
        {/* Logo */}
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

        {/* Navigation */}
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

        {/* Logout */}
        <button
          onClick={signOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
}
