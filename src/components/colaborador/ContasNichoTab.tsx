import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Pencil, Trash2, Instagram, Youtube, Twitter, Music2, MessageCircle, MoreVertical, KeyRound, Copy, ChevronDown, ChevronUp, Phone, Send, Globe, GripVertical, Flame, Snowflake, Thermometer, CheckCircle2, Rocket, AlertTriangle, CalendarIcon, Pause, Power } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { DndContext, closestCenter, DragEndEvent, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";


interface ContasNichoTabProps {
  nichoId: string;
}

// Icones por plataforma
const plataformaIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  youtube: <Youtube className="h-4 w-4 text-red-500" />,
  twitter: <Twitter className="h-4 w-4 text-sky-400" />,
  tiktok: <Music2 className="h-4 w-4 text-cyan-400" />,
  facebook: <MessageCircle className="h-4 w-4 text-blue-500" />,
  whatsapp: <Phone className="h-4 w-4 text-green-500" />,
  telegram: <Send className="h-4 w-4 text-blue-400" />,
  site: <Globe className="h-4 w-4 text-purple-400" />,
};

const PLATAFORMAS = [
  { value: "todas", label: "Todas" },
  { value: "tiktok", label: "TikTok" },
  { value: "instagram", label: "Instagram" },
  { value: "youtube", label: "YouTube" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "telegram", label: "Telegram" },
  { value: "site", label: "Site" },
  { value: "facebook", label: "Facebook" },
  { value: "twitter", label: "Twitter/X" },
  { value: "outros", label: "Outros" },
];

// === PAÍSES ===
const PAISES = [
  { value: "BR", label: "Brasil", flag: "🇧🇷" },
  { value: "US", label: "Estados Unidos", flag: "🇺🇸" },
  { value: "PT", label: "Portugal", flag: "🇵🇹" },
  { value: "ES", label: "Espanha", flag: "🇪🇸" },
  { value: "MX", label: "México", flag: "🇲🇽" },
  { value: "AR", label: "Argentina", flag: "🇦🇷" },
  { value: "CO", label: "Colômbia", flag: "🇨🇴" },
  { value: "CL", label: "Chile", flag: "🇨🇱" },
  { value: "PE", label: "Peru", flag: "🇵🇪" },
  { value: "UK", label: "Reino Unido", flag: "🇬🇧" },
  { value: "DE", label: "Alemanha", flag: "🇩🇪" },
  { value: "FR", label: "França", flag: "🇫🇷" },
  { value: "IT", label: "Itália", flag: "🇮🇹" },
  { value: "outro", label: "Outro", flag: "🌍" },
];

const PAISES_FILTROS = [
  { value: "todos", label: "Todos países" },
  ...PAISES.map(p => ({ value: p.value, label: `${p.flag} ${p.label}` })),
];

