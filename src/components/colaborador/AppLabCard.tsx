import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MoreHorizontal, Pencil, Trash2, Link2, Users, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface AppLabApp {
  id: string;
  nome_app: string;
  descricao_curta: string | null;
  status_teste: "em_analise" | "em_teste" | "validado" | "descartado";
  usuarios_ativos: number;
  usuarios_ativos_atualizado_em: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  links_count?: number;
  links_summary?: {
    "7_dias": number;
    "30_dias": number;
    "3_meses": number;
    expirados: number;
  };
}

interface AppLabCardProps {
  app: AppLabApp;
  onEdit: (app: AppLabApp) => void;
  onDelete: (app: AppLabApp) => void;
  onManageLinks: (app: AppLabApp) => void;
  onStatusChange: (app: AppLabApp, newStatus: AppLabApp["status_teste"]) => void;
}

const STATUS_CONFIG = {
  em_analise: {
    label: "Em Análise",
    emoji: "🟡",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    text: "text-amber-500",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  em_teste: {
    label: "Em Teste",
    emoji: "🔵",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    text: "text-blue-500",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  },
  validado: {
    label: "Validado",
    emoji: "🟢",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    text: "text-emerald-500",
    badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  descartado: {
    label: "Descartado",
    emoji: "🔴",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    text: "text-red-500",
    badge: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

const STATUS_OPTIONS: AppLabApp["status_teste"][] = [
  "em_analise",
  "em_teste",
  "validado",
  "descartado",
];

const DURACAO_CONFIG = {
  "7_dias": { label: "7d", emoji: "🧪", color: "text-amber-500", bg: "bg-amber-500/20" },
  "30_dias": { label: "30d", emoji: "🔬", color: "text-blue-500", bg: "bg-blue-500/20" },
  "3_meses": { label: "3m", emoji: "🧫", color: "text-purple-500", bg: "bg-purple-500/20" },
};

export function AppLabCard({
  app,
  onEdit,
  onDelete,
  onManageLinks,
  onStatusChange,
}: AppLabCardProps) {
  const statusConfig = STATUS_CONFIG[app.status_teste];
  const summary = app.links_summary;
  const hasExpirados = summary && summary.expirados > 0;

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        statusConfig.bg,
        statusConfig.border,
        "border"
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Info Principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground truncate">
                {app.nome_app}
              </h3>
              <Badge
                variant="outline"
                className={cn("text-xs shrink-0", statusConfig.badge)}
              >
                {statusConfig.emoji} {statusConfig.label}
              </Badge>
            </div>

            {app.descricao_curta && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {app.descricao_curta}
              </p>
            )}

            {/* Stats Row */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              {/* Links Count */}
              <button
                onClick={() => onManageLinks(app)}
                className="flex items-center gap-1.5 hover:text-primary transition-colors"
              >
                <Link2 className="h-3.5 w-3.5" />
                <span>{app.links_count || 0} contas</span>
              </button>

              {/* Usuarios Ativos */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5" />
                      <span>{app.usuarios_ativos} ativos</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    {app.usuarios_ativos_atualizado_em ? (
                      <p>
                        Atualizado em{" "}
                        {format(
                          new Date(app.usuarios_ativos_atualizado_em),
                          "dd/MM/yyyy",
                          { locale: ptBR }
                        )}
                      </p>
                    ) : (
                      <p>Sem data de atualização</p>
                    )}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>

              {/* Last Update */}
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                <span>
                  {format(new Date(app.updated_at), "dd/MM", { locale: ptBR })}
                </span>
              </div>
            </div>

            {/* Test Summary */}
            {summary && (summary["7_dias"] > 0 || summary["30_dias"] > 0 || summary["3_meses"] > 0 || summary.expirados > 0) && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {summary["7_dias"] > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn("text-xs cursor-default", DURACAO_CONFIG["7_dias"].bg, DURACAO_CONFIG["7_dias"].color)}>
                          {DURACAO_CONFIG["7_dias"].emoji} {summary["7_dias"]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {summary["7_dias"]} teste(s) de 7 dias ativos
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {summary["30_dias"] > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn("text-xs cursor-default", DURACAO_CONFIG["30_dias"].bg, DURACAO_CONFIG["30_dias"].color)}>
                          {DURACAO_CONFIG["30_dias"].emoji} {summary["30_dias"]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {summary["30_dias"]} teste(s) de 30 dias ativos
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {summary["3_meses"] > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="outline" className={cn("text-xs cursor-default", DURACAO_CONFIG["3_meses"].bg, DURACAO_CONFIG["3_meses"].color)}>
                          {DURACAO_CONFIG["3_meses"].emoji} {summary["3_meses"]}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {summary["3_meses"]} teste(s) de 3 meses ativos
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                {summary.expirados > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge variant="destructive" className="text-xs cursor-default">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          {summary.expirados}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        {summary.expirados} teste(s) expirado(s) - requer atenção
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}

            {/* Observações */}
            {app.observacoes && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs text-muted-foreground/70 mt-2 italic truncate cursor-help">
                      💬 {app.observacoes}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>{app.observacoes}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Expiration Alert */}
            {hasExpirados && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onManageLinks(app)}>
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {summary?.expirados} teste(s) expirado(s)
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            {/* Status Quick Change */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn("h-8 px-2", statusConfig.text)}
                >
                  {statusConfig.emoji}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {STATUS_OPTIONS.map((status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => onStatusChange(app, status)}
                    className={cn(
                      app.status_teste === status && "bg-muted"
                    )}
                  >
                    {STATUS_CONFIG[status].emoji} {STATUS_CONFIG[status].label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* More Actions */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(app)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onManageLinks(app)}>
                  <Link2 className="h-4 w-4 mr-2" />
                  Gerenciar Vinculações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(app)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
