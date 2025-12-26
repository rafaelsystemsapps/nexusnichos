import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Instagram,
  Youtube,
  MessageCircle,
  Mail,
  Phone,
  ExternalLink,
  MoreVertical,
  Trash2,
  Edit,
  UserPlus,
  Globe,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

// TikTok icon
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

type StatusContato = "salvo" | "contatado" | "aceitou" | "nao_aceitou" | "sem_resposta";

interface Prospect {
  id: string;
  nome_display: string;
  origem: string;
  origem_url: string | null;
  metodo_contato: string;
  contato: string | null;
  status_contato: StatusContato;
  observacao: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
}

interface ProspectCardProps {
  prospect: Prospect;
  onStatusChange: (id: string, newStatus: StatusContato) => void;
  onEdit: (prospect: Prospect) => void;
  onDelete: (id: string) => void;
  onConvert: (prospect: Prospect) => void;
}

const STATUS_CONFIG: Record<StatusContato, { label: string; color: string; bgColor: string }> = {
  salvo: { label: "Salvo", color: "text-yellow-600", bgColor: "bg-yellow-500/20 border-yellow-500/30" },
  contatado: { label: "Contatado", color: "text-blue-600", bgColor: "bg-blue-500/20 border-blue-500/30" },
  aceitou: { label: "Aceitou", color: "text-green-600", bgColor: "bg-green-500/20 border-green-500/30" },
  nao_aceitou: { label: "Não Aceitou", color: "text-red-600", bgColor: "bg-red-500/20 border-red-500/30" },
  sem_resposta: { label: "Sem Resposta", color: "text-muted-foreground", bgColor: "bg-muted/50 border-muted" },
};

const ORIGEM_ICONS: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  tiktok: <TikTokIcon className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  outro: <Globe className="h-4 w-4" />,
};

const METODO_ICONS: Record<string, React.ReactNode> = {
  dm: <MessageCircle className="h-3 w-3" />,
  email: <Mail className="h-3 w-3" />,
  whatsapp: <Phone className="h-3 w-3" />,
  outro: <MessageCircle className="h-3 w-3" />,
};

export function ProspectCard({ prospect, onStatusChange, onEdit, onDelete, onConvert }: ProspectCardProps) {
  const statusConfig = STATUS_CONFIG[prospect.status_contato] || STATUS_CONFIG.salvo;

  const statusOptions: StatusContato[] = ["salvo", "contatado", "sem_resposta", "aceitou", "nao_aceitou"];

  return (
    <Card className={cn("border-l-4 transition-all hover:shadow-md", statusConfig.bgColor)}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Info */}
          <div className="flex-1 min-w-0 space-y-2">
            {/* Header */}
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">{ORIGEM_ICONS[prospect.origem] || ORIGEM_ICONS.outro}</span>
              <h3 className="font-semibold text-foreground truncate">{prospect.nome_display}</h3>
              {prospect.origem_url && (
                <a
                  href={prospect.origem_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              )}
            </div>

            {/* Contact */}
            {prospect.contato && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                {METODO_ICONS[prospect.metodo_contato] || METODO_ICONS.outro}
                <span className="truncate">{prospect.contato}</span>
              </div>
            )}

            {/* Observation */}
            {prospect.observacao && (
              <p className="text-sm text-muted-foreground line-clamp-2 italic">
                "{prospect.observacao}"
              </p>
            )}

            {/* Date */}
            {prospect.data_ultimo_contato && (
              <p className="text-xs text-muted-foreground">
                Último contato: {format(new Date(prospect.data_ultimo_contato), "dd/MM/yyyy", { locale: ptBR })}
              </p>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col items-end gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(prospect)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                {prospect.status_contato === "aceitou" && (
                  <DropdownMenuItem onClick={() => onConvert(prospect)}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Converter em Cliente
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(prospect.id)} className="text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Status Badge */}
            <Badge variant="outline" className={cn("text-xs", statusConfig.color)}>
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        {/* Quick Status Change */}
        <div className="flex flex-wrap gap-1 mt-3 pt-3 border-t border-border/50">
          {statusOptions.map((status) => (
            <Button
              key={status}
              variant={prospect.status_contato === status ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "h-7 text-xs px-2",
                prospect.status_contato === status && STATUS_CONFIG[status].color
              )}
              onClick={() => onStatusChange(prospect.id, status)}
            >
              {STATUS_CONFIG[status].label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
