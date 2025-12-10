import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Package, TrendingUp } from "lucide-react";

interface PedidosResumoCardsProps {
  pendentes: number;
  enviados: number;
  valorTotal: number;
}

export function PedidosResumoCards({ pendentes, enviados, valorTotal }: PedidosResumoCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Pendentes
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-500">{pendentes}</div>
          <p className="text-xs text-muted-foreground">aguardando envio</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Enviados (mês)
          </CardTitle>
          <Package className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">{enviados}</div>
          <p className="text-xs text-muted-foreground">este mês</p>
        </CardContent>
      </Card>

      <Card className="bg-card/50 border-border/50">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Valor Total (mês)
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(valorTotal)}</div>
          <p className="text-xs text-muted-foreground">em pedidos</p>
        </CardContent>
      </Card>
    </div>
  );
}
