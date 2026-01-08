import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

export interface ItineraryItemDetails {
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  stars?: number;
  vehicleType?: string;
  company?: string;
  departureLocation?: string;
  arrivalLocation?: string;
  airline?: string;
  flightNumber?: string;
  departure?: string;
  arrival?: string;
  flightClass?: string;
  venue?: string;
  eventName?: string;
  seatInfo?: string;
  [key: string]: any;
}

export interface ItineraryItemFeedback {
  id: string;
  item_id: string;
  is_approved: boolean | null;
  observation: string | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryDayFeedback {
  id: string;
  day_id: string;
  is_approved: boolean | null;
  observation: string | null;
  client_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface ItineraryLink {
  label: string;
  url: string;
}

export interface ItineraryItem {
  id: string;
  day_id: string;
  type: string;
  title: string;
  description: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  address: string | null;
  details: ItineraryItemDetails;
  images: string[] | null;
  links?: ItineraryLink[] | null;
  price: number | null;
  currency: string;
  booking_reference: string | null;
  confirmation_number: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  feedbacks?: ItineraryItemFeedback[];
}

export interface ItineraryDay {
  id: string;
  itinerary_id: string;
  day_number: number;
  title: string | null;
  date: string | null;
  location: string | null;
  description: string | null;
  cover_image_url: string | null;
  images: string[] | null;
  links?: ItineraryLink[] | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  items?: ItineraryItem[];
  feedbacks?: ItineraryDayFeedback[];
}

export interface CustomItinerary {
  id: string;
  agency_id: string;
  client_id: string | null;
  title: string;
  description: string | null;
  cover_image_url: string | null;
  logo_url: string | null;
  start_date: string | null;
  end_date: string | null;
  destination: string | null;
  public_token: string;
  requires_token: boolean;
  access_token: string | null;
  is_active: boolean;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  days?: ItineraryDay[];
  client?: { id: string; name: string; email: string | null } | null;
}

export interface CustomItineraryInput {
  title: string;
  description?: string;
  cover_image_url?: string;
  logo_url?: string;
  start_date?: string;
  end_date?: string;
  destination?: string;
  client_id?: string;
  requires_token?: boolean;
  access_token?: string;
  is_active?: boolean;
  status?: string;
}

export interface ItineraryDayInput {
  itinerary_id: string;
  day_number: number;
  title?: string;
  date?: string;
  location?: string;
  description?: string;
  cover_image_url?: string;
  images?: string[];
  links?: ItineraryLink[];
  sort_order?: number;
}

export interface ItineraryItemInput {
  day_id: string;
  type: string;
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  address?: string;
  details?: ItineraryItemDetails;
  images?: string[];
  links?: ItineraryLink[];
  price?: number;
  currency?: string;
  booking_reference?: string;
  confirmation_number?: string;
  sort_order?: number;
}

const mapItinerary = (i: any): CustomItinerary => ({
  id: i.id,
  agency_id: i.agencyId,
  client_id: i.clientId,
  title: i.title,
  description: i.description,
  cover_image_url: i.coverImageUrl,
  logo_url: i.logoUrl,
  start_date: i.startDate,
  end_date: i.endDate,
  destination: i.destination,
  public_token: i.publicToken,
  requires_token: i.requiresToken,
  access_token: i.accessToken,
  is_active: i.isActive,
  status: i.status,
  approved_at: i.approvedAt,
  approved_by: i.approvedBy,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
  created_by: i.createdById ?? null,
  client: i.client ? { id: i.client.id, name: i.client.name, email: i.client.email } : null,
  days: i.days,
});

const mapDay = (d: any): ItineraryDay => ({
  id: d.id,
  itinerary_id: d.itineraryId,
  day_number: d.dayNumber,
  title: d.title,
  date: d.date,
  location: d.location,
  description: d.description,
  cover_image_url: d.coverImageUrl,
  images: d.images || [],
  links: d.links || [],
  sort_order: d.sortOrder ?? 0,
  created_at: d.createdAt,
  updated_at: d.updatedAt,
  items: d.items,
  feedbacks: d.feedbacks,
});

const mapItem = (i: any): ItineraryItem => ({
  id: i.id,
  day_id: i.dayId,
  type: i.type,
  title: i.title,
  description: i.description,
  start_time: toTimeString(i.startTime),
  end_time: toTimeString(i.endTime),
  location: i.location,
  address: i.address,
  details: i.details || {},
  images: i.images || [],
  links: i.links || [],
  price: i.price ?? null,
  currency: i.currency,
  booking_reference: i.bookingReference,
  confirmation_number: i.confirmationNumber,
  sort_order: i.sortOrder ?? 0,
  created_at: i.createdAt,
  updated_at: i.updatedAt,
  feedbacks: i.feedbacks,
});

const toTimeIso = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  // If already ISO with date, parse directly
  if (/^\d{4}-\d{2}-\d{2}T/.test(trimmed)) {
    const d = new Date(trimmed);
    return Number.isNaN(d.getTime()) ? null : d.toISOString();
  }
  // If only HH:mm or HH:mm:ss
  const hasSeconds = trimmed.length === 8;
  const padded = hasSeconds ? trimmed : `${trimmed.length === 5 ? trimmed : `${trimmed}:00`}`;
  const d = new Date(`1970-01-01T${padded}`);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

const toTimeString = (value: any): string => {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{2}:\d{2}/.test(value.trim())) {
    return value.trim().slice(0, 5);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

const mapItemFeedback = (f: any): ItineraryItemFeedback => ({
  id: f.id,
  item_id: f.itemId,
  is_approved: f.isApproved,
  observation: f.observation,
  client_name: f.clientName,
  created_at: f.createdAt,
  updated_at: f.updatedAt,
});

const mapDayFeedback = (f: any): ItineraryDayFeedback => ({
  id: f.id,
  day_id: f.dayId,
  is_approved: f.isApproved,
  observation: f.observation,
  client_name: f.clientName,
  created_at: f.createdAt,
  updated_at: f.updatedAt,
});

const mapItineraryInput = (input: CustomItineraryInput & { agency_id?: string }) => ({
  agencyId: input.agency_id,
  clientId: input.client_id ?? null,
  title: input.title,
  description: input.description ?? null,
  coverImageUrl: input.cover_image_url ?? null,
  logoUrl: input.logo_url ?? null,
  startDate: input.start_date ? new Date(input.start_date).toISOString() : null,
  endDate: input.end_date ? new Date(input.end_date).toISOString() : null,
  destination: input.destination ?? null,
  requiresToken: input.requires_token ?? false,
  accessToken: input.access_token ?? null,
  isActive: input.is_active ?? true,
  status: input.status ?? 'draft',
});

const mapDayInput = (input: ItineraryDayInput) => ({
  itineraryId: input.itinerary_id,
  dayNumber: input.day_number,
  title: input.title ?? null,
  date: input.date ? new Date(input.date).toISOString() : null,
  location: input.location ?? null,
  description: input.description ?? null,
  coverImageUrl: input.cover_image_url ?? null,
  images: input.images ?? [],
  links: input.links ?? [],
  sortOrder: input.sort_order ?? 0,
});

const mapItemInput = (input: ItineraryItemInput) => ({
  dayId: input.day_id,
  type: input.type,
  title: input.title,
  description: input.description ?? null,
  startTime: toTimeIso(input.start_time),
  endTime: toTimeIso(input.end_time),
  // ensure we don't send unused date fields
  startDate: undefined,
  endDate: undefined,
  location: input.location ?? null,
  address: input.address ?? null,
  details: input.details ?? {},
  images: input.images ?? [],
  links: input.links ?? [],
  price: input.price ?? null,
  currency: input.currency ?? 'BRL',
  bookingReference: input.booking_reference ?? null,
  confirmationNumber: input.confirmation_number ?? null,
  sortOrder: input.sort_order ?? 0,
});

export function useCustomItineraries(
  agencyFilter?: string | null,
  options?: { includeFeedbacks?: boolean },
) {
  const { agency, isSuperAdmin } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [
      'custom-itineraries',
      isSuperAdmin ? 'all' : agency?.id,
      agencyFilter,
      options?.includeFeedbacks ? 'with-feedbacks' : 'basic',
    ],
    queryFn: async () => {
      const where: Record<string, unknown> = {};
      if (!isSuperAdmin && agency?.id) {
        where.agencyId = agency.id;
      } else if (isSuperAdmin && agencyFilter) {
        where.agencyId = agencyFilter;
      }

      const include: Record<string, unknown> = {
        client: { select: { id: true, name: true, email: true } },
      };
      if (options?.includeFeedbacks) {
        include.days = {
          select: {
            id: true,
            feedbacks: { select: { id: true, clientName: true, createdAt: true, isApproved: true } },
            items: {
              select: {
                id: true,
                feedbacks: { select: { id: true, clientName: true, createdAt: true, isApproved: true } },
              },
            },
          },
        };
      }

      const params = new URLSearchParams({
        where: JSON.stringify(where),
        include: JSON.stringify(include),
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/customItinerary?${params.toString()}`);
      return (data || []).map(mapItinerary);
    },
    enabled: isSuperAdmin || !!agency?.id,
  });

  const createMutation = useMutation({
    mutationFn: async (input: CustomItineraryInput & { agency_id?: string }) => {
      const targetAgencyId = input.agency_id || agency?.id;
      if (!targetAgencyId) throw new Error('Agência não encontrada');

      const created = await apiFetch<any>(`/api/customItinerary`, {
        method: 'POST',
        body: JSON.stringify(mapItineraryInput({ ...input, agency_id: targetAgencyId })),
      });
      return mapItinerary(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-itineraries'] });
      toast({ title: 'Roteiro criado com sucesso!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar roteiro', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...input }: CustomItineraryInput & { id: string }) => {
      const updated = await apiFetch<any>(`/api/customItinerary/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ ...mapItineraryInput(input), updatedAt: new Date().toISOString() }),
      });
      return mapItinerary(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-itineraries'] });
      toast({ title: 'Roteiro atualizado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar roteiro', description: error.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/customItinerary/${id}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-itineraries'] });
      toast({ title: 'Roteiro excluído!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir roteiro', description: error.message, variant: 'destructive' });
    },
  });

  return {
    itineraries: query.data || [],
    isLoading: query.isLoading,
    createItinerary: createMutation.mutateAsync,
    updateItinerary: updateMutation.mutate,
    deleteItinerary: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isSuperAdmin,
  };
}

// Hook for managing a single itinerary with its days and items
export function useItineraryDetails(itineraryId: string | null) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['itinerary-details', itineraryId],
    queryFn: async () => {
      if (!itineraryId) return null;

      const params = new URLSearchParams({
        include: JSON.stringify({
          client: { select: { id: true, name: true, email: true } },
          days: {
            include: {
              items: { include: { feedbacks: true } },
              feedbacks: true,
            },
          },
        }),
      });

      const itinerary = await apiFetch<any>(`/api/customItinerary/${itineraryId}?${params.toString()}`);
      if (!itinerary) return null;

      const days =
        (itinerary.days || [])
          .map((d: any) => ({
            ...mapDay(d),
            items: (d.items || []).map((it: any) => ({
              ...mapItem(it),
              feedbacks: (it.feedbacks || []).map(mapItemFeedback),
            })),
            feedbacks: (d.feedbacks || []).map(mapDayFeedback),
          }))
          .sort((a: ItineraryDay, b: ItineraryDay) => a.sort_order - b.sort_order);

      return {
        ...mapItinerary(itinerary),
        days,
      } as CustomItinerary;
    },
    enabled: !!itineraryId,
  });

  // Day mutations
  const createDayMutation = useMutation({
    mutationFn: async (input: ItineraryDayInput) => {
      const created = await apiFetch<any>(`/api/itineraryDay`, {
        method: 'POST',
        body: JSON.stringify(mapDayInput(input)),
      });
      return mapDay(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar dia', description: error.message, variant: 'destructive' });
    },
  });

  const updateDayMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ItineraryDayInput> & { id: string }) => {
      const payload: any = { updatedAt: new Date().toISOString() };
      if (input.day_number !== undefined) payload.dayNumber = input.day_number;
      if (input.title !== undefined) payload.title = input.title ?? null;
      if (input.date !== undefined) payload.date = input.date ? new Date(input.date).toISOString() : null;
      if (input.location !== undefined) payload.location = input.location ?? null;
      if (input.description !== undefined) payload.description = input.description ?? null;
      if (input.cover_image_url !== undefined) payload.coverImageUrl = input.cover_image_url ?? null;
      if (input.images !== undefined) payload.images = input.images ?? [];
      if (input.links !== undefined) payload.links = input.links ?? [];
      if (input.sort_order !== undefined) payload.sortOrder = input.sort_order ?? 0;

      const updated = await apiFetch<any>(`/api/itineraryDay/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapDay(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar dia', description: error.message, variant: 'destructive' });
    },
  });

  const deleteDayMutation = useMutation({
    mutationFn: async (dayId: string) => {
      await apiFetch(`/api/itineraryDay/${dayId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
      toast({ title: 'Dia excluído!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir dia', description: error.message, variant: 'destructive' });
    },
  });

  // Item mutations
  const createItemMutation = useMutation({
    mutationFn: async (input: ItineraryItemInput) => {
      const created = await apiFetch<any>(`/api/itineraryItem`, {
        method: 'POST',
        body: JSON.stringify(mapItemInput(input)),
      });
      return mapItem(created);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao criar item', description: error.message, variant: 'destructive' });
    },
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ id, ...input }: Partial<ItineraryItemInput> & { id: string }) => {
      const payload: any = { updatedAt: new Date().toISOString() };
      if (input.type !== undefined) payload.type = input.type;
      if (input.title !== undefined) payload.title = input.title;
      if (input.description !== undefined) payload.description = input.description ?? null;
      if (input.start_time !== undefined) {
        payload.startTime = input.start_time ? new Date(`1970-01-01T${input.start_time}`).toISOString() : null;
      }
      if (input.end_time !== undefined) {
        payload.endTime = input.end_time ? new Date(`1970-01-01T${input.end_time}`).toISOString() : null;
      }
      if (input.location !== undefined) payload.location = input.location ?? null;
      if (input.address !== undefined) payload.address = input.address ?? null;
      if (input.details !== undefined) payload.details = input.details ?? {};
      if (input.images !== undefined) payload.images = input.images ?? [];
      if (input.links !== undefined) payload.links = input.links ?? [];
      if (input.price !== undefined) payload.price = input.price ?? null;
      if (input.currency !== undefined) payload.currency = input.currency ?? 'BRL';
      if (input.booking_reference !== undefined) payload.bookingReference = input.booking_reference ?? null;
      if (input.confirmation_number !== undefined) payload.confirmationNumber = input.confirmation_number ?? null;
      if (input.sort_order !== undefined) payload.sortOrder = input.sort_order ?? 0;

      const updated = await apiFetch<any>(`/api/itineraryItem/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      return mapItem(updated);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao atualizar item', description: error.message, variant: 'destructive' });
    },
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (itemId: string) => {
      await apiFetch(`/api/itineraryItem/${itemId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['itinerary-details', itineraryId] });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao excluir item', description: error.message, variant: 'destructive' });
    },
  });

  return {
    itinerary: query.data,
    isLoading: query.isLoading,
    refetch: query.refetch,
    // Day operations
    createDay: createDayMutation.mutateAsync,
    updateDay: updateDayMutation.mutate,
    deleteDay: deleteDayMutation.mutate,
    // Item operations
    createItem: createItemMutation.mutateAsync,
    updateItem: updateItemMutation.mutate,
    deleteItem: deleteItemMutation.mutate,
  };
}

