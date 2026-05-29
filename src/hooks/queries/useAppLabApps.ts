import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppType, ClientStatus } from "./useAppLabClients";

export interface AppLabApp {
  id: string;
  nicho_id: string;
  user_id: string;
  name: string;
  app_type: AppType;
  category: string | null;
  country: string | null;
  status: ClientStatus;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AppFormInput {
  name: string;
  app_type: AppType;
  category?: string | null;
  country?: string | null;
  status: ClientStatus;
  description?: string | null;
  created_at?: string | null;
}

const QK = (nichoId: string) => ["applab-apps", nichoId];

export function useAppLabApps(nichoId: string) {
  return useQuery({
    queryKey: QK(nichoId),
    enabled: !!nichoId,
    queryFn: async (): Promise<AppLabApp[]> => {
      const { data, error } = await supabase
        .from("app_lab_apps" as any)
        .select("*")
        .eq("nicho_id", nichoId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as AppLabApp[];
    },
  });
}

export function useCreateAppLabApp(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AppFormInput): Promise<AppLabApp> => {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth.user?.id;
      if (!user_id) throw new Error("Sessão expirada");

      const { data, error } = await supabase
        .from("app_lab_apps" as any)
        .insert({
          nicho_id: nichoId,
          user_id,
          name: input.name,
          app_type: input.app_type,
          category: input.category ?? null,
          country: input.country ?? "BR",
          status: input.status,
          description: input.description ?? null,
          ...(input.created_at ? { created_at: input.created_at } : {}),
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as AppLabApp;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      toast.success("App criado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateAppLabApp(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AppFormInput }) => {
      const { error } = await supabase
        .from("app_lab_apps" as any)
        .update({
          name: input.name,
          app_type: input.app_type,
          category: input.category ?? null,
          country: input.country ?? "BR",
          status: input.status,
          description: input.description ?? null,
          ...(input.created_at ? { created_at: input.created_at } : {}),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      toast.success("App atualizado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAppLabApp(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // unlink clients first
      await supabase.from("app_lab_clients" as any).update({ app_id: null }).eq("app_id", id);
      const { error } = await supabase.from("app_lab_apps" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      qc.invalidateQueries({ queryKey: ["applab-clients", nichoId] });
      toast.success("App excluído");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
