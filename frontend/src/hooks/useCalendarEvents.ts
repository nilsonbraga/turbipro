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
}

export function useCalendarEvents() {
  const { isSuperAdmin, profile } = useAuth();
  const userAgencyId = profile?.agency_id;

  return useQuery({
    queryKey: ['calendar-events', userAgencyId, isSuperAdmin],
    queryFn: async () => {
      // Get closed proposals
      const proposalsWhere: Record<string, unknown> = { stage: { isClosed: true } };
      if (!isSuperAdmin && userAgencyId) {
        proposalsWhere.agencyId = userAgencyId;
      }

      const proposalsQuery = new URLSearchParams({
        where: JSON.stringify(proposalsWhere),
        include: JSON.stringify({
          stage: { select: { isClosed: true } },
          client: { select: { name: true } },
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
        };
      });

      return events;
    },
  });
}
