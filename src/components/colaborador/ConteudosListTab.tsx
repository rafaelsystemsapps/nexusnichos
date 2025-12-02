import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { format } from "date-fns";

interface ConteudosListTabProps {
  nichoId: string;
}

export function ConteudosListTab({ nichoId }: ConteudosListTabProps) {
  const [conteudos, setConteudos] = useState<any[]>([]);

  useEffect(() => {
    fetchConteudos();
  }, [nichoId]);

  const fetchConteudos = async () => {
    try {
      const { data, error } = await supabase
        .from("conteudos")
        .select("*, profiles:responsavel_id(nome)")
        .eq("nicho_id", nichoId)
        .order("data_postagem", { ascending: true });

      if (error) throw error;
      setConteudos(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar conteúdos");
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
      <h2 className="text-3xl font-bold tracking-tight">Lista de Conteúdos</h2>

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {conteudos.map((conteudo) => (
              <TableRow key={conteudo.id} className="hover:bg-surface-hover transition-colors">
                <TableCell className="font-medium">{conteudo.titulo}</TableCell>
                <TableCell className="text-muted-foreground">{format(new Date(conteudo.data_postagem), "dd/MM/yyyy")}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{conteudo.canal}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{conteudo.tipo_midia}</TableCell>
                <TableCell>{getStatusBadge(conteudo.status)}</TableCell>
                <TableCell className="text-muted-foreground">{conteudo.profiles?.nome || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
