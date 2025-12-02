import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

export function ContasTab() {
  const [contas, setContas] = useState<any[]>([]);

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select(`
          *,
          nichos(nome),
          profiles:responsavel_id(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja deletar esta conta?")) return;

    try {
      const { error } = await supabase
        .from("contas_redes_sociais")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Conta deletada!");
      fetchContas();
    } catch (error: any) {
      toast.error("Erro ao deletar: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      ativa: "default",
      pausada: "secondary",
      banida: "destructive",
      limitada: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Todas as Contas de Redes Sociais</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome/Conta</TableHead>
            <TableHead>Plataforma</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Nicho</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contas.map((conta) => (
            <TableRow key={conta.id}>
              <TableCell className="font-medium">{conta.nome_conta}</TableCell>
              <TableCell className="capitalize">{conta.plataforma}</TableCell>
              <TableCell>{getStatusBadge(conta.status)}</TableCell>
              <TableCell>{conta.nichos?.nome}</TableCell>
              <TableCell>{conta.profiles?.nome || "-"}</TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(conta.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
