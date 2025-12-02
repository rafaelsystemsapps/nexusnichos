import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ConteudoForm } from "./ConteudoForm";

interface ConteudosListTabProps {
  nichoId: string;
}

export function ConteudosListTab({ nichoId }: ConteudosListTabProps) {
  const [conteudos, setConteudos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedConteudo, setSelectedConteudo] = useState<any>(null);

  useEffect(() => {
    fetchConteudos();
  }, [nichoId]);

  const fetchConteudos = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .order("data_postagem", { ascending: false });

      if (error) throw error;
      setConteudos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdos");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return <Badge variant="secondary">-</Badge>;
    
    const variants: Record<string, "secondary" | "default" | "outline"> = {
      planejado: "secondary",
      em_producao: "default",
      publicado: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const handleEdit = (conteudo: any) => {
    setSelectedConteudo(conteudo);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setSelectedConteudo(null);
    fetchConteudos();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Lista de Conteúdos</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedConteudo(null)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Conteúdo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {selectedConteudo ? "Editar Conteúdo" : "Novo Conteúdo"}
              </DialogTitle>
            </DialogHeader>
            <ConteudoForm
              nichoId={nichoId}
              conteudo={selectedConteudo}
              onSuccess={handleDialogClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="rounded-lg border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="font-semibold">Título</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Canal</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando...
                </TableCell>
              </TableRow>
            ) : conteudos.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum conteúdo encontrado. Crie o primeiro!
                </TableCell>
              </TableRow>
            ) : (
              conteudos.map((conteudo) => (
                <TableRow key={conteudo.id} className="hover:bg-surface-hover transition-colors">
                  <TableCell className="font-medium">{conteudo.titulo || "-"}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {conteudo.data_postagem 
                      ? format(new Date(conteudo.data_postagem), "dd/MM/yyyy") 
                      : "-"}
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{conteudo.canal || "-"}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{conteudo.tipo_midia || "-"}</TableCell>
                  <TableCell>{getStatusBadge(conteudo.status)}</TableCell>
                  <TableCell className="text-muted-foreground">{conteudo.profiles?.nome || "-"}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(conteudo)}
                      className="hover:bg-primary/20"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
