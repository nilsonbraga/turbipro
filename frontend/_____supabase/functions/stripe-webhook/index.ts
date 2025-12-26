import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, stripe-signature",
};

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Stripe webhook received");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe key from platform_settings
    const { data: settingsData } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "stripe_secret_key")
      .single();

    if (!settingsData?.setting_value) {
      console.error("Stripe key not configured");
      return new Response(JSON.stringify({ error: "Stripe não configurado" }), { status: 400 });
    }

    const stripe = new Stripe(settingsData.setting_value, { apiVersion: "2023-10-16" });

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    // For now, skip signature verification in development
    // In production, you should verify the webhook signature
    let event: Stripe.Event;
    try {
      event = JSON.parse(body) as Stripe.Event;
    } catch (err) {
      console.error("Error parsing webhook body:", err);
      return new Response(JSON.stringify({ error: "Invalid payload" }), { status: 400 });
    }

    console.log("Event type:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout session completed:", session.id);

        const agencyId = session.metadata?.agency_id;
        const planId = session.metadata?.plan_id;
        const billingCycle = session.metadata?.billing_cycle as 'monthly' | 'yearly';
        const couponId = session.metadata?.coupon_id || null;
        const discountPercentage = parseFloat(session.metadata?.discount_percentage || "0");

        if (agencyId && planId) {
          // Get subscription details from Stripe
          const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

          // Update or create agency subscription
          const { data: existingSub } = await supabase
            .from("agency_subscriptions")
            .select("id")
            .eq("agency_id", agencyId)
            .single();

          const subscriptionData = {
            agency_id: agencyId,
            plan_id: planId,
            billing_cycle: billingCycle,
            status: subscription.status === 'trialing' ? 'trialing' : 'active',
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: subscription.id,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            coupon_id: couponId || null,
            discount_applied: discountPercentage > 0 ? discountPercentage : null,
            updated_at: new Date().toISOString(),
          };

          if (existingSub) {
            await supabase
              .from("agency_subscriptions")
              .update(subscriptionData)
              .eq("id", existingSub.id);
          } else {
            await supabase
              .from("agency_subscriptions")
              .insert(subscriptionData);
          }

          // Increment coupon usage
          if (couponId) {
            await supabase.rpc('increment_coupon_usage', { coupon_id: couponId });
          }

          console.log("Subscription created/updated for agency:", agencyId);
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata?.agency_id;

        if (agencyId) {
          await supabase
            .from("agency_subscriptions")
            .update({
              status: subscription.status === 'trialing' ? 'trialing' : 
                      subscription.status === 'active' ? 'active' :
                      subscription.status === 'past_due' ? 'past_due' : 'canceled',
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("agency_id", agencyId);

          console.log("Subscription updated for agency:", agencyId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const agencyId = subscription.metadata?.agency_id;

        if (agencyId) {
          await supabase
            .from("agency_subscriptions")
            .update({
              status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq("agency_id", agencyId);

          console.log("Subscription canceled for agency:", agencyId);
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          await supabase
            .from("agency_subscriptions")
            .update({
              status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscriptionId);

          console.log("Payment failed for subscription:", subscriptionId);
        }
        break;
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
