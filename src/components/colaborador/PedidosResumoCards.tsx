import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Package, TrendingUp } from "lucide-react";
import { useIsIOSMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PedidosResumoCardsProps {
  pendentes: number;
  enviados: number;
  valorTotal: number;
}

export function PedidosResumoCards({ pendentes, enviados, valorTotal }: PedidosResumoCardsProps) {
  const isIOSMobile = useIsIOSMobile();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const cards = [
    {
      title: "Pendentes",
      value: pendentes.toString(),
      description: "aguardando envio",
      icon: Clock,
      valueColor: "text-yellow-500",
      iconColor: "text-yellow-500",
    },
    {
      title: "Enviados (mês)",
      value: enviados.toString(),
      description: "este mês",
      icon: Package,
      valueColor: "text-green-500",
      iconColor: "text-green-500",
    },
    {
      title: "Valor Total (mês)",
      value: formatCurrency(valorTotal),
      description: "em pedidos",
      icon: TrendingUp,
      valueColor: "",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className={cn(
      "grid gap-3",
      isIOSMobile ? "grid-cols-1" : "gap-4 md:grid-cols-3"
    )}>
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={cn(
            "border-border/50",
            isIOSMobile 
              ? "ios-card p-3 ios-animate-fade-in" 
              : "bg-card/50"
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
              card.iconColor,
              isIOSMobile ? "h-3.5 w-3.5" : "h-4 w-4"
            )} />
          </CardHeader>
          <CardContent className={isIOSMobile ? "p-0" : undefined}>
            <div className={cn(
              "font-bold",
              card.valueColor,
              isIOSMobile ? "ios-value" : "text-2xl"
            )}>
              {card.value}
            </div>
            <p className={cn(
              "text-muted-foreground",
              isIOSMobile ? "ios-subtitle" : "text-xs"
            )}>
              {card.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
