import { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Filter,
  Target,
} from "lucide-react";
import { ProspectCard } from "./ProspectCard";
import { ProspectForm } from "./ProspectForm";
import { useProspects, useInvalidateProspects } from "@/hooks/queries";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type StatusContato = "salvo" | "contatado" | "aceitou" | "nao_aceitou" | "sem_resposta";

interface Prospect {
  id: string;
  nome_display: string;
  origem: string;
  origem_url: string | null;
  metodo_contato: string;
  contato: string | null;
  status_contato: StatusContato;
  observacao: string | null;
  data_ultimo_contato: string | null;
  created_at: string;
}

interface ProspectsTabProps {
  nichoId: string;
}

const STATUS_ORDER: StatusContato[] = ["salvo", "contatado", "sem_resposta", "aceitou", "nao_aceitou"];

export function ProspectsTab({ nichoId }: ProspectsTabProps) {
  const { data: rawProspects = [], isLoading: loading } = useProspects(nichoId);
  const invalidateProspects = useInvalidateProspects(nichoId);
  const queryClient = useQueryClient();
  
  const prospects = rawProspects as Prospect[];
  
  const [formOpen, setFormOpen] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [filterOrigem, setFilterOrigem] = useState<string>("todos");
  
  // Convert dialog
  const [convertProspect, setConvertProspect] = useState<Prospect | null>(null);
  const [deleteProspectId, setDeleteProspectId] = useState<string | null>(null);

  // Sort by status order
  const sortedProspects = useMemo(() => {
    return [...prospects].sort((a, b) => {
      const aIndex = STATUS_ORDER.indexOf(a.status_contato);
      const bIndex = STATUS_ORDER.indexOf(b.status_contato);
      if (aIndex !== bIndex) return aIndex - bIndex;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [prospects]);

  const filteredProspects = useMemo(() => {
    return sortedProspects.filter((p) => {
      const matchSearch = p.nome_display.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = filterStatus === "todos" || p.status_contato === filterStatus;
      const matchOrigem = filterOrigem === "todos" || p.origem === filterOrigem;
      return matchSearch && matchStatus && matchOrigem;
    });
  }, [sortedProspects, searchTerm, filterStatus, filterOrigem]);

  // Stats
  const stats = useMemo(() => ({
    total: prospects.length,
    salvo: prospects.filter((p) => p.status_contato === "salvo").length,
    contatado: prospects.filter((p) => p.status_contato === "contatado").length,
    sem_resposta: prospects.filter((p) => p.status_contato === "sem_resposta").length,
    aceitou: prospects.filter((p) => p.status_contato === "aceitou").length,
    nao_aceitou: prospects.filter((p) => p.status_contato === "nao_aceitou").length,
  }), [prospects]);

  const handleStatusChange = async (id: string, newStatus: StatusContato) => {
    try {
      const updateData: any = {
        status_contato: newStatus,
      };
      
      if (newStatus === "contatado" || newStatus === "sem_resposta" || newStatus === "aceitou" || newStatus === "nao_aceitou") {
        updateData.data_ultimo_contato = new Date().toISOString();
      }

      // Optimistic update
      queryClient.setQueryData(["prospects", nichoId], (old: any[]) => 
        old?.map((p) => (p.id === id ? { ...p, ...updateData } : p)) || []
      );

      const { error } = await supabase
        .from("prospects")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;
      toast.success("Status atualizado!");
    } catch (error: any) {
      toast.error("Erro ao atualizar status: " + error.message);
      invalidateProspects();
    }
  };

  const handleDelete = async () => {
    if (!deleteProspectId) return;
    
    try {
      // Optimistic update
      queryClient.setQueryData(["prospects", nichoId], (old: any[]) => 
        old?.filter((p) => p.id !== deleteProspectId) || []
      );

      const { error } = await supabase
        .from("prospects")
        .delete()
        .eq("id", deleteProspectId);

      if (error) throw error;
      toast.success("Prospect removido!");
    } catch (error: any) {
      toast.error("Erro ao excluir: " + error.message);
      invalidateProspects();
    } finally {
      setDeleteProspectId(null);
    }
  };

  const handleConvert = async () => {
    if (!convertProspect) return;

    try {
      const clienteData: any = {
        nicho_id: nichoId,
        nome: convertProspect.nome_display,
        tipo: "influencer" as const,
        status: "rodando" as const,
        observacao_texto: convertProspect.observacao,
      };

      if (convertProspect.origem === "instagram" && convertProspect.origem_url) {
        clienteData.instagram_url = convertProspect.origem_url;
      } else if (convertProspect.origem === "tiktok" && convertProspect.origem_url) {
        clienteData.tiktok_url = convertProspect.origem_url;
      } else if (convertProspect.origem_url) {
        clienteData.link_principal = convertProspect.origem_url;
      }

      const { error: insertError } = await supabase
        .from("clientes")
        .insert(clienteData);

      if (insertError) throw insertError;

      const { error: deleteError } = await supabase
        .from("prospects")
        .delete()
        .eq("id", convertProspect.id);

      if (deleteError) throw deleteError;

      invalidateProspects();
      queryClient.invalidateQueries({ queryKey: ["clientes", nichoId] });
      toast.success("Prospect convertido em cliente!");
    } catch (error: any) {
      toast.error("Erro ao converter: " + error.message);
    } finally {
      setConvertProspect(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-20 rounded-lg skeleton-pulse bg-muted" />
          ))}
        </div>
        <div className="h-12 rounded-lg skeleton-pulse bg-muted" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-32 rounded-lg skeleton-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 tab-content">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="p-4 rounded-lg bg-card/50 border border-border/50">
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
          <p className="text-2xl font-bold text-yellow-500">{stats.salvo}</p>
          <p className="text-xs text-muted-foreground">Salvos</p>
        </div>
        <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-2xl font-bold text-blue-500">{stats.contatado}</p>
          <p className="text-xs text-muted-foreground">Contatados</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50 border border-muted">
          <p className="text-2xl font-bold text-muted-foreground">{stats.sem_resposta}</p>
          <p className="text-xs text-muted-foreground">Sem Resposta</p>
        </div>
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-2xl font-bold text-green-500">{stats.aceitou}</p>
          <p className="text-xs text-muted-foreground">Aceitaram</p>
        </div>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <p className="text-2xl font-bold text-red-500">{stats.nao_aceitou}</p>
          <p className="text-xs text-muted-foreground">Não Aceitaram</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar prospect..."
              className="pl-9 w-[200px]"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="salvo">Salvos</SelectItem>
              <SelectItem value="contatado">Contatados</SelectItem>
              <SelectItem value="sem_resposta">Sem Resposta</SelectItem>
              <SelectItem value="aceitou">Aceitaram</SelectItem>
              <SelectItem value="nao_aceitou">Não Aceitaram</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterOrigem} onValueChange={setFilterOrigem}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas</SelectItem>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="outro">Outro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => { setEditingProspect(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Prospect
        </Button>
      </div>

      {/* Lista de Prospects */}
      {filteredProspects.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/30 mb-4">
            <Target className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium mb-1">Nenhum prospect encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {searchTerm || filterStatus !== "todos" || filterOrigem !== "todos"
              ? "Tente ajustar os filtros"
              : "Comece adicionando seu primeiro prospect"}
          </p>
          {!searchTerm && filterStatus === "todos" && filterOrigem === "todos" && (
            <Button onClick={() => { setEditingProspect(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Prospect
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredProspects.map((prospect) => (
            <ProspectCard
              key={prospect.id}
              prospect={prospect}
              onStatusChange={handleStatusChange}
              onEdit={(p) => { setEditingProspect(p); setFormOpen(true); }}
              onDelete={(id) => setDeleteProspectId(id)}
              onConvert={(p) => setConvertProspect(p)}
            />
          ))}
        </div>
      )}

      {/* Form */}
      <ProspectForm
        open={formOpen}
        onOpenChange={setFormOpen}
        nichoId={nichoId}
        prospect={editingProspect}
        onSuccess={invalidateProspects}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteProspectId} onOpenChange={() => setDeleteProspectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Prospect?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O prospect será removido permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Convert Confirmation */}
      <AlertDialog open={!!convertProspect} onOpenChange={() => setConvertProspect(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Converter em Cliente?</AlertDialogTitle>
            <AlertDialogDescription>
              O prospect <strong>{convertProspect?.nome_display}</strong> será convertido em cliente.
              Os dados serão transferidos e o prospect será removido da lista.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConvert}>
              Converter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
