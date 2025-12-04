import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react";

interface ResumoCardsProps {
  faturamentoMensal: number;
  lucroMensal: number;
  transacoesMes: number;
  faturamentoTotal: number;
}

export function FinanceiroResumoCards({
  faturamentoMensal,
  lucroMensal,
  transacoesMes,
  faturamentoTotal,
}: ResumoCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Faturamento Mensal",
      value: formatCurrency(faturamentoMensal),
      icon: DollarSign,
      description: "Total de vendas no mês",
    },
    {
      title: "Lucro Líquido Mensal",
      value: formatCurrency(lucroMensal),
      icon: TrendingUp,
      description: "Vendas - Custos do mês",
      highlight: lucroMensal > 0,
    },
    {
      title: "Transações no Mês",
      value: transacoesMes.toString(),
      icon: Receipt,
      description: "Quantidade de vendas",
    },
    {
      title: "Faturamento Total",
      value: formatCurrency(faturamentoTotal),
      icon: Wallet,
      description: "Histórico completo",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.title} className="border-border/50 shadow-premium">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <card.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${card.highlight ? "text-green-500" : ""}`}>
              {card.value}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
