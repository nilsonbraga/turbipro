import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import type { StudioColors, IconSelection, ArtData, CurrencyType } from '@/components/studio/StudioEditor';
import type { FormatType, ArtType } from '@/pages/Studio';

export interface SavedTemplate {
  id: string;
  name: string;
  createdAt: string;
  formatId: FormatType;
  artTypeId: ArtType;
  templateId: number;
  data: ArtData;
  colors: StudioColors;
  icons?: IconSelection;
  blurLevel: number;
  images: string[]; // URLs from storage
  logoUrl?: string;
  isFavorite: boolean;
}

interface SaveTemplateInput {
  name: string;
  formatId: FormatType;
  artTypeId: ArtType;
  templateId: number;
  data: ArtData;
  colors: StudioColors;
  icons?: IconSelection;
  blurLevel: number;
  images: string[]; // base64 strings
  logo: string; // base64 string
}

export function useStudioTemplates() {
  const { agency, user, isSuperAdmin } = useAuth();
  // Fallback for superadmin without selected agency
  const fallbackAgencyId = 'bfd6d952-a5c7-4129-827a-63b6dc4ad577';
  const { toast } = useToast();
  const [savedTemplates, setSavedTemplates] = useState<SavedTemplate[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load templates from API on mount
  useEffect(() => {
    // Se tiver agência selecionada ou for superadmin (usa fallback), carrega
    if (agency?.id || isSuperAdmin) {
      loadTemplates();
    }
  }, [agency?.id, isSuperAdmin]);

  const mapBackendToTemplate = (row: any): SavedTemplate => {
    const parsedData =
      typeof row.data === 'string'
        ? (JSON.parse(row.data) as ArtData)
        : ((row.data as unknown as ArtData) || {});
    // Prefer top-level colors/icons/images, but also read from nested data
    const parsedColors =
      typeof row.colors === 'string'
        ? (JSON.parse(row.colors) as StudioColors)
        : ((row.colors as unknown as StudioColors) || {});
    const parsedIcons =
      typeof row.icons === 'string'
        ? (JSON.parse(row.icons) as IconSelection)
        : ((row.icons as unknown as IconSelection | undefined) || undefined);
    const dataColors =
      typeof (parsedData as any)?.colors === 'string'
        ? (JSON.parse((parsedData as any).colors) as StudioColors)
        : ((parsedData as any)?.colors as StudioColors | undefined);
    const dataIcons =
      typeof (parsedData as any)?.icons === 'string'
        ? (JSON.parse((parsedData as any).icons) as IconSelection)
        : ((parsedData as any)?.icons as IconSelection | undefined);
    const dataLogo = (parsedData as any)?.logoUrl as string | undefined;
    const dataBlur = (parsedData as any)?.blurLevel as number | undefined;

    // Fallbacks for legacy records that might have stored fields inside data
    const dataImages = (parsedData as any)?.images;
    const mergedImages =
      Array.isArray(row.images) && row.images.length > 0
        ? row.images
        : Array.isArray(dataImages)
          ? dataImages
          : [];

    const nameFromData =
      (parsedData as any)?.destinos ||
      (parsedData as any)?.hotel ||
      (parsedData as any)?.origem ||
      (parsedData as any)?.title;
    const derivedName =
      (row.name && row.name !== 'Arte' ? row.name : undefined) ||
      nameFromData ||
      'Arte';

    const dataFormat = (parsedData as any)?.formatId as FormatType | undefined;
    const dataArtType = (parsedData as any)?.artTypeId as ArtType | undefined;
    const dataTemplateId = (parsedData as any)?.templateId as number | undefined;
    const dataBlurLevel = (parsedData as any)?.blurLevel as number | undefined;

    const derivedFormatId = (row.formatId || dataFormat || 'instagram-post') as FormatType;
    const derivedArtTypeId = (row.artTypeId || dataArtType || 'pacote') as ArtType;
    const derivedTemplateId = row.templateId ?? dataTemplateId ?? 1;

    const mergedColors = { ...parsedColors, ...(dataColors || {}) };

    return {
      id: row.id,
      name: derivedName,
      createdAt: row.createdAt,
      formatId: derivedFormatId,
      artTypeId: derivedArtTypeId,
      templateId: derivedTemplateId,
      data: parsedData,
      colors: {
        primary: mergedColors.primary || '#837d24',
        secondary: mergedColors.secondary || '#d0c131',
        headerColor: mergedColors.headerColor || '#344331',
        headerTextColor: mergedColors.headerTextColor || '#ffffff',
        headerTransparent: mergedColors.headerTransparent ?? false,
        headerOpacity: mergedColors.headerOpacity ?? 10,
        headerBlur: mergedColors.headerBlur ?? 3,
        headerRadius: mergedColors.headerRadius ?? 20,
        titleFontSize: mergedColors.titleFontSize ?? 40,
        titleFontFamily: mergedColors.titleFontFamily || 'Poppins',
        titleFontWeight: mergedColors.titleFontWeight ?? 700,
        titleFontStyle: mergedColors.titleFontStyle || 'normal',
        headerTopSpacing: mergedColors.headerTopSpacing ?? 40,
        dateTextColor: mergedColors.dateTextColor || '#ffffff',
        nightsCardColor: mergedColors.nightsCardColor || '#344331',
        nightsCardOpacity: mergedColors.nightsCardOpacity ?? 100,
        nightsCardRadius: mergedColors.nightsCardRadius ?? 20,
        nightsCardBlur: mergedColors.nightsCardBlur ?? 0,
        fontPrimary: mergedColors.fontPrimary || '#ffffff',
        fontSecondary: mergedColors.fontSecondary || '#d0c131',
        logo: mergedColors.logo || '',
      },
      icons: parsedIcons || dataIcons,
      blurLevel: row.blurLevel ?? dataBlurLevel ?? dataBlur ?? 24,
      images: mergedImages,
      logoUrl: row.logoUrl || dataLogo || undefined,
      isFavorite: row.isFavorite || false,
    };
  };

  const getTemplate = async (id: string) => {
    const tpl = await apiFetch<any>(`/api/studioTemplate/${id}`);
    return mapBackendToTemplate(tpl);
  };

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        orderBy: JSON.stringify({ createdAt: 'desc' }),
      });
      const agencyForQuery = agency?.id || fallbackAgencyId;
      // Trazer modelos da agência atual e também legados sem agência
      params.set(
        'where',
        JSON.stringify({
          OR: [{ agencyId: agencyForQuery }, { agencyId: null }],
        }),
      );
      const { data } = await apiFetch<{ data: any[] }>(`/api/studioTemplate?${params.toString()}`);
      setSavedTemplates((data || []).map(mapBackendToTemplate));
    } catch (error) {
      console.error('Error loading saved templates:', error);
      setSavedTemplates([]);
      toast({ title: 'Erro ao carregar modelos', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async (template: SaveTemplateInput, existingId?: string): Promise<SavedTemplate> => {
    const targetAgencyId = agency?.id || (user as any)?.agencyId || (user as any)?.agency_id || fallbackAgencyId;
    if (!targetAgencyId || !user?.id) {
      throw new Error('Selecione uma agência para salvar o modelo');
    }

    setIsSaving(true);
    
    try {
      const payload = {
        agencyId: targetAgencyId,
        createdById: user.id,
        name: template.name,
        formatId: template.formatId,
        artTypeId: template.artTypeId,
        templateId: template.templateId,
        data: template.data as any,
        colors: template.colors as any,
        icons: (template.icons || null) as any,
        blurLevel: template.blurLevel,
        images: template.images || [],
        logoUrl: template.logo || null,
      };
      // Duplicate fields inside data for backward compatibility with older records
      (payload.data as any).colors = template.colors;
      (payload.data as any).icons = template.icons;
      (payload.data as any).images = template.images;
      (payload.data as any).logoUrl = template.logo;
      (payload.data as any).blurLevel = template.blurLevel;
      (payload.data as any).formatId = template.formatId;
      (payload.data as any).artTypeId = template.artTypeId;
      (payload.data as any).templateId = template.templateId;
      (payload.data as any).name = template.name;

      if (existingId) {
        await apiFetch<any>(`/api/studioTemplate/${existingId}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
        const refreshed = await getTemplate(existingId);
        setSavedTemplates(prev => 
          prev.map(t => t.id === existingId ? refreshed : t)
        );
        toast({ title: 'Modelo atualizado!' });
        return refreshed;
      }

      const created = await apiFetch<any>(`/api/studioTemplate`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const newTemplate = await getTemplate(created.id);

      setSavedTemplates(prev => [newTemplate, ...prev]);
      toast({ title: 'Modelo salvo!' });
      return newTemplate;
    } catch (error: any) {
      console.error('Error saving template:', error);
      throw new Error(error?.message || 'Erro ao salvar modelo');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    try {
      await apiFetch(`/api/studioTemplate/${id}`, { method: 'DELETE' });
      setSavedTemplates(prev => prev.filter(t => t.id !== id));
      toast({ title: 'Modelo removido!' });
    } catch (error) {
      console.error('Error deleting template:', error);
      throw error;
    }
  };

  const updateTemplate = async (id: string, updates: Partial<SavedTemplate>) => {
    try {
      const dbUpdates: any = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.data !== undefined) dbUpdates.data = updates.data;
      if (updates.colors !== undefined) dbUpdates.colors = updates.colors;
      if (updates.icons !== undefined) dbUpdates.icons = updates.icons;
      if (updates.blurLevel !== undefined) dbUpdates.blurLevel = updates.blurLevel;
      if (updates.isFavorite !== undefined) dbUpdates.isFavorite = updates.isFavorite;

      await apiFetch(`/api/studioTemplate/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dbUpdates),
      });

      setSavedTemplates(prev => 
        prev.map(t => t.id === id ? { ...t, ...updates } : t)
      );
    } catch (error) {
      console.error('Error updating template:', error);
      throw error;
    }
  };

  const toggleFavorite = async (id: string) => {
    const template = savedTemplates.find(t => t.id === id);
    if (!template) return;
    
    await updateTemplate(id, { isFavorite: !template.isFavorite });
  };

  return {
    savedTemplates,
    saveTemplate,
    deleteTemplate,
    updateTemplate,
    toggleFavorite,
    loadTemplates,
    getTemplate,
    isSaving,
    isLoading,
  };
}
