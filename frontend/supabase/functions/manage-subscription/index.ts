import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ManageRequest {
  action: 'change_plan' | 'change_cycle' | 'cancel' | 'create_portal' | 'create' | 'update';
  agency_id: string;
  new_plan_id?: string;
  new_billing_cycle?: 'monthly' | 'yearly';
  return_url?: string;
  // Manual update fields
  plan_id?: string;
  billing_cycle?: 'monthly' | 'yearly';
  status?: string;
  current_period_start?: string;
  current_period_end?: string;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Manage subscription request received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userSupabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userSupabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado" }), { 
        status: 401, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    // Check if user is super admin
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    if (roleData?.role !== 'super_admin') {
      return new Response(JSON.stringify({ error: "Acesso negado" }), { 
        status: 403, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      });
    }

    const body: ManageRequest = await req.json();
    console.log("Action:", body.action, "Agency:", body.agency_id);

    // Handle manual create/update actions (no Stripe required)
    if (body.action === 'create' || body.action === 'update') {
      // Get existing subscription
      const { data: existingSub } = await supabase
        .from("agency_subscriptions")
        .select("*")
        .eq("agency_id", body.agency_id)
        .maybeSingle();

      if (body.action === 'create' && existingSub) {
        // If subscription exists, update it instead
        const { error: updateError } = await supabase
          .from("agency_subscriptions")
          .update({
            plan_id: body.plan_id || null,
            billing_cycle: body.billing_cycle || 'monthly',
            status: body.status || 'active',
            current_period_start: body.current_period_start || new Date().toISOString(),
            current_period_end: body.current_period_end,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingSub.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "Assinatura atualizada com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (body.action === 'create') {
        const { error: insertError } = await supabase
          .from("agency_subscriptions")
          .insert({
            agency_id: body.agency_id,
            plan_id: body.plan_id || null,
            billing_cycle: body.billing_cycle || 'monthly',
            status: body.status || 'active',
            current_period_start: body.current_period_start || new Date().toISOString(),
            current_period_end: body.current_period_end,
          });

        if (insertError) {
          console.error("Insert error:", insertError);
          throw insertError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "Assinatura criada com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (body.action === 'update') {
        if (!existingSub) {
          return new Response(
            JSON.stringify({ error: "Assinatura não encontrada" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
        if (body.plan_id !== undefined) updateData.plan_id = body.plan_id || null;
        if (body.billing_cycle) updateData.billing_cycle = body.billing_cycle;
        if (body.status) updateData.status = body.status;
        if (body.current_period_start) updateData.current_period_start = body.current_period_start;
        if (body.current_period_end) updateData.current_period_end = body.current_period_end;

        const { error: updateError } = await supabase
          .from("agency_subscriptions")
          .update(updateData)
          .eq("id", existingSub.id);

        if (updateError) {
          console.error("Update error:", updateError);
          throw updateError;
        }

        return new Response(
          JSON.stringify({ success: true, message: "Assinatura atualizada com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For Stripe-related actions, require Stripe key
    const { data: settingsData } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "stripe_secret_key")
      .single();

    if (!settingsData?.setting_value) {
      return new Response(
        JSON.stringify({ error: "Stripe não configurado. Configure a chave Stripe em Configurações > Integrações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(settingsData.setting_value, { apiVersion: "2023-10-16" });

    // Get agency subscription
    const { data: subscription, error: subError } = await supabase
      .from("agency_subscriptions")
      .select("*")
      .eq("agency_id", body.agency_id)
      .single();

    if (subError && body.action !== 'change_plan') {
      return new Response(
        JSON.stringify({ error: "Assinatura não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    switch (body.action) {
      case "change_plan": {
        if (!body.new_plan_id) {
          return new Response(
            JSON.stringify({ error: "Novo plano não especificado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get new plan details
        const { data: newPlan } = await supabase
          .from("subscription_plans")
          .select("*")
          .eq("id", body.new_plan_id)
          .single();

        if (!newPlan) {
          return new Response(
            JSON.stringify({ error: "Plano não encontrado" }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const billingCycle = body.new_billing_cycle || subscription?.billing_cycle || 'monthly';
        const priceId = billingCycle === 'monthly' 
          ? newPlan.stripe_price_id_monthly 
          : newPlan.stripe_price_id_yearly;

        // If there's a Stripe subscription, update it
        if (subscription?.stripe_subscription_id && priceId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            items: [{
              id: stripeSubscription.items.data[0].id,
              price: priceId,
            }],
            proration_behavior: 'create_prorations',
          });
        }

        // Update in database
        if (subscription) {
          await supabase
            .from("agency_subscriptions")
            .update({
              plan_id: body.new_plan_id,
              billing_cycle: billingCycle,
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscription.id);
        } else {
          // Create new subscription (manual activation)
          const periodDays = billingCycle === 'monthly' ? 30 : 365;
          await supabase
            .from("agency_subscriptions")
            .insert({
              agency_id: body.agency_id,
              plan_id: body.new_plan_id,
              billing_cycle: billingCycle,
              status: 'active',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + periodDays * 24 * 60 * 60 * 1000).toISOString(),
            });
        }

        return new Response(
          JSON.stringify({ success: true, message: "Plano alterado com sucesso" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "change_cycle": {
        if (!body.new_billing_cycle) {
          return new Response(
            JSON.stringify({ error: "Novo ciclo não especificado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        // Get plan details for the new price
        if (subscription?.plan_id) {
          const { data: plan } = await supabase
            .from("subscription_plans")
            .select("*")
            .eq("id", subscription.plan_id)
            .single();

          if (plan && subscription.stripe_subscription_id) {
            const priceId = body.new_billing_cycle === 'monthly' 
              ? plan.stripe_price_id_monthly 
              : plan.stripe_price_id_yearly;

            if (priceId) {
              const stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripe_subscription_id);
              await stripe.subscriptions.update(subscription.stripe_subscription_id, {
                items: [{
                  id: stripeSubscription.items.data[0].id,
                  price: priceId,
                }],
                proration_behavior: 'create_prorations',
              });
            }
          }
        }

        await supabase
          .from("agency_subscriptions")
          .update({
            billing_cycle: body.new_billing_cycle,
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription!.id);

        return new Response(
          JSON.stringify({ success: true, message: "Ciclo de cobrança alterado" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "cancel": {
        if (subscription?.stripe_subscription_id) {
          await stripe.subscriptions.update(subscription.stripe_subscription_id, {
            cancel_at_period_end: true,
          });
        }

        await supabase
          .from("agency_subscriptions")
          .update({
            status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq("id", subscription!.id);

        return new Response(
          JSON.stringify({ success: true, message: "Assinatura cancelada" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "create_portal": {
        if (!subscription?.stripe_customer_id) {
          return new Response(
            JSON.stringify({ error: "Cliente Stripe não encontrado" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }

        const portalSession = await stripe.billingPortal.sessions.create({
          customer: subscription.stripe_customer_id,
          return_url: body.return_url || "https://app.example.com/settings",
        });

        return new Response(
          JSON.stringify({ url: portalSession.url }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: "Ação inválida" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error: any) {
    console.error("Error managing subscription:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
