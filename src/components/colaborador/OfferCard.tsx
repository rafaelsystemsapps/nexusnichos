import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { 
  ExternalLink, 
  Pencil, 
  Trash2,
  Flame,
  Snowflake,
  CheckCircle2,
  XCircle,
  Trash,
  ShoppingCart
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { OfferVault, StatusOferta } from "@/hooks/queries/useOfferVault";

// Plataforma icons
const PLATAFORMA_ICONS: Record<string, string> = {
  tiktok: "📱",
  instagram: "📸",
  facebook: "👤",
  youtube: "▶️",
  outro: "🔗",
};

// Status config
const STATUS_CONFIG: Record<StatusOferta, { label: string; color: string; bgColor: string; icon: React.ReactNode }> = {
  salva: {
    label: "Salva",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10 border-amber-500/30",
    icon: <Snowflake className="h-3.5 w-3.5" />,
  },
  em_teste: {
    label: "Em Teste",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10 border-blue-500/30",
    icon: <Flame className="h-3.5 w-3.5" />,
  },
  funcionou: {
    label: "Funcionou",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10 border-emerald-500/30",
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  nao_funcionou: {
    label: "Não Funcionou",
    color: "text-red-500",
    bgColor: "bg-red-500/10 border-red-500/30",
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  lixo: {
    label: "Lixo",
    color: "text-zinc-500",
    bgColor: "bg-zinc-500/10 border-zinc-500/30",
    icon: <Trash className="h-3.5 w-3.5" />,
  },
};

// País flags (common ones)
const PAIS_FLAGS: Record<string, string> = {
  BR: "🇧🇷",
  US: "🇺🇸",
  ES: "🇪🇸",
  MX: "🇲🇽",
  PT: "🇵🇹",
  AR: "🇦🇷",
  CO: "🇨🇴",
  CL: "🇨🇱",
  PE: "🇵🇪",
  UK: "🇬🇧",
  DE: "🇩🇪",
  FR: "🇫🇷",
  IT: "🇮🇹",
};

interface OfferCardProps {
  offer: OfferVault;
  onEdit: (offer: OfferVault) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: StatusOferta) => void;
}

export function OfferCard({ offer, onEdit, onDelete, onStatusChange }: OfferCardProps) {
  const status = offer.status_oferta as StatusOferta;
  const statusConfig = STATUS_CONFIG[status] || STATUS_CONFIG.salva;
  const plataformaIcon = PLATAFORMA_ICONS[offer.origem_plataforma] || "🔗";
  const paisFlag = PAIS_FLAGS[offer.pais] || "🌍";

  return (
    <Card className={cn(
      "border transition-all hover:shadow-md",
      statusConfig.bgColor
    )}>
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm truncate">{offer.titulo_curto}</h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
              <span>{plataformaIcon} {offer.origem_plataforma}</span>
              <span>•</span>
              <span>{paisFlag} {offer.pais}</span>
              <span>•</span>
              <span>{format(new Date(offer.updated_at), "dd/MM", { locale: ptBR })}</span>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={cn("shrink-0 gap-1", statusConfig.color, statusConfig.bgColor)}
          >
            {statusConfig.icon}
            {statusConfig.label}
          </Badge>
        </div>

        {/* Links */}
        <div className="space-y-1">
          {offer.origem_url && (
            <a 
              href={offer.origem_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-primary hover:underline truncate"
            >
              <ExternalLink className="h-3 w-3 shrink-0" />
              <span className="truncate">Origem: {offer.origem_url}</span>
            </a>
          )}
          {offer.link_pagina_vendas && (
            <a 
              href={offer.link_pagina_vendas} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-emerald-600 hover:underline truncate"
            >
              <ShoppingCart className="h-3 w-3 shrink-0" />
              <span className="truncate">Vendas: {offer.link_pagina_vendas}</span>
            </a>
          )}
        </div>

        {/* Como testar */}
        {offer.como_testar && (
          <div className="text-xs">
            <span className="text-muted-foreground">🧪 Como testar: </span>
            <span className="text-foreground">{offer.como_testar}</span>
          </div>
        )}

        {/* Aprendizado */}
        {offer.aprendizado && (
          <div className="text-xs">
            <span className="text-muted-foreground">💡 Aprendizado: </span>
            <span className="text-foreground">{offer.aprendizado}</span>
          </div>
        )}

        {/* Status buttons */}
        <div className="flex items-center gap-1 pt-2 border-t border-border/30">
          {(Object.keys(STATUS_CONFIG) as StatusOferta[]).map((s) => (
            <button
              key={s}
              onClick={() => onStatusChange(offer.id, s)}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center transition-all",
                status === s 
                  ? cn(STATUS_CONFIG[s].bgColor, STATUS_CONFIG[s].color, "ring-2 ring-offset-1 ring-offset-background")
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
              title={STATUS_CONFIG[s].label}
            >
              {STATUS_CONFIG[s].icon}
            </button>
          ))}
          
          <div className="flex-1" />
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => onEdit(offer)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Excluir oferta?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. A oferta "{offer.titulo_curto}" será removida permanentemente.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => onDelete(offer.id)}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}
