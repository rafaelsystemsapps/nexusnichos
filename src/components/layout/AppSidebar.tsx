import { useState, useMemo, memo } from "react";
import { useLocation, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { useProfile, useInvalidateProfile } from "@/hooks/queries";
import {
  Settings,
  LogOut,
  LayoutDashboard,
  ChevronDown,
  UserCheck,
  Gem,
  Cog,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AvatarEditor } from "@/components/admin/AvatarEditor";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface AppSidebarProps {
  nichoId?: string;
  nichoNome?: string;
  contasHabilitado?: boolean;
  pedidosHabilitado?: boolean;
  radarHabilitado?: boolean;
  cemiterioHabilitado?: boolean;
  mapaDependenciaHabilitado?: boolean;
  testeRapidoHabilitado?: boolean;
  logsAprendizadoHabilitado?: boolean;
  lembretesHojeHabilitado?: boolean;
  timeHabilitado?: boolean;
  clientesHabilitado?: boolean;
  offerVaultHabilitado?: boolean;
  appLabHabilitado?: boolean;
  ordemAbas?: string[] | null;
}

// Abas fixas simplificadas
const ABAS_SIMPLES = ["planejamento", "offervault", "clientes", "configuracoes"] as const;

const DEFAULT_ORDER = [
  "projeto",
  "contas",
  "logistica",
  "time",
  "clientes",
  "pedidos",
  "offervault",
  "applab",
  "radar",
  "cemiterio",
  "mapa",
  "testes",
  "aprendizado",
  "lembretes",
  "configuracoes",
];

function AppSidebarComponent({ nichoId, nichoNome, contasHabilitado, pedidosHabilitado, radarHabilitado, cemiterioHabilitado, mapaDependenciaHabilitado, testeRapidoHabilitado, logsAprendizadoHabilitado, lembretesHojeHabilitado, timeHabilitado, clientesHabilitado, offerVaultHabilitado, appLabHabilitado, ordemAbas }: AppSidebarProps) {
  const location = useLocation();
  const { user, role, signOut } = useAuth();
  const isAdmin = role === "admin";
  const isIOSMobile = useIsIOSMobile();
  
  const { data: profile } = useProfile(user?.id);
  const invalidateProfile = useInvalidateProfile(user?.id);
  const [avatarEditorOpen, setAvatarEditorOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Configuração simplificada — apenas 4 abas
  const abaConfig = useMemo(() => ({
    planejamento: { title: "Planejamento", href: `/workspace/${nichoId}`, icon: ClipboardList, enabled: true },
    offervault: { title: "OfferVault", href: `/workspace/${nichoId}/offervault`, icon: Gem, enabled: true },
    clientes: { title: "Clientes", href: `/workspace/${nichoId}/clientes`, icon: UserCheck, enabled: true },
    configuracoes: { title: "Config", href: `/workspace/${nichoId}/configuracoes`, icon: Settings, enabled: true },
  }), [nichoId]);

  // Navega apenas pelas 4 abas fixas
  const navItems = useMemo(() => {
    if (isAdmin) {
      return [
        { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
        { title: "Nichos", href: "/admin/nichos", icon: Settings },
        { title: "Configurações", href: "/admin/configuracoes", icon: Cog },
      ];
    }
    return ABAS_SIMPLES.map(id => ({
      title: abaConfig[id].title,
      href: abaConfig[id].href,
      icon: abaConfig[id].icon,
    }));
  }, [abaConfig, isAdmin]);

  // Limita itens na tab bar mobile (máximo 5)
  const mobileNavItems = useMemo(() => navItems.slice(0, 5), [navItems]);

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === href;
    }
    // Para a aba "Projeto", só ativa se for exatamente a rota raiz do workspace
    if (href.match(/^\/workspace\/[^/]+$/)) {
      return location.pathname === href || location.pathname === href + "/projeto";
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

        {/* Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-muted/50 transition-colors">
              {/* Avatar */}
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                style={{ backgroundColor: profile?.avatar_color || '#6B7280' }}
              >
                {profile?.avatar_emoji || (
                  <span className="text-white font-medium text-xs">
                    {profile?.nome ? getInitials(profile.nome) : "?"}
                  </span>
                )}
              </div>
              <span className="text-sm text-muted-foreground max-w-[100px] truncate">
                {profile?.nome || "Usuário"}
              </span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setAvatarEditorOpen(true)}>
              <Settings className="h-4 w-4 mr-2" />
              Editar Perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={signOut}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Avatar Editor Modal */}
        {user && profile && (
          <AvatarEditor
            open={avatarEditorOpen}
            onOpenChange={setAvatarEditorOpen}
            userId={user.id}
            userName={profile.nome}
            currentEmoji={profile.avatar_emoji}
            currentColor={profile.avatar_color}
            onSave={invalidateProfile}
          />
        )}
      </div>
    </header>
  );
}

export const AppSidebar = memo(AppSidebarComponent);
