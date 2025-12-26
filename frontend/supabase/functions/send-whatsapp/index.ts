import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SendWhatsAppRequest {
  to: string;
  message: string;
  phone_number_id: string;
  access_token: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, message, phone_number_id, access_token }: SendWhatsAppRequest = await req.json();

    if (!to || !message || !phone_number_id || !access_token) {
      return new Response(
        JSON.stringify({ error: "Parâmetros obrigatórios não fornecidos" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Limpar número de telefone
    const cleanPhone = to.replace(/\D/g, "");

    console.log(`Enviando mensagem WhatsApp para ${cleanPhone}`);

    // Enviar mensagem via WhatsApp Cloud API
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: cleanPhone,
          type: "text",
          text: {
            preview_url: false,
            body: message,
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Erro da API WhatsApp:", data);
      return new Response(
        JSON.stringify({ error: data.error?.message || "Erro ao enviar mensagem" }),
        { status: response.status, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("Mensagem enviada com sucesso:", data);

    return new Response(
      JSON.stringify({ success: true, message_id: data.messages?.[0]?.id }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Erro ao enviar mensagem WhatsApp:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
