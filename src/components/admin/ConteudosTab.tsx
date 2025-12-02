import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function ConteudosTab() {
  const [conteudos, setConteudos] = useState<any[]>([]);

  useEffect(() => {
    fetchConteudos();
  }, []);

  const fetchConteudos = async () => {
    try {
      const { data, error } = await supabase
        .from("conteudos")
        .select(`
          *,
          nichos(nome),
          profiles:responsavel_id(nome)
        `)
        .order("data_postagem", { ascending: true });

      if (error) throw error;
      setConteudos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdos");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar este conteúdo?")) return;

    try {
      const { error } = await supabase.from("conteudos").delete().eq("id", id);

      if (error) throw error;
      toast.success("Conteúdo deletado!");
      fetchConteudos();
    } catch (error: any) {
      toast.error("Erro ao deletar: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
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

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Todos os Conteúdos</h2>

      <div className="rounded-lg border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="font-semibold">Título</TableHead>
              <TableHead className="font-semibold">Data</TableHead>
              <TableHead className="font-semibold">Canal</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nicho</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {conteudos.map((conteudo) => (
              <TableRow key={conteudo.id} className="hover:bg-surface-hover transition-colors">
                <TableCell className="font-medium">{conteudo.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(conteudo.data_postagem), "dd/MM/yyyy")}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{conteudo.canal}</TableCell>
                <TableCell>{getStatusBadge(conteudo.status)}</TableCell>
                <TableCell>{conteudo.nichos?.nome}</TableCell>
                <TableCell className="text-muted-foreground">{conteudo.profiles?.nome || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(conteudo.id)}
                    className="hover:bg-destructive/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
