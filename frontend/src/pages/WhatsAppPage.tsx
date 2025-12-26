import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  MessageCircle, 
  Send, 
  Search, 
  Settings,
  Plus,
  CheckCheck,
  Check,
  AlertTriangle,
  Loader2,
  Phone
} from "lucide-react";
import { format } from "date-fns";
import { apiFetch } from "@/lib/api";

interface WhatsAppConfig {
  id: string;
  phone_number_id: string | null;
  access_token: string | null;
  business_account_id: string | null;
  webhook_verify_token: string | null;
  is_configured: boolean | null;
}

interface Conversation {
  id: string;
  wa_contact_id: string;
  contact_name: string | null;
  contact_phone: string;
  unread_count: number;
  last_message_at: string | null;
}

interface Message {
  id: string;
  direction: string;
  message_type: string;
  content: string | null;
  status: string;
  sent_at: string;
}

const WhatsAppPage = () => {
  const { profile } = useAuth();
  
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState(true);
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [isNewConversationOpen, setIsNewConversationOpen] = useState(false);
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactName, setNewContactName] = useState("");
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [configForm, setConfigForm] = useState({
    phone_number_id: "",
    access_token: "",
    business_account_id: "",
    webhook_verify_token: ""
  });

  const mapConfig = (data: any): WhatsAppConfig => ({
    id: data.id,
    phone_number_id: data.phoneNumberId,
    access_token: data.accessToken,
    business_account_id: data.businessAccountId,
    webhook_verify_token: data.webhookVerifyToken,
    is_configured: data.isConfigured,
  });

  const mapConversation = (c: any): Conversation => ({
    id: c.id,
    wa_contact_id: c.waContactId,
    contact_name: c.contactName,
    contact_phone: c.contactPhone,
    unread_count: c.unreadCount,
    last_message_at: c.lastMessageAt,
  });

  const mapMessage = (m: any): Message => ({
    id: m.id,
    direction: m.direction,
    message_type: m.messageType,
    content: m.content,
    status: m.status,
    sent_at: m.sentAt,
  });

  // Carregar configuração
  useEffect(() => {
    const fetchConfig = async () => {
      if (!profile?.agency_id) {
        setIsLoadingConfig(false);
        return;
      }
      
      try {
        const params = new URLSearchParams({
          where: JSON.stringify({ agencyId: profile.agency_id }),
          take: '1',
        });
        const { data } = await apiFetch<{ data: any[] }>(`/api/agencyWhatsappConfig?${params.toString()}`);
        const item = data?.[0];
        if (item) {
          const configData = mapConfig(item);
          setConfig(configData);
          setConfigForm({
            phone_number_id: configData.phone_number_id || "",
            access_token: configData.access_token || "",
            business_account_id: configData.business_account_id || "",
            webhook_verify_token: configData.webhook_verify_token || ""
          });
        }
      } catch (error) {
        console.error("Erro ao carregar configuração:", error);
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchConfig();
  }, [profile?.agency_id]);

  // Carregar conversas
  const fetchConversations = async () => {
    if (!profile?.agency_id) return;
    
    try {
      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: profile.agency_id }),
        orderBy: JSON.stringify({ lastMessageAt: "desc" }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/whatsappConversation?${params.toString()}`);
      setConversations((data || []).map(mapConversation));
    } catch (error) {
      console.error("Erro ao carregar conversas:", error);
    }
  };

  useEffect(() => {
    if (config?.is_configured) {
      fetchConversations();
    }
  }, [profile?.agency_id, config?.is_configured]);

  // Carregar mensagens da conversa selecionada
  const fetchMessages = async (conversationId: string) => {
    setIsLoadingMessages(true);
    try {
      const params = new URLSearchParams({
        where: JSON.stringify({ conversationId }),
        orderBy: JSON.stringify({ sentAt: "asc" }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/whatsappMessage?${params.toString()}`);
      setMessages((data || []).map(mapMessage));
      
      await apiFetch(`/api/whatsappConversation/${conversationId}`, {
        method: "PUT",
        body: JSON.stringify({ unreadCount: 0 }),
      });
      
      setConversations(conversations.map(c => 
        c.id === conversationId ? { ...c, unread_count: 0 } : c
      ));
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Scroll para última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Salvar configuração
  const handleSaveConfig = async () => {
    if (!profile?.agency_id) return;
    
    setIsSavingConfig(true);
    try {
      const configData = {
        agency_id: profile.agency_id,
        phone_number_id: configForm.phone_number_id || null,
        access_token: configForm.access_token || null,
        business_account_id: configForm.business_account_id || null,
        webhook_verify_token: configForm.webhook_verify_token || null,
        is_configured: !!(configForm.phone_number_id && configForm.access_token)
      };

      if (config?.id) {
        await apiFetch(`/api/agencyWhatsappConfig/${config.id}`, {
          method: "PUT",
          body: JSON.stringify({
            phoneNumberId: configData.phone_number_id,
            accessToken: configData.access_token,
            businessAccountId: configData.business_account_id,
            webhookVerifyToken: configData.webhook_verify_token,
            isConfigured: configData.is_configured,
          }),
        });
      } else {
        await apiFetch(`/api/agencyWhatsappConfig`, {
          method: "POST",
          body: JSON.stringify({
            agencyId: profile.agency_id,
            phoneNumberId: configData.phone_number_id,
            accessToken: configData.access_token,
            businessAccountId: configData.business_account_id,
            webhookVerifyToken: configData.webhook_verify_token,
            isConfigured: configData.is_configured,
          }),
        });
      }

      toast.success("Configuração salva com sucesso!");
      
      // Recarregar config
      const { data } = await apiFetch<{ data: any[] }>(`/api/agencyWhatsappConfig?${new URLSearchParams({
        where: JSON.stringify({ agencyId: profile.agency_id }),
        take: '1',
      }).toString()}`);
      const item = data?.[0];
      if (item) setConfig(mapConfig(item));
    } catch (error: any) {
      console.error("Erro ao salvar configuração:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Criar nova conversa
  const handleCreateConversation = async () => {
    if (!profile?.agency_id || !newContactPhone) return;
    
    const phone = newContactPhone.replace(/\D/g, "");
    
    try {
      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: profile.agency_id, contactPhone: phone }),
        take: '1',
      });
      const { data: existingList } = await apiFetch<{ data: any[] }>(`/api/whatsappConversation?${params.toString()}`);
      const existing = existingList?.[0];

      if (existing) {
        const conv = mapConversation(existing);
        setSelectedConversation(conv);
        setIsNewConversationOpen(false);
        return;
      }

      const created = await apiFetch<any>(`/api/whatsappConversation`, {
        method: "POST",
        body: JSON.stringify({
          agencyId: profile.agency_id,
          waContactId: phone,
          contactPhone: phone,
          contactName: newContactName || null,
          unreadCount: 0,
        }),
      });
      
      const newConv = mapConversation(created);
      setConversations([newConv, ...conversations]);
      setSelectedConversation(newConv);
      setIsNewConversationOpen(false);
      setNewContactPhone("");
      setNewContactName("");
      toast.success("Conversa criada!");
    } catch (error: any) {
      console.error("Erro ao criar conversa:", error);
      toast.error("Erro ao criar conversa");
    }
  };

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!selectedConversation || !newMessage.trim() || !config?.is_configured) return;
    
    setIsSending(true);
    try {
      const created = await apiFetch<any>(`/api/whatsappMessage`, {
        method: "POST",
        body: JSON.stringify({
          conversationId: selectedConversation.id,
          agencyId: profile?.agency_id,
          direction: "outbound",
          messageType: "text",
          content: newMessage,
          status: "sent",
          sentAt: new Date().toISOString(),
        }),
      });

      const msg = mapMessage(created);

      await apiFetch(`/api/whatsappConversation/${selectedConversation.id}`, {
        method: "PUT",
        body: JSON.stringify({ lastMessageAt: msg.sent_at }),
      });

      setMessages([...messages, msg]);
      setNewMessage("");
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error(error.message || "Erro ao enviar mensagem");
    } finally {
      setIsSending(false);
    }
  };

  const filteredConversations = conversations.filter(conv =>
    (conv.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    conv.contact_phone.includes(searchTerm)
  );

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-muted-foreground" />;
      default:
        return <Check className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp</h1>
          <p className="text-muted-foreground">
            Gerencie suas conversas do WhatsApp Business
          </p>
        </div>
      </div>

      <Tabs defaultValue={config?.is_configured ? "chat" : "config"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Conversas
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat">
          {!config?.is_configured ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>WhatsApp não configurado</AlertTitle>
              <AlertDescription>
                Configure as credenciais do WhatsApp Business API na aba de configurações.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="grid grid-cols-12 gap-6 h-[calc(100vh-280px)]">
              {/* Lista de conversas */}
              <div className="col-span-4">
                <Card className="h-full flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          placeholder="Buscar conversas..."
                          className="pl-10"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                      <Dialog open={isNewConversationOpen} onOpenChange={setIsNewConversationOpen}>
                        <DialogTrigger asChild>
                          <Button size="icon">
                            <Plus className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Nova Conversa</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label>Número do WhatsApp</Label>
                              <Input
                                placeholder="5511999999999"
                                value={newContactPhone}
                                onChange={(e) => setNewContactPhone(e.target.value)}
                              />
                              <p className="text-xs text-muted-foreground">
                                Digite o número com código do país (ex: 5511999999999)
                              </p>
                            </div>
                            <div className="space-y-2">
                              <Label>Nome (opcional)</Label>
                              <Input
                                placeholder="Nome do contato"
                                value={newContactName}
                                onChange={(e) => setNewContactName(e.target.value)}
                              />
                            </div>
                            <Button onClick={handleCreateConversation} className="w-full">
                              Iniciar Conversa
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 p-0 overflow-hidden">
                    <ScrollArea className="h-full">
                      {filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                          <MessageCircle className="h-8 w-8 mb-2" />
                          <p>Nenhuma conversa</p>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredConversations.map((conv) => (
                            <div
                              key={conv.id}
                              className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                                selectedConversation?.id === conv.id ? "bg-muted" : ""
                              }`}
                              onClick={() => setSelectedConversation(conv)}
                            >
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarFallback className="bg-green-500 text-white">
                                    {(conv.contact_name || conv.contact_phone).charAt(0).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between">
                                    <span className="font-medium truncate">
                                      {conv.contact_name || conv.contact_phone}
                                    </span>
                                    {conv.last_message_at && (
                                      <span className="text-xs text-muted-foreground">
                                        {format(new Date(conv.last_message_at), "HH:mm")}
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground truncate">
                                      {conv.contact_phone}
                                    </p>
                                    {conv.unread_count > 0 && (
                                      <Badge variant="default" className="ml-2">
                                        {conv.unread_count}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Chat */}
              <div className="col-span-8">
                <Card className="h-full flex flex-col">
                  {selectedConversation ? (
                    <>
                      <CardHeader className="border-b py-3">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback className="bg-green-500 text-white">
                              {(selectedConversation.contact_name || selectedConversation.contact_phone).charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <CardTitle className="text-base">
                              {selectedConversation.contact_name || selectedConversation.contact_phone}
                            </CardTitle>
                            <CardDescription className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {selectedConversation.contact_phone}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 overflow-hidden p-0">
                        <ScrollArea className="h-full p-4">
                          {isLoadingMessages ? (
                            <div className="flex items-center justify-center h-full">
                              <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                          ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <MessageCircle className="h-12 w-12 mb-2" />
                              <p>Nenhuma mensagem ainda</p>
                              <p className="text-sm">Envie uma mensagem para iniciar a conversa</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {messages.map((msg) => (
                                <div
                                  key={msg.id}
                                  className={`flex ${msg.direction === "outbound" ? "justify-end" : "justify-start"}`}
                                >
                                  <div
                                    className={`max-w-[70%] rounded-lg px-3 py-2 ${
                                      msg.direction === "outbound"
                                        ? "bg-green-500 text-white"
                                        : "bg-muted"
                                    }`}
                                  >
                                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                                    <div className={`flex items-center justify-end gap-1 mt-1 ${
                                      msg.direction === "outbound" ? "text-green-100" : "text-muted-foreground"
                                    }`}>
                                      <span className="text-xs">
                                        {format(new Date(msg.sent_at), "HH:mm")}
                                      </span>
                                      {msg.direction === "outbound" && getStatusIcon(msg.status)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                              <div ref={messagesEndRef} />
                            </div>
                          )}
                        </ScrollArea>
                      </CardContent>
                      <div className="border-t p-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Digite sua mensagem..."
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSendMessage();
                              }
                            }}
                          />
                          <Button onClick={handleSendMessage} disabled={isSending || !newMessage.trim()}>
                            {isSending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mb-4" />
                      <p>Selecione uma conversa para começar</p>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do WhatsApp Business API</CardTitle>
              <CardDescription>
                Configure as credenciais da sua conta do WhatsApp Business API.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Como configurar</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>Para usar o WhatsApp Business API, você precisa:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Criar uma conta no <a href="https://business.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta Business Suite</a></li>
                    <li>Criar um app no <a href="https://developers.facebook.com/apps" target="_blank" rel="noopener noreferrer" className="text-primary underline">Meta for Developers</a></li>
                    <li>Adicionar o produto "WhatsApp" ao seu app</li>
                    <li>Obter o Phone Number ID e Access Token</li>
                    <li>Configurar o webhook com a URL abaixo</li>
                  </ol>
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Phone Number ID</Label>
                  <Input
                    placeholder="Seu Phone Number ID do WhatsApp"
                    value={configForm.phone_number_id}
                    onChange={(e) => setConfigForm({ ...configForm, phone_number_id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Access Token</Label>
                  <Input
                    type="password"
                    placeholder="Seu Access Token permanente"
                    value={configForm.access_token}
                    onChange={(e) => setConfigForm({ ...configForm, access_token: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Business Account ID (opcional)</Label>
                  <Input
                    placeholder="ID da sua conta business"
                    value={configForm.business_account_id}
                    onChange={(e) => setConfigForm({ ...configForm, business_account_id: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Webhook Verify Token</Label>
                  <Input
                    placeholder="Token de verificação do webhook"
                    value={configForm.webhook_verify_token}
                    onChange={(e) => setConfigForm({ ...configForm, webhook_verify_token: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Este token será usado para verificar o webhook. Crie um token único e seguro.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <div className="flex gap-2">
                    <Input
                      readOnly
                      value={`http://localhost:3001/webhooks/whatsapp`}
                    />
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(`http://localhost:3001/webhooks/whatsapp`);
                        toast.success("URL copiada!");
                      }}
                    >
                      Copiar
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Configure esta URL como webhook no Meta for Developers. Selecione os eventos: messages, message_deliveries, message_reads.
                  </p>
                </div>
              </div>

              <Button onClick={handleSaveConfig} disabled={isSavingConfig}>
                {isSavingConfig ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Salvar Configurações
              </Button>

              {config?.is_configured && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCheck className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">WhatsApp configurado</AlertTitle>
                  <AlertDescription className="text-green-700">
                    Sua integração com o WhatsApp Business API está ativa.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WhatsAppPage;
