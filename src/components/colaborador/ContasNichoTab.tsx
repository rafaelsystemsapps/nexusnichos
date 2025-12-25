import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Instagram, Youtube, Twitter, Music2, MessageCircle, MoreVertical, KeyRound, Eye, EyeOff, Copy, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ContasNichoTabProps {
  nichoId: string;
}

// Ícones por plataforma
const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  twitter: <Twitter className="h-4 w-4" />,
  tiktok: <Music2 className="h-4 w-4" />,
  facebook: <MessageCircle className="h-4 w-4" />,
  whatsapp: <MessageCircle className="h-4 w-4" />,
};

// Status minimalista: ativa, risco, desativada
type StatusConta = "ativa" | "risco" | "desativada";

const STATUS_CONFIG: Record<StatusConta, { label: string; className: string }> = {
  ativa: { 
    label: "Ativa", 
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
  },
  risco: { 
    label: "Risco", 
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30" 
  },
  desativada: { 
    label: "Desativada", 
    className: "bg-red-500/20 text-red-400 border-red-500/30" 
  },
};

// Mapeamento do enum antigo para o novo status minimalista
const mapStatusFromDB = (status: string): StatusConta => {
  if (status === "ativa") return "ativa";
  if (status === "pausada" || status === "limitada") return "risco";
  if (status === "banida") return "desativada";
  return "ativa";
};

// Mapeamento do status minimalista para o enum do banco
const mapStatusToDB = (status: StatusConta): string => {
  if (status === "ativa") return "ativa";
  if (status === "risco") return "limitada"; // limitada representa risco no DB
  if (status === "desativada") return "banida"; // banida representa desativada no DB
  return "ativa";
};

