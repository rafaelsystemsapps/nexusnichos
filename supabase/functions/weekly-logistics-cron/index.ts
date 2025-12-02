import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action } = await req.json();

    if (action === "auto_mark_incomplete") {
      // Auto-mark pending tasks as "nao_concluida" for past days
      console.log("Running auto-mark incomplete tasks...");

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      // Get all pending tasks for dates before today
      const { data: pendingTasks, error: fetchError } = await supabase
        .from("tarefa_diaria")
        .select("id, data")
        .eq("status", "pendente")
        .lt("data", todayStr);

      if (fetchError) {
        throw fetchError;
      }

      if (pendingTasks && pendingTasks.length > 0) {
        const taskIds = pendingTasks.map((t) => t.id);

        const { error: updateError } = await supabase
          .from("tarefa_diaria")
          .update({ status: "nao_concluida" })
          .in("id", taskIds);

        if (updateError) {
          throw updateError;
        }

        console.log(`Marked ${taskIds.length} tasks as nao_concluida`);
      } else {
        console.log("No pending tasks to mark as incomplete");
      }

      return new Response(
        JSON.stringify({ success: true, message: `Processed ${pendingTasks?.length || 0} tasks` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "weekly_reset") {
      // Create new week and finalize old one
      console.log("Running weekly reset...");

      const today = new Date();
      
      // Calculate start and end of current week (Monday to Sunday)
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Adjust for Monday start
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - diff);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Get ISO week number
      const getWeekNumber = (date: Date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
      };

      const weekNumber = getWeekNumber(weekStart);
      const year = weekStart.getFullYear();

      // Format dates
      const formatDate = (d: Date) => d.toISOString().split("T")[0];
      const weekStartStr = formatDate(weekStart);
      const weekEndStr = formatDate(weekEnd);

      // Get all nichos
      const { data: nichos, error: nichosError } = await supabase
        .from("nichos")
        .select("id");

      if (nichosError) throw nichosError;

      for (const nicho of nichos || []) {
        // Check if week already exists
        const { data: existingWeek } = await supabase
          .from("semana_logistica")
          .select("id")
          .eq("nicho_id", nicho.id)
          .eq("semana_numero", weekNumber)
          .eq("ano", year)
          .maybeSingle();

        if (existingWeek) {
          console.log(`Week ${weekNumber}/${year} already exists for nicho ${nicho.id}`);
          continue;
        }

        // Finalize previous active weeks
        await supabase
          .from("semana_logistica")
          .update({ status: "finalizada" })
          .eq("nicho_id", nicho.id)
          .eq("status", "ativa");

        // Create new week
        const { data: newWeek, error: weekError } = await supabase
          .from("semana_logistica")
          .insert({
            nicho_id: nicho.id,
            semana_inicio: weekStartStr,
            semana_fim: weekEndStr,
            semana_numero: weekNumber,
            ano: year,
            status: "ativa",
          })
          .select()
          .single();

        if (weekError) {
          console.error(`Error creating week for nicho ${nicho.id}:`, weekError);
          continue;
        }

        // Get active templates for this nicho
        const { data: templates } = await supabase
          .from("tarefa_templates")
          .select("id")
          .eq("nicho_id", nicho.id)
          .eq("ativa", true);

        if (templates && templates.length > 0) {
          // Create daily tasks for each template
          const dailyTasks = [];
          for (const template of templates) {
            for (let day = 0; day < 7; day++) {
              const taskDate = new Date(weekStart);
              taskDate.setDate(weekStart.getDate() + day);
              dailyTasks.push({
                semana_id: newWeek.id,
                template_id: template.id,
                dia_semana: day,
                data: formatDate(taskDate),
                status: "pendente",
              });
            }
          }

          await supabase.from("tarefa_diaria").insert(dailyTasks);
          console.log(`Created ${dailyTasks.length} tasks for nicho ${nicho.id}`);
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: "Weekly reset completed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in weekly-logistics-cron:", error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
