import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Smartphone, 
  ExternalLink, 
  Github, 
  Calendar, 
  Users, 
  Pencil, 
  Trash2,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AplicativoForm } from "./AplicativoForm";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Aplicativo {
  id: string;
  nome: string;
  descricao: string | null;
  tipo_app: string | null;
  status: string | null;
  tecnologias: string | null;
  url_producao: string | null;
  url_repositorio: string | null;
  data_criacao: string | null;
  data_lancamento: string | null;
  clientes_count?: number;
}

interface AplicativoCardProps {
  aplicativo: Aplicativo;
  nichoId: string;
  onUpdate: () => void;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  ideia: { label: "Ideia", variant: "outline" },
  desenvolvimento: { label: "Em Desenvolvimento", variant: "secondary" },
  lancado: { label: "Lancado", variant: "default" },
  ativo: { label: "Ativo", variant: "default" },
  pausado: { label: "Pausado", variant: "destructive" },
};

const tipoConfig: Record<string, string> = {
  guia: "Guia Digital",
  gestao: "Gestao",
  delivery: "Delivery",
  outro: "Outro",
};

export function AplicativoCard({ aplicativo, nichoId, onUpdate }: AplicativoCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const { error } = await supabase
        .from("aplicativos")
        .delete()
        .eq("id", aplicativo.id);

      if (error) throw error;
      toast.success("Aplicativo removido!");
      onUpdate();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const status = statusConfig[aplicativo.status || "ideia"] || statusConfig.ideia;
  const tipo = tipoConfig[aplicativo.tipo_app || "outro"] || "Outro";

  return (
    <>
      <Card className="transition-all hover:shadow-md">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <Smartphone className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate">{aplicativo.nome}</h3>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant={status.variant}>{status.label}</Badge>
                  <Badge variant="outline">{tipo}</Badge>
                  {aplicativo.clientes_count && aplicativo.clientes_count > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {aplicativo.clientes_count} cliente{aplicativo.clientes_count > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {aplicativo.descricao && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {aplicativo.descricao}
            </p>
          )}

          <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
            {aplicativo.tecnologias && (
              <span className="font-mono text-xs bg-muted px-2 py-1 rounded">
                {aplicativo.tecnologias}
              </span>
            )}
            {aplicativo.data_criacao && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {format(new Date(aplicativo.data_criacao), "MMM yyyy", { locale: ptBR })}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {aplicativo.url_producao && (
              <Button variant="outline" size="sm" asChild>
                <a href={aplicativo.url_producao} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  App
                </a>
              </Button>
            )}
            {aplicativo.url_repositorio && (
              <Button variant="outline" size="sm" asChild>
                <a href={aplicativo.url_repositorio} target="_blank" rel="noopener noreferrer">
                  <Github className="h-3 w-3 mr-1" />
                  Repo
                </a>
              </Button>
            )}
          </div>

          {expanded && (
            <div className="pt-3 border-t space-y-3">

              <div className="flex items-center gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-3 w-3 mr-1" />
                  Editar
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-destructive">
                      <Trash2 className="h-3 w-3 mr-1" />
                      Remover
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Remover aplicativo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acao vai remover o aplicativo e todos os resultados associados.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleDelete} disabled={deleting}>
                        {deleting ? "Removendo..." : "Remover"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AplicativoForm
        open={editOpen}
        onOpenChange={setEditOpen}
        nichoId={nichoId}
        aplicativo={aplicativo}
        onSave={onUpdate}
      />
    </>
  );
}
