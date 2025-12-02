import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConteudoFluxoModalProps {
  conteudo: any;
  open: boolean;
  onClose: () => void;
}

interface Subtarefa {
  id: string;
  tipo: string;
  titulo: string;
  concluida: boolean;
  observacoes: string | null;
}

const tiposSubtarefa = [
  { value: "copy", label: "Copy" },
  { value: "edicao", label: "Edição" },
  { value: "design", label: "Design" },
  { value: "postagem", label: "Postagem" },
  { value: "outro", label: "Outro" },
];

export function ConteudoFluxoModal({ conteudo, open, onClose }: ConteudoFluxoModalProps) {
  const [subtarefas, setSubtarefas] = useState<Subtarefa[]>([]);
  const [loading, setLoading] = useState(true);
  const [newSubtarefa, setNewSubtarefa] = useState({ tipo: "copy", titulo: "" });

  useEffect(() => {
    if (open && conteudo) {
      fetchSubtarefas();
    }
  }, [open, conteudo]);

  const fetchSubtarefas = async () => {
    try {
      const { data, error } = await supabase
        .from("subtarefas_conteudo")
        .select("*")
        .eq("conteudo_id", conteudo.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setSubtarefas(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar subtarefas");
    } finally {
      setLoading(false);
    }
  };

  const addSubtarefa = async () => {
    if (!newSubtarefa.titulo.trim()) {
      toast.error("Digite um título para a subtarefa");
      return;
    }

    try {
      const { error } = await supabase.from("subtarefas_conteudo").insert([{
        conteudo_id: conteudo.id,
        tipo: newSubtarefa.tipo,
        titulo: newSubtarefa.titulo,
        concluida: false,
      }]);

      if (error) throw error;
      toast.success("Subtarefa adicionada!");
      setNewSubtarefa({ tipo: "copy", titulo: "" });
      fetchSubtarefas();
    } catch (error: any) {
      toast.error("Erro ao adicionar: " + error.message);
    }
  };

  const toggleSubtarefa = async (subtarefa: Subtarefa) => {
    try {
      const { error } = await supabase
        .from("subtarefas_conteudo")
        .update({ concluida: !subtarefa.concluida })
        .eq("id", subtarefa.id);

      if (error) throw error;
      fetchSubtarefas();
    } catch (error: any) {
      toast.error("Erro ao atualizar");
    }
  };

  const deleteSubtarefa = async (id: string) => {
    try {
      const { error } = await supabase
        .from("subtarefas_conteudo")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Subtarefa removida!");
      fetchSubtarefas();
    } catch (error: any) {
      toast.error("Erro ao remover");
    }
  };

  const updateObservacoes = async (id: string, observacoes: string) => {
    try {
      const { error } = await supabase
        .from("subtarefas_conteudo")
        .update({ observacoes })
        .eq("id", id);

      if (error) throw error;
    } catch (error: any) {
      toast.error("Erro ao salvar observação");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      planejado: "secondary",
      em_producao: "default",
      publicado: "outline",
    };

    return (
      <Badge variant={variants[status] || "default"} className="capitalize">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const colors: Record<string, string> = {
      copy: "bg-blue-500/10 text-blue-500",
      edicao: "bg-purple-500/10 text-purple-500",
      design: "bg-pink-500/10 text-pink-500",
      postagem: "bg-green-500/10 text-green-500",
      outro: "bg-gray-500/10 text-gray-500",
    };

    return (
      <span className={`px-2 py-0.5 rounded text-xs font-medium ${colors[tipo] || ""}`}>
        {tiposSubtarefa.find((t) => t.value === tipo)?.label || tipo}
      </span>
    );
  };

  const completedCount = subtarefas.filter((s) => s.concluida).length;
  const totalCount = subtarefas.length;

  if (!conteudo) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span>{conteudo.titulo}</span>
            {getStatusBadge(conteudo.status)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info do Conteúdo */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Data:</span>{" "}
              <span className="font-medium">
                {format(new Date(conteudo.data_postagem), "dd/MM/yyyy", { locale: ptBR })}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Plataforma:</span>{" "}
              <span className="font-medium capitalize">{conteudo.canal}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Tipo:</span>{" "}
              <span className="font-medium capitalize">{conteudo.tipo_midia}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Responsável:</span>{" "}
              <span className="font-medium">{conteudo.profiles?.nome || "-"}</span>
            </div>
          </div>

          {conteudo.descricao && (
            <div>
              <Label className="text-muted-foreground">Descrição</Label>
              <p className="text-sm mt-1">{conteudo.descricao}</p>
            </div>
          )}

          {/* Subtarefas */}
          <div className="border-t border-border/50 pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">
                Fluxo de Produção
                {totalCount > 0 && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    ({completedCount}/{totalCount})
                  </span>
                )}
              </h3>
            </div>

            {/* Add new subtarefa */}
            <div className="flex gap-2 mb-4">
              <Select
                value={newSubtarefa.tipo}
                onValueChange={(value) => setNewSubtarefa({ ...newSubtarefa, tipo: value })}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposSubtarefa.map((tipo) => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder="Título da subtarefa..."
                value={newSubtarefa.titulo}
                onChange={(e) => setNewSubtarefa({ ...newSubtarefa, titulo: e.target.value })}
                className="flex-1"
                onKeyDown={(e) => e.key === "Enter" && addSubtarefa()}
              />
              <Button onClick={addSubtarefa} size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Lista de subtarefas */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : subtarefas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma subtarefa. Adicione acima.
              </p>
            ) : (
              <div className="space-y-3">
                {subtarefas.map((subtarefa) => (
                  <div
                    key={subtarefa.id}
                    className={`p-3 rounded-lg border transition-all ${
                      subtarefa.concluida
                        ? "bg-green-500/5 border-green-500/20"
                        : "bg-surface border-border/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={subtarefa.concluida}
                        onCheckedChange={() => toggleSubtarefa(subtarefa)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getTipoBadge(subtarefa.tipo)}
                          <span className={`text-sm font-medium ${subtarefa.concluida ? "line-through text-muted-foreground" : ""}`}>
                            {subtarefa.titulo}
                          </span>
                        </div>
                        <Textarea
                          placeholder="Observações..."
                          defaultValue={subtarefa.observacoes || ""}
                          onBlur={(e) => updateObservacoes(subtarefa.id, e.target.value)}
                          className="text-xs h-16 resize-none mt-2"
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive shrink-0"
                        onClick={() => deleteSubtarefa(subtarefa.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
