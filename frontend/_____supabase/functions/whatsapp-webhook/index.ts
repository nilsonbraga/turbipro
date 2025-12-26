import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const handler = async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  
  // Handle webhook verification (GET request from Meta)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    console.log("Webhook verification request:", { mode, token, challenge });

    if (mode === "subscribe") {
      // Get all verify tokens from configured agencies
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      const { data: configs } = await supabaseAdmin
        .from("agency_whatsapp_config")
        .select("webhook_verify_token, agency_id")
        .eq("is_configured", true);

      const validTokens = configs?.map(c => c.webhook_verify_token).filter(Boolean) || [];

      if (token && validTokens.includes(token)) {
        console.log("Webhook verified successfully");
        return new Response(challenge, {
          status: 200,
          headers: { "Content-Type": "text/plain" },
        });
      }
    }

    return new Response("Forbidden", { status: 403 });
  }

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle incoming messages (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("Received webhook:", JSON.stringify(body, null, 2));

      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      );

      // Process incoming messages
      if (body.entry) {
        for (const entry of body.entry) {
          const changes = entry.changes || [];
          
          for (const change of changes) {
            if (change.field === "messages") {
              const value = change.value;
              const phoneNumberId = value.metadata?.phone_number_id;
              const messages = value.messages || [];
              const contacts = value.contacts || [];

              // Find agency by phone_number_id
              const { data: configData } = await supabaseAdmin
                .from("agency_whatsapp_config")
                .select("agency_id")
                .eq("phone_number_id", phoneNumberId)
                .eq("is_configured", true)
                .maybeSingle();

              if (!configData) {
                console.log("No agency found for phone_number_id:", phoneNumberId);
                continue;
              }

              const agencyId = configData.agency_id;

              for (const message of messages) {
                const contact = contacts.find((c: any) => c.wa_id === message.from);
                const contactName = contact?.profile?.name || null;
                const contactPhone = message.from;

                console.log("Processing incoming message:", {
                  from: contactPhone,
                  contact_name: contactName,
                  type: message.type,
                  text: message.text?.body,
                  timestamp: message.timestamp,
                });

                // Find or create conversation
                let { data: conversation } = await supabaseAdmin
                  .from("whatsapp_conversations")
                  .select("*")
                  .eq("agency_id", agencyId)
                  .eq("wa_contact_id", contactPhone)
                  .maybeSingle();

                if (!conversation) {
                  // Create new conversation
                  const { data: newConv, error: convError } = await supabaseAdmin
                    .from("whatsapp_conversations")
                    .insert({
                      agency_id: agencyId,
                      wa_contact_id: contactPhone,
                      contact_phone: contactPhone,
                      contact_name: contactName,
                      unread_count: 1,
                      last_message_at: new Date().toISOString(),
                    })
                    .select()
                    .single();

                  if (convError) {
                    console.error("Error creating conversation:", convError);
                    continue;
                  }
                  conversation = newConv;
                } else {
                  // Update existing conversation
                  await supabaseAdmin
                    .from("whatsapp_conversations")
                    .update({
                      contact_name: contactName || conversation.contact_name,
                      unread_count: (conversation.unread_count || 0) + 1,
                      last_message_at: new Date().toISOString(),
                    })
                    .eq("id", conversation.id);
                }

                // Save message
                let content = null;
                let messageType = message.type;

                if (message.type === "text") {
                  content = message.text?.body;
                } else if (message.type === "image") {
                  content = message.image?.caption || "[Imagem]";
                } else if (message.type === "document") {
                  content = message.document?.filename || "[Documento]";
                } else if (message.type === "audio") {
                  content = "[Áudio]";
                } else if (message.type === "video") {
                  content = message.video?.caption || "[Vídeo]";
                } else if (message.type === "sticker") {
                  content = "[Figurinha]";
                } else if (message.type === "location") {
                  content = `[Localização: ${message.location?.latitude}, ${message.location?.longitude}]`;
                } else {
                  content = `[${message.type}]`;
                }

                const { error: msgError } = await supabaseAdmin
                  .from("whatsapp_messages")
                  .insert({
                    conversation_id: conversation.id,
                    wa_message_id: message.id,
                    direction: "inbound",
                    message_type: messageType,
                    content: content,
                    status: "received",
                    sent_at: new Date(parseInt(message.timestamp) * 1000).toISOString(),
                  });

                if (msgError) {
                  console.error("Error saving message:", msgError);
                }
              }

              // Process status updates
              const statuses = value.statuses || [];
              for (const status of statuses) {
                console.log("Processing status update:", status);
                
                // Update message status
                const { error: statusError } = await supabaseAdmin
                  .from("whatsapp_messages")
                  .update({ status: status.status })
                  .eq("wa_message_id", status.id);

                if (statusError) {
                  console.error("Error updating message status:", statusError);
                }
              }
            }
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    } catch (error: any) {
      console.error("Error processing webhook:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405 });
};

serve(handler);
