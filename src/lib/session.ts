import { supabase } from "@/integrations/supabase/client";

// Sessão compartilhada — login invisível para que as RLS continuem funcionando.
// O usuário nunca digita senha nem vê tela de login.
const SHARED_EMAIL = "rafael.workbiz@gmail.com";
const SHARED_PASSWORD = "Admin2902";

let sessionPromise: Promise<string | null> | null = null;

/**
 * Garante que existe uma sessão Supabase ativa.
 * É idempotente / singleton: múltiplas chamadas concorrentes compartilham
 * a mesma promessa, evitando logins duplicados (race condition de boot).
 * Retorna o user id quando disponível.
 */
export function ensureSession(): Promise<string | null> {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) return data.session.user?.id ?? null;

      const { error } = await supabase.auth.signInWithPassword({
        email: SHARED_EMAIL,
        password: SHARED_PASSWORD,
      });
      if (error) {
        console.error("Falha no login compartilhado:", error.message);
        // permite nova tentativa em chamadas futuras
        sessionPromise = null;
        throw error;
      }
      const { data: after } = await supabase.auth.getSession();
      return after.session?.user?.id ?? null;
    })();
  }
  return sessionPromise;
}
