import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetch } from '@/lib/api';

export interface CalendarEvent {
  id: string;
  type: string;
  description: string;
  start_date: string;
  end_date: string | null;
  origin: string | null;
  destination: string | null;
  proposal_id: string;
  proposal_title: string;
  proposal_number: number;
  client_name: string | null;
  client_id: string | null;
  value: number;
  details?: unknown;
  tags?: string[];
  priority?: string | null;
  column_name?: string | null;
  assignees?: string[];
  isAllDay?: boolean;
}

export function useCalendarEvents() {
  const { isSuperAdmin, profile } = useAuth();
  const userAgencyId = profile?.agency_id;

  return useQuery({
    queryKey: ['calendar-events', userAgencyId, isSuperAdmin],
    queryFn: async () => {
      // Get proposals (all stages, filtered by agency when needed)
      const proposalsWhere: Record<string, unknown> = {};
      if (!isSuperAdmin && userAgencyId) {
        proposalsWhere.agencyId = userAgencyId;
      }

      const proposalsQuery = new URLSearchParams({
        where: JSON.stringify(proposalsWhere),
        include: JSON.stringify({
          stage: { select: { isClosed: true } },
          client: { select: { name: true } },
          agency: { select: { name: true } },
        }),
      });

      const { data: proposals } = await apiFetch<{ data: any[] }>(`/api/proposal?${proposalsQuery.toString()}`);
      if (!proposals || proposals.length === 0) return [];

      const proposalIds = proposals.map((p) => p.id);

      // Get services with dates from closed proposals
      const servicesQuery = new URLSearchParams({
        where: JSON.stringify({
          proposalId: { in: proposalIds },
          startDate: { not: null },
        }),
      });

      const { data: services } = await apiFetch<{ data: any[] }>(`/api/proposalService?${servicesQuery.toString()}`);

      const events: CalendarEvent[] = (services || []).map((service) => {
        const proposal = proposals.find((p) => p.id === service.proposalId);
        return {
          id: service.id,
          type: service.type,
          description: service.description || '',
          start_date: service.startDate,
          end_date: service.endDate,
          origin: service.origin,
          destination: service.destination,
          proposal_id: service.proposalId,
          proposal_title: proposal?.title || '',
          proposal_number: proposal?.number || 0,
          client_name: proposal?.client?.name || null,
          client_id: proposal?.clientId || null,
          value: Number(service.value || 0),
          details: service.details,
        };
      });

      // Tasks com início/prazo para o calendário
      const tasksWhere: Record<string, unknown> = {};
      if (!isSuperAdmin && userAgencyId) {
        tasksWhere.agencyId = userAgencyId;
      }

      const tasksQuery = new URLSearchParams({
        where: JSON.stringify(tasksWhere),
        include: JSON.stringify({
          column: { select: { name: true, color: true } },
          assignees: { include: { user: { select: { id: true, name: true } } } },
          client: { select: { id: true, name: true } },
          proposal: { select: { id: true, title: true, number: true } },
        }),
        orderBy: JSON.stringify({ startDate: 'asc' }),
      });

      const { data: tasks } = await apiFetch<{ data: any[] }>(`/api/task?${tasksQuery.toString()}`);

      const taskEvents: CalendarEvent[] = (tasks || [])
        .filter((t) => t.startDate || t.dueDate)
        .map((task) => {
          const isDateOnly = (value?: string | null) => {
            if (!value) return false;
            const parsed = new Date(value);
            if (Number.isNaN(parsed.getTime())) return false;
            return (
              parsed.getHours() === 0 &&
              parsed.getMinutes() === 0 &&
              parsed.getSeconds() === 0 &&
              parsed.getMilliseconds() === 0
            );
          };

          const start = task.startDate ? new Date(task.startDate) : task.dueDate ? new Date(task.dueDate) : null;
          if (!start || Number.isNaN(start.getTime())) return null;

          const hasStart = Boolean(task.startDate);
          const hasDue = Boolean(task.dueDate);
          const startIsDateOnly = task.startDate ? isDateOnly(task.startDate) : true;
          const dueIsDateOnly = task.dueDate ? isDateOnly(task.dueDate) : true;
          const isAllDay = startIsDateOnly && dueIsDateOnly;

          const normalizeStart = (value: Date) => {
            const normalized = new Date(value);
            if (isAllDay) {
              normalized.setHours(0, 0, 0, 0);
            }
            return normalized;
          };

          const normalizeEnd = (value: Date) => {
            const normalized = new Date(value);
            if (isAllDay) {
              normalized.setHours(23, 59, 59, 999);
            }
            return normalized;
          };

          let end = new Date(start.getTime() + 60 * 60 * 1000);
          if (hasStart && hasDue) {
            const tmp = new Date(task.dueDate);
            if (!Number.isNaN(tmp.getTime())) end = tmp;
          } else if (!hasStart && hasDue) {
            const tmp = new Date(task.dueDate);
            if (!Number.isNaN(tmp.getTime())) end = new Date(tmp.getTime() + 60 * 60 * 1000);
          }

          const normalizedStart = normalizeStart(start);
          const normalizedEnd = normalizeEnd(end);

          return {
            id: task.id,
            type: 'task',
            description: task.description || '',
            start_date: normalizedStart.toISOString(),
            end_date:
              normalizedEnd && !Number.isNaN(normalizedEnd.getTime())
                ? normalizedEnd.toISOString()
                : normalizedStart.toISOString(),
            origin: null,
            destination: null,
            proposal_id: task.proposalId ?? '',
            proposal_title: task.proposal?.title ?? '',
            proposal_number: task.proposal?.number ?? 0,
            client_name: task.client?.name ?? null,
            client_id: task.clientId ?? null,
            value: 0,
            tags: Array.isArray(task.tags) ? task.tags : [],
            details: {
              column: task.column?.name ?? '',
              priority: task.priority ?? 'medium',
              taskTitle: task.title,
            },
            priority: task.priority ?? 'medium',
            column_name: task.column?.name ?? null,
            assignees: (task.assignees || [])
              .map((a: any) => a.user?.name)
              .filter(Boolean),
            isAllDay,
          } as CalendarEvent;
        })
        .filter(Boolean) as CalendarEvent[];

      return [...events, ...taskEvents];
    },
  });
}
