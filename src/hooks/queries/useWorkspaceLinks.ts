import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthReady } from "@/hooks/useAuthReady";

export interface WorkspaceLink {
  id: string;
  nicho_id: string;
  type: string;
  provider: string | null;
  title: string;
  url: string;
  created_at: string;
  updated_at: string;
}

export function useWorkspaceLink(nichoId: string | undefined, type: string) {
  const { ready } = useAuthReady();
  return useQuery({
    queryKey: ["workspace-link", nichoId, type],
    queryFn: async () => {
      if (!nichoId) return null;
      
      const { data, error } = await supabase
        .from("workspace_links")
        .select("*")
        .eq("nicho_id", nichoId)
        .eq("type", type)
        .maybeSingle();

      if (error) throw error;
      return data as WorkspaceLink | null;
    },
    enabled: ready && !!nichoId && !!type,
  });
}

export function useUpsertWorkspaceLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: {
      nicho_id: string;
      type: string;
      provider: string;
      title: string;
      url: string;
    }) => {
      const { error } = await supabase
        .from("workspace_links")
        .upsert(data, {
          onConflict: "nicho_id,type",
          ignoreDuplicates: false,
        });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-link", variables.nicho_id, variables.type],
      });
    },
  });
}

export function useDeleteWorkspaceLink() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ nichoId, type }: { nichoId: string; type: string }) => {
      const { error } = await supabase
        .from("workspace_links")
        .delete()
        .eq("nicho_id", nichoId)
        .eq("type", type);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-link", variables.nichoId, variables.type],
      });
    },
  });
}
