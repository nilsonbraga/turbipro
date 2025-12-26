import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAgencyResendConfig, ResendConfigInput } from "@/hooks/useAgencyResendConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  Mail, 
  Send, 
  Star, 
  Trash2, 
  Search, 
  RefreshCw, 
  Plus,
  Inbox,
  SendHorizontal,
  FileText,
  AlertTriangle,
  Loader2,
  StarOff,
  Info,
  ExternalLink,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { apiFetch } from "@/lib/api";

interface Email {
  id: string;
  from_email: string;
  from_name: string | null;
  to_emails: string[];
  subject: string;
  body_text: string | null;
  body_html: string | null;
  is_read: boolean;
  is_starred: boolean;
  is_sent: boolean;
  folder: string;
  sent_at: string | null;
  received_at: string | null;
  created_at: string;
}

// Inline config component for email page
function EmailConfigSetup({ onConfigured }: { onConfigured: () => void }) {
  const { config, saveConfig, isSaving } = useAgencyResendConfig();
  const [apiKey, setApiKey] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [fromName, setFromName] = useState('');

  const handleSave = () => {
    if (!apiKey || !fromEmail) {
      toast.error('Preencha a API Key e o email do remetente');
      return;
    }

    const data: ResendConfigInput = {
      api_key: apiKey,
      from_email: fromEmail,
      from_name: fromName,
    };

    saveConfig(data, {
      onSuccess: () => {
        onConfigured();
      },
    });
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Configure o Email</CardTitle>
          <CardDescription>
            Para usar o módulo de email, configure o Resend primeiro
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <p className="mb-2">
                Para usar o Resend, você precisa criar uma conta gratuita em{' '}
                <a 
                  href="https://resend.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  resend.com <ExternalLink className="h-3 w-3" />
                </a>
              </p>
              <p className="text-sm text-muted-foreground">
                1. Crie uma conta no Resend<br />
                2. Adicione e verifique seu domínio<br />
                3. Crie uma API Key<br />
                4. Cole a API Key abaixo
              </p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key *</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="re_xxxxxxxx"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromName">Nome do Remetente</Label>
              <Input
                id="fromName"
                placeholder="Minha Agência de Viagens"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fromEmail">Email do Remetente *</Label>
              <Input
                id="fromEmail"
                type="email"
                placeholder="contato@seudominio.com"
                value={fromEmail}
                onChange={(e) => setFromEmail(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                Use um email do domínio verificado no Resend
              </p>
            </div>
          </div>

          <Button 
            onClick={handleSave} 
            disabled={isSaving || !apiKey || !fromEmail}
            className="w-full"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Configurar e Continuar'
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

const EmailPage = () => {
  const { profile } = useAuth();
  const { config, isLoading: isLoadingConfig } = useAgencyResendConfig();
  const [showConfig, setShowConfig] = useState(false);
  
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [activeFolder, setActiveFolder] = useState("inbox");
  const [newEmail, setNewEmail] = useState({
    to: "",
    subject: "",
    body: ""
  });

  // Check if we should show config based on config state
  useEffect(() => {
    if (!isLoadingConfig && !config?.is_configured) {
      setShowConfig(true);
    } else {
      setShowConfig(false);
    }
  }, [config, isLoadingConfig]);

  const fetchEmails = async () => {
    if (!profile?.agency_id) return;
    
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        where: JSON.stringify({ agencyId: profile.agency_id, folder: activeFolder }),
        orderBy: JSON.stringify({ createdAt: "desc" }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/agencyEmail?${params.toString()}`);
      const mapped = (data || []).map((e) => ({
        id: e.id,
        from_email: e.fromEmail,
        from_name: e.fromName,
        to_emails: e.toEmails || [],
        subject: e.subject,
        body_text: e.bodyText,
        body_html: e.bodyHtml,
        is_read: e.isRead,
        is_starred: e.isStarred,
        is_sent: e.isSent,
        folder: e.folder,
        sent_at: e.sentAt,
        received_at: e.receivedAt,
        created_at: e.createdAt,
      })) as Email[];
      setEmails(mapped);
    } catch (error: any) {
      console.error("Erro ao carregar emails:", error);
      toast.error("Erro ao carregar emails");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [profile?.agency_id, activeFolder]);

  const handleSendEmail = async () => {
    if (!config?.is_configured) {
      toast.error("Configure o Resend nas configurações antes de enviar emails");
      return;
    }

    if (!newEmail.to || !newEmail.subject || !newEmail.body) {
      toast.error("Preencha todos os campos");
      return;
    }

    setIsSending(true);
    try {
      await apiFetch(`/api/agencyEmail`, {
        method: "POST",
        body: JSON.stringify({
          agencyId: profile?.agency_id,
          userId: profile?.id,
          provider: "resend",
          fromEmail: config?.from_email || "",
          fromName: config?.from_name || null,
          toEmails: [newEmail.to],
          subject: newEmail.subject,
          bodyText: newEmail.body,
          bodyHtml: newEmail.body.replace(/\n/g, "<br>"),
          isSent: true,
          folder: "sent",
          sentAt: new Date().toISOString(),
        }),
      });

      toast.success("Email enviado com sucesso!");
      setIsComposeOpen(false);
      setNewEmail({ to: "", subject: "", body: "" });
      if (activeFolder === "sent") {
        fetchEmails();
      }
    } catch (error: any) {
      console.error("Erro ao enviar email:", error);
      toast.error(error.message || "Erro ao enviar email");
    } finally {
      setIsSending(false);
    }
  };

  const handleToggleStar = async (email: Email) => {
    try {
      await apiFetch(`/api/agencyEmail/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({ isStarred: !email.is_starred }),
      });
      
      setEmails(emails.map(e => 
        e.id === email.id ? { ...e, is_starred: !e.is_starred } : e
      ));
      
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, is_starred: !selectedEmail.is_starred });
      }
    } catch (error) {
      toast.error("Erro ao atualizar email");
    }
  };

  const handleMarkAsRead = async (email: Email) => {
    if (email.is_read) return;
    
    try {
      await apiFetch(`/api/agencyEmail/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({ isRead: true }),
      });
      
      setEmails(emails.map(e => 
        e.id === email.id ? { ...e, is_read: true } : e
      ));
    } catch (error) {
      console.error("Erro ao marcar como lido:", error);
    }
  };

  const handleDelete = async (email: Email) => {
    try {
      await apiFetch(`/api/agencyEmail/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({ folder: "trash" }),
      });
      
      setEmails(emails.filter(e => e.id !== email.id));
      setSelectedEmail(null);
      toast.success("Email movido para lixeira");
    } catch (error) {
      toast.error("Erro ao excluir email");
    }
  };

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.from_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (email.from_name && email.from_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) {
      return format(date, "HH:mm", { locale: ptBR });
    }
    return format(date, "dd/MM/yyyy", { locale: ptBR });
  };

  const getFolderIcon = (folder: string) => {
    switch (folder) {
      case "inbox": return <Inbox className="h-4 w-4" />;
      case "sent": return <SendHorizontal className="h-4 w-4" />;
      case "drafts": return <FileText className="h-4 w-4" />;
      case "trash": return <Trash2 className="h-4 w-4" />;
      default: return <Mail className="h-4 w-4" />;
    }
  };

  const getFolderLabel = (folder: string) => {
    switch (folder) {
      case "inbox": return "Caixa de Entrada";
      case "sent": return "Enviados";
      case "drafts": return "Rascunhos";
      case "trash": return "Lixeira";
      default: return folder;
    }
  };

  if (isLoadingConfig) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show configuration setup if not configured
  if (showConfig) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">
            Gerencie seus emails
          </p>
        </div>
        <EmailConfigSetup onConfigured={() => setShowConfig(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Email</h1>
          <p className="text-muted-foreground">
            Gerencie seus emails
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchEmails} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          <Dialog open={isComposeOpen} onOpenChange={setIsComposeOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Email
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Novo Email</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="to">Para</Label>
                  <Input
                    id="to"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={newEmail.to}
                    onChange={(e) => setNewEmail({ ...newEmail, to: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto</Label>
                  <Input
                    id="subject"
                    placeholder="Assunto do email"
                    value={newEmail.subject}
                    onChange={(e) => setNewEmail({ ...newEmail, subject: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="body">Mensagem</Label>
                  <Textarea
                    id="body"
                    placeholder="Digite sua mensagem..."
                    rows={10}
                    value={newEmail.body}
                    onChange={(e) => setNewEmail({ ...newEmail, body: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsComposeOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleSendEmail} disabled={isSending}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Enviar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {!config?.is_configured && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Configure o Resend nas configurações (Integrações) para enviar emails.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-12 gap-6 h-[calc(100vh-250px)]">
        {/* Sidebar de pastas */}
        <div className="col-span-2">
          <Card className="h-full">
            <CardContent className="p-2">
              <div className="space-y-1">
                {["inbox", "sent", "drafts", "trash"].map((folder) => (
                  <Button
                    key={folder}
                    variant={activeFolder === folder ? "secondary" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => setActiveFolder(folder)}
                  >
                    {getFolderIcon(folder)}
                    <span className="ml-2">{getFolderLabel(folder)}</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de emails */}
        <div className="col-span-4">
          <Card className="h-full flex flex-col">
            <CardHeader className="pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar emails..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ScrollArea className="h-full">
                {isLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : filteredEmails.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
                    <Mail className="h-8 w-8 mb-2" />
                    <p>Nenhum email encontrado</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {filteredEmails.map((email) => (
                      <div
                        key={email.id}
                        className={`p-3 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedEmail?.id === email.id ? "bg-muted" : ""
                        } ${!email.is_read ? "bg-primary/5" : ""}`}
                        onClick={() => {
                          setSelectedEmail(email);
                          handleMarkAsRead(email);
                        }}
                      >
                        <div className="flex items-start gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleStar(email);
                            }}
                          >
                            {email.is_starred ? (
                              <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            ) : (
                              <StarOff className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className={`font-medium truncate ${!email.is_read ? "font-semibold" : ""}`}>
                                {email.is_sent ? email.to_emails[0] : (email.from_name || email.from_email)}
                              </span>
                              <span className="text-xs text-muted-foreground shrink-0">
                                {formatDate(email.sent_at || email.created_at)}
                              </span>
                            </div>
                            <p className={`text-sm truncate ${!email.is_read ? "font-medium" : "text-muted-foreground"}`}>
                              {email.subject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {email.body_text?.substring(0, 100)}
                            </p>
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

        {/* Conteúdo do email */}
        <div className="col-span-6">
          <Card className="h-full flex flex-col">
            {selectedEmail ? (
              <>
                <CardHeader className="border-b">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{selectedEmail.subject}</CardTitle>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">
                          {selectedEmail.is_sent ? "Para: " : "De: "}
                        </span>
                        {selectedEmail.is_sent 
                          ? selectedEmail.to_emails.join(", ")
                          : `${selectedEmail.from_name || ""} <${selectedEmail.from_email}>`
                        }
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(selectedEmail.sent_at || selectedEmail.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStar(selectedEmail)}
                      >
                        {selectedEmail.is_starred ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(selectedEmail)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto p-6">
                  {selectedEmail.body_html ? (
                    <div 
                      className="prose prose-sm max-w-none dark:prose-invert"
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body_html }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-sm">
                      {selectedEmail.body_text}
                    </pre>
                  )}
                </CardContent>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <Mail className="h-12 w-12 mb-4" />
                <p>Selecione um email para visualizar</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EmailPage;