const getPaisFlag = (pais: string | null): string => {
  const found = PAISES.find(p => p.value === pais);
  return found?.flag || "🌍";
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

const STATUS_FILTROS = [
  { value: "todas", label: "Todas" },
  { value: "ativa", label: "Ativas" },
  { value: "risco", label: "Risco" },
  { value: "desativada", label: "Desativadas" },
];

// === SISTEMA DE AQUECIMENTO CONTROLADO ===
type FaseAquecimento = "fria" | "aquecendo" | "pausado" | "aquecida";

// Planos de aquecimento disponíveis
const PLANOS_AQUECIMENTO = [
  { value: 3, label: "⚡ 3 dias (rápido)" },
  { value: 7, label: "⏱️ 7 dias (padrão)" },
  { value: 15, label: "🔥 15 dias (moderado)" },
  { value: 30, label: "💪 30 dias (completo)" },
];

const FASE_CONFIG: Record<FaseAquecimento, { 
  label: string; 
  icon: React.ReactNode; 
  className: string;
  shortLabel: string;
}> = {
  fria: { 
    label: "Fria", 
    shortLabel: "Fria",
    icon: <Snowflake className="h-3 w-3" />,
    className: "bg-sky-500/20 text-sky-400 border-sky-500/30" 
  },
  aquecendo: { 
    label: "Aquecendo", 
    shortLabel: "Aquec.",
    icon: <Flame className="h-3 w-3" />,
    className: "bg-orange-500/20 text-orange-400 border-orange-500/30" 
  },
  pausado: { 
    label: "Pausado", 
    shortLabel: "Pausado",
    icon: <Pause className="h-3 w-3" />,
    className: "bg-amber-500/20 text-amber-400 border-amber-500/30" 
  },
  aquecida: { 
    label: "Aquecida", 
    shortLabel: "Aquecida",
    icon: <CheckCircle2 className="h-3 w-3" />,
    className: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
  },
};

const FASE_FILTROS = [
  { value: "todas", label: "Todas fases" },
  { value: "fria", label: "❄️ Fria" },
  { value: "aquecendo", label: "🔥 Aquecendo" },
  { value: "pausado", label: "⏸️ Pausado" },
  { value: "aquecida", label: "✅ Aquecida" },
];

// Calcula a fase de aquecimento baseada no sistema controlado
const calcularFaseAquecimento = (conta: any): FaseAquecimento => {
  // Se não tem plano definido = Fria
  if (!conta.aquecimento_meta_dias) return 'fria';
  
  // Se toggle está DESATIVADO
  if (!conta.aquecimento_ativo) {
    // Se já tinha iniciado antes = Pausado
    if (conta.aquecimento_inicio) return 'pausado';
    return 'fria';
  }
  
  // Toggle ATIVO - calcular progresso
  if (!conta.aquecimento_inicio) return 'fria';
  
  const diasAquecendo = differenceInDays(new Date(), new Date(conta.aquecimento_inicio));
  
  if (diasAquecendo >= conta.aquecimento_meta_dias) {
    return 'aquecida'; // ✅ Completou!
  }
  
  return 'aquecendo'; // 🔥 Em progresso
};

// Calcula dias desde início do aquecimento
const calcularDiasAquecendo = (conta: any): { dias: number; meta: number } | null => {
  if (!conta.aquecimento_inicio || !conta.aquecimento_meta_dias) return null;
  const dias = differenceInDays(new Date(), new Date(conta.aquecimento_inicio));
  return { dias: Math.max(0, dias), meta: conta.aquecimento_meta_dias };
};

// Calcula progresso do aquecimento (0-100)
const calcularProgressoAquecimento = (conta: any): number => {
  const info = calcularDiasAquecendo(conta);
  if (!info) return 0;
  const progresso = (info.dias / info.meta) * 100;
  return Math.min(100, Math.max(0, progresso));
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

// Componente sortable para cada conta
interface SortableContaItemProps {
  conta: any;
  onEdit: (conta: any) => void;
  onDelete: (conta: any) => void;
  onCredenciais: (conta: any) => void;
  onToggleAquecimento: (conta: any) => void;
  hasCredenciais: (conta: any) => boolean;
  getStatusDisplay: (status: string) => React.ReactNode;
  getFaseDisplay: (conta: any) => React.ReactNode;
}

function SortableContaItem({ conta, onEdit, onDelete, onCredenciais, onToggleAquecimento, hasCredenciais, getStatusDisplay, getFaseDisplay }: SortableContaItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: conta.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const status = mapStatusFromDB(conta.status);
  const needsAction = status === "risco" || status === "desativada";
  const infoAquecimento = calcularDiasAquecendo(conta);
  const progressoAquecimento = calcularProgressoAquecimento(conta);
  const faseAquecimento = calcularFaseAquecimento(conta);

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors ${
        needsAction ? "bg-destructive/5" : ""
      }`}
    >
      {/* Handle de arrastar */}
      <div 
        {...attributes} 
        {...listeners}
        className="pt-1 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icone da plataforma */}
      <div className="pt-0.5 text-muted-foreground">
        {plataformaIcons[conta.plataforma] || (
          <span className="text-xs font-medium capitalize">{conta.plataforma?.[0]}</span>
        )}
      </div>
      
      {/* Conteudo principal */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center flex-wrap gap-1.5">
          <span className="font-medium text-sm truncate max-w-[120px] shrink-0">{conta.nome_conta}</span>
          {getStatusDisplay(conta.status)}
          {getFaseDisplay(conta)}
          <span className="text-sm" title={PAISES.find(p => p.value === conta.pais)?.label || conta.pais}>
            {getPaisFlag(conta.pais)}
          </span>
        </div>

        {/* Barra de progresso do aquecimento */}
        {infoAquecimento && (faseAquecimento === 'aquecendo' || faseAquecimento === 'pausado' || faseAquecimento === 'aquecida') && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className={faseAquecimento === 'aquecida' ? 'text-emerald-400' : faseAquecimento === 'aquecendo' ? 'text-orange-400' : 'text-amber-400'}>
                {faseAquecimento === 'aquecida' ? '✅' : faseAquecimento === 'aquecendo' ? '🔥' : '⏸️'} 
                {' '}{Math.min(infoAquecimento.dias, infoAquecimento.meta)}/{infoAquecimento.meta} dias
              </span>
              <span className="text-muted-foreground">{Math.round(progressoAquecimento)}%</span>
            </div>
            <Progress 
              value={progressoAquecimento} 
              className={cn(
                "h-1.5",
                faseAquecimento === 'aquecida' && "[&>div]:bg-emerald-500",
                faseAquecimento === 'aquecendo' && "[&>div]:bg-orange-500",
                faseAquecimento === 'pausado' && "[&>div]:bg-amber-500"
              )}
            />
          </div>
        )}

        {/* Aviso se não tem plano definido */}
        {!conta.aquecimento_meta_dias && (
          <p className="text-xs text-amber-400/70 mt-1">
            ⚠️ Definir plano de aquecimento
          </p>
        )}
        
        {/* Telefone para WhatsApp/Telegram */}
        {(conta.plataforma === "whatsapp" || conta.plataforma === "telegram") && conta.telefone && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="opacity-60">Tel:</span> {conta.telefone}
          </p>
        )}

        {/* PIN para Instagram */}
        {conta.plataforma === "instagram" && conta.pin && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="opacity-60">PIN:</span> ****
          </p>
        )}

        {/* URL para Sites */}
        {conta.plataforma === "site" && conta.url_site && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            <span className="opacity-60">URL:</span> {conta.url_site}
          </p>
        )}

        {/* Ultima acao */}
        {conta.ultima_acao && (
          <p className="text-xs text-muted-foreground mt-1">
            <span className="opacity-60">Ultima:</span> {conta.ultima_acao}
          </p>
        )}
        
        {/* Proxima acao - destaque se necessario */}
        {conta.proxima_acao && (
          <p className={`text-xs mt-0.5 ${needsAction ? "text-amber-400 font-medium" : "text-muted-foreground"}`}>
            <span className="opacity-60">Proxima:</span> {conta.proxima_acao}
          </p>
        )}
      </div>

      {/* Acoes rapidas */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Toggle de aquecimento - só mostra se tem plano definido */}
        {conta.aquecimento_meta_dias && faseAquecimento !== 'aquecida' && (
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8",
              conta.aquecimento_ativo ? "text-orange-400 hover:text-orange-300" : "text-muted-foreground"
            )}
            onClick={() => onToggleAquecimento(conta)}
            title={conta.aquecimento_ativo ? "Pausar aquecimento" : "Iniciar aquecimento"}
          >
            {conta.aquecimento_ativo ? <Flame className="h-4 w-4" /> : <Power className="h-4 w-4" />}
          </Button>
        )}

        {/* Botao de credenciais */}
        {hasCredenciais(conta) && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => onCredenciais(conta)}
            title="Ver credenciais"
          >
            <KeyRound className="h-4 w-4" />
          </Button>
        )}

        {/* Menu de acoes */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={() => onEdit(conta)}>
              <Pencil className="h-3.5 w-3.5 mr-2" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(conta)}
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
}

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
    telefone: "",
    url_site: "",
    pin: "",
    data_criacao_conta: "",
    pais: "BR",
    aquecimento_meta_dias: null as number | null,
    aquecimento_ativo: false,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<any>(null);
  const [credenciaisOpen, setCredenciaisOpen] = useState(false);
  
  // Modal de visualizacao de credenciais
  const [credenciaisModalOpen, setCredenciaisModalOpen] = useState(false);
  const [contaCredenciais, setContaCredenciais] = useState<any>(null);

  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<string>("todas");
  const [filtroPlataforma, setFiltroPlataforma] = useState<string>("todas");
  const [filtroFase, setFiltroFase] = useState<string>("todas");
  const [filtroPais, setFiltroPais] = useState<string>("todos");

  // Sensor para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    fetchContas();
  }, [nichoId]);

  const fetchContas = async () => {
    try {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("ordem", { ascending: true });

      if (error) throw error;
      setContas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar contas");
    } finally {
      setLoading(false);
    }
  };

  // Filtrar contas
  const contasFiltradas = useMemo(() => {
    return contas.filter(conta => {
      const statusConta = mapStatusFromDB(conta.status);
      const faseConta = calcularFaseAquecimento(conta);
      const matchStatus = filtroStatus === "todas" || statusConta === filtroStatus;
      const matchPlataforma = filtroPlataforma === "todas" || conta.plataforma === filtroPlataforma;
      const matchFase = filtroFase === "todas" || faseConta === filtroFase;
      const matchPais = filtroPais === "todos" || conta.pais === filtroPais;
      return matchStatus && matchPlataforma && matchFase && matchPais;
    });
  }, [contas, filtroStatus, filtroPlataforma, filtroFase, filtroPais]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = contas.findIndex(c => c.id === active.id);
    const newIndex = contas.findIndex(c => c.id === over.id);
    
    const newOrder = arrayMove(contas, oldIndex, newIndex);
    setContas(newOrder);

    // Atualizar ordem no banco em background
    const updates = newOrder.map((conta, index) => 
      supabase
        .from("contas_redes_sociais")
        .update({ ordem: index })
        .eq("id", conta.id)
    );
    
    try {
      await Promise.all(updates);
    } catch (error) {
      toast.error("Erro ao salvar ordem");
      fetchContas(); // Reverter em caso de erro
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validacao: proxima acao obrigatoria se status e risco ou desativada
    if ((formData.status === "risco" || formData.status === "desativada") && !formData.proxima_acao.trim()) {
      toast.error("Proxima acao e obrigatoria para contas em risco ou desativadas");
      return;
    }

    try {
      const payload: any = {
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
        telefone: formData.telefone || null,
        url_site: formData.url_site || null,
        pin: formData.pin || null,
        data_criacao_conta: formData.data_criacao_conta || null,
        pais: formData.pais || 'BR',
        aquecimento_meta_dias: formData.aquecimento_meta_dias || null,
        aquecimento_ativo: formData.aquecimento_ativo,
        // Se está ativando o aquecimento pela primeira vez, definir data de início
        aquecimento_inicio: formData.aquecimento_ativo && !editingConta?.aquecimento_inicio 
          ? format(new Date(), "yyyy-MM-dd") 
          : editingConta?.aquecimento_inicio || null,
        nicho_id: nichoId,
        responsavel_id: user?.id || null,
        ordem: editingConta ? editingConta.ordem : contas.length,
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
      telefone: "",
      url_site: "",
      pin: "",
      data_criacao_conta: "",
      pais: "BR",
      aquecimento_meta_dias: null,
      aquecimento_ativo: false,
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
      telefone: conta.telefone || "",
      url_site: conta.url_site || "",
      pin: conta.pin || "",
      data_criacao_conta: conta.data_criacao_conta || "",
      pais: conta.pais || "BR",
      aquecimento_meta_dias: conta.aquecimento_meta_dias || null,
      aquecimento_ativo: conta.aquecimento_ativo || false,
    });
    // Abrir secao de credenciais se ja existem dados
    setCredenciaisOpen(!!(conta.login_email || conta.senha_acesso || conta.url_conta || conta.gmail_email || conta.gmail_senha));
    setDialogOpen(true);
  };

  // Toggle rápido de aquecimento
  const handleToggleAquecimento = async (conta: any) => {
    const novoAtivo = !conta.aquecimento_ativo;
    
    try {
      const updateData: any = {
        aquecimento_ativo: novoAtivo,
      };
      
      // Se está ativando e não tem data de início, definir agora
      if (novoAtivo && !conta.aquecimento_inicio) {
        updateData.aquecimento_inicio = format(new Date(), "yyyy-MM-dd");
      }
      
      const { error } = await supabase
        .from("contas_redes_sociais")
        .update(updateData)
        .eq("id", conta.id);

      if (error) throw error;
      
      toast.success(novoAtivo ? "Aquecimento iniciado!" : "Aquecimento pausado!");
      fetchContas();
    } catch (error: any) {
      toast.error("Erro: " + error.message);
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

  const openCredenciaisModal = (conta: any) => {
    setContaCredenciais(conta);
    setCredenciaisModalOpen(true);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const hasCredenciais = (conta: any) => {
    return !!(conta.login_email || conta.senha_acesso || conta.url_conta || conta.gmail_email || conta.gmail_senha || conta.telefone || conta.url_site || conta.pin);
  };

  // Verifica se plataforma precisa de campos especificos
  const needsTelefone = formData.plataforma === "whatsapp" || formData.plataforma === "telegram";
  const needsUrlSite = formData.plataforma === "site";
  const needsPin = formData.plataforma === "instagram" || formData.plataforma === "whatsapp" || formData.plataforma === "telegram";
  // Credenciais normais: nao e WhatsApp ou Telegram (Instagram precisa de credenciais + PIN)
  const needsCredenciaisNormais = !needsTelefone && formData.plataforma !== "site";

  const getStatusDisplay = (dbStatus: string) => {
    const status = mapStatusFromDB(dbStatus);
    const config = STATUS_CONFIG[status];
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border text-center inline-block ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const getFaseDisplay = (conta: any) => {
    const fase = calcularFaseAquecimento(conta);
    const config = FASE_CONFIG[fase];
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-md border inline-flex items-center gap-1 ${config.className}`}>
        {config.icon}
        {config.shortLabel}
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
      {/* Header com filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-xl font-semibold">Controle de Contas</h2>
          <p className="text-xs text-muted-foreground">Arraste para reordenar. Filtre por status ou plataforma.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          {/* Filtro de Status */}
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="h-8 w-[110px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTROS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Plataforma */}
          <Select value={filtroPlataforma} onValueChange={setFiltroPlataforma}>
            <SelectTrigger className="h-8 w-[120px]">
              <SelectValue placeholder="Plataforma" />
            </SelectTrigger>
            <SelectContent>
              {PLATAFORMAS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de País */}
          <Select value={filtroPais} onValueChange={setFiltroPais}>
            <SelectTrigger className="h-8 w-[130px]">
              <SelectValue placeholder="País" />
            </SelectTrigger>
            <SelectContent>
              {PAISES_FILTROS.map(p => (
                <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

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
                        <SelectItem value="telegram">Telegram</SelectItem>
                        <SelectItem value="site">Site</SelectItem>
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
                  <Label className="text-xs">País *</Label>
                  <Select
                    value={formData.pais}
                    onValueChange={(value) => setFormData({ ...formData, pais: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAISES.map(p => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.flag} {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="risco">Risco</SelectItem>
                      <SelectItem value="desativada">Desativada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Ultima acao feita</Label>
                  <Input
                    className="h-9"
                    value={formData.ultima_acao}
                    onChange={(e) => setFormData({ ...formData, ultima_acao: e.target.value })}
                    placeholder="Ex: Postou 3 videos ontem"
                    maxLength={100}
                  />
                </div>

                <div>
                  <Label className="text-xs">
                    Proxima acao necessaria
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

                {/* Campo de Data de Criação da Conta */}
                <div>
                  <Label className="text-xs">Data de criação da conta</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-9 justify-start text-left font-normal",
                          !formData.data_criacao_conta && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.data_criacao_conta 
                          ? format(new Date(formData.data_criacao_conta), "dd/MM/yyyy", { locale: ptBR })
                          : <span>Selecione a data</span>
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.data_criacao_conta ? new Date(formData.data_criacao_conta) : undefined}
                        onSelect={(date) => setFormData({ 
                          ...formData, 
                          data_criacao_conta: date ? format(date, "yyyy-MM-dd") : "" 
                        })}
                        disabled={(date) => date > new Date()}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* === SEÇÃO DE AQUECIMENTO === */}
                <div className="border border-border/50 rounded-lg p-3 space-y-3 bg-muted/20">
                  <div className="flex items-center gap-2">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-medium">Aquecimento</span>
                  </div>
                  
                  {/* Seletor de plano */}
                  <div>
                    <Label className="text-xs">Plano de aquecimento</Label>
                    <Select
                      value={formData.aquecimento_meta_dias?.toString() || ""}
                      onValueChange={(value) => setFormData({ 
                        ...formData, 
                        aquecimento_meta_dias: value ? parseInt(value) : null 
                      })}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecione um plano" />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANOS_AQUECIMENTO.map(p => (
                          <SelectItem key={p.value} value={p.value.toString()}>
                            {p.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Toggle de aquecimento - só aparece se tem plano selecionado */}
                  {formData.aquecimento_meta_dias && (
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs">Aquecimento ativo</Label>
                        <p className="text-xs text-muted-foreground">
                          {formData.aquecimento_ativo 
                            ? "Contador em andamento" 
                            : "Ative para iniciar o contador"
                          }
                        </p>
                      </div>
                      <Switch
                        checked={formData.aquecimento_ativo}
                        onCheckedChange={(checked) => setFormData({ ...formData, aquecimento_ativo: checked })}
                      />
                    </div>
                  )}
                </div>

                {/* Campos especificos para WhatsApp/Telegram */}
                {needsTelefone && (
                  <div>
                    <Label className="text-xs">Numero de Telefone *</Label>
                    <Input
                      className="h-9"
                      value={formData.telefone}
                      onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                      placeholder="Ex: +55 11 99999-9999"
                      required
                      maxLength={20}
                    />
                  </div>
                )}

                {/* Campo especifico para Instagram - apenas PIN */}
                {needsPin && (
                  <div>
                    <Label className="text-xs">PIN de Seguranca</Label>
                    <Input
                      className="h-9"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                      placeholder="Ex: 1234"
                      maxLength={10}
                    />
                  </div>
                )}

                {/* Campo especifico para Sites */}
                {needsUrlSite && (
                  <div>
                    <Label className="text-xs">URL do Site *</Label>
                    <Input
                      className="h-9"
                      value={formData.url_site}
                      onChange={(e) => setFormData({ ...formData, url_site: e.target.value })}
                      placeholder="https://meusite.com.br"
                      required
                      maxLength={200}
                    />
                  </div>
                )}

                {/* Secao colapsavel de credenciais - apenas para plataformas que precisam */}
                {needsCredenciaisNormais && (
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

                      {/* Gmail - nao mostrar para Site */}
                      {!needsUrlSite && (
                        <>
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
                        </>
                      )}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                <Button type="submit" className="w-full" size="sm">
                  {editingConta ? "Atualizar" : "Adicionar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista com drag and drop */}
      {contasFiltradas.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {contas.length === 0 ? "Nenhuma conta cadastrada." : "Nenhuma conta encontrada com os filtros selecionados."}
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={contasFiltradas.map(c => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="border border-border/50 rounded-lg divide-y divide-border/50 bg-card/50">
              {contasFiltradas.map((conta) => (
                <SortableContaItem
                  key={conta.id}
                  conta={conta}
                  onEdit={openEditDialog}
                  onDelete={openDeleteDialog}
                  onCredenciais={openCredenciaisModal}
                  onToggleAquecimento={handleToggleAquecimento}
                  hasCredenciais={hasCredenciais}
                  getStatusDisplay={getStatusDisplay}
                  getFaseDisplay={getFaseDisplay}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
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

            {/* Telefone para WhatsApp/Telegram */}
            {contaCredenciais?.telefone && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Numero de Telefone</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                    {contaCredenciais.telefone}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.telefone, "Telefone")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* PIN para Instagram */}
            {contaCredenciais?.pin && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">PIN de Seguranca</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm font-mono">
                    {contaCredenciais.pin}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.pin, "PIN")}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}

            {/* URL do Site */}
            {contaCredenciais?.url_site && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">URL do Site</Label>
                <div className="flex items-center gap-2">
                  <a 
                    href={contaCredenciais.url_site}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-muted/50 border border-border/50 rounded-md px-3 py-2 text-sm truncate hover:bg-muted/70 transition-colors"
                  >
                    {contaCredenciais.url_site}
                  </a>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="shrink-0 h-9 w-9"
                    onClick={() => copyToClipboard(contaCredenciais.url_site, "URL do Site")}
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
