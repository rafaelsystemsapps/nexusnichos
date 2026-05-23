import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, CheckCircle2, Circle, Target, Lightbulb, Video } from "lucide-react";

interface PlanejamentoTabProps {
  nichoId: string;
}

interface Tarefa {
  id: string;
  texto: string;
  feita: boolean;
  criada: string;
}

interface Ideia {
  id: string;
  texto: string;
  criada: string;
}

const STORAGE_KEY_TAREFAS = (id: string) => `nexus_tarefas_${id}`;
const STORAGE_KEY_IDEIAS = (id: string) => `nexus_ideias_${id}`;
const STORAGE_KEY_META = (id: string) => `nexus_meta_videos_${id}`;
const STORAGE_KEY_VIDEOS_HOJE = (id: string) => `nexus_videos_hoje_${id}`;
const STORAGE_KEY_DATA = (id: string) => `nexus_data_hoje_${id}`;

function getHoje() {
  return new Date().toISOString().split("T")[0];
}

export function PlanejamentoTab({ nichoId }: PlanejamentoTabProps) {
  // Meta de vídeos
  const [metaVideos, setMetaVideos] = useState<number>(() => {
    const s = localStorage.getItem(STORAGE_KEY_META(nichoId));
    return s ? Number(s) : 3;
  });
  const [videosHoje, setVideosHoje] = useState<number>(() => {
    const dataGuardada = localStorage.getItem(STORAGE_KEY_DATA(nichoId));
    const hoje = getHoje();
    if (dataGuardada !== hoje) {
      localStorage.setItem(STORAGE_KEY_DATA(nichoId), hoje);
      localStorage.setItem(STORAGE_KEY_VIDEOS_HOJE(nichoId), "0");
      return 0;
    }
    return Number(localStorage.getItem(STORAGE_KEY_VIDEOS_HOJE(nichoId)) || "0");
  });

  // Tarefas
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_TAREFAS(nichoId));
    return s ? JSON.parse(s) : [];
  });
  const [novaTarefa, setNovaTarefa] = useState("");

  // Ideias
  const [ideias, setIdeias] = useState<Ideia[]>(() => {
    const s = localStorage.getItem(STORAGE_KEY_IDEIAS(nichoId));
    return s ? JSON.parse(s) : [];
  });
  const [novaIdeia, setNovaIdeia] = useState("");

  // Persistência
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_META(nichoId), String(metaVideos));
  }, [metaVideos, nichoId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VIDEOS_HOJE(nichoId), String(videosHoje));
  }, [videosHoje, nichoId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_TAREFAS(nichoId), JSON.stringify(tarefas));
  }, [tarefas, nichoId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_IDEIAS(nichoId), JSON.stringify(ideias));
  }, [ideias, nichoId]);

  const progresso = metaVideos > 0 ? Math.min((videosHoje / metaVideos) * 100, 100) : 0;

  const adicionarTarefa = () => {
    if (!novaTarefa.trim()) return;
    setTarefas([...tarefas, { id: Date.now().toString(), texto: novaTarefa.trim(), feita: false, criada: getHoje() }]);
    setNovaTarefa("");
  };

  const toggleTarefa = (id: string) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t));
  };

  const removerTarefa = (id: string) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

  const adicionarIdeia = () => {
    if (!novaIdeia.trim()) return;
    setIdeias([{ id: Date.now().toString(), texto: novaIdeia.trim(), criada: getHoje() }, ...ideias]);
    setNovaIdeia("");
  };

  const removerIdeia = (id: string) => {
    setIdeias(ideias.filter(i => i.id !== id));
  };

  const tarefasPendentes = tarefas.filter(t => !t.feita);
  const tarefasFeitas = tarefas.filter(t => t.feita);

  return (
    <div className="max-w-2xl mx-auto space-y-8 px-2 py-4">

      {/* BLOCO: VÍDEOS DO DIA */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Video className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm uppercase tracking-wide">Vídeos hoje</span>
        </div>

        {/* Progresso */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">{videosHoje} de {metaVideos} postados</span>
            <span className="font-mono font-bold">{Math.round(progresso)}%</span>
          </div>
          <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${progresso}%`,
                backgroundColor: progresso >= 100 ? "#22c55e" : progresso >= 50 ? "#f59e0b" : "#3b82f6"
              }}
            />
          </div>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setVideosHoje(Math.max(0, videosHoje - 1))}
            className="w-9 h-9 rounded border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
          >−</button>
          <span className="text-2xl font-bold w-8 text-center">{videosHoje}</span>
          <button
            onClick={() => setVideosHoje(videosHoje + 1)}
            className="w-9 h-9 rounded border border-border flex items-center justify-center text-lg font-bold hover:bg-muted transition-colors"
          >+</button>
          <span className="text-muted-foreground text-sm ml-2">Meta:</span>
          <input
            type="number"
            min={1}
            value={metaVideos}
            onChange={e => setMetaVideos(Math.max(1, Number(e.target.value)))}
            className="w-14 border border-border rounded px-2 py-1 text-sm text-center bg-background"
          />
          {videosHoje > 0 && (
            <button
              onClick={() => setVideosHoje(0)}
              className="ml-auto text-xs text-muted-foreground hover:text-foreground underline"
            >
              resetar
            </button>
          )}
        </div>
      </div>

      {/* BLOCO: TAREFAS */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm uppercase tracking-wide">Tarefas</span>
          {tarefasPendentes.length > 0 && (
            <span className="ml-auto text-xs text-muted-foreground">{tarefasPendentes.length} pendente{tarefasPendentes.length > 1 ? "s" : ""}</span>
          )}
        </div>

        {/* Input nova tarefa */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nova tarefa..."
            value={novaTarefa}
            onChange={e => setNovaTarefa(e.target.value)}
            onKeyDown={e => e.key === "Enter" && adicionarTarefa()}
            className="flex-1"
          />
          <Button size="sm" onClick={adicionarTarefa} variant="outline">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {/* Lista pendentes */}
        {tarefasPendentes.length === 0 && tarefasFeitas.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma tarefa ainda.</p>
        )}

        <div className="space-y-1">
          {tarefasPendentes.map(t => (
            <div key={t.id} className="flex items-center gap-2 py-1.5 group">
              <button onClick={() => toggleTarefa(t.id)} className="shrink-0 text-muted-foreground hover:text-foreground">
                <Circle className="h-4 w-4" />
              </button>
              <span className="flex-1 text-sm">{t.texto}</span>
              <button onClick={() => removerTarefa(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}

          {/* Feitas */}
          {tarefasFeitas.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border/50">
              {tarefasFeitas.map(t => (
                <div key={t.id} className="flex items-center gap-2 py-1.5 group opacity-50">
                  <button onClick={() => toggleTarefa(t.id)} className="shrink-0 text-green-500">
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                  <span className="flex-1 text-sm line-through">{t.texto}</span>
                  <button onClick={() => removerTarefa(t.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BLOCO: IDEIAS */}
      <div className="border border-border rounded-lg p-5 bg-card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm uppercase tracking-wide">Ideias</span>
        </div>

        <div className="flex gap-2 mb-4">
          <Textarea
            placeholder="Anota uma ideia aqui... (Enter para salvar)"
            value={novaIdeia}
            onChange={e => setNovaIdeia(e.target.value)}
            onKeyDown={e => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                adicionarIdeia();
              }
            }}
            className="flex-1 min-h-[60px] resize-none"
          />
          <Button size="sm" onClick={adicionarIdeia} variant="outline" className="self-start">
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        {ideias.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">Nenhuma ideia ainda.</p>
        )}

        <div className="space-y-2">
          {ideias.map(i => (
            <div key={i.id} className="flex items-start gap-2 py-2 px-3 rounded bg-muted/40 group">
              <span className="flex-1 text-sm whitespace-pre-wrap">{i.texto}</span>
              <button onClick={() => removerIdeia(i.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity shrink-0 mt-0.5">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