// Hook for public itinerary access
export function usePublicItinerary(token: string | null, accessToken?: string | null) {
  return useQuery({
    queryKey: ['public-itinerary', token, accessToken],
    queryFn: async () => {
      if (!token) return null;

      const params = new URLSearchParams({
        where: JSON.stringify({ publicToken: token, isActive: true }),
        include: JSON.stringify({
          agency: { select: { id: true, name: true, logoUrl: true, email: true, phone: true, instagramHandle: true } },
          days: {
            include: {
              items: { include: { feedbacks: true } },
              feedbacks: true,
            },
          },
        }),
      });

      const { data } = await apiFetch<{ data: any[] }>(`/api/customItinerary?${params.toString()}`);
      const itinerary = data?.[0];
      if (!itinerary) return null;

      // Check access token if required
      if (itinerary.requiresToken && itinerary.accessToken !== accessToken) {
        return { requiresToken: true, itinerary: null };
      }

      const days =
        (itinerary.days || []).map((d: any) => ({
          ...mapDay(d),
          items: (d.items || []).map((it: any) => ({
            ...mapItem(it),
            feedbacks: (it.feedbacks || []).map(mapItemFeedback),
            feedback: (it.feedbacks || []).length
              ? mapItemFeedback((it.feedbacks || [])[ (it.feedbacks || []).length - 1])
              : null,
          })),
          feedbacks: (d.feedbacks || []).map(mapDayFeedback),
          feedback: (d.feedbacks || []).length
            ? mapDayFeedback((d.feedbacks || [])[ (d.feedbacks || []).length - 1])
            : null,
        })) as (ItineraryDay & { feedback?: ItineraryDayFeedback | null; feedbacks?: ItineraryDayFeedback[] })[];

      return {
        requiresToken: false,
        itinerary: {
          ...mapItinerary(itinerary),
          days,
        } as CustomItinerary,
        agency: itinerary.agency ? { ...itinerary.agency, logo_url: itinerary.agency.logoUrl } : null,
      };
    },
    enabled: !!token,
  });
}

