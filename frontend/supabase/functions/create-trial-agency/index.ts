import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TrialSignupRequest {
  user_id: string;
  agency_name: string;
  email: string;
  user_name: string;
  trial_days?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as TrialSignupRequest;

    if (!body.user_id || !body.agency_name || !body.email || !body.user_name) {
      return new Response(
        JSON.stringify({ error: "Parâmetros inválidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const trialDays = body.trial_days && body.trial_days > 0 ? body.trial_days : 7;
    const now = new Date();
    const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);

    // 1. Create agency
    const { data: agency, error: agencyError } = await supabaseAdmin
      .from("agencies")
      .insert({
        name: body.agency_name,
        email: body.email,
        is_active: true,
      })
      .select()
      .single();

    if (agencyError || !agency) {
      console.error("Error creating agency:", agencyError);
      return new Response(
        JSON.stringify({ error: agencyError?.message || "Erro ao criar agência" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const agencyId = agency.id as string;

    // 2. Update profile with agency_id and name
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({ agency_id: agencyId, name: body.user_name })
      .eq("id", body.user_id);

    if (profileError) {
      console.error("Error updating profile:", profileError);
    }

    // 3. Set user as admin of the agency
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .update({ role: "admin" })
      .eq("user_id", body.user_id);

    if (roleError) {
      console.error("Error updating role:", roleError);
    }

    // 4. Create trial subscription
    const { error: subscriptionError } = await supabaseAdmin
      .from("agency_subscriptions")
      .insert({
        agency_id: agencyId,
        status: "trialing",
        billing_cycle: "monthly",
        current_period_start: now.toISOString(),
        current_period_end: trialEnd.toISOString(),
        plan_id: null,
      });

    if (subscriptionError) {
      console.error("Error creating subscription:", subscriptionError);
    }

    // 5. Create default pipeline stages and task columns
    try {
      await supabaseAdmin.rpc("create_default_pipeline_stages", { _agency_id: agencyId });
    } catch (rpcError) {
      console.error("Error creating default pipeline stages:", rpcError);
    }

    try {
      await supabaseAdmin.rpc("create_default_task_columns", { _agency_id: agencyId });
    } catch (rpcError) {
      console.error("Error creating default task columns:", rpcError);
    }

    return new Response(
      JSON.stringify({ success: true, agency_id: agencyId, trial_ends_at: trialEnd.toISOString() }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (error: any) {
    console.error("Error in create-trial-agency:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  }
};

serve(handler);
