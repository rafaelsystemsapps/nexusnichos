import { useQuery } from "@tanstack/react-query";
import { ensureSession } from "@/lib/session";

/**
 * Sinal global de "sessão pronta".
 * Todas as queries que dependem de RLS devem usar `ready` no seu `enabled`
 * para não disparar antes da sessão compartilhada existir (evita falso
 * "Nicho não encontrado" e leituras vazias bloqueadas pelo RLS).
 */
export function useAuthReady() {
  const { data, isSuccess } = useQuery({
    queryKey: ["auth-session"],
    queryFn: ensureSession,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 2,
  });

  return {
    ready: isSuccess,
    userId: (data as string | null | undefined) ?? null,
  };
}
