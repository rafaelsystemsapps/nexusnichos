import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "lucide-react";

interface SemanaLogistica {
  id: string;
  semana_inicio: string;
  semana_fim: string;
  semana_numero: number;
  ano: number;
  status: string;
}

interface LogisticaHistoricoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semanas: SemanaLogistica[];
}

export function LogisticaHistoricoDialog({
  open,
  onOpenChange,
  semanas,
}: LogisticaHistoricoDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Histórico de Semanas</DialogTitle>
        </DialogHeader>

        <div className="space-y-3 max-h-[400px] overflow-y-auto">
          {semanas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma semana finalizada ainda</p>
            </div>
          ) : (
            semanas.map((semana) => (
              <div
                key={semana.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border bg-background"
              >
                <div>
                  <p className="font-medium text-sm">
                    Semana {semana.semana_numero}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(semana.semana_inicio), "dd/MM", {
                      locale: ptBR,
                    })}{" "}
                    -{" "}
                    {format(new Date(semana.semana_fim), "dd/MM/yyyy", {
                      locale: ptBR,
                    })}
                  </p>
                </div>
                <Badge variant="secondary" className="text-xs">
                  {semana.ano}
                </Badge>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
