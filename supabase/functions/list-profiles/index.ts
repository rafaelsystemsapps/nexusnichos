import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileWithRole {
  id: string;
  nome: string;
  email: string;
  role: "admin" | "colaborador";
  avatar_emoji: string | null;
  avatar_color: string | null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("Fetching profiles with roles...");

    // Fetch all profiles with avatar fields
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, nome, email, avatar_emoji, avatar_color");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      throw profilesError;
    }

    // Fetch all user roles
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("user_id, role");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      throw rolesError;
    }

    // Map roles by user_id for quick lookup
    const rolesMap = new Map<string, string>();
    roles?.forEach((r) => {
      rolesMap.set(r.user_id, r.role);
    });

    // Combine profiles with roles
    const profilesWithRoles: ProfileWithRole[] = (profiles || [])
      .map((profile) => ({
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        role: (rolesMap.get(profile.id) || "colaborador") as "admin" | "colaborador",
        avatar_emoji: profile.avatar_emoji || null,
        avatar_color: profile.avatar_color || null,
      }))
      // Sort: admins first, then alphabetically by name
      .sort((a, b) => {
        if (a.role === "admin" && b.role !== "admin") return -1;
        if (a.role !== "admin" && b.role === "admin") return 1;
        return a.nome.localeCompare(b.nome);
      });

    console.log(`Returning ${profilesWithRoles.length} profiles`);

    return new Response(JSON.stringify(profilesWithRoles), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    console.error("Error in list-profiles:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
