-- Tabela para armazenar emails enviados e recebidos
CREATE TABLE public.agency_emails (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL DEFAULT 'smtp', -- 'smtp', 'gmail', 'outlook'
  message_id TEXT, -- ID externo do email
  thread_id TEXT, -- Para agrupamento de threads
  from_email TEXT NOT NULL,
  from_name TEXT,
  to_emails TEXT[] NOT NULL,
  cc_emails TEXT[],
  bcc_emails TEXT[],
  subject TEXT NOT NULL,
  body_text TEXT,
  body_html TEXT,
  is_read BOOLEAN DEFAULT false,
  is_starred BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false, -- true = enviado, false = recebido
  folder TEXT DEFAULT 'inbox', -- inbox, sent, drafts, trash
  sent_at TIMESTAMP WITH TIME ZONE,
  received_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para configuração OAuth do Gmail/Outlook
CREATE TABLE public.agency_email_oauth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE UNIQUE,
  provider TEXT NOT NULL, -- 'gmail' ou 'outlook'
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  email_address TEXT,
  is_configured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Tabela para conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agency_id UUID NOT NULL REFERENCES public.agencies(id) ON DELETE CASCADE,
  wa_contact_id TEXT NOT NULL, -- Número do WhatsApp do contato
  contact_name TEXT,
  contact_phone TEXT NOT NULL,
  client_id UUID REFERENCES public.clients(id), -- Vincular a um cliente se existir
  last_message_at TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(agency_id, wa_contact_id)
);

-- Tabela para mensagens do WhatsApp
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  wa_message_id TEXT, -- ID da mensagem no WhatsApp
  direction TEXT NOT NULL, -- 'inbound' ou 'outbound'
  message_type TEXT NOT NULL DEFAULT 'text', -- text, image, document, audio, video
  content TEXT,
  media_url TEXT,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- RLS para agency_emails
ALTER TABLE public.agency_emails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their emails"
  ON public.agency_emails FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all emails"
  ON public.agency_emails FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS para agency_email_oauth
ALTER TABLE public.agency_email_oauth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency admins can manage their email OAuth"
  ON public.agency_email_oauth FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()) AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Super admin can manage all email OAuth"
  ON public.agency_email_oauth FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS para whatsapp_conversations
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their WhatsApp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (agency_id = get_user_agency_id(auth.uid()));

CREATE POLICY "Super admin can manage all WhatsApp conversations"
  ON public.whatsapp_conversations FOR ALL
  USING (is_super_admin(auth.uid()));

-- RLS para whatsapp_messages
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Agency users can manage their WhatsApp messages"
  ON public.whatsapp_messages FOR ALL
  USING (conversation_id IN (
    SELECT id FROM public.whatsapp_conversations 
    WHERE agency_id = get_user_agency_id(auth.uid())
  ));

CREATE POLICY "Super admin can manage all WhatsApp messages"
  ON public.whatsapp_messages FOR ALL
  USING (is_super_admin(auth.uid()));

-- Triggers para updated_at
CREATE TRIGGER update_agency_emails_updated_at
  BEFORE UPDATE ON public.agency_emails
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agency_email_oauth_updated_at
  BEFORE UPDATE ON public.agency_email_oauth
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_whatsapp_conversations_updated_at
  BEFORE UPDATE ON public.whatsapp_conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_agency_emails_agency_id ON public.agency_emails(agency_id);
CREATE INDEX idx_agency_emails_folder ON public.agency_emails(folder);
CREATE INDEX idx_whatsapp_conversations_agency_id ON public.whatsapp_conversations(agency_id);
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);