import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { usePerfilContext, type Perfil } from "@/contexts/PerfilContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function Avatar({ perfil, size = 32 }: { perfil: Perfil | null; size?: number }) {
  const inicial = perfil?.nome?.[0]?.toUpperCase() ?? "?";
  const conteudo = perfil?.emoji || inicial;
  return (
    <div
      className="rounded-lg flex items-center justify-center text-sm font-semibold text-white shrink-0"
      style={{
        width: size,
        height: size,
        backgroundColor: perfil?.cor || "#6B7280",
        fontSize: size <= 24 ? 12 : 14,
      }}
    >
      {conteudo}
    </div>
  );
}

export function SeletorPerfil() {
  const navigate = useNavigate();
  const { perfis, perfilAtivo, setPerfilAtivo, loadingPerfis } = usePerfilContext();

  const escolher = (p: Perfil) => {
    setPerfilAtivo(p);
    if (p.tipo === "admin") {
      navigate("/admin");
    } else if (p.nichoId) {
      navigate(`/workspace/${p.nichoId}`);
    } else {
      toast({
        title: "Perfil sem nicho vinculado",
        description: `${p.nome} não tem nicho associado.`,
        variant: "destructive",
      });
    }
  };

  const admins = perfis.filter((p) => p.tipo === "admin");
  const colabs = perfis.filter((p) => p.tipo === "colaborador");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-[#1a1a1a] transition-opacity"
          aria-label="Trocar perfil"
        >
          <Avatar perfil={perfilAtivo} />
          <span className="text-sm text-foreground max-w-[120px] truncate hidden sm:inline">
            {perfilAtivo?.nome ?? (loadingPerfis ? "..." : "Perfil")}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-[#1a1a1a] border-[#333] text-white"
      >
        {admins.length > 0 && (
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Admin
            </DropdownMenuLabel>
            {admins.map((p) => (
              <PerfilItem
                key={p.id}
                perfil={p}
                ativo={perfilAtivo?.id === p.id}
                onClick={() => escolher(p)}
              />
            ))}
          </>
        )}
        {colabs.length > 0 && (
          <>
            {admins.length > 0 && <DropdownMenuSeparator className="bg-[#333]" />}
            <DropdownMenuLabel className="text-xs text-muted-foreground uppercase tracking-wide">
              Workspace
            </DropdownMenuLabel>
            {colabs.map((p) => (
              <PerfilItem
                key={p.id}
                perfil={p}
                ativo={perfilAtivo?.id === p.id}
                onClick={() => escolher(p)}
              />
            ))}
          </>
        )}
        {perfis.length === 0 && (
          <div className="px-2 py-3 text-xs text-muted-foreground text-center">
            {loadingPerfis ? "Carregando perfis..." : "Nenhum perfil encontrado"}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function PerfilItem({
  perfil,
  ativo,
  onClick,
}: {
  perfil: Perfil;
  ativo: boolean;
  onClick: () => void;
}) {
  return (
    <DropdownMenuItem
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 cursor-pointer focus:bg-[#2a2a2a]",
        ativo && "bg-[#262626]"
      )}
    >
      <Avatar perfil={perfil} size={24} />
      <span className="flex-1 truncate text-sm">{perfil.nome}</span>
      <span
        className={cn(
          "text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wide",
          perfil.tipo === "admin"
            ? "bg-[#b45309] text-white"
            : "bg-[#1d4ed8] text-white"
        )}
      >
        {perfil.tipo === "admin" ? "Admin" : "Work"}
      </span>
    </DropdownMenuItem>
  );
}