// Hook for submitting public feedback
export function usePublicItineraryFeedback() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const submitItemFeedbackMutation = useMutation({
    mutationFn: async ({ itemId, isApproved, observation, clientName }: {
      itemId: string;
      isApproved?: boolean;
      observation?: string;
      clientName?: string;
    }) => {
      const created = await apiFetch(`/api/itineraryItemFeedback`, {
        method: 'POST',
        body: JSON.stringify({
          itemId,
          isApproved: isApproved ?? null,
          observation: observation ?? null,
          clientName: clientName ?? null,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-itinerary'] });
      toast({ title: 'Feedback enviado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar feedback', description: error.message, variant: 'destructive' });
    },
  });

  const submitDayFeedbackMutation = useMutation({
    mutationFn: async ({ dayId, isApproved, observation, clientName }: {
      dayId: string;
      isApproved?: boolean;
      observation?: string;
      clientName?: string;
    }) => {
      const created = await apiFetch(`/api/itineraryDayFeedback`, {
        method: 'POST',
        body: JSON.stringify({
          dayId,
          isApproved: isApproved ?? null,
          observation: observation ?? null,
          clientName: clientName ?? null,
        }),
      });
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-itinerary'] });
      toast({ title: 'Feedback enviado!' });
    },
    onError: (error: any) => {
      toast({ title: 'Erro ao enviar feedback', description: error.message, variant: 'destructive' });
    },
  });

  return {
    submitItemFeedback: submitItemFeedbackMutation.mutateAsync,
    submitDayFeedback: submitDayFeedbackMutation.mutateAsync,
    isSubmitting: submitItemFeedbackMutation.isPending || submitDayFeedbackMutation.isPending,
  };
}
