import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, X } from "lucide-react";
import { usePerfilContext, type Perfil, type TipoPerfil } from "@/contexts/PerfilContext";

const EMOJIS = ["🚀","💼","🎯","⚡","🔥","💡","🎲","🏆","👾","🤖","💰","🌐","🛠️","📊","🎨","🧠","👑","⚙️","🦁","🐺"];
const CORES = [
  { nome: "Azul", valor: "#1d4ed8" },
  { nome: "Verde", valor: "#15803d" },
  { nome: "Vermelho", valor: "#b91c1c" },
  { nome: "Roxo", valor: "#7c3aed" },
  { nome: "Laranja", valor: "#b45309" },
  { nome: "Cinza", valor: "#4b5563" },
  { nome: "Amarelo", valor: "#a16207" },
  { nome: "Rosa", valor: "#be185d" },
];

export default function SelecaoPerfil() {
  const navigate = useNavigate();
  const { perfis, setPerfilAtivo, adicionarPerfil, removerPerfil } = usePerfilContext();
  const [modalAberto, setModalAberto] = useState(false);

  const handleSelecionar = (p: Perfil) => {
    setPerfilAtivo(p);
    if (p.tipo === "admin") {
      navigate("/admin");
    } else if (p.nichoId) {
      navigate(`/workspace/${p.nichoId}`);
    } else {
      alert("Este perfil ainda não tem um nicho configurado. Edite o perfil e informe o nichoId.");
      setPerfilAtivo(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4" style={{ background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif" }}>
      <h1 className="text-5xl font-bold mb-12 tracking-tight">Nexus</h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-3xl">
        {perfis.map((p) => (
          <PerfilCard key={p.id} perfil={p} onClick={() => handleSelecionar(p)} onRemove={() => removerPerfil(p.id)} />
        ))}
        <button
          onClick={() => setModalAberto(true)}
          className="flex flex-col items-center justify-center w-[120px] h-[140px] rounded-lg transition-colors"
          style={{ border: "2px dashed #444", background: "transparent" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#1a1a1a")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <Plus className="w-8 h-8 mb-2" style={{ color: "#666" }} />
          <span className="text-xs" style={{ color: "#666" }}>Novo perfil</span>
        </button>
      </div>

      <p className="mt-12 text-xs" style={{ color: "#555" }}>Selecione um perfil para começar</p>

      {modalAberto && (
        <NovoPerfilModal
          onClose={() => setModalAberto(false)}
          onCriar={(p) => {
            adicionarPerfil(p);
            setModalAberto(false);
          }}
        />
      )}
    </div>
  );
}

function PerfilCard({ perfil, onClick, onRemove }: { perfil: Perfil; onClick: () => void; onRemove: () => void }) {
  const [hover, setHover] = useState(false);
  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        onClick={onClick}
        className="flex flex-col items-center justify-center w-[120px] h-[140px] rounded-lg transition-transform hover:scale-105"
        style={{ background: perfil.cor }}
      >
        <div className="text-4xl mb-2">{perfil.emoji}</div>
        <div className="text-sm font-medium text-white">{perfil.nome}</div>
        {perfil.tipo === "admin" && (
          <div
            className="mt-2 px-2 py-0.5 rounded text-white"
            style={{ background: "#b45309", fontSize: "10px" }}
          >
            ADMIN
          </div>
        )}
      </button>
      {hover && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm(`Remover perfil "${perfil.nome}"?`)) onRemove();
          }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center"
          style={{ background: "#1a1a1a", border: "1px solid #444", color: "#999" }}
          aria-label="Remover perfil"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}

function NovoPerfilModal({ onClose, onCriar }: { onClose: () => void; onCriar: (p: { nome: string; tipo: TipoPerfil; emoji: string; cor: string; nichoId?: string | null }) => void }) {
  const [nome, setNome] = useState("");
  const [tipo, setTipo] = useState<TipoPerfil>("colaborador");
  const [emoji, setEmoji] = useState(EMOJIS[0]);
  const [cor, setCor] = useState(CORES[0].valor);
  const [nichoId, setNichoId] = useState("");

  const handleSubmit = () => {
    if (!nome.trim()) return;
    onCriar({
      nome: nome.trim(),
      tipo,
      emoji,
      cor,
      nichoId: tipo === "colaborador" ? (nichoId.trim() || null) : null,
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4" style={{ background: "rgba(0,0,0,0.7)" }}>
      <div className="w-full max-w-md rounded-lg p-6" style={{ background: "#1a1a1a", border: "1px solid #333" }}>
        <h2 className="text-xl font-bold mb-4 text-white">Novo perfil</h2>

        <label className="block text-xs mb-1" style={{ color: "#999" }}>Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          autoFocus
          className="w-full px-3 py-2 rounded mb-4 text-white"
          style={{ background: "#0a0a0a", border: "1px solid #333" }}
        />

        <label className="block text-xs mb-2" style={{ color: "#999" }}>Emoji</label>
        <div className="grid grid-cols-10 gap-1 mb-4">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className="w-8 h-8 flex items-center justify-center rounded text-lg transition-colors"
              style={{ background: emoji === e ? "#333" : "transparent", border: emoji === e ? "1px solid #666" : "1px solid transparent" }}
            >
              {e}
            </button>
          ))}
        </div>

        <label className="block text-xs mb-2" style={{ color: "#999" }}>Cor</label>
        <div className="flex gap-2 mb-4 flex-wrap">
          {CORES.map((c) => (
            <button
              key={c.valor}
              onClick={() => setCor(c.valor)}
              className="w-8 h-8 rounded-full transition-transform"
              style={{ background: c.valor, transform: cor === c.valor ? "scale(1.15)" : "scale(1)", border: cor === c.valor ? "2px solid #fff" : "2px solid transparent" }}
              title={c.nome}
            />
          ))}
        </div>

        <label className="block text-xs mb-2" style={{ color: "#999" }}>Tipo</label>
        <div className="flex gap-2 mb-4">
          {(["admin", "colaborador"] as TipoPerfil[]).map((t) => (
            <button
              key={t}
              onClick={() => setTipo(t)}
              className="flex-1 px-3 py-2 rounded text-sm capitalize"
              style={{ background: tipo === t ? "#333" : "transparent", border: "1px solid #444", color: "#fff" }}
            >
              {t}
            </button>
          ))}
        </div>

        {tipo === "colaborador" && (
          <>
            <label className="block text-xs mb-1" style={{ color: "#999" }}>Nicho ID (opcional)</label>
            <input
              type="text"
              value={nichoId}
              onChange={(e) => setNichoId(e.target.value)}
              placeholder="UUID do nicho"
              className="w-full px-3 py-2 rounded mb-4 text-white text-sm"
              style={{ background: "#0a0a0a", border: "1px solid #333" }}
            />
          </>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 rounded text-sm"
            style={{ background: "transparent", border: "1px solid #444", color: "#ccc" }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={!nome.trim()}
            className="flex-1 px-4 py-2 rounded text-sm font-medium text-white disabled:opacity-50"
            style={{ background: "#1d4ed8" }}
          >
            Criar
          </button>
        </div>
      </div>
    </div>
  );
}
