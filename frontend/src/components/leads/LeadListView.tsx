import { useState } from 'react';
import { Proposal } from '@/hooks/useProposals';
import { PipelineStage } from '@/hooks/usePipelineStages';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDurationMinutes } from '@/utils/sla';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

function getInitials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

const getStageElapsedMinutes = (proposal: Proposal, fallbackEnteredAt?: string | null) => {
  const candidates = [proposal.stage_entered_at, fallbackEnteredAt].filter(Boolean) as string[];
  let enteredAt = proposal.created_at;

  if (candidates.length > 0) {
    const dates = candidates
      .map((value) => new Date(value))
      .filter((date) => !Number.isNaN(date.getTime()));
    if (dates.length > 0) {
      const latest = dates.reduce((max, current) => (current > max ? current : max));
      enteredAt = latest.toISOString();
    }
  }

  if (!enteredAt) {
    enteredAt = proposal.updated_at || proposal.created_at;
  }
  if (!enteredAt) return null;
  const enteredDate = new Date(enteredAt);
  if (Number.isNaN(enteredDate.getTime())) return null;
  return Math.max(0, Math.floor((Date.now() - enteredDate.getTime()) / 60000));
};

const getSlaStatus = (proposal: Proposal, fallbackEnteredAt?: string | null) => {
  const stage = proposal.pipeline_stages;
  if (!stage || stage.is_closed || stage.is_lost) return null;
  const slaMinutes = stage.sla_minutes;
  if (slaMinutes === null || slaMinutes === undefined) return null;
  const elapsedMinutes = getStageElapsedMinutes(proposal, fallbackEnteredAt);
  if (elapsedMinutes === null) return null;
  return { remaining: slaMinutes - elapsedMinutes };
};

interface LeadListViewProps {
  stages: PipelineStage[];
  proposals: Proposal[];
  proposalTags: Record<string, { name: string; color: string }[]>;
  serviceTotals: Record<string, { value: number; commission: number }>;
  stageEnteredAtByProposal: Record<string, string | null>;
  onProposalView: (proposal: Proposal) => void;
  onProposalEdit: (proposal: Proposal) => void;
  onProposalDelete: (proposal: Proposal) => void;
  onProposalClose: (proposal: Proposal) => void;
  onProposalCopyLink: (proposal: Proposal) => void;
}

interface StageSectionProps {
  stage: PipelineStage;
  proposals: Proposal[];
  proposalTags: Record<string, { name: string; color: string }[]>;
  serviceTotals: Record<string, { value: number; commission: number }>;
  stageEnteredAtByProposal: Record<string, string | null>;
  onProposalView: (proposal: Proposal) => void;
  onProposalEdit: (proposal: Proposal) => void;
  onProposalDelete: (proposal: Proposal) => void;
  onProposalClose: (proposal: Proposal) => void;
  onProposalCopyLink: (proposal: Proposal) => void;
}

function StageSection({
  stage,
  proposals,
  proposalTags,
  serviceTotals,
  stageEnteredAtByProposal,
  onProposalView,
  onProposalEdit,
  onProposalDelete,
  onProposalClose,
  onProposalCopyLink,
}: StageSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const totalValue = proposals.reduce((sum, p) => sum + (serviceTotals[p.id]?.value || 0), 0);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mb-2">
      <CollapsibleTrigger asChild>
        <div className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors group">
          {isOpen ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: stage.color }}
          />
          <span className="font-medium text-sm">{stage.name}</span>
          <Badge variant="secondary" className="text-xs h-5 px-1.5">
            {proposals.length}
          </Badge>
          <span className="text-xs text-muted-foreground ml-auto">
            {formatCurrency(totalValue)}
          </span>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {proposals.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground text-sm ml-8">
            Nenhuma proposta neste estágio
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[80px]">#</TableHead>
                <TableHead className="min-w-[200px]">Título</TableHead>
                <TableHead className="w-[180px]">Cliente</TableHead>
                <TableHead className="w-[150px]">Tags</TableHead>
                <TableHead className="w-[120px]">Valor</TableHead>
                <TableHead className="w-[120px]">Lucro</TableHead>
                <TableHead className="w-[140px]">SLA</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead className="w-[40px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {proposals.map((proposal) => {
                const tags = proposalTags[proposal.id] || [];
                const totals = serviceTotals[proposal.id] || { value: 0, commission: 0 };
                const client = proposal.clients;
                const stageEnteredAt = stageEnteredAtByProposal[proposal.id];
                const slaStatus = getSlaStatus(proposal, stageEnteredAt);

                return (
                  <TableRow
                    key={proposal.id}
                    className="group cursor-pointer hover:bg-muted/30"
                    onClick={() => onProposalView(proposal)}
                  >
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        #{proposal.number}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{proposal.title}</span>
                    </TableCell>
                    <TableCell>
                      {client ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
                              {getInitials(client.name)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm">{client.name}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {tags.slice(0, 2).map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="text-xs px-2 py-0"
                              style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                            >
                              {tag.name}
                            </Badge>
                          ))}
                          {tags.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-2 py-0">
                              +{tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm">{formatCurrency(totals.value)}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium text-sm text-green-600">
                        {formatCurrency(totals.commission)}
                      </span>
                    </TableCell>
                    <TableCell>
                      {slaStatus ? (
                        <Badge
                          variant={slaStatus.remaining < 0 ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {slaStatus.remaining < 0
                            ? `Atrasado ${formatDurationMinutes(Math.abs(slaStatus.remaining))}`
                            : `Restam ${formatDurationMinutes(slaStatus.remaining)}`}
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span className="text-xs">
                          {format(new Date(proposal.created_at), 'dd/MM/yy', { locale: ptBR })}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onProposalView(proposal);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onProposalEdit(proposal);
                }}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onProposalCopyLink(proposal);
                }}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Ver link
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onProposalDelete(proposal);
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                          {!proposal.pipeline_stages?.is_closed && (
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                onProposalClose(proposal);
                              }}
                              className="text-green-600"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Fechar
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function LeadListView({
  stages,
  proposals,
  proposalTags,
  serviceTotals,
  stageEnteredAtByProposal,
  onProposalView,
  onProposalEdit,
  onProposalDelete,
  onProposalClose,
  onProposalCopyLink,
}: LeadListViewProps) {
  return (
    <div className="p-6 space-y-2">
      {stages.map((stage) => (
        <StageSection
          key={stage.id}
          stage={stage}
          proposals={proposals.filter((p) => p.stage_id === stage.id)}
          proposalTags={proposalTags}
          serviceTotals={serviceTotals}
          stageEnteredAtByProposal={stageEnteredAtByProposal}
          onProposalView={onProposalView}
          onProposalEdit={onProposalEdit}
          onProposalDelete={onProposalDelete}
          onProposalClose={onProposalClose}
          onProposalCopyLink={onProposalCopyLink}
        />
      ))}
    </div>
  );
}
