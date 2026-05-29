import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type AppType = "b2b" | "b2c";
export type ClientStatus = "active" | "inactive" | "pending";

export interface AppLabBilling {
  id: string;
  client_id: string;
  nicho_id: string;
  monthly_value: number | null;
  due_date: string | null;
  next_payment: string | null;
  plan: string | null;
  billing_status: string | null;
}

export interface AppLabClient {
  id: string;
  nicho_id: string;
  user_id: string;
  app_id: string | null;
  name: string;
  app_type: AppType;
  status: ClientStatus;
  country: string | null;
  description: string | null;
  login_email: string | null;
  password: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  billing?: AppLabBilling | null;
}

export interface ClientFormInput {
  name: string;
  app_type: AppType;
  status: ClientStatus;
  app_id?: string | null;
  country?: string | null;
  description?: string | null;
  login_email?: string | null;
  password?: string | null;
  notes?: string | null;
  billing?: {
    monthly_value?: number | null;
    due_date?: string | null;
    next_payment?: string | null;
    plan?: string | null;
  } | null;
}

const QK = (nichoId: string) => ["applab-clients", nichoId];

export function useAppLabClients(nichoId: string) {
  return useQuery({
    queryKey: QK(nichoId),
    enabled: !!nichoId,
    queryFn: async (): Promise<AppLabClient[]> => {
      const { data: clients, error } = await supabase
        .from("app_lab_clients" as any)
        .select("*")
        .eq("nicho_id", nichoId)
        .order("updated_at", { ascending: false });
      if (error) throw error;

      const ids = (clients || []).map((c: any) => c.id);
      let billingByClient: Record<string, AppLabBilling> = {};
      if (ids.length) {
        const { data: bills, error: bErr } = await supabase
          .from("app_lab_billing" as any)
          .select("*")
          .in("client_id", ids);
        if (bErr) throw bErr;
        (bills || []).forEach((b: any) => {
          billingByClient[b.client_id] = b as AppLabBilling;
        });
      }
      return (clients || []).map((c: any) => ({
        ...(c as AppLabClient),
        billing: billingByClient[c.id] ?? null,
      }));
    },
  });
}

export function useCreateAppLabClient(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClientFormInput) => {
      const { data: auth } = await supabase.auth.getUser();
      const user_id = auth.user?.id;
      if (!user_id) throw new Error("Sessão expirada");

      const { data: client, error } = await supabase
        .from("app_lab_clients" as any)
        .insert({
          nicho_id: nichoId,
          user_id,
          name: input.name,
          app_type: input.app_type,
          status: input.status,
          app_id: input.app_id ?? null,
          country: input.country ?? "BR",
          description: input.description ?? null,
          login_email: input.login_email ?? null,
          password: input.password ?? null,
          notes: input.notes ?? null,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.app_type === "b2b" && input.billing) {
        const { error: bErr } = await supabase.from("app_lab_billing" as any).insert({
          client_id: (client as any).id,
          nicho_id: nichoId,
          monthly_value: input.billing.monthly_value ?? null,
          due_date: input.billing.due_date ?? null,
          next_payment: input.billing.next_payment ?? null,
          plan: input.billing.plan ?? null,
        });
        if (bErr) throw bErr;
      }
      return client;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      toast.success("Cliente criado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useUpdateAppLabClient(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: ClientFormInput }) => {
      const { error } = await supabase
        .from("app_lab_clients" as any)
        .update({
          name: input.name,
          app_type: input.app_type,
          status: input.status,
          country: input.country ?? "BR",
          description: input.description ?? null,
          login_email: input.login_email ?? null,
          password: input.password ?? null,
          notes: input.notes ?? null,
        })
        .eq("id", id);
      if (error) throw error;

      if (input.app_type === "b2b") {
        // upsert billing
        const { data: existing } = await supabase
          .from("app_lab_billing" as any)
          .select("id")
          .eq("client_id", id)
          .maybeSingle();
        if (existing) {
          const { error: uErr } = await supabase
            .from("app_lab_billing" as any)
            .update({
              monthly_value: input.billing?.monthly_value ?? null,
              due_date: input.billing?.due_date ?? null,
              next_payment: input.billing?.next_payment ?? null,
              plan: input.billing?.plan ?? null,
            })
            .eq("client_id", id);
          if (uErr) throw uErr;
        } else {
          const { error: iErr } = await supabase.from("app_lab_billing" as any).insert({
            client_id: id,
            nicho_id: nichoId,
            monthly_value: input.billing?.monthly_value ?? null,
            due_date: input.billing?.due_date ?? null,
            next_payment: input.billing?.next_payment ?? null,
            plan: input.billing?.plan ?? null,
          });
          if (iErr) throw iErr;
        }
      } else {
        // B2C → remove billing if existed
        await supabase.from("app_lab_billing" as any).delete().eq("client_id", id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      toast.success("Cliente atualizado");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}

export function useDeleteAppLabClient(nichoId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("app_lab_clients" as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QK(nichoId) });
      toast.success("Cliente excluído");
    },
    onError: (e: any) => toast.error("Erro: " + e.message),
  });
}
