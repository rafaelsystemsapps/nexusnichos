import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Ban, TrendingDown, Wind, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CemiterioItem {
  id: string;
  nome: string;
  motivo: string;
  observacao: string | null;
  data_encerramento: string;
}

interface CemiterioItemCardProps {
  item: CemiterioItem;
  onDelete: (id: string) => void;
}

const MOTIVOS = {
  banido: { label: "Banido", icon: Ban },
  saturado: { label: "Saturado", icon: TrendingDown },
  perdeu_tracao: { label: "Perdeu tração", icon: Wind },
  substituido: { label: "Substituído", icon: RefreshCw },
};

export function CemiterioItemCard({ item, onDelete }: CemiterioItemCardProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);

  const motivo = MOTIVOS[item.motivo as keyof typeof MOTIVOS] || { 
    label: item.motivo, 
    icon: Ban 
  };
  const MotivoIcon = motivo.icon;

  return (
    <>
      <Card className="bg-muted/10 border-border/15 hover:bg-muted/15 transition-colors">
        <div className="flex items-start justify-between p-4">
          <div className="flex-1 min-w-0">
            {/* Nome do ativo */}
            <h3 className="font-medium text-muted-foreground truncate">
              {item.nome}
            </h3>
            
            {/* Motivo e data */}
            <div className="flex items-center gap-3 mt-1.5 text-sm">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-muted/30 text-muted-foreground/70">
                <MotivoIcon className="h-3 w-3" />
                {motivo.label}
              </span>
              <span className="text-muted-foreground/50 text-xs">
                {format(new Date(item.data_encerramento), "dd MMM yyyy", { locale: ptBR })}
              </span>
            </div>

            {/* Observação */}
            {item.observacao && (
              <p className="mt-2 text-sm text-muted-foreground/50 truncate">
                {item.observacao}
              </p>
            )}
          </div>

          {/* Botão excluir (discreto) */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setDeleteOpen(true)}
            className="h-8 w-8 opacity-30 hover:opacity-100 text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </Card>

      {/* Confirmação de exclusão */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover do cemitério?</AlertDialogTitle>
            <AlertDialogDescription>
              O item "{item.nome}" será removido permanentemente do registro histórico.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onDelete(item.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
