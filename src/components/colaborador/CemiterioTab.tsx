import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Archive, Plus } from "lucide-react";
import { toast } from "sonner";
import { CemiterioItemCard } from "./CemiterioItemCard";
import { CemiterioItemForm } from "./CemiterioItemForm";

interface CemiterioItem {
  id: string;
  nome: string;
  motivo: string;
  observacao: string | null;
  data_encerramento: string;
  created_at: string;
}

interface CemiterioTabProps {
  nichoId: string;
}

const MAX_ITEMS = 50;

export function CemiterioTab({ nichoId }: CemiterioTabProps) {
  const [itens, setItens] = useState<CemiterioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    fetchItens();
  }, [nichoId]);

  const fetchItens = async () => {
    try {
      // Busca contagem total primeiro
      const { count } = await supabase
        .from("cemiterio")
        .select("*", { count: "exact", head: true })
        .eq("nicho_id", nichoId);
      
      setTotalCount(count || 0);

      // Busca itens com limite
      const { data, error } = await supabase
        .from("cemiterio")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("data_encerramento", { ascending: false })
        .limit(MAX_ITEMS);

      if (error) throw error;
      setItens(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar itens: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("cemiterio")
        .delete()
        .eq("id", id);

      if (error) throw error;
      
      setItens(prev => prev.filter(item => item.id !== id));
      toast.success("Item removido do cemitério");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-lg bg-muted/20 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header discreto */}
      <Card className="bg-muted/10 border-border/20">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 opacity-70">
              <div className="p-2 rounded-lg bg-muted/30">
                <Archive className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-lg text-muted-foreground font-medium">
                  Cemitério
                </CardTitle>
                <CardDescription className="text-muted-foreground/60">
                  Registro de ativos encerrados
                </CardDescription>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setFormOpen(true)}
              className="opacity-40 hover:opacity-100 text-muted-foreground/50 hover:text-foreground transition-opacity"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Lista de itens */}
      {itens.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground/50">
          <Archive className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Nenhum item arquivado</p>
          <p className="text-xs mt-1 opacity-70">
            Itens encerrados aparecem aqui como registro histórico
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {itens.map(item => (
            <CemiterioItemCard
              key={item.id}
              item={item}
              onDelete={handleDelete}
            />
          ))}
          
          {/* Aviso discreto de limite */}
          {totalCount > MAX_ITEMS && (
            <p className="text-center text-xs text-muted-foreground/40 pt-4">
              Mostrando os {MAX_ITEMS} itens mais recentes
            </p>
          )}
        </div>
      )}

      {/* Formulário */}
      <CemiterioItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        onSuccess={fetchItens}
      />
    </div>
  );
}
