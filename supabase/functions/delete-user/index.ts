import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  user_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Token de autorização necessário" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify the user is authenticated
    const { data: { user: requestingUser }, error: authError } = await userClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if requesting user is admin
    const { data: adminRole, error: roleError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleError) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Erro ao verificar permissões" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Apenas administradores podem excluir usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const { user_id }: DeleteUserRequest = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "ID do usuário é obrigatório" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Prevent admin from deleting themselves
    if (user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "Você não pode excluir sua própria conta" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting complete deletion for user: ${user_id}`);

    // Create admin client for privileged operations
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // 1. Get the nicho_id associated with this user
    const { data: userNicho, error: userNichoError } = await adminClient
      .from("user_nichos")
      .select("nicho_id")
      .eq("user_id", user_id)
      .maybeSingle();

    if (userNichoError) {
      console.error("Error fetching user nicho:", userNichoError);
    }

    const nichoId = userNicho?.nicho_id;
    console.log(`User nicho_id: ${nichoId}`);

    // If user has a nicho, delete all workspace data
    if (nichoId) {
      console.log(`Deleting all workspace data for nicho: ${nichoId}`);

      // 2. Get conteudo IDs for this nicho (needed for subtarefas)
      const { data: conteudos } = await adminClient
        .from("conteudos")
        .select("id")
        .eq("nicho_id", nichoId);
      
      const conteudoIds = conteudos?.map(c => c.id) || [];
      console.log(`Found ${conteudoIds.length} conteudos to delete`);

      // 3. Get semana IDs for this nicho (needed for tarefa_diaria)
      const { data: semanas } = await adminClient
        .from("semana_logistica")
        .select("id")
        .eq("nicho_id", nichoId);
      
      const semanaIds = semanas?.map(s => s.id) || [];
      console.log(`Found ${semanaIds.length} semanas to delete`);

      // Delete in correct order (respecting foreign keys)

      // 4. Delete subtarefas_conteudo (depends on conteudos)
      if (conteudoIds.length > 0) {
        const { error } = await adminClient
          .from("subtarefas_conteudo")
          .delete()
          .in("conteudo_id", conteudoIds);
        if (error) console.error("Error deleting subtarefas_conteudo:", error);
        else console.log("Deleted subtarefas_conteudo");
      }

      // 5. Delete tarefa_diaria (depends on semana_logistica)
      if (semanaIds.length > 0) {
        const { error } = await adminClient
          .from("tarefa_diaria")
          .delete()
          .in("semana_id", semanaIds);
        if (error) console.error("Error deleting tarefa_diaria:", error);
        else console.log("Deleted tarefa_diaria");
      }

      // 6. Delete semana_logistica
      const { error: semanaError } = await adminClient
        .from("semana_logistica")
        .delete()
        .eq("nicho_id", nichoId);
      if (semanaError) console.error("Error deleting semana_logistica:", semanaError);
      else console.log("Deleted semana_logistica");

      // 7. Delete tarefa_templates
      const { error: templatesError } = await adminClient
        .from("tarefa_templates")
        .delete()
        .eq("nicho_id", nichoId);
      if (templatesError) console.error("Error deleting tarefa_templates:", templatesError);
      else console.log("Deleted tarefa_templates");

      // 8. Delete conteudos
      const { error: conteudosError } = await adminClient
        .from("conteudos")
        .delete()
        .eq("nicho_id", nichoId);
      if (conteudosError) console.error("Error deleting conteudos:", conteudosError);
      else console.log("Deleted conteudos");

      // 9. Delete conteudo_bruto
      const { error: brutoError } = await adminClient
        .from("conteudo_bruto")
        .delete()
        .eq("nicho_id", nichoId);
      if (brutoError) console.error("Error deleting conteudo_bruto:", brutoError);
      else console.log("Deleted conteudo_bruto");

      // 10. Delete pedidos
      const { error: pedidosError } = await adminClient
        .from("pedidos")
        .delete()
        .eq("nicho_id", nichoId);
      if (pedidosError) console.error("Error deleting pedidos:", pedidosError);
      else console.log("Deleted pedidos");

      // 11. Delete transacoes_financeiras
      const { error: transacoesError } = await adminClient
        .from("transacoes_financeiras")
        .delete()
        .eq("nicho_id", nichoId);
      if (transacoesError) console.error("Error deleting transacoes_financeiras:", transacoesError);
      else console.log("Deleted transacoes_financeiras");

      // 12. Delete produtos
      const { error: produtosError } = await adminClient
        .from("produtos")
        .delete()
        .eq("nicho_id", nichoId);
      if (produtosError) console.error("Error deleting produtos:", produtosError);
      else console.log("Deleted produtos");

      // 13. Delete contas_redes_sociais
      const { error: contasError } = await adminClient
        .from("contas_redes_sociais")
        .delete()
        .eq("nicho_id", nichoId);
      if (contasError) console.error("Error deleting contas_redes_sociais:", contasError);
      else console.log("Deleted contas_redes_sociais");

      // 14. Delete membros_time
      const { error: membrosError } = await adminClient
        .from("membros_time")
        .delete()
        .eq("nicho_id", nichoId);
      if (membrosError) console.error("Error deleting membros_time:", membrosError);
      else console.log("Deleted membros_time");

      // 15. Delete biblioteca_nicho
      const { error: bibliotecaError } = await adminClient
        .from("biblioteca_nicho")
        .delete()
        .eq("nicho_id", nichoId);
      if (bibliotecaError) console.error("Error deleting biblioteca_nicho:", bibliotecaError);
      else console.log("Deleted biblioteca_nicho");
    }

    // 16. Delete user_nichos
    const { error: nichosError } = await adminClient
      .from("user_nichos")
      .delete()
      .eq("user_id", user_id);
    if (nichosError) console.error("Error deleting user_nichos:", nichosError);
    else console.log("Deleted user_nichos");

    // 17. Delete the nicho itself (if exists)
    if (nichoId) {
      const { error: nichoError } = await adminClient
        .from("nichos")
        .delete()
        .eq("id", nichoId);
      if (nichoError) console.error("Error deleting nicho:", nichoError);
      else console.log("Deleted nicho");
    }

    // 18. Delete user_roles
    const { error: rolesError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", user_id);
    if (rolesError) console.error("Error deleting user_roles:", rolesError);
    else console.log("Deleted user_roles");

    // 19. Delete profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .delete()
      .eq("id", user_id);
    if (profileError) console.error("Error deleting profile:", profileError);
    else console.log("Deleted profile");

    // 20. Delete from auth.users
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user_id);

    if (authDeleteError) {
      console.error("Error deleting auth user:", authDeleteError);
      return new Response(
        JSON.stringify({ error: "Erro ao excluir usuário: " + authDeleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`User ${user_id} and all workspace data deleted successfully`);

    return new Response(
      JSON.stringify({ success: true, message: "Usuário e todos os dados do workspace excluídos com sucesso" }),
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
