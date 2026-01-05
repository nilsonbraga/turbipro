import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface Testimonial {
  name: string;
  text: string;
  photo?: string;
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface ItinerarySummaryImage {
  url: string;
  title?: string;
  description?: string;
}

export interface NotRecommendedItem {
  title: string;
  description: string;
}

export interface PricingOffer {
  title: string;
  description?: string;
  price_cash?: number | null;
  price_installment?: number | null;
  installments_count?: number | null;
  entry_value?: number | null;
  is_offer?: boolean;
  original_price_cash?: number | null;
  original_price_installment?: number | null;
  currency?: string;
}

export interface ExpeditionGroup {
  id: string;
  agency_id: string;
  destination: string;
  start_date: string;
  duration_days: number;
  max_participants: number;
  description: string | null;
  public_token: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  cover_image_url?: string | null;
  carousel_images?: string[] | null;
  landing_text?: string | null;
  impact_phrase?: string | null;
  description_image_url?: string | null;
  description_gallery_images?: string[] | null;
  about_title?: string | null;
  about_description?: string | null;
  about_image_url?: string | null;
  destination_summary_title?: string | null;
  destination_summary_description?: string | null;
  destination_summary_image_url?: string | null;
  itinerary_summary_title?: string | null;
  itinerary_summary_description?: string | null;
  itinerary_summary_images?: ItinerarySummaryImage[] | null;
  transport_title?: string | null;
  transport_text?: string | null;
  transport_images?: string[] | null;
  not_recommended_items?: NotRecommendedItem[] | null;
  registrations_count?: number;
  waitlist_count?: number;
  // Pricing fields
  price_cash?: number | null;
  price_installment?: number | null;
  installments_count?: number | null;
  currency?: string;
  pricing_offers?: PricingOffer[] | null;
  // Date preference toggle
  show_date_preference?: boolean;
  // Package inclusions/exclusions
  included_items?: string[] | null;
  excluded_items?: string[] | null;
  // New fields
  youtube_video_url?: string | null;
  google_reviews_url?: string | null;
  testimonials?: Testimonial[] | null;
  faqs?: FAQ[] | null;
}

export interface ExpeditionRegistration {
  id: string;
  group_id: string;
  name: string;
  email: string;
  phone: string | null;
  is_waitlist: boolean;
  status: string;
  created_at: string;
  date_preference?: string | null;
  selected_offer_title?: string | null;
}

export interface ExpeditionGroupInput {
  destination: string;
  start_date: string;
  duration_days: number;
  max_participants: number;
  description?: string;
  is_active?: boolean;
  cover_image_url?: string;
  carousel_images?: string[];
  landing_text?: string;
  impact_phrase?: string;
  description_image_url?: string;
  description_gallery_images?: string[];
  about_title?: string;
  about_description?: string;
  about_image_url?: string;
  destination_summary_title?: string;
  destination_summary_description?: string;
  destination_summary_image_url?: string;
  itinerary_summary_title?: string;
  itinerary_summary_description?: string;
  itinerary_summary_images?: ItinerarySummaryImage[];
  transport_title?: string;
  transport_text?: string;
  transport_images?: string[];
  not_recommended_items?: NotRecommendedItem[];
  // Pricing fields
  price_cash?: number | null;
  price_installment?: number | null;
  installments_count?: number | null;
  currency?: string;
  pricing_offers?: PricingOffer[];
  // Date preference toggle
  show_date_preference?: boolean;
  // Package inclusions/exclusions
  included_items?: string[];
  excluded_items?: string[];
  // New fields
  youtube_video_url?: string;
  google_reviews_url?: string;
  testimonials?: Testimonial[];
  faqs?: FAQ[];
}

export interface ExpeditionGroupWithAgency extends ExpeditionGroup {
  agency_name?: string;
}

const mapBackendToFront = (g: any): ExpeditionGroup => ({
  id: g.id,
  agency_id: g.agencyId,
  destination: g.destination,
  start_date: g.startDate,
  duration_days: g.durationDays,
  max_participants: g.maxParticipants,
  description: g.description,
  public_token: g.publicToken,
  is_active: g.isActive,
  created_at: g.createdAt,
  updated_at: g.updatedAt,
  cover_image_url: g.coverImageUrl,
  carousel_images: g.carouselImages || [],
  landing_text: g.landingText,
  impact_phrase: g.impactPhrase,
  description_image_url: g.descriptionImageUrl,
  description_gallery_images: g.descriptionGalleryImages || [],
  about_title: g.aboutTitle,
  about_description: g.aboutDescription,
  about_image_url: g.aboutImageUrl,
  destination_summary_title: g.destinationSummaryTitle,
  destination_summary_description: g.destinationSummaryDescription,
  destination_summary_image_url: g.destinationSummaryImageUrl,
  itinerary_summary_title: g.itinerarySummaryTitle,
  itinerary_summary_description: g.itinerarySummaryDescription,
  itinerary_summary_images: g.itinerarySummaryImages || [],
  transport_title: g.transportTitle,
  transport_text: g.transportText,
  transport_images: g.transportImages || [],
  not_recommended_items: g.notRecommendedItems || [],
  registrations_count: g.registrations_count,
  waitlist_count: g.waitlist_count,
  price_cash: g.priceCash,
  price_installment: g.priceInstallment,
  installments_count: g.installmentsCount,
  currency: g.currency,
  pricing_offers: g.pricingOffers || [],
  show_date_preference: g.showDatePreference,
  included_items: g.includedItems || [],
  excluded_items: g.excludedItems || [],
  youtube_video_url: g.youtubeVideoUrl,
  google_reviews_url: g.googleReviewsUrl,
  testimonials: g.testimonials,
  faqs: g.faqs,
});

const mapFrontToBackendGroup = (input: ExpeditionGroupInput & { agency_id?: string }) => ({
  agencyId: input.agency_id,
  destination: input.destination,
  startDate: input.start_date ? new Date(input.start_date).toISOString() : null,
  durationDays: input.duration_days,
  maxParticipants: input.max_participants,
  description: input.description ?? null,
  isActive: input.is_active ?? true,
  coverImageUrl: input.cover_image_url ?? null,
  carouselImages: input.carousel_images ?? [],
  landingText: input.landing_text ?? null,
  impactPhrase: input.impact_phrase ?? null,
  descriptionImageUrl: input.description_image_url ?? null,
  descriptionGalleryImages: input.description_gallery_images ?? [],
  aboutTitle: input.about_title ?? null,
  aboutDescription: input.about_description ?? null,
  aboutImageUrl: input.about_image_url ?? null,
  destinationSummaryTitle: input.destination_summary_title ?? null,
  destinationSummaryDescription: input.destination_summary_description ?? null,
  destinationSummaryImageUrl: input.destination_summary_image_url ?? null,
  itinerarySummaryTitle: input.itinerary_summary_title ?? null,
  itinerarySummaryDescription: input.itinerary_summary_description ?? null,
  itinerarySummaryImages: input.itinerary_summary_images ?? [],
  transportTitle: input.transport_title ?? null,
  transportText: input.transport_text ?? null,
  transportImages: input.transport_images ?? [],
  notRecommendedItems: input.not_recommended_items ?? [],
  priceCash: input.price_cash ?? null,
  priceInstallment: input.price_installment ?? null,
  installmentsCount: input.installments_count ?? null,
  currency: input.currency ?? 'BRL',
  pricingOffers: input.pricing_offers ?? [],
  showDatePreference: input.show_date_preference ?? false,
  includedItems: input.included_items ?? [],
  excludedItems: input.excluded_items ?? [],
  youtubeVideoUrl: input.youtube_video_url ?? null,
  googleReviewsUrl: input.google_reviews_url ?? null,
  testimonials: input.testimonials ?? [],
  faqs: input.faqs ?? [],
});

export function useExpeditionGroups(agencyFilter?: string | null) {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['expedition-groups', isSuperAdmin ? 'all' : agency?.id, agencyFilter],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      } else if (isSuperAdmin && agencyFilter) {
        where.agencyId = agencyFilter;
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        orderBy: JSON.stringify({ startDate: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/expeditionGroup?${params.toString()}`);
      const groups = (data || []).map(mapBackendToFront) as ExpeditionGroupWithAgency[];

      if (groups.length === 0) return groups;

      if (isSuperAdmin) {
        const agencyIds = [...new Set(groups.map((g) => g.agency_id))];
        if (agencyIds.length > 0) {
          const agencyQuery = new URLSearchParams({
            where: JSON.stringify({ id: { in: agencyIds } }),
            select: JSON.stringify({ id: true, name: true }),
          });
          const { data: agencies } = await apiFetch<{ data: any[] }>(`/api/agency?${agencyQuery.toString()}`);
          const agencyMap = new Map((agencies || []).map((a) => [a.id, a.name]));
          groups.forEach((g) => {
            g.agency_name = agencyMap.get(g.agency_id) || 'Desconhecida';
          });
        }
      }

      // registration counts per group
      await Promise.all(
        groups.map(async (group) => {
          const confirmedParams = new URLSearchParams({
            where: JSON.stringify({ groupId: group.id, isWaitlist: false }),
            withCount: 'true',
            take: '0',
          });
          const waitlistParams = new URLSearchParams({
            where: JSON.stringify({ groupId: group.id, isWaitlist: true }),
            withCount: 'true',
            take: '0',
          });
          const [{ total: confirmedCount = 0 } = {} as any, { total: waitlistCount = 0 } = {} as any] =
            await Promise.all([
              apiFetch<{ data: any[]; total: number }>(`/api/expeditionRegistration?${confirmedParams.toString()}`).catch(
                () => ({ total: 0 } as any),
              ),
              apiFetch<{ data: any[]; total: number }>(`/api/expeditionRegistration?${waitlistParams.toString()}`).catch(
                () => ({ total: 0 } as any),
              ),
            ]);

          group.registrations_count = confirmedCount;
          group.waitlist_count = waitlistCount;
        }),
      );

      return groups;
    },
    enabled: isSuperAdmin || !!agency?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: ExpeditionGroupInput & { agency_id?: string }) => {
      const targetAgencyId = input.agency_id || agency?.id;
      if (!targetAgencyId) throw new Error('Agência não encontrada');

      const payload = mapFrontToBackendGroup({ ...input, agency_id: targetAgencyId });
      const created = await apiFetch<any>(`/api/expeditionGroup`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return mapBackendToFront(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({ title: 'Grupo criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar grupo', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: ExpeditionGroupInput & { id: string }) => {
      const payload = mapFrontToBackendGroup(input);
      const updated = await apiFetch<any>(`/api/expeditionGroup/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...payload, updatedAt: new Date().toISOString() }),
      });
      return mapBackendToFront(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({ title: 'Grupo atualizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar grupo', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/expeditionGroup/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({ title: 'Grupo excluído!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir grupo', description: error.message, variant: 'destructive' });
    },
  });

  return {
    groups: query.data || [],
    isLoading: query.isLoading,
    createGroup: createMutation.mutate,
    updateGroup: updateMutation.mutate,
    deleteGroup: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSuperAdmin,
  };
}

