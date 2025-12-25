import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Plus, Archive, Eye, AlertCircle } from "lucide-react";
import { RadarItemCard } from "./RadarItemCard";
import { RadarItemForm } from "./RadarItemForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RadarItem {
  id: string;
  nicho_id: string;
  tema: string;
  plataforma: string;
  status_termico: string;
  data_validade: string | null;
  observacao: string | null;
  arquivado: boolean;
  created_at: string;
  updated_at: string;
}

interface RadarOportunidadesTabProps {
  nichoId: string;
}

const MAX_ITEMS = 10;

export function RadarOportunidadesTab({ nichoId }: RadarOportunidadesTabProps) {
  const [items, setItems] = useState<RadarItem[]>([]);
  const [archivedItems, setArchivedItems] = useState<RadarItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RadarItem | null>(null);
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [nichoId]);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const [activeRes, archivedRes] = await Promise.all([
        supabase
          .from("radar_oportunidades")
          .select("*")
          .eq("nicho_id", nichoId)
          .eq("arquivado", false)
          .order("created_at", { ascending: false }),
        supabase
          .from("radar_oportunidades")
          .select("*")
          .eq("nicho_id", nichoId)
          .eq("arquivado", true)
          .order("updated_at", { ascending: false })
          .limit(20)
      ]);

      if (activeRes.error) throw activeRes.error;
      if (archivedRes.error) throw archivedRes.error;

      setItems(activeRes.data || []);
      setArchivedItems(archivedRes.data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar radar: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (item: RadarItem, newStatus: "quente" | "morno" | "morto") => {
    // Optimistic update
    setItems(prev => prev.map(i => 
      i.id === item.id ? { ...i, status_termico: newStatus } : i
    ));

    try {
      const { error } = await supabase
        .from("radar_oportunidades")
        .update({ status_termico: newStatus })
        .eq("id", item.id);

      if (error) throw error;
    } catch (error: any) {
      // Rollback
      setItems(prev => prev.map(i => 
        i.id === item.id ? { ...i, status_termico: item.status_termico } : i
      ));
      toast.error("Erro ao atualizar status");
    }
  };

  const handleArchive = async (item: RadarItem) => {
    // Optimistic update
    setItems(prev => prev.filter(i => i.id !== item.id));
    setArchivedItems(prev => [{ ...item, arquivado: true }, ...prev]);

    try {
      const { error } = await supabase
        .from("radar_oportunidades")
        .update({ arquivado: true })
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Item arquivado");
    } catch (error: any) {
      // Rollback
      setItems(prev => [...prev, item]);
      setArchivedItems(prev => prev.filter(i => i.id !== item.id));
      toast.error("Erro ao arquivar");
    }
  };

  const handleRestore = async (item: RadarItem) => {
    if (items.length >= MAX_ITEMS) {
      toast.error("Radar cheio — arquive itens antes de restaurar");
      return;
    }

    // Optimistic update
    setArchivedItems(prev => prev.filter(i => i.id !== item.id));
    setItems(prev => [{ ...item, arquivado: false }, ...prev]);

    try {
      const { error } = await supabase
        .from("radar_oportunidades")
        .update({ arquivado: false })
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Item restaurado");
    } catch (error: any) {
      // Rollback
      setArchivedItems(prev => [item, ...prev]);
      setItems(prev => prev.filter(i => i.id !== item.id));
      toast.error("Erro ao restaurar");
    }
  };

  const handleDelete = async (item: RadarItem) => {
    const prevItems = items;
    const prevArchived = archivedItems;
    
    setItems(prev => prev.filter(i => i.id !== item.id));
    setArchivedItems(prev => prev.filter(i => i.id !== item.id));

    try {
      const { error } = await supabase
        .from("radar_oportunidades")
        .delete()
        .eq("id", item.id);

      if (error) throw error;
      toast.success("Item removido");
    } catch (error: any) {
      setItems(prevItems);
      setArchivedItems(prevArchived);
      toast.error("Erro ao remover");
    }
  };

  const handleEdit = (item: RadarItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const isExpired = (dateStr: string | null) => {
    if (!dateStr) return false;
    return new Date(dateStr) < new Date(new Date().toDateString());
  };

  const radarCheio = items.length >= MAX_ITEMS;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-3xl">📡</div>
          <div>
            <h2 className="text-xl font-semibold">Radar de Oportunidades</h2>
            <p className="text-sm text-muted-foreground">
              Sensação térmica do mercado • {items.length}/{MAX_ITEMS} itens
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setArchiveModalOpen(true)}
            className="text-muted-foreground"
          >
            <Archive className="h-4 w-4 mr-1" />
            Arquivo ({archivedItems.length})
          </Button>
          <Button 
            onClick={handleNewItem} 
            size="sm"
            disabled={radarCheio}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo
          </Button>
        </div>
      </div>

      {/* Alert when full */}
      {radarCheio && (
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertDescription className="text-amber-200">
            Radar cheio — decida antes de adicionar
          </AlertDescription>
        </Alert>
      )}

      {/* Items List */}
      <Card className="bg-card/50 border-border/50">
        <CardContent className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 rounded-lg bg-muted/30 animate-pulse" />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="text-5xl mb-3 opacity-50">📡</div>
              <p className="font-medium">Radar vazio</p>
              <p className="text-sm">Adicione oportunidades para monitorar o mercado</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <RadarItemCard
                  key={item.id}
                  item={item}
                  expired={isExpired(item.data_validade)}
                  onStatusChange={(status) => handleStatusChange(item, status)}
                  onEdit={() => handleEdit(item)}
                  onArchive={() => handleArchive(item)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Modal */}
      <RadarItemForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        item={editingItem}
        onSuccess={fetchItems}
      />

      {/* Archive Modal */}
      <Dialog open={archiveModalOpen} onOpenChange={setArchiveModalOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Arquivo Frio (Cemitério)
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto space-y-3 py-2">
            {archivedItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum item arquivado</p>
              </div>
            ) : (
              archivedItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/30"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl opacity-50">
                      {item.status_termico === "quente" ? "🟢" : item.status_termico === "morno" ? "🟡" : "🔴"}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium truncate text-muted-foreground">{item.tema}</p>
                      <p className="text-xs text-muted-foreground/70">{item.plataforma}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRestore(item)}
                      disabled={items.length >= MAX_ITEMS}
                    >
                      Restaurar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(item)}
                      className="text-destructive hover:text-destructive"
                    >
                      Excluir
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
