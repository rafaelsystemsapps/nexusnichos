import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Plus, Pencil, Trash2, Wrench } from "lucide-react";
import {
  FerramentaTrabalho,
  useDeleteFerramentaTrabalho,
  calcularCustoMensalFerramentas,
} from "@/hooks/queries/useFerramentasTrabalho";
import { FerramentaTrabalhoForm } from "./FerramentaTrabalhoForm";

interface FerramentaTrabalhoTableProps {
  nichoId: string;
  ferramentas: FerramentaTrabalho[];
  isLoading: boolean;
}

const CATEGORIA_LABELS: Record<string, string> = {
  design: "Design",
  ia: "IA",
  infra: "Infra",
  marketing: "Marketing",
  produtividade: "Produtividade",
  outros: "Outros",
};

export function FerramentaTrabalhoTable({
  nichoId,
  ferramentas,
  isLoading,
}: FerramentaTrabalhoTableProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [editingFerramenta, setEditingFerramenta] = useState<FerramentaTrabalho | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [ferramentaToDelete, setFerramentaToDelete] = useState<FerramentaTrabalho | null>(null);

  const deleteMutation = useDeleteFerramentaTrabalho();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const handleEdit = (ferramenta: FerramentaTrabalho) => {
    setEditingFerramenta(ferramenta);
    setFormOpen(true);
  };

  const handleDelete = (ferramenta: FerramentaTrabalho) => {
    setFerramentaToDelete(ferramenta);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (ferramentaToDelete) {
      await deleteMutation.mutateAsync({
        id: ferramentaToDelete.id,
        nichoId,
      });
      setDeleteDialogOpen(false);
      setFerramentaToDelete(null);
    }
  };

  const handleFormClose = (open: boolean) => {
    setFormOpen(open);
    if (!open) {
      setEditingFerramenta(null);
    }
  };

  const custoMensal = calcularCustoMensalFerramentas(ferramentas);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-32 rounded-lg skeleton-pulse bg-muted" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Ferramentas de Trabalho
            {ferramentas.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {formatCurrency(custoMensal)}/mês
              </Badge>
            )}
          </CardTitle>
          <Button size="sm" onClick={() => setFormOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Ferramenta
          </Button>
        </CardHeader>
        <CardContent>
          {ferramentas.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="p-3 rounded-full bg-muted/30 mb-3">
                <Wrench className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium mb-1">Nenhuma ferramenta cadastrada</h3>
              <p className="text-xs text-muted-foreground">
                Adicione as ferramentas que você usa no dia a dia
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ferramenta</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Mensal</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ferramentas.map((ferramenta) => {
                    const valorMensal =
                      ferramenta.periodicidade === "anual"
                        ? ferramenta.valor / 12
                        : ferramenta.valor;

                    return (
                      <TableRow
                        key={ferramenta.id}
                        className={!ferramenta.ativo ? "opacity-50" : ""}
                      >
                        <TableCell className="font-medium">
                          <div>
                            {ferramenta.nome}
                            {ferramenta.observacao && (
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {ferramenta.observacao}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIA_LABELS[ferramenta.categoria || "outros"]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                            <span>{formatCurrency(ferramenta.valor)}</span>
                            <span className="text-xs text-muted-foreground">
                              /{ferramenta.periodicidade === "anual" ? "ano" : "mês"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-amber-400">
                          {formatCurrency(valorMensal)}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={ferramenta.ativo ? "default" : "secondary"}
                            className={
                              ferramenta.ativo
                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                : ""
                            }
                          >
                            {ferramenta.ativo ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(ferramenta)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDelete(ferramenta)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <FerramentaTrabalhoForm
        open={formOpen}
        onOpenChange={handleFormClose}
        nichoId={nichoId}
        ferramenta={editingFerramenta}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover ferramenta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover "{ferramentaToDelete?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
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
