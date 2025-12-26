import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Create Supabase client with user's JWT
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("Auth error:", userError);
      throw new Error("Unauthorized");
    }

    console.log("User authenticated:", user.id);

    // Get user's agency_id from profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("agency_id")
      .eq("id", user.id)
      .single();

    if (profileError || !profile?.agency_id) {
      console.error("Profile error:", profileError);
      throw new Error("User has no agency");
    }

    console.log("Agency ID:", profile.agency_id);

    // Get Resend configuration for the agency using service role
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { data: resendConfig, error: configError } = await supabaseAdmin
      .from("agency_resend_config")
      .select("*")
      .eq("agency_id", profile.agency_id)
      .single();

    if (configError || !resendConfig) {
      console.error("Resend config error:", configError);
      throw new Error("Resend não configurado. Vá em Configurações > Integrações para configurar.");
    }

    if (!resendConfig.api_key_encrypted) {
      throw new Error("API Key do Resend não configurada");
    }

    if (!resendConfig.from_email) {
      throw new Error("Email do remetente não configurado");
    }

    console.log("Resend config found, sending email...");

    // Parse request body
    const { to, subject, body }: SendEmailRequest = await req.json();

    if (!to || !subject || !body) {
      throw new Error("Missing required fields: to, subject, body");
    }

    // Initialize Resend with agency's API key
    const resend = new Resend(resendConfig.api_key_encrypted);

    // Send email
    const fromAddress = resendConfig.from_name 
      ? `${resendConfig.from_name} <${resendConfig.from_email}>`
      : resendConfig.from_email;

    console.log(`Sending email from ${fromAddress} to ${to}`);

    const emailResponse = await resend.emails.send({
      from: fromAddress,
      to: [to],
      subject: subject,
      html: body,
    });

    console.log("Resend API response:", emailResponse);

    // Check if Resend returned an error
    if (emailResponse.error) {
      console.error("Resend error:", emailResponse.error);
      throw new Error(emailResponse.error.message || "Erro ao enviar email via Resend");
    }

    console.log("Email sent successfully:", emailResponse.data);

    return new Response(
      JSON.stringify({ success: true, data: emailResponse.data }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in send-email function:", errorMessage);
    
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
