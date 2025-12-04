import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

interface LucroMembro {
  membroId: string | null;
  nome: string;
  funcao: string;
  transacoes: number;
  lucroLiquido: number;
}

interface LucroPorMembroTableProps {
  dados: LucroMembro[];
}

export function LucroPorMembroTable({ dados }: LucroPorMembroTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (dados.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Users className="h-5 w-5" />
          Lucro por Membro do Time
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Membro</TableHead>
              <TableHead>Função</TableHead>
              <TableHead className="text-center">Transações</TableHead>
              <TableHead className="text-right">Lucro Líquido</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dados.map((membro) => (
              <TableRow key={membro.membroId || "sem-responsavel"}>
                <TableCell className="font-medium">
                  {membro.nome}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {membro.funcao}
                </TableCell>
                <TableCell className="text-center">
                  {membro.transacoes}
                </TableCell>
                <TableCell
                  className={`text-right font-semibold ${
                    membro.lucroLiquido >= 0 ? "text-green-500" : "text-red-500"
                  }`}
                >
                  {formatCurrency(membro.lucroLiquido)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
