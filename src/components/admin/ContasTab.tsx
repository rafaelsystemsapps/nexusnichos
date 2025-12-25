import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Instagram, Youtube, Twitter, Music2, MessageCircle, MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Ícones por plataforma
const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  tiktok: <Music2 className="h-4 w-4" />,
  facebook: <MessageCircle className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
};

// Status minimalista: ativa, risco, caída
type StatusConta = "ativa" | "risco" | "caida";

const STATUS_CONFIG: Record<StatusConta, { label: string; className: string }> = {
  ativa: { 
    label: "Ativa", 
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
  },
  risco: { 
    label: "Risco", 
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30" 
  },
  caida: { 
    label: "Caída", 
    className: "bg-red-500/20 text-red-400 border-red-500/30" 
  },
};

// Mapeamento do enum antigo para o novo status minimalista
const mapStatusFromDB = (status: string): StatusConta => {
  if (status === "ativa") return "ativa";
  if (status === "pausada" || status === "limitada") return "risco";
  if (status === "banida") return "caida";
  return "ativa";
};

export function ContasTab() {
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any>(null);

  useEffect(() => {
    fetchContas();
  }, []);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select(`
          *,
          nichos(nome)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!contaToDelete) return;
    
    try {
      const { error } = await supabase
        .from("contas_redes_sociais")
        .delete()
        .eq("id", contaToDelete.id);

      if (error) throw error;
      toast.success("Conta removida!");
      fetchContas();
    } catch (error: any) {
      toast.error("Erro ao remover: " + error.message);
    } finally {
      setDeleteDialogOpen(false);
      setContaToDelete(null);
    }
  };

  const openDeleteDialog = (conta: any) => {
    setContaToDelete(conta);
    setDeleteDialogOpen(true);
  };

  const getStatusDisplay = (dbStatus: string) => {
    const status = mapStatusFromDB(dbStatus);
    const config = STATUS_CONFIG[status];
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-md border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header minimalista */}
      <div>
        <h2 className="text-xl font-semibold">Todas as Contas</h2>
        <p className="text-xs text-muted-foreground">Visão geral de todas as contas de todos os nichos</p>
      </div>

      {/* Lista minimalista */}
      {contas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma conta encontrada.
        </div>
      ) : (
        <div className="border border-border/50 rounded-lg divide-y divide-border/50 bg-card/50">
          {contas.map((conta) => {
            const status = mapStatusFromDB(conta.status);
            const needsAction = status === "risco" || status === "caida";
            
            return (
              <div 
                key={conta.id} 
                className={`px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors ${
                  needsAction ? "bg-destructive/5" : ""
                }`}
              >
                {/* Ícone da plataforma */}
                <div className="pt-0.5 text-muted-foreground">
                  {plataformaIcons[conta.plataforma] || (
                    <span className="text-xs font-medium capitalize">{conta.plataforma?.[0]}</span>
                  )}
                </div>
                
                {/* Conteúdo principal */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm truncate">{conta.nome_conta}</span>
                    {getStatusDisplay(conta.status)}
                    {conta.nichos?.nome && (
                      <span className="text-xs text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                        {conta.nichos.nome}
                      </span>
                    )}
                  </div>
                  
                  {/* Última ação */}
                  {conta.ultima_acao && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <span className="opacity-60">Última:</span> {conta.ultima_acao}
                    </p>
                  )}
                  
                  {/* Próxima ação - destaque se necessário */}
                  {conta.proxima_acao && (
                    <p className={`text-xs mt-0.5 ${needsAction ? "text-amber-400 font-medium" : "text-muted-foreground"}`}>
                      <span className="opacity-60">Próxima:</span> {conta.proxima_acao}
                    </p>
                  )}
                </div>

                {/* Menu de ações */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={() => openDeleteDialog(conta)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2" />
                      Remover
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover conta?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{contaToDelete?.nome_conta}</strong>?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
