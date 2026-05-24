import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: adminRole } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem excluir usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "ID do usuário é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Get the nicho_id associated with this user
    const { data: userNicho } = await adminClient
      .from("user_nichos")
      .select("nicho_id")
      .eq("user_id", user_id)
      .maybeSingle();

    const nichoId = userNicho?.nicho_id;

    if (nichoId) {
      // Clean up workspace data (only remaining domain tables)
      await adminClient.from("applab_account_links").delete().eq("nicho_id", nichoId);
      await adminClient.from("applab_apps").delete().eq("nicho_id", nichoId);
      await adminClient.from("contas_redes_sociais").delete().eq("nicho_id", nichoId);
      await adminClient.from("workspace_links").delete().eq("nicho_id", nichoId);
    }

    await adminClient.from("user_nichos").delete().eq("user_id", user_id);

    if (nichoId) {
      await adminClient.from("nichos").delete().eq("id", nichoId);
    }

    await adminClient.from("user_roles").delete().eq("user_id", user_id);
    await adminClient.from("profiles").delete().eq("id", user_id);

    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      return new Response(
        JSON.stringify({ error: "Erro ao excluir usuário: " + authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuário e dados do workspace excluídos com sucesso" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Erro interno do servidor" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