export function ContasNichoTab({ nichoId }: ContasNichoTabProps) {
  const { user } = useAuth();
  const [contas, setContas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConta, setEditingConta] = useState<any>(null);
  const [formData, setFormData] = useState({
    plataforma: "tiktok",
    nome_conta: "",
    status: "ativa" as StatusConta,
    ultima_acao: "",
    proxima_acao: "",
    login_email: "",
    senha_acesso: "",
    url_conta: "",
    gmail_email: "",
    gmail_senha: "",
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any>(null);
  const [credenciaisOpen, setCredenciaisOpen] = useState(false);
  
  // Modal de visualização de credenciais
  const [credenciaisModalOpen, setCredenciaisModalOpen] = useState(false);
  const [contaCredenciais, setContaCredenciais] = useState<any>(null);
  const [senhaVisivel, setSenhaVisivel] = useState(true);
  const [gmailSenhaVisivel, setGmailSenhaVisivel] = useState(true);

  useEffect(() => {
    fetchContas();
  }, [nichoId]);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validação: próxima ação obrigatória se status é risco ou desativada
    if ((formData.status === "risco" || formData.status === "desativada") && !formData.proxima_acao.trim()) {
      toast.error("Próxima ação é obrigatória para contas em risco ou desativadas");
      return;
    }

    try {
      const payload = {
        plataforma: formData.plataforma as any,
        nome_conta: formData.nome_conta,
        status: mapStatusToDB(formData.status) as any,
        ultima_acao: formData.ultima_acao || null,
        proxima_acao: formData.proxima_acao || null,
        login_email: formData.login_email || null,
        senha_acesso: formData.senha_acesso || null,
        url_conta: formData.url_conta || null,
        gmail_email: formData.gmail_email || null,
        gmail_senha: formData.gmail_senha || null,
        nicho_id: nichoId,
        responsavel_id: user?.id || null,
      };

      if (editingConta) {
        const { error } = await supabase
          .from("contas_redes_sociais")
          .update(payload)
          .eq("id", editingConta.id);

        if (error) throw error;
        toast.success("Conta atualizada!");
      } else {
        const { error } = await supabase.from("contas_redes_sociais").insert([payload]);

        if (error) throw error;
        toast.success("Conta adicionada!");
      }

      setDialogOpen(false);
      resetForm();
      fetchContas();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      plataforma: "tiktok",
      nome_conta: "",
      status: "ativa",
      ultima_acao: "",
      proxima_acao: "",
      login_email: "",
      senha_acesso: "",
      url_conta: "",
      gmail_email: "",
      gmail_senha: "",
    });
    setEditingConta(null);
    setCredenciaisOpen(false);
  };

  const openEditDialog = (conta: any) => {
    setEditingConta(conta);
    setFormData({
      plataforma: conta.plataforma,
      nome_conta: conta.nome_conta,
      status: mapStatusFromDB(conta.status),
      ultima_acao: conta.ultima_acao || "",
      proxima_acao: conta.proxima_acao || "",
      login_email: conta.login_email || "",
      senha_acesso: conta.senha_acesso || "",
      url_conta: conta.url_conta || "",
      gmail_email: conta.gmail_email || "",
      gmail_senha: conta.gmail_senha || "",
    });
    // Abrir seção de credenciais se já existem dados
    setCredenciaisOpen(!!(conta.login_email || conta.senha_acesso || conta.url_conta || conta.gmail_email || conta.gmail_senha));
    setDialogOpen(true);
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

  const openCredenciaisModal = (conta: any) => {
    setContaCredenciais(conta);
    setSenhaVisivel(true);
    setGmailSenhaVisivel(true);
    setCredenciaisModalOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const hasCredenciais = (conta: any) => {
    return !!(conta.login_email || conta.senha_acesso || conta.url_conta || conta.gmail_email || conta.gmail_senha);
  };

  const getStatusDisplay = (dbStatus: string) => {
    const status = mapStatusFromDB(dbStatus);
    const config = STATUS_CONFIG[status];
    return (
      <span className={`text-xs font-medium px-2 py-1 rounded-md border w-[85px] text-center inline-block ${config.className}`}>
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
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Controle de Contas</h2>
          <p className="text-xs text-muted-foreground">Atenção rápida: alguma conta precisa de ação?</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={resetForm}>
              <Plus className="w-4 h-4 mr-1" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>
                {editingConta ? "Editar Conta" : "Nova Conta"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Plataforma *</Label>
                  <Select
                    value={formData.plataforma}
                    onValueChange={(value) => setFormData({ ...formData, plataforma: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tiktok">TikTok</SelectItem>
                      <SelectItem value="instagram">Instagram</SelectItem>
                      <SelectItem value="youtube">YouTube</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="twitter">Twitter/X</SelectItem>
                      <SelectItem value="outros">Outros</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Identificador *</Label>
                  <Input
                    className="h-9"
                    value={formData.nome_conta}
                    onChange={(e) => setFormData({ ...formData, nome_conta: e.target.value })}
                    placeholder="Nome interno"
                    required
                    maxLength={50}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData({ ...formData, status: value as StatusConta })}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ativa">🟢 Ativa</SelectItem>
                    <SelectItem value="risco">🟡 Risco</SelectItem>
                    <SelectItem value="desativada">🔴 Desativada</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Última ação feita</Label>
                <Input
                  className="h-9"
                  value={formData.ultima_acao}
                  onChange={(e) => setFormData({ ...formData, ultima_acao: e.target.value })}
                  placeholder="Ex: Postou 3 vídeos ontem"
                  maxLength={100}
                />
              </div>

              <div>
                <Label className="text-xs">
                  Próxima ação necessária
                  {(formData.status === "risco" || formData.status === "desativada") && (
                    <span className="text-destructive ml-1">*</span>
                  )}
                </Label>
                <Input
                  className="h-9"
                  value={formData.proxima_acao}
                  onChange={(e) => setFormData({ ...formData, proxima_acao: e.target.value })}
                  placeholder="Ex: Pausar 3 dias, mudar IP"
                  maxLength={100}
                  required={formData.status === "risco" || formData.status === "desativada"}
                />
              </div>

              {/* Seção colapsável de credenciais */}
              <Collapsible open={credenciaisOpen} onOpenChange={setCredenciaisOpen}>
                <CollapsibleTrigger asChild>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    className="w-full justify-between text-muted-foreground hover:text-foreground"
                  >
                    <span className="flex items-center gap-2">
                      <KeyRound className="h-3.5 w-3.5" />
                      Credenciais de acesso (opcional)
                    </span>
                    {credenciaisOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 pt-3">
                  <div>
                    <Label className="text-xs">Login / Email</Label>
                    <Input
                      className="h-9"
                      value={formData.login_email}
                      onChange={(e) => setFormData({ ...formData, login_email: e.target.value })}
                      placeholder="Ex: email@gmail.com"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Senha</Label>
                    <Input
                      className="h-9"
                      type="text"
                      value={formData.senha_acesso}
                      onChange={(e) => setFormData({ ...formData, senha_acesso: e.target.value })}
                      placeholder="Senha da conta"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">URL de acesso</Label>
                    <Input
                      className="h-9"
                      value={formData.url_conta}
                      onChange={(e) => setFormData({ ...formData, url_conta: e.target.value })}
                      placeholder="https://..."
                      maxLength={200}
                    />
                  </div>

                  {/* Separador visual para Gmail */}
                  <div className="border-t border-border/50 pt-3 mt-2">
                    <span className="text-xs text-muted-foreground">Gmail vinculado (opcional)</span>
                  </div>

                  <div>
                    <Label className="text-xs">Email do Gmail</Label>
                    <Input
                      className="h-9"
                      value={formData.gmail_email}
                      onChange={(e) => setFormData({ ...formData, gmail_email: e.target.value })}
                      placeholder="Ex: conta@gmail.com"
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Senha do Gmail</Label>
                    <Input
                      className="h-9"
                      type="text"
                      value={formData.gmail_senha}
                      onChange={(e) => setFormData({ ...formData, gmail_senha: e.target.value })}
                      placeholder="Senha do Gmail"
                      maxLength={100}
                    />
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button type="submit" className="w-full" size="sm">
                {editingConta ? "Atualizar" : "Adicionar"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Lista minimalista */}
      {contas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          Nenhuma conta cadastrada.
        </div>
      ) : (
        <div className="border border-border/50 rounded-lg divide-y divide-border/50 bg-card/50">
          {contas.map((conta) => {
            const status = mapStatusFromDB(conta.status);
            const needsAction = status === "risco" || status === "desativada";
            
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
                  <div className="flex items-center">
                    <span className="font-medium text-sm truncate w-[130px] shrink-0">{conta.nome_conta}</span>
                    <div className="ml-2">
                      {getStatusDisplay(conta.status)}
                    </div>
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

                {/* Ações rápidas */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* Botão de credenciais */}
                  {hasCredenciais(conta) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openCredenciaisModal(conta)}
                      title="Ver credenciais"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                  )}

                  {/* Menu de ações */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem onClick={() => openEditDialog(conta)}>
                        <Pencil className="h-3.5 w-3.5 mr-2" />
                        Editar
                      </DropdownMenuItem>
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

      {/* Modal de Credenciais */}
      <Dialog open={credenciaisModalOpen} onOpenChange={setCredenciaisModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" />
              Acesso: {contaCredenciais?.nome_conta}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Login/Email */}
            {contaCredenciais?.login_email && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Login / Email</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                    {contaCredenciais.login_email}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.login_email, "Login")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Senha */}
            {contaCredenciais?.senha_acesso && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Senha</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                    {contaCredenciais.senha_acesso}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.senha_acesso, "Senha")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* Gmail vinculado */}
            {(contaCredenciais?.gmail_email || contaCredenciais?.gmail_senha) && (
              <>
                <div className="border-t border-border/30 pt-3">
                  <span className="text-xs text-muted-foreground font-medium">Gmail vinculado</span>
                </div>

                {contaCredenciais?.gmail_email && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Email Gmail</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                        {contaCredenciais.gmail_email}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-9 w-9"
                        onClick={() => copyToClipboard(contaCredenciais.gmail_email, "Email Gmail")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}

                {contaCredenciais?.gmail_senha && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Senha Gmail</Label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                        {contaCredenciais.gmail_senha}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="shrink-0 h-9 w-9"
                        onClick={() => copyToClipboard(contaCredenciais.gmail_senha, "Senha Gmail")}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* URL de acesso */}
            {contaCredenciais?.url_conta && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">URL de Acesso</Label>
                <div className="flex items-center gap-2">
                  <a 
                    href={contaCredenciais.url_conta}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm truncate hover:bg-muted/70 transition-colors"
                  >
                    {contaCredenciais.url_conta}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.url_conta, "URL")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
