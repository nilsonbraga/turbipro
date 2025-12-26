import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.21.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CheckoutRequest {
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  agency_id: string;
  agency_name: string;
  agency_email: string;
  coupon_code?: string;
  success_url: string;
  cancel_url: string;
}

async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting Stripe checkout session creation...");

    // Get Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe key from platform_settings
    const { data: settingsData, error: settingsError } = await supabase
      .from("platform_settings")
      .select("setting_value")
      .eq("setting_key", "stripe_secret_key")
      .single();

    if (settingsError || !settingsData?.setting_value) {
      console.error("Stripe key not configured:", settingsError);
      return new Response(
        JSON.stringify({ error: "Stripe não configurado. Configure a chave do Stripe nas configurações." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(settingsData.setting_value, { apiVersion: "2023-10-16" });

    const body: CheckoutRequest = await req.json();
    console.log("Request body:", { ...body, coupon_code: body.coupon_code ? "[REDACTED]" : undefined });

    // Get the plan details
    const { data: plan, error: planError } = await supabase
      .from("subscription_plans")
      .select("*")
      .eq("id", body.plan_id)
      .single();

    if (planError || !plan) {
      console.error("Plan not found:", planError);
      return new Response(
        JSON.stringify({ error: "Plano não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if plan has Stripe price ID
    const priceId = body.billing_cycle === 'monthly' 
      ? plan.stripe_price_id_monthly 
      : plan.stripe_price_id_yearly;

    if (!priceId) {
      console.error("Stripe price ID not configured for plan");
      return new Response(
        JSON.stringify({ error: "Este plano não tem preço configurado no Stripe" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check for existing Stripe customer
    let customerId: string | undefined;
    const { data: existingSub } = await supabase
      .from("agency_subscriptions")
      .select("stripe_customer_id")
      .eq("agency_id", body.agency_id)
      .single();

    if (existingSub?.stripe_customer_id) {
      customerId = existingSub.stripe_customer_id;
    } else {
      // Create new customer
      const customer = await stripe.customers.create({
        email: body.agency_email,
        name: body.agency_name,
        metadata: { agency_id: body.agency_id },
      });
      customerId = customer.id;
    }

    // Check for internal coupon
    let discountPercentage = 0;
    let couponId: string | null = null;
    if (body.coupon_code) {
      const { data: coupon } = await supabase
        .from("discount_coupons")
        .select("*")
        .eq("code", body.coupon_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const now = new Date();
        const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
        
        if ((!validFrom || now >= validFrom) && (!validUntil || now <= validUntil)) {
          if (!coupon.max_uses || coupon.current_uses < coupon.max_uses) {
            if (!coupon.applicable_plans || coupon.applicable_plans.includes(body.plan_id)) {
              discountPercentage = coupon.discount_type === 'percentage' 
                ? coupon.discount_value 
                : 0; // For fixed amount, handle differently
              couponId = coupon.id;
            }
          }
        }
      }
    }

    // Create checkout session
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: body.success_url,
      cancel_url: body.cancel_url,
      metadata: {
        agency_id: body.agency_id,
        plan_id: body.plan_id,
        billing_cycle: body.billing_cycle,
        coupon_id: couponId || "",
        discount_percentage: discountPercentage.toString(),
      },
      subscription_data: {
        metadata: {
          agency_id: body.agency_id,
          plan_id: body.plan_id,
        },
        trial_period_days: plan.trial_days || undefined,
      },
    };

    // Apply Stripe coupon if we have discount
    if (discountPercentage > 0) {
      // Create a Stripe coupon on-the-fly for this session
      const stripeCoupon = await stripe.coupons.create({
        percent_off: discountPercentage,
        duration: "once",
      });
      sessionParams.discounts = [{ coupon: stripeCoupon.id }];
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    console.log("Checkout session created:", session.id);

    return new Response(
      JSON.stringify({ url: session.url, session_id: session.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
}

serve(handler);
