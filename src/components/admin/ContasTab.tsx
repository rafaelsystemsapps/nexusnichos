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
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Todas as Contas de Redes Sociais</h2>

      <div className="rounded-lg border border-border/50 shadow-premium overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-surface hover:bg-surface">
              <TableHead className="font-semibold">Nome/Conta</TableHead>
              <TableHead className="font-semibold">Plataforma</TableHead>
              <TableHead className="font-semibold">Status</TableHead>
              <TableHead className="font-semibold">Nicho</TableHead>
              <TableHead className="font-semibold">Responsável</TableHead>
              <TableHead className="font-semibold">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {contas.map((conta) => (
              <TableRow key={conta.id} className="hover:bg-surface-hover transition-colors">
                <TableCell className="font-medium">{conta.nome_conta}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{conta.plataforma}</TableCell>
                <TableCell>{getStatusBadge(conta.status)}</TableCell>
                <TableCell>{conta.nichos?.nome}</TableCell>
                <TableCell className="text-muted-foreground">{conta.profiles?.nome || "-"}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(conta.id)}
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
