import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type OfferVault = Tables<"offer_vault">;
export type OfferVaultInsert = TablesInsert<"offer_vault">;
export type OfferVaultUpdate = TablesUpdate<"offer_vault">;

export type StatusOferta = "salva" | "em_teste" | "funcionou" | "nao_funcionou" | "lixo";
export type PlataformaOrigem = "tiktok" | "instagram" | "facebook" | "youtube" | "outro";

export const STATUS_ORDER: StatusOferta[] = ["em_teste", "salva", "funcionou", "nao_funcionou", "lixo"];

export function useOfferVault(nichoId: string) {
  return useQuery({
    queryKey: ["offer_vault", nichoId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offer_vault")
        .select("*")
        .eq("nicho_id", nichoId)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return data as OfferVault[];
    },
    enabled: !!nichoId,
  });
}

export function useCreateOffer(nichoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (offer: Omit<OfferVaultInsert, "nicho_id">) => {
      const { data, error } = await supabase
        .from("offer_vault")
        .insert({ ...offer, nicho_id: nichoId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_vault", nichoId] });
    },
  });
}

export function useUpdateOffer(nichoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: OfferVaultUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from("offer_vault")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_vault", nichoId] });
    },
  });
}

export function useDeleteOffer(nichoId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("offer_vault")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offer_vault", nichoId] });
    },
  });
}
