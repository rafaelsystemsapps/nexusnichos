import { useAllClienteApps } from "@/hooks/queries/useAllClienteApps";
import { useFerramentasTrabalho, calcularCustoMensalFerramentas } from "@/hooks/queries/useFerramentasTrabalho";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, Globe, Users, Wrench } from "lucide-react";
import { FerramentaTrabalhoTable } from "./FerramentaTrabalhoTable";

interface CustosAppsTabProps {
  nichoId: string;
}

export function CustosAppsTab({ nichoId }: CustosAppsTabProps) {
  const { data, isLoading } = useAllClienteApps(nichoId);
  const { data: ferramentas = [], isLoading: ferramentasLoading } = useFerramentasTrabalho(nichoId);

  const custoMensalFerramentas = calcularCustoMensalFerramentas(ferramentas);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-lg skeleton-pulse bg-muted" />
          ))}
        </div>
        <div className="h-48 rounded-lg skeleton-pulse bg-muted" />
        <div className="h-96 rounded-lg skeleton-pulse bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  const { clientes, totais } = data;

  // Filtrar apenas clientes com domínios ou com valor de contrato
  const clientesComDados = clientes.filter(
    (c) => c.dominios.length > 0 || c.valor_contrato
  );

  // Ordenar por custo mensal (maior primeiro)
  const clientesOrdenados = [...clientesComDados].sort(
    (a, b) => b.custo_mensal - a.custo_mensal
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // RECEITA: soma dos contratos mensais de clientes com valor fixo
  const receita = clientes
    .filter(c => c.modelo_pagamento === 'valor_fixo' && c.valor_contrato)
    .reduce((acc, c) => acc + (c.valor_contrato || 0), 0);

  // CUSTOS: ferramentas de trabalho + custos dos clientes (domínios, assinaturas)
  const custoClientes = totais.custo_mensal_total;
  const custoFerramentas = custoMensalFerramentas;
  const custoTotal = custoClientes + custoFerramentas;
  
  // SOBRA: Receita - Custos
  const sobra = receita - custoTotal;

  return (
    <div className="space-y-6">
      {/* Cards de Resumo - Simplificado */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* RECEITA - O que entra */}
        <Card className="border-emerald-500/30 bg-emerald-500/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              <span className="text-sm font-medium text-emerald-300">Receita Mensal</span>
            </div>
            <p className="text-3xl font-bold text-emerald-400">
              {formatCurrency(receita)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              O que entra dos clientes
            </p>
          </CardContent>
        </Card>

        {/* CUSTOS - O que sai */}
        <Card className="border-red-500/30 bg-red-500/10">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <TrendingDown className="h-5 w-5 text-red-400" />
              <span className="text-sm font-medium text-red-300">Custos Mensais</span>
            </div>
            <p className="text-3xl font-bold text-red-400">
              {formatCurrency(custoTotal)}
            </p>
            <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
              <p>Ferramentas: {formatCurrency(custoFerramentas)}</p>
              <p>Clientes: {formatCurrency(custoClientes)}</p>
            </div>
          </CardContent>
        </Card>

        {/* SOBRA - O que fica */}
        <Card className={`border-${sobra >= 0 ? 'cyan' : 'orange'}-500/30 bg-${sobra >= 0 ? 'cyan' : 'orange'}-500/10`}>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className={`h-5 w-5 ${sobra >= 0 ? 'text-cyan-400' : 'text-orange-400'}`} />
              <span className={`text-sm font-medium ${sobra >= 0 ? 'text-cyan-300' : 'text-orange-300'}`}>
                {sobra >= 0 ? 'Sobra' : 'Falta'}
              </span>
            </div>
            <p className={`text-3xl font-bold ${sobra >= 0 ? 'text-cyan-400' : 'text-orange-400'}`}>
              {formatCurrency(Math.abs(sobra))}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sobra >= 0 ? 'Lucro líquido mensal' : 'Prejuízo mensal'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Ferramentas de Trabalho */}
      <FerramentaTrabalhoTable
        nichoId={nichoId}
        ferramentas={ferramentas}
        isLoading={ferramentasLoading}
      />

      {/* Tabela de Custos por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Clientes e Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientesOrdenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/30 mb-4">
                <Globe className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Nenhum custo cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Adicione domínios nos clientes para ver o resumo aqui
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Contrato</TableHead>
                    <TableHead className="text-right">Custos</TableHead>
                    <TableHead className="text-right">Faturamento</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesOrdenados.map((cliente) => (
                    <TableRow key={cliente.cliente_id}>
                      <TableCell className="font-medium">
                        {cliente.cliente_nome}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            cliente.cliente_status === "rodando"
                              ? "border-emerald-500/50 text-emerald-400"
                              : cliente.cliente_status === "pausado"
                              ? "border-amber-500/50 text-amber-400"
                              : "border-muted-foreground/50"
                          }
                        >
                          {cliente.cliente_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.modelo_pagamento === "porcentagem" ? (
                          <div className="flex flex-col items-end">
                            <span>{cliente.valor_contrato}%</span>
                            {cliente.ticket_valor && (
                              <span className="text-xs text-muted-foreground">
                                Ticket: {formatCurrency(cliente.ticket_valor)}
                              </span>
                            )}
                          </div>
                        ) : cliente.valor_contrato ? (
                          formatCurrency(cliente.valor_contrato)
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell className="text-right text-amber-400">
                        {cliente.custo_mensal > 0
                          ? formatCurrency(cliente.custo_mensal)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.modelo_pagamento === "valor_fixo" && cliente.valor_contrato ? (
                          <span className="text-teal-400 font-medium">
                            {formatCurrency(cliente.valor_contrato)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
