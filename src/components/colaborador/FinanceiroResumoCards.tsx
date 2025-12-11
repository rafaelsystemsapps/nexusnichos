import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Receipt, Wallet } from "lucide-react";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

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
  const isIOSMobile = useIsIOSMobile();

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
    <div className={cn(
      "grid gap-3",
      isIOSMobile ? "grid-cols-2" : "gap-4 md:grid-cols-2 lg:grid-cols-4"
    )}>
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={cn(
            "border-border/50",
            isIOSMobile 
              ? "ios-card p-3 ios-animate-fade-in" 
              : "shadow-premium"
          )}
        >
          <CardHeader className={cn(
            "flex flex-row items-center justify-between space-y-0",
            isIOSMobile ? "p-0 pb-1" : "pb-2"
          )}>
            <CardTitle className={cn(
              "font-medium text-muted-foreground",
              isIOSMobile ? "ios-title" : "text-sm"
            )}>
              {card.title}
            </CardTitle>
            <card.icon className={cn(
              "text-muted-foreground",
              isIOSMobile ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
          </CardHeader>
          <CardContent className={isIOSMobile ? "p-0" : undefined}>
            <div className={cn(
              "font-bold",
              card.highlight ? "text-green-500" : "",
              isIOSMobile ? "ios-value" : "text-2xl"
            )}>
              {card.value}
            </div>
            <p className={cn(
              "text-muted-foreground mt-0.5",
              isIOSMobile ? "ios-subtitle" : "text-xs mt-1"
            )}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
