import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CollaboratorPerformance } from '@/hooks/useTeamPerformance';
import { Trophy, TrendingUp, DollarSign, Users } from 'lucide-react';

interface PerformanceCardProps {
  performance: CollaboratorPerformance;
  rank?: number;
  formatCurrency: (value: number) => string;
  onCardClick?: () => void;
  className?: string;
}

export function PerformanceCard({ performance, rank, formatCurrency, onCardClick, className }: PerformanceCardProps) {
  const { collaborator, totalSales, totalProfit, totalCommissions, dealsCount, goal, goalProgress, leadsCount } = performance as any;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };
  const avatarUrl = collaborator.avatar_url ?? null;

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Badge className="bg-yellow-500 text-yellow-950">🥇 1º</Badge>;
    if (rank === 2) return <Badge className="bg-gray-400 text-gray-950">🥈 2º</Badge>;
    if (rank === 3) return <Badge className="bg-amber-600 text-amber-950">🥉 3º</Badge>;
    return <Badge variant="outline">{rank}º</Badge>;
  };

  return (
    <Card className={`${onCardClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} ${className || ""}`} onClick={onCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              {avatarUrl && <AvatarImage src={avatarUrl} alt={collaborator.name || 'Avatar'} />}
              <AvatarFallback>{getInitials(collaborator.name)}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{collaborator.name}</CardTitle>
              <p className="text-xs text-muted-foreground">
                {collaborator.position || 'Colaborador'} 
                {collaborator.team && ` • ${collaborator.team.name}`}
              </p>
            </div>
          </div>
          {rank && getRankBadge(rank)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total Vendido
            </p>
            <p className="text-lg font-semibold">{formatCurrency(totalSales)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Lucro Gerado
            </p>
            <p className="text-lg font-semibold">{formatCurrency(totalProfit)}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Trophy className="h-3 w-3" /> Vendas Fechadas
            </p>
            <p className="text-lg font-semibold">{dealsCount}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3 w-3" /> Leads Captados
            </p>
            <p className="text-lg font-semibold">{leadsCount ?? 0}</p>
          </div>
        </div>

        {goalProgress && goal && (
          <div className="border-t pt-4 space-y-3">
            <p className="text-sm font-medium">Progresso das Metas</p>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-3 w-3 text-slate-500" />
                  Vendas
                </span>
                <span>{formatCurrency(totalSales)} / {formatCurrency(goal.target_sales_value)}</span>
              </div>
              <Progress value={Math.min(goalProgress.salesProgress, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <TrendingUp className="h-3 w-3 text-slate-500" />
                  Lucro
                </span>
                <span>{formatCurrency(totalProfit)} / {formatCurrency(goal.target_profit)}</span>
              </div>
              <Progress value={Math.min(goalProgress.profitProgress, 100)} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5">
                  <Trophy className="h-3 w-3 text-slate-500" />
                  Número de Vendas Fechadas
                </span>
                <span>{dealsCount} / {goal.target_deals_count}</span>
              </div>
              <Progress value={Math.min(goalProgress.dealsProgress, 100)} className="h-2" />
            </div>
          </div>
        )}

        {!goal && (
          <div className="border-t pt-4">
            <p className="text-xs text-muted-foreground text-center">
              Nenhuma meta definida para este período
            </p>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Comissão do período</span>
            <span className="font-semibold text-primary">{formatCurrency(totalCommissions)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
