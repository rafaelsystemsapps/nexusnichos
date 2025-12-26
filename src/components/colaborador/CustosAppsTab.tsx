import { useAllClienteApps } from "@/hooks/queries/useAllClienteApps";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Package, Users } from "lucide-react";

interface CustosAppsTabProps {
  nichoId: string;
}

export function CustosAppsTab({ nichoId }: CustosAppsTabProps) {
  const { data, isLoading } = useAllClienteApps(nichoId);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-24 rounded-lg skeleton-pulse bg-muted" />
          ))}
        </div>
        <div className="h-96 rounded-lg skeleton-pulse bg-muted" />
      </div>
    );
  }

  if (!data) return null;

  const { clientes, totais } = data;

  // Filtrar apenas clientes com apps ou com valor de contrato
  const clientesComDados = clientes.filter(
    (c) => c.apps.length > 0 || c.valor_contrato
  );

  // Ordenar por margem (menor primeiro para destacar problemas)
  const clientesOrdenados = [...clientesComDados].sort(
    (a, b) => a.margem_bruta - b.margem_bruta
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Apps</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{totais.total_apps}</p>
          </CardContent>
        </Card>

        <Card className="border-purple-500/20 bg-purple-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-purple-400" />
              <span className="text-xs text-muted-foreground">Clientes c/ Apps</span>
            </div>
            <p className="text-2xl font-bold text-purple-400">{totais.clientes_com_apps}</p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-amber-400" />
              <span className="text-xs text-muted-foreground">Custo Mensal</span>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(totais.custo_mensal_total)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-orange-500/20 bg-orange-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-4 w-4 text-orange-400" />
              <span className="text-xs text-muted-foreground">Custo Estrutural</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">
              {formatCurrency(totais.custo_estrutural_total)}
            </p>
          </CardContent>
        </Card>

        <Card className={`border-${totais.margem_bruta_total >= 0 ? 'emerald' : 'red'}-500/20 bg-${totais.margem_bruta_total >= 0 ? 'emerald' : 'red'}-500/5`}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              {totais.margem_bruta_total >= 0 ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-400" />
              )}
              <span className="text-xs text-muted-foreground">Margem Total</span>
            </div>
            <p className={`text-2xl font-bold ${totais.margem_bruta_total >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {formatCurrency(totais.margem_bruta_total)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Custos por Cliente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Custos por Cliente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientesOrdenados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="p-4 rounded-full bg-muted/30 mb-4">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-1">Nenhum custo cadastrado</h3>
              <p className="text-sm text-muted-foreground">
                Adicione apps/custos nos clientes para ver o resumo aqui
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Apps</TableHead>
                    <TableHead className="text-right">Contrato</TableHead>
                    <TableHead className="text-right">Custo Mensal</TableHead>
                    <TableHead className="text-right">Estrutural</TableHead>
                    <TableHead className="text-right">Margem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientesOrdenados.map((cliente) => (
                    <TableRow key={cliente.cliente_id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {cliente.margem_bruta < 0 && (
                            <AlertTriangle className="h-4 w-4 text-red-400" />
                          )}
                          {cliente.cliente_nome}
                        </div>
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
                        <Badge variant="secondary">{cliente.apps.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.valor_contrato
                          ? formatCurrency(cliente.valor_contrato)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-amber-400">
                        {cliente.custo_mensal > 0
                          ? formatCurrency(cliente.custo_mensal)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right text-orange-400">
                        {cliente.custo_estrutural > 0
                          ? formatCurrency(cliente.custo_estrutural)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {cliente.modelo_pagamento === "valor_fixo" ? (
                          <span
                            className={
                              cliente.margem_bruta >= 0
                                ? "text-emerald-400 font-medium"
                                : "text-red-400 font-medium"
                            }
                          >
                            {cliente.margem_bruta >= 0 ? "+" : ""}
                            {formatCurrency(cliente.margem_bruta)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">%</span>
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
