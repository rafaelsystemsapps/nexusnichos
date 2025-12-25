import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  GripVertical,
  LayoutDashboard,
  Share2,
  CalendarCheck,
  Users,
  DollarSign,
  Package,
  Radio,
  Archive,
  Network,
  FlaskConical,
  Lightbulb,
  Settings,
  Move,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AbaItem {
  id: string;
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  enabled: boolean;
  fixed?: boolean;
}

interface OrdemAbasEditorProps {
  nichoId: string;
  nicho: {
    ordem_abas?: string[] | null;
    contas_habilitado?: boolean;
    time_habilitado?: boolean;
    financeiro_habilitado?: boolean;
    pedidos_habilitado?: boolean;
    radar_habilitado?: boolean;
    cemiterio_habilitado?: boolean;
    mapa_dependencia_habilitado?: boolean;
    teste_rapido_habilitado?: boolean;
    logs_aprendizado_habilitado?: boolean;
  };
  onConfigUpdate: () => void;
}

const DEFAULT_ORDER = [
  "dashboard",
  "contas",
  "logistica",
  "time",
  "financeiro",
  "pedidos",
  "radar",
  "cemiterio",
  "mapa",
  "testes",
  "aprendizado",
  "configuracoes",
];

const ABA_CONFIG: Record<string, { title: string; icon: React.ComponentType<{ className?: string }> }> = {
  dashboard: { title: "Dashboard", icon: LayoutDashboard },
  contas: { title: "Contas", icon: Share2 },
  logistica: { title: "Logística", icon: CalendarCheck },
  time: { title: "Time", icon: Users },
  financeiro: { title: "Financeiro", icon: DollarSign },
  pedidos: { title: "Pedidos", icon: Package },
  radar: { title: "Radar", icon: Radio },
  cemiterio: { title: "Cemitério", icon: Archive },
  mapa: { title: "Mapa", icon: Network },
  testes: { title: "Testes", icon: FlaskConical },
  aprendizado: { title: "Aprendizado", icon: Lightbulb },
  configuracoes: { title: "Configurações", icon: Settings },
};

function SortableAbaItem({ item }: { item: AbaItem }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, disabled: item.fixed });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border transition-all",
        isDragging && "shadow-lg bg-primary/5 border-primary/30 z-50",
        !item.enabled && "opacity-40",
        item.fixed 
          ? "bg-muted/20 border-border/20 cursor-not-allowed" 
          : "bg-surface/50 border-border/30 cursor-grab active:cursor-grabbing"
      )}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          "p-1 rounded hover:bg-muted/50 transition-colors",
          item.fixed && "invisible"
        )}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="p-1.5 rounded-md bg-muted/30">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <span className={cn("font-medium text-sm", !item.enabled && "text-muted-foreground")}>
        {item.title}
      </span>
      {item.fixed && (
        <span className="ml-auto text-xs text-muted-foreground">Fixo</span>
      )}
      {!item.enabled && !item.fixed && (
        <span className="ml-auto text-xs text-muted-foreground">Desativado</span>
      )}
    </div>
  );
}

export function OrdemAbasEditor({ nichoId, nicho, onConfigUpdate }: OrdemAbasEditorProps) {
  const [abas, setAbas] = useState<AbaItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    buildAbasList();
  }, [nicho]);

  const buildAbasList = () => {
    const order = nicho.ordem_abas || DEFAULT_ORDER;
    
    const enabledMap: Record<string, boolean> = {
      dashboard: true, // sempre habilitado
      contas: nicho.contas_habilitado !== false,
      logistica: true, // sempre habilitado
      time: nicho.time_habilitado !== false,
      financeiro: nicho.financeiro_habilitado === true,
      pedidos: nicho.pedidos_habilitado === true,
      radar: nicho.radar_habilitado === true,
      cemiterio: nicho.cemiterio_habilitado === true,
      mapa: nicho.mapa_dependencia_habilitado === true,
      testes: nicho.teste_rapido_habilitado === true,
      aprendizado: nicho.logs_aprendizado_habilitado === true,
      configuracoes: true, // sempre habilitado
    };

    const fixedItems = ["dashboard", "configuracoes"];

    // Garantir que todos os itens estejam na ordem
    const allIds = [...new Set([...order, ...DEFAULT_ORDER])];
    
    const items: AbaItem[] = allIds
      .filter(id => ABA_CONFIG[id])
      .map(id => ({
        id,
        title: ABA_CONFIG[id].title,
        icon: ABA_CONFIG[id].icon,
        enabled: enabledMap[id] ?? false,
        fixed: fixedItems.includes(id),
      }));

    setAbas(items);
    setHasChanges(false);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setAbas((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        
        // Não permitir mover para antes do dashboard ou depois de configurações
        const dashboardIndex = items.findIndex(i => i.id === "dashboard");
        const configIndex = items.findIndex(i => i.id === "configuracoes");
        
        if (newIndex <= dashboardIndex || newIndex >= configIndex) {
          return items;
        }

        const newItems = arrayMove(items, oldIndex, newIndex);
        setHasChanges(true);
        return newItems;
      });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const newOrder = abas.map(a => a.id);
      
      const { error } = await supabase
        .from("nichos")
        .update({ ordem_abas: newOrder })
        .eq("id", nichoId);

      if (error) throw error;

      toast.success("Ordem das abas salva!");
      setHasChanges(false);
      onConfigUpdate();
    } catch (error: any) {
      toast.error("Erro ao salvar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    const enabledMap: Record<string, boolean> = {
      dashboard: true,
      contas: nicho.contas_habilitado !== false,
      logistica: true,
      time: nicho.time_habilitado !== false,
      financeiro: nicho.financeiro_habilitado === true,
      pedidos: nicho.pedidos_habilitado === true,
      radar: nicho.radar_habilitado === true,
      cemiterio: nicho.cemiterio_habilitado === true,
      mapa: nicho.mapa_dependencia_habilitado === true,
      testes: nicho.teste_rapido_habilitado === true,
      aprendizado: nicho.logs_aprendizado_habilitado === true,
      configuracoes: true,
    };

    const fixedItems = ["dashboard", "configuracoes"];

    const items: AbaItem[] = DEFAULT_ORDER
      .filter(id => ABA_CONFIG[id])
      .map(id => ({
        id,
        title: ABA_CONFIG[id].title,
        icon: ABA_CONFIG[id].icon,
        enabled: enabledMap[id] ?? false,
        fixed: fixedItems.includes(id),
      }));

    setAbas(items);
    setHasChanges(true);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Move className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Ordem das Abas</CardTitle>
              <CardDescription>Arraste para reorganizar as abas do menu</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={saving}
            >
              Resetar
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving || !hasChanges}
            >
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={abas.map(a => a.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {abas.map((item) => (
                <SortableAbaItem key={item.id} item={item} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
        
        {hasChanges && (
          <p className="text-xs text-amber-500 mt-3">
            Você tem alterações não salvas
          </p>
        )}
      </CardContent>
    </Card>
  );
}
