import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Sessão compartilhada — login invisível para que as RLS continuem funcionando.
// O usuário nunca digita senha nem vê tela de login.
const SHARED_EMAIL = "rafael.workbiz@gmail.com";
const SHARED_PASSWORD = "Admin2902";

export type TipoPerfil = "admin" | "colaborador";

export interface Perfil {
  id: string;
  nome: string;
  tipo: TipoPerfil;
  nichoId: string | null;
  emoji: string;
  cor: string;
}

const PERFIL_ATIVO_KEY = "nexus_perfil_ativo";

const CORES_FALLBACK = ["#1d4ed8", "#b45309", "#047857", "#6d28d9", "#be123c", "#0891b2"];

function emojiFallback(tipo: TipoPerfil) {
  return tipo === "admin" ? "⚙️" : "🚀";
}

function corFallback(idx: number) {
  return CORES_FALLBACK[idx % CORES_FALLBACK.length];
}

interface PerfilContextType {
  perfis: Perfil[];
  perfilAtivo: Perfil | null;
  loadingPerfis: boolean;
  ready: boolean;
  setPerfilAtivo: (p: Perfil) => void;
  trocarPerfil: () => void;
}

const PerfilContext = createContext<PerfilContextType | undefined>(undefined);

async function garantirSessao() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: SHARED_EMAIL,
    password: SHARED_PASSWORD,
  });
  if (error) console.error("Falha no login compartilhado:", error.message);
}

function carregarPerfilSalvo(): Perfil | null {
  try {
    const raw = localStorage.getItem(PERFIL_ATIVO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [perfilAtivo, setPerfilAtivoState] = useState<Perfil | null>(() => carregarPerfilSalvo());
  const [ready, setReady] = useState(false);
  const [loadingPerfis, setLoadingPerfis] = useState(true);

  const setPerfilAtivo = useCallback((p: Perfil) => {
    setPerfilAtivoState(p);
    localStorage.setItem(PERFIL_ATIVO_KEY, JSON.stringify(p));
  }, []);

  const trocarPerfil = useCallback(() => {
    localStorage.removeItem(PERFIL_ATIVO_KEY);
    setPerfilAtivoState(null);
  }, []);

  useEffect(() => {
    (async () => {
      await garantirSessao();
      setReady(true);

      const [profilesRes, rolesRes, nichosRes] = await Promise.all([
        supabase.from("profiles").select("id, nome, avatar_emoji, avatar_color"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("user_nichos").select("user_id, nicho_id"),
      ]);

      const roles = new Map<string, TipoPerfil>();
      (rolesRes.data ?? []).forEach((r: any) => {
        const tipo: TipoPerfil = r.role === "admin" ? "admin" : "colaborador";
        // admin tem prioridade
        if (roles.get(r.user_id) !== "admin") roles.set(r.user_id, tipo);
      });

      const nichos = new Map<string, string>();
      (nichosRes.data ?? []).forEach((n: any) => nichos.set(n.user_id, n.nicho_id));

      const lista: Perfil[] = (profilesRes.data ?? []).map((p: any, i: number) => ({
        id: p.id,
        nome: p.nome ?? "Sem nome",
        tipo: roles.get(p.id) ?? "colaborador",
        nichoId: nichos.get(p.id) ?? null,
        emoji: p.avatar_emoji ?? emojiFallback(roles.get(p.id) ?? "colaborador"),
        cor: p.avatar_color ?? corFallback(i),
      }));

      lista.sort((a, b) => {
        if (a.tipo === b.tipo) return a.nome.localeCompare(b.nome);
        return a.tipo === "admin" ? -1 : 1;
      });

      setPerfis(lista);
      setLoadingPerfis(false);

      // Default: primeiro admin se não há salvo
      const salvo = carregarPerfilSalvo();
      if (!salvo && lista.length > 0) {
        const padrao = lista.find((p) => p.tipo === "admin") ?? lista[0];
        setPerfilAtivoState(padrao);
        localStorage.setItem(PERFIL_ATIVO_KEY, JSON.stringify(padrao));
      } else if (salvo) {
        // refresh dados do salvo a partir da lista (caso emoji/cor/nicho mudaram)
        const atualizado = lista.find((p) => p.id === salvo.id);
        if (atualizado) {
          setPerfilAtivoState(atualizado);
          localStorage.setItem(PERFIL_ATIVO_KEY, JSON.stringify(atualizado));
        }
      }
    })();
  }, []);

  return (
    <PerfilContext.Provider
      value={{ perfis, perfilAtivo, loadingPerfis, ready, setPerfilAtivo, trocarPerfil }}
    >
      {children}
    </PerfilContext.Provider>
  );
}

export function usePerfilContext() {
  const ctx = useContext(PerfilContext);
  if (!ctx) throw new Error("usePerfilContext deve ser usado dentro de PerfilProvider");
  return ctx;
}
