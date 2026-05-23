import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Credenciais do "usuário compartilhado" do backend.
// Toda a UI usa este usuário invisível para que as policies RLS continuem funcionando.
const SHARED_EMAIL = "rafael.workbiz@gmail.com";
const SHARED_PASSWORD = "Admin2902";

export type TipoPerfil = "admin" | "colaborador";

export interface Perfil {
  id: string;
  nome: string;
  tipo: TipoPerfil;
  emoji: string;
  cor: string;
  nichoId?: string | null;
}

const PERFIS_KEY = "nexus_perfis";
const PERFIL_ATIVO_KEY = "nexus_perfil_ativo";

const PERFIS_PADRAO: Perfil[] = [
  { id: "admin", nome: "Admin", tipo: "admin", emoji: "⚙️", cor: "#b45309" },
  { id: "matias", nome: "Matias", tipo: "colaborador", nichoId: null, emoji: "🚀", cor: "#1d4ed8" },
];

interface PerfilContextType {
  perfis: Perfil[];
  perfilAtivo: Perfil | null;
  ready: boolean;
  setPerfilAtivo: (p: Perfil | null) => void;
  adicionarPerfil: (p: Omit<Perfil, "id">) => Perfil;
  removerPerfil: (id: string) => void;
  trocarPerfil: () => void;
}

const PerfilContext = createContext<PerfilContextType | undefined>(undefined);

function carregarPerfis(): Perfil[] {
  try {
    const raw = localStorage.getItem(PERFIS_KEY);
    if (!raw) {
      localStorage.setItem(PERFIS_KEY, JSON.stringify(PERFIS_PADRAO));
      return PERFIS_PADRAO;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    localStorage.setItem(PERFIS_KEY, JSON.stringify(PERFIS_PADRAO));
    return PERFIS_PADRAO;
  } catch {
    return PERFIS_PADRAO;
  }
}

function carregarPerfilAtivo(): Perfil | null {
  try {
    const raw = sessionStorage.getItem(PERFIL_ATIVO_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

async function garantirSessao() {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: SHARED_EMAIL,
    password: SHARED_PASSWORD,
  });
  if (error) {
    console.error("Falha no login compartilhado:", error.message);
  }
}

export function PerfilProvider({ children }: { children: React.ReactNode }) {
  const [perfis, setPerfis] = useState<Perfil[]>(() => carregarPerfis());
  const [perfilAtivo, setPerfilAtivoState] = useState<Perfil | null>(() => carregarPerfilAtivo());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    garantirSessao().finally(() => setReady(true));
  }, []);

  useEffect(() => {
    localStorage.setItem(PERFIS_KEY, JSON.stringify(perfis));
  }, [perfis]);

  const setPerfilAtivo = useCallback((p: Perfil | null) => {
    setPerfilAtivoState(p);
    if (p) sessionStorage.setItem(PERFIL_ATIVO_KEY, JSON.stringify(p));
    else sessionStorage.removeItem(PERFIL_ATIVO_KEY);
  }, []);

  const adicionarPerfil = useCallback((p: Omit<Perfil, "id">) => {
    const novo: Perfil = { ...p, id: crypto.randomUUID() };
    setPerfis((curr) => [...curr, novo]);
    return novo;
  }, []);

  const removerPerfil = useCallback((id: string) => {
    setPerfis((curr) => curr.filter((p) => p.id !== id));
  }, []);

  const trocarPerfil = useCallback(() => {
    setPerfilAtivo(null);
  }, [setPerfilAtivo]);

  return (
    <PerfilContext.Provider
      value={{ perfis, perfilAtivo, ready, setPerfilAtivo, adicionarPerfil, removerPerfil, trocarPerfil }}
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
