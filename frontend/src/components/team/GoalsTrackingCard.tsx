import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Target, TrendingUp, Trophy, DollarSign, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';

interface GoalsTrackingCardProps {
  goal: {
    id: string;
    collaborator: {
      id: string;
      name: string;
      team?: { name: string } | null;
    };
    target_sales_value: number;
    target_profit: number;
    target_deals_count: number;
    month: number;
    year: number;
  };
  currentSales: number;
  currentProfit: number;
  currentDeals: number;
  formatCurrency: (value: number) => string;
  onEdit?: () => void;
  onDelete?: () => void;
  onCardClick?: () => void;
}

const months = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function GoalsTrackingCard({ 
  goal, 
  currentSales, 
  currentProfit, 
  currentDeals,
  formatCurrency,
  onEdit,
  onDelete,
  onCardClick
}: GoalsTrackingCardProps) {
  const salesProgress = goal.target_sales_value > 0 
    ? Math.min((currentSales / goal.target_sales_value) * 100, 100) 
    : 0;
  const profitProgress = goal.target_profit > 0 
    ? Math.min((currentProfit / goal.target_profit) * 100, 100) 
    : 0;
  const dealsProgress = goal.target_deals_count > 0 
    ? Math.min((currentDeals / goal.target_deals_count) * 100, 100) 
    : 0;

  const overallProgress = (salesProgress + profitProgress + dealsProgress) / 3;

  const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-primary';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className={onCardClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""} onClick={onCardClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary">
                {getInitials(goal.collaborator.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{goal.collaborator.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                {goal.collaborator.team && (
                  <Badge variant="outline" className="text-xs">
                    {goal.collaborator.team.name}
                  </Badge>
                )}
                <Badge variant="secondary" className="text-xs">
                  {months[goal.month - 1]} {goal.year}
                </Badge>
              </div>
            </div>
          </div>
          {(onEdit || onDelete) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && (
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Editar Meta
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir Meta
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Progresso Geral</span>
          <Badge 
            variant={overallProgress >= 100 ? 'default' : 'secondary'}
            className={overallProgress >= 100 ? 'bg-green-500' : ''}
          >
            {overallProgress.toFixed(0)}%
          </Badge>
        </div>
        <Progress value={overallProgress} className="h-2" />

        {/* Sales Goal */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span>Vendas</span>
            </div>
            <span className="text-muted-foreground">
              {formatCurrency(currentSales)} / {formatCurrency(goal.target_sales_value)}
            </span>
          </div>
          <Progress 
            value={salesProgress} 
            className="h-1.5"
          />
        </div>

        {/* Profit Goal */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span>Lucro</span>
            </div>
            <span className="text-muted-foreground">
              {formatCurrency(currentProfit)} / {formatCurrency(goal.target_profit)}
            </span>
          </div>
          <Progress 
            value={profitProgress} 
            className="h-1.5"
          />
        </div>

        {/* Deals Goal */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-muted-foreground" />
              <span>Negócios</span>
            </div>
            <span className="text-muted-foreground">
              {currentDeals} / {goal.target_deals_count}
            </span>
          </div>
          <Progress 
            value={dealsProgress} 
            className="h-1.5"
          />
        </div>
      </CardContent>
    </Card>
  );
}
