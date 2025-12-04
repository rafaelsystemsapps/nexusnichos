import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MembroTime {
  id: string;
  nome: string;
  funcao: string;
}

interface Transacao {
  id: string;
  produto_nome: string;
  preco_custo: number;
  preco_venda: number;
  created_at: string;
  membro_time?: MembroTime | null;
}

interface TransacoesTableProps {
  transacoes: Transacao[];
}

export function TransacoesTable({ transacoes }: TransacoesTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (transacoes.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        Nenhuma transação registrada ainda.
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border/50">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>Produto/Serviço</TableHead>
            <TableHead>Responsável</TableHead>
            <TableHead className="text-right">Preço Venda</TableHead>
            <TableHead className="text-right">Preço Custo</TableHead>
            <TableHead className="text-right">Lucro Líquido</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transacoes.map((transacao) => {
            const lucro = transacao.preco_venda - transacao.preco_custo;
            return (
              <TableRow key={transacao.id}>
                <TableCell className="text-muted-foreground">
                  {format(new Date(transacao.created_at), "dd/MM/yyyy HH:mm", {
                    locale: ptBR,
                  })}
                </TableCell>
                <TableCell className="font-medium">
                  {transacao.produto_nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {transacao.membro_time?.nome || "-"}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transacao.preco_venda)}
                </TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {formatCurrency(transacao.preco_custo)}
                </TableCell>
                <TableCell
                  className={`text-right font-medium ${
                    lucro >= 0 ? "text-green-500" : "text-destructive"
                  }`}
                >
                  {formatCurrency(lucro)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