export function useExpeditionRegistrations(groupId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createRegistrationMutation = useMutation({
    mutationFn: async ({
      groupId,
      name,
      email,
      phone,
      isWaitlist,
      status,
    }: {
      groupId: string;
      name: string;
      email: string;
      phone?: string | null;
      isWaitlist: boolean;
      status?: string;
    }) => {
      const payload = {
        groupId,
        name,
        email,
        phone: phone || null,
        isWaitlist,
        status: status ?? (isWaitlist ? 'entrou_na_lista' : 'confirmado'),
      };
      const created = await apiFetch(`/api/expeditionRegistration`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      return created;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['expedition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({
        title: variables.isWaitlist ? 'Adicionado à lista de espera' : 'Inscrito adicionado!',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao adicionar inscrição', description: error.message, variant: 'destructive' });
    },
  });

  const query = useQuery({
    queryKey: ['expedition-registrations', groupId],
    queryFn: async () => {
      if (!groupId) return [];

      const params = new URLSearchParams({
        where: JSON.stringify({ groupId }),
        orderBy: JSON.stringify({ createdAt: 'asc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/expeditionRegistration?${params.toString()}`);
      return (data || []).map((r) => ({
        id: r.id,
        group_id: r.groupId,
        name: r.name,
        email: r.email,
        phone: r.phone,
        is_waitlist: r.isWaitlist,
        status: r.status,
        created_at: r.createdAt,
        date_preference: r.datePreference,
        selected_offer_title: r.selectedOfferTitle ?? null,
      })) as ExpeditionRegistration[];
    },
    enabled: !!groupId,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/expeditionRegistration/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({ title: 'Inscrito removido!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao remover inscrito', description: error.message, variant: 'destructive' });
    },
  });

  const promoteFromWaitlistMutation = useMutation({
    mutationFn: async (id: string) => {
      const updated = await apiFetch(`/api/expeditionRegistration/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ isWaitlist: false }),
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-registrations'] });
      queryClient.invalidateQueries({ queryKey: ['expedition-groups'] });
      toast({ title: 'Inscrito promovido da lista de espera!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao promover inscrito', description: error.message, variant: 'destructive' });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updated = await apiFetch(`/api/expeditionRegistration/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
      return updated;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expedition-registrations'] });
      toast({ title: 'Status atualizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar status', description: error.message, variant: 'destructive' });
    },
  });

  const confirmed = query.data?.filter(r => !r.is_waitlist) || [];
  const waitlist = query.data?.filter(r => r.is_waitlist) || [];

  return {
    registrations: query.data || [],
    confirmed,
    waitlist,
    isLoading: query.isLoading,
    deleteRegistration: deleteMutation.mutate,
    promoteFromWaitlist: promoteFromWaitlistMutation.mutate,
    updateRegistrationStatus: (id: string, status: string) => updateStatusMutation.mutate({ id, status }),
    isDeleting: deleteMutation.isPending,
    isPromoting: promoteFromWaitlistMutation.isPending,
    createRegistration: createRegistrationMutation.mutate,
    isCreating: createRegistrationMutation.isPending,
  };
}

// Hook for public registration (no auth required)
export function usePublicExpeditionGroup(token: string | null) {
  return useQuery({
    queryKey: ['public-expedition-group', token],
    queryFn: async () => {
      if (!token) return null;

      const params = new URLSearchParams({
        where: JSON.stringify({ publicToken: token, isActive: true }),
      });
      const { data } = await apiFetch<{ data: any[] }>(`/api/expeditionGroup?${params.toString()}`);
      const group = (data || [])[0];
      if (!group) return null;

      const agency = await apiFetch<any>(`/api/agency/${group.agencyId}`).catch(() => null);

      const countParams = new URLSearchParams({
        where: JSON.stringify({ groupId: group.id, isWaitlist: false }),
        withCount: 'true',
        take: '0',
      });
      const { total } = await apiFetch<{ data: any[]; total: number }>(
        `/api/expeditionRegistration?${countParams.toString()}`,
      ).catch(() => ({ total: 0 }));

      return {
        ...mapBackendToFront(group),
        registrations_count: total || 0,
        agency: agency || null,
      };
    },
    enabled: !!token,
  });
}

export function usePublicRegistration() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ groupId, name, email, phone, isWaitlist, datePreference, selectedOfferTitle }: {
      groupId: string;
      name: string;
      email: string;
      phone?: string;
      isWaitlist: boolean;
      datePreference?: string;
      selectedOfferTitle?: string;
    }) => {
      const created = await apiFetch(`/api/expeditionRegistration`, {
        method: 'POST',
        body: JSON.stringify({
          groupId,
          name,
          email,
          phone: phone || null,
          isWaitlist,
          datePreference: datePreference || null,
          selectedOfferTitle: selectedOfferTitle || null,
        }),
      });
      return created;
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: variables.isWaitlist ? 'Inscrito na lista de espera!' : 'Inscrição confirmada!',
        description: 'Você receberá mais informações por email.',
      });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao realizar inscrição', description: error.message, variant: 'destructive' });
    },
  });
}
