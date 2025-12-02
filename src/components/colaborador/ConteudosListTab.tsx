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
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Lista de Conteúdos</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Título</TableHead>
            <TableHead>Data</TableHead>
            <TableHead>Canal</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Responsável</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conteudos.map((conteudo) => (
            <TableRow key={conteudo.id}>
              <TableCell className="font-medium">{conteudo.titulo}</TableCell>
              <TableCell>{format(new Date(conteudo.data_postagem), "dd/MM/yyyy")}</TableCell>
              <TableCell className="capitalize">{conteudo.canal}</TableCell>
              <TableCell className="capitalize">{conteudo.tipo_midia}</TableCell>
              <TableCell>{getStatusBadge(conteudo.status)}</TableCell>
              <TableCell>{conteudo.profiles?.nome || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
