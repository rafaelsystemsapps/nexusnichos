import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type AccountStatus = "ativa" | "desabilitada" | "banida";

// Map UI status <-> DB enum (status_conta: ativa | pausada | limitada | banida)
export const statusToDB = (s: AccountStatus): "ativa" | "pausada" | "banida" => {
  if (s === "desabilitada") return "pausada";
  if (s === "banida") return "banida";
  return "ativa";
};
export const statusFromDB = (s: string | null | undefined): AccountStatus => {
  if (s === "banida") return "banida";
  if (s === "pausada" || s === "limitada") return "desabilitada";
  return "ativa";
};

export interface AccountRow {
  id: string;
  nicho_id: string;
  plataforma: string;
  nome_conta: string;
  username: string | null;
  senha_acesso: string | null;
  pais: string | null;
  data_criacao_conta: string | null;
  status: string;
  disabled_at: string | null;
  banned_at: string | null;
  created_at: string;
  gmail_email: string | null;
  gmail_senha: string | null;
  login_email: string | null;
}

export function useAccounts(nichoId: string | undefined) {
  return useQuery({
    queryKey: ["accounts", nichoId],
    enabled: !!nichoId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*")
        .eq("nicho_id", nichoId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AccountRow[];
    },
  });
}

export function useAccount(accountId: string | undefined) {
  return useQuery({
    queryKey: ["account", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .select("*")
        .eq("id", accountId!)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as AccountRow | null;
    },
  });
}

interface AccountInput {
  nicho_id: string;
  nome_conta: string;
  username?: string | null;
  plataforma: string;
  senha_acesso?: string | null;
  pais?: string | null;
  data_criacao_conta?: string | null;
  status: AccountStatus;
  gmail_email?: string | null;
  gmail_senha?: string | null;
}

export function useCreateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AccountInput) => {
      const payload: any = {
        nicho_id: input.nicho_id,
        nome_conta: input.nome_conta,
        username: input.username || null,
        plataforma: input.plataforma,
        senha_acesso: input.senha_acesso || null,
        pais: input.pais || "BR",
        data_criacao_conta: input.data_criacao_conta || null,
        status: statusToDB(input.status),
        disabled_at: input.status === "desabilitada" ? new Date().toISOString() : null,
        banned_at: input.status === "banida" ? new Date().toISOString() : null,
      };
      const { data, error } = await supabase
        .from("contas_redes_sociais")
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["accounts", vars.nicho_id] }),
  });
}

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: AccountInput & { id: string }) => {
      const payload: any = {
        nome_conta: input.nome_conta,
        username: input.username || null,
        plataforma: input.plataforma,
        senha_acesso: input.senha_acesso || null,
        pais: input.pais || "BR",
        data_criacao_conta: input.data_criacao_conta || null,
        status: statusToDB(input.status),
        disabled_at: input.status === "desabilitada" ? new Date().toISOString() : null,
        banned_at: input.status === "banida" ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("contas_redes_sociais").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["accounts", vars.nicho_id] });
      qc.invalidateQueries({ queryKey: ["account", vars.id] });
    },
  });
}

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; nicho_id?: string }) => {
      const { error } = await supabase.from("contas_redes_sociais").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["accounts"] }),
  });
}

export function useSetAccountStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: AccountStatus }) => {
      const payload: any = {
        status: statusToDB(status),
        disabled_at: status === "desabilitada" ? new Date().toISOString() : null,
        banned_at: status === "banida" ? new Date().toISOString() : null,
      };
      const { error } = await supabase.from("contas_redes_sociais").update(payload).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["accounts"] });
      qc.invalidateQueries({ queryKey: ["account", vars.id] });
    },
  });
}
