import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Check, X, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TesteRapidoForm } from "./TesteRapidoForm";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface TesteRapido {
  id: string;
  hipotese: string;
  plataforma: string;
  status: string;
  resultado_percebido: string | null;
  created_at: string;
}

interface TesteRapidoTabProps {
  nichoId: string;
}

export function TesteRapidoTab({ nichoId }: TesteRapidoTabProps) {
  const [testes, setTestes] = useState<TesteRapido[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [decidirOpen, setDecidirOpen] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchTestes = async () => {
    const { data, error } = await supabase
      .from("testes_rapidos")
      .select("*")
      .eq("nicho_id", nichoId)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Erro ao carregar testes",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setTestes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchTestes();
  }, [nichoId]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("testes_rapidos").delete().eq("id", id);
    if (error) {
      toast({
        title: "Erro ao excluir teste",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({ title: "Teste excluído" });
      fetchTestes();
    }
  };

  const testesEmTeste = testes.filter((t) => t.status === "em_teste");
  const testesDecididos = testes.filter((t) => t.status !== "em_teste");

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Testes Rápidos</h2>
          <p className="text-sm text-muted-foreground">"Isso merece continuar ou não?"</p>
        </div>
        <Button onClick={() => setFormOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Novo
        </Button>
      </div>

      {/* Aviso se muitos testes em aberto */}
      {testesEmTeste.length > 3 && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-600 text-sm">
            Você tem {testesEmTeste.length} testes em aberto. Decidir rápido é o objetivo.
          </AlertDescription>
        </Alert>
      )}

      {/* Em Teste */}
      {testesEmTeste.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Em Teste
          </h3>
          <div className="space-y-2">
            {testesEmTeste.map((teste) => (
              <Card key={teste.id} className="bg-card border-border">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      "{teste.hipotese}"
                    </p>
                    <p className="text-xs text-muted-foreground">{teste.plataforma}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDecidirOpen(teste.id)}
                  >
                    Decidir
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Decididos */}
      {testesDecididos.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
            Decididos
          </h3>
          <div className="space-y-2">
            {testesDecididos.map((teste) => (
              <Card key={teste.id} className="bg-card border-border">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      {teste.status === "funcionou" ? (
                        <Check className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          "{teste.hipotese}"
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {teste.plataforma} •{" "}
                          <span
                            className={
                              teste.status === "funcionou"
                                ? "text-green-600"
                                : "text-red-500"
                            }
                          >
                            {teste.status === "funcionou" ? "Funcionou" : "Não funcionou"}
                          </span>
                        </p>
                        {teste.resultado_percebido && (
                          <p className="text-xs text-muted-foreground italic mt-1">
                            "{teste.resultado_percebido}"
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      onClick={() => handleDelete(teste.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Estado vazio */}
      {testes.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-sm">Nenhum teste ainda.</p>
          <p className="text-muted-foreground text-xs mt-1">
            Crie um teste para validar uma hipótese rapidamente.
          </p>
        </div>
      )}

      {/* Modal criar */}
      <TesteRapidoForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSuccess={fetchTestes}
      />

      {/* Modal decidir */}
      {decidirOpen && (
        <TesteRapidoForm
          open={!!decidirOpen}
          onOpenChange={() => setDecidirOpen(null)}
          nichoId={nichoId}
          testeId={decidirOpen}
          onSuccess={fetchTestes}
          mode="decidir"
        />
      )}
    </div>
  );
}
