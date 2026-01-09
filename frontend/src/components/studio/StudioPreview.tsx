import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { MessageCircle, Plane, MapPin, Calendar, Hotel, Coffee, Luggage, Car, Bus } from 'lucide-react';
import type { FormatType, ArtType } from '@/pages/Studio';
import type { ArtData, PacoteData, VooData, HospedagemData, StudioColors, IconSelection, CurrencyType } from './StudioEditor';

interface FormatOption {
  id: FormatType;
  name: string;
  dimensions: string;
  width: number;
  height: number;
}

interface ArtTypeOption {
  id: ArtType;
  name: string;
  description: string;
}

interface StudioPreviewProps {
  format: FormatOption;
  artType: ArtTypeOption;
  templateId: number;
  data: ArtData;
  images: string[];
  colors: StudioColors;
  icons?: IconSelection;
  blurLevel?: number;
  isExportMode?: boolean;
}

// Helper to truncate text
const truncate = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength - 1) + '…' : text;
};

// Helper to format currency
const formatCurrency = (value: string, currency: CurrencyType = 'BRL') => {
  const symbols = { BRL: 'R$', EUR: '€', USD: '$' };
  return `${symbols[currency]} ${value}`;
};

const hexToRgba = (hex: string | undefined, alpha: number) => {
  const clean = (hex || '#000000').replace('#', '');
  if (clean.length !== 6) return `rgba(0,0,0,${alpha})`;
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const hexToRgbaPercent = (hex: string, opacityPercent: number) => {
  return hexToRgba(hex, opacityPercent / 100);
};

export const StudioPreview = forwardRef<HTMLDivElement, StudioPreviewProps>(
  ({ format, artType, templateId, data, images, colors, icons, blurLevel = 24, isExportMode = false }, ref) => {
    const safeColors: StudioColors = {
      primary: colors?.primary || '#344331',
      secondary: colors?.secondary || '#837d24',
      headerColor: colors?.headerColor || '#344331',
      headerTextColor: colors?.headerTextColor || '#ffffff',
      headerTransparent: colors?.headerTransparent ?? false,
      headerOpacity: colors?.headerOpacity ?? 10,
      headerBlur: colors?.headerBlur ?? 3,
      headerRadius: colors?.headerRadius ?? 20,
      titleFontSize: colors?.titleFontSize ?? 40,
      titleFontFamily: colors?.titleFontFamily || 'Poppins',
      titleFontWeight: colors?.titleFontWeight ?? 700,
      titleFontStyle: colors?.titleFontStyle || 'normal',
      headerTopSpacing: colors?.headerTopSpacing ?? 40,
      dateTextColor: colors?.dateTextColor || '#ffffff',
      nightsCardColor: colors?.nightsCardColor || '#344331',
      nightsCardOpacity: colors?.nightsCardOpacity ?? 100,
      nightsCardRadius: colors?.nightsCardRadius ?? 20,
      nightsCardBlur: colors?.nightsCardBlur ?? 0,
      fontPrimary: colors?.fontPrimary || '#ffffff',
      fontSecondary: colors?.fontSecondary || '#837d24',
      logo: colors?.logo || '',
    };
    const aspectRatio = format.width / format.height;
    const isVertical = aspectRatio < 1;
    const isStories = format.height > format.width * 1.5; // Stories format detection (1080x1920)
    const isInstagramPost = format.id === 'instagram-post'; // 1080x1440 (3:4)
    const effectiveBlurLevel = isStories ? 0 : blurLevel;
    
    // Scale factor for Instagram Post format (larger than square but not stories)
    const scaleFactor = isInstagramPost ? 1.25 : 1;

    // Always render at half size, export mode just wraps in a container
    const displayWidth = format.width / 2;
    const displayHeight = format.height / 2;

    const storySafeTop = 125;
    const storySafeBottom = 170;

    return (
      <div
        ref={ref}
        className="relative overflow-hidden rounded-xl shadow-2xl bg-white"
        style={{
          width: displayWidth,
          height: displayHeight,
        }}
      >
        {/* Background Photo - Full visibility, no overlay */}
        {images.length > 0 ? (
          <div className="absolute inset-0">
            {images.length === 1 && (
              <img src={images[0]} alt="" className="w-full h-full object-cover" />
            )}
            {images.length === 2 && (
              <div className="flex h-full">
                {images.map((img, i) => (
                  <img key={i} src={img} alt="" className="w-1/2 h-full object-cover" />
                ))}
              </div>
            )}
            {images.length === 3 && (
              <div className="grid grid-cols-2 h-full">
                <img src={images[0]} alt="" className="row-span-2 w-full h-full object-cover" />
                <img src={images[1]} alt="" className="w-full h-full object-cover" />
                <img src={images[2]} alt="" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        ) : (
          <div 
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, hsl(210 40% 96%) 0%, hsl(210 40% 90%) 100%)`
            }}
          />
        )}

        {/* Template-specific blur overlay */}
        {templateId === 1 && (
          <ModernBlurOverlay colors={safeColors} blurLevel={effectiveBlurLevel} isVertical={isVertical} isStories={isStories} isExportMode={isExportMode} />
        )}

        {/* Content Layer - centered for Stories */}
        <div
  className={cn(
    "relative h-full flex flex-col",
    isVertical ? "px-5" : "px-4",
    isStories ? "justify-between" : ""
  )}
  style={{
    paddingTop: isStories ? storySafeTop : undefined,
    paddingBottom: isStories ? storySafeBottom : undefined,
  }}
>
          {artType.id === 'pacote' && (
            <PacoteTemplate 
              data={data as PacoteData} 
              isVertical={isVertical}
              colors={safeColors}
              templateId={templateId}
              format={format}
              icons={icons}
              isStories={isStories}
              isExportMode={isExportMode}
              scaleFactor={scaleFactor}
            />
          )}
          {artType.id === 'voo' && (
            <VooTemplate 
              data={data as VooData} 
              isVertical={isVertical}
              colors={safeColors}
              templateId={templateId}
              format={format}
              isStories={isStories}
              isExportMode={isExportMode}
              scaleFactor={scaleFactor}
            />
          )}
          {artType.id === 'hospedagem' && (
            <HospedagemTemplate 
              data={data as HospedagemData} 
              isVertical={isVertical}
              colors={safeColors}
              templateId={templateId}
              format={format}
              isStories={isStories}
              isExportMode={isExportMode}
              scaleFactor={scaleFactor}
            />
          )}
        </div>
      </div>
    );
  }
);

StudioPreview.displayName = 'StudioPreview';

// Blur Overlay Components for each template style
interface BlurOverlayProps {
  colors: StudioColors;
  blurLevel: number;
  isVertical: boolean;
  isStories?: boolean;
  isExportMode?: boolean;
}

// Modern: Blur from bottom
function ModernBlurOverlay({ colors, blurLevel, isVertical, isStories, isExportMode }: BlurOverlayProps) {
  const startPosition = isStories ? 58 : (isVertical ? 45 : 50);
  const colorTop = isStories ? startPosition + 5 : startPosition + 8;
  const exportGradient = isStories
    ? `linear-gradient(180deg, ${hexToRgba(colors.primary, 0)} 0%, ${hexToRgba(colors.primary, 0.28)} 45%, ${hexToRgba(colors.secondary, 0.5)} 100%)`
    : `linear-gradient(180deg, ${colors.primary}00 0%, ${colors.primary}55 35%, ${colors.secondary}88 100%)`;
  const colorGradient = isStories
    ? `linear-gradient(180deg, ${hexToRgba(colors.primary, 0)} 0%, ${hexToRgba(colors.primary, 0.38)} 45%, ${hexToRgba(colors.secondary, 0.6)} 100%)`
    : `linear-gradient(180deg, ${colors.primary}00 0%, ${colors.primary}88 40%, ${colors.secondary}cc 100%)`;
  
  return (
    <>
      {/* Backdrop blur layer */}
      <div 
        className="absolute left-0 right-0 bottom-0 pointer-events-none studio-blur-layer"
        data-blur-fallback={`${colors.primary}60`}
        style={{
          top: `${startPosition}%`,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%, black 100%)',
          ...(isExportMode 
            ? { 
                background: exportGradient,
                filter: `blur(${blurLevel}px)`,
                transform: 'scale(1.08)',
              }
            : {
                backdropFilter: `blur(${blurLevel}px)`,
                WebkitBackdropFilter: `blur(${blurLevel}px)`,
              }
          ),
        }}
      />
      {/* Color gradient layer */}
      <div 
        className="absolute left-0 right-0 bottom-0 pointer-events-none studio-color-layer"
        style={{
          top: `${colorTop}%`,
          background: colorGradient,
          WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.8) 100%)',
          maskImage: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.8) 100%)',
        }}
      />
    </>
  );
}

// Template Props
interface TemplateProps {
  isVertical: boolean;
  colors: StudioColors;
  templateId: number;
  format: { id?: string; width: number; height: number };
  isStories?: boolean;
  isExportMode?: boolean;
  scaleFactor?: number;
}

const iconComponents = {
  plane: Plane,
  luggage: Luggage,
  hotel: Hotel,
  car: Car,
  breakfast: Coffee,
  transfer: Bus,
};

function PacoteTemplate({ data, isVertical, colors, templateId, format, icons, isStories, isExportMode, scaleFactor = 1 }: TemplateProps & { data: PacoteData; icons?: IconSelection }) {
  // Get active icons
  const activeIcons = icons 
    ? Object.entries(icons).filter(([_, active]) => active).map(([key]) => key)
    : [];

  const hasObs = Boolean(data.observacao?.trim());
  const position = 'bottom';

  // Title side: left for bottom/left templates, right for right templates, center for top templates
  const titleSide: 'left' | 'right' | 'center' =
    position === 'right' ? 'right' : position === 'top' ? 'center' : 'left';
  const logoSide: 'left' | 'right' = titleSide === 'right' ? 'left' : 'right';

  return (
    <>
      {/* Logo - always opposite side of the title */}
      {colors.logo && (
        <div
          className={cn(
            'absolute z-20',
            isStories ? 'top-6' : 'top-4',
            logoSide === 'right' ? 'right-4' : 'left-4'
          )}
        >
          <img
            src={colors.logo}
            alt="Logo"
            className="h-8 w-auto object-contain drop-shadow-lg"
            style={{ maxWidth: '80px' }}
          />
        </div>
      )}

      {/* Header - Package name and period */}
      <div
        className={cn(
          'z-10',
          position === 'right' && 'ml-auto text-right',
          position === 'left' && 'mr-auto',
          position === 'top' && 'mx-auto text-center'
        )}
        style={{ 
          maxWidth: position === 'left' || position === 'right' ? '55%' : '100%',
          paddingTop: `${colors.headerTopSpacing ?? 20}px`,
        }}
      >
        <div
          className={cn(
            "inline-block overflow-hidden", 
            !colors.headerTransparent && "px-5 py-3 shadow-lg"
          )}
          style={{
            backgroundColor: colors.headerTransparent 
              ? 'transparent' 
              : hexToRgbaPercent(colors.headerColor, colors.headerOpacity ?? 100),
            borderRadius: colors.headerTransparent ? 0 : `${colors.headerRadius}px`,
            minWidth: colors.headerTransparent ? 'auto' : (position === 'top' ? '60%' : '50%'),
            maxWidth: '100%',
            position: 'relative',
          }}
        >
          {/* Glass-like blur effect */}
          {colors.headerBlur > 0 && !colors.headerTransparent && (
            <div
              className="absolute inset-0 studio-header-blur"
              data-blur-fallback={colors.headerColor}
              style={{
                borderRadius: `${colors.headerRadius}px`,
                ...(isExportMode
                  ? {
                      background: `linear-gradient(135deg, ${hexToRgba(colors.headerColor, 0.55)} 0%, ${hexToRgba(colors.secondary, 0.25)} 100%)`,
                      filter: `blur(${colors.headerBlur}px)`,
                      transform: 'scale(1.08)',
                    }
                  : {
                      backdropFilter: `blur(${colors.headerBlur}px)`,
                      WebkitBackdropFilter: `blur(${colors.headerBlur}px)`,
                    }
                ),
              }}
            />
          )}
          {data.periodo && (
            <p
              className="text-xs font-bold tracking-wide uppercase relative z-10"
              style={{ 
                color: colors.dateTextColor || colors.fontSecondary,
                marginBottom: '-2px',
              }}
            >
              {data.periodo}
            </p>
          )}
          <h2
            className="relative z-10"
            style={{
              color: colors.headerTextColor || colors.fontPrimary,
              fontSize: `${Math.min(colors.titleFontSize, 60)}px`,
              fontFamily: colors.titleFontFamily || 'Inter',
              fontWeight: colors.titleFontWeight || 900,
              fontStyle: colors.titleFontStyle || 'normal',
              lineHeight: 1.1,
              marginTop: 0,
            }}
          >
            {truncate(data.destinos || 'Destino', 40)}
          </h2>
        </div>

        {/* Observation badge */}
        {hasObs && (
          <div className={cn('block mt-2', position === 'right' && 'text-right')}>
            <span
              className="inline-block px-4 py-2 text-xs font-bold shadow-md rounded-xl bg-white/95"
              style={{ color: colors.headerColor }}
            >
              {truncate(data.observacao.trim(), 35)}
            </span>
          </div>
        )}
      </div>

      {/* Spacer - gap between header and bottom block */}
      {!isStories && (
        <div
          className="flex-1"
          style={{ minHeight: hasObs ? '40px' : '30px' }}
        />
      )}

      {/* Bottom/Side content */}
      <div 
        className={cn(
          "z-10 flex flex-col",
          position === 'right' && "text-right ml-auto",
          position === 'left' && "mr-auto",
          position === 'top' && !isStories && "mt-auto"
        )}
        style={{ 
          maxWidth: position === 'left' || position === 'right' ? '55%' : '100%',
          maxHeight: isStories ? '60%' : '55%',
          overflow: 'hidden',
          paddingBottom: '24px',
        }}
      >
        {/* Scrollable content area */}
        <div className="space-y-1.5 flex-shrink overflow-hidden">
          {/* Duration info */}
          {(data.noites || data.dias) && (
            <p 
              className="font-bold drop-shadow-lg" 
              style={{ 
                color: colors.fontPrimary,
                fontSize: `${16 * scaleFactor}px`,
              }}
            >
              {data.noites && `${data.noites} noites`}{data.noites && data.dias && ' / '}{data.dias && `${data.dias} dias`}
            </p>
          )}

          {/* Icons row - only show selected icons */}
          {activeIcons.length > 0 && (
            <div className={cn("flex gap-2 py-1", position === 'right' && "justify-end")}>
              {activeIcons.map((iconKey) => {
                const Icon = iconComponents[iconKey as keyof typeof iconComponents];
                return Icon ? (
                  <div 
                    key={iconKey}
                    className="rounded-full border-2 border-white/80 flex items-center justify-center"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      width: `${32 * scaleFactor}px`,
                      height: `${32 * scaleFactor}px`,
                    }}
                  >
                    <Icon style={{ color: colors.fontPrimary, width: `${16 * scaleFactor}px`, height: `${16 * scaleFactor}px` }} />
                  </div>
                ) : null;
              })}
            </div>
          )}

          {/* Includes as badges */}
          {data.incluiItems && data.incluiItems.length > 0 && (
            <div className={cn("flex flex-wrap gap-2", position === 'right' && "justify-end")}>
              {data.incluiItems.slice(0, isVertical ? 6 : 4).map((item, i) => (
                <span 
                  key={i} 
                  className="rounded-full font-semibold border-2 border-white/70 bg-white/10 backdrop-blur-sm"
                  style={{ 
                    color: colors.fontPrimary,
                    padding: `${4 * scaleFactor}px ${12 * scaleFactor}px`,
                    fontSize: `${12 * scaleFactor}px`,
                  }}
                >
                  {truncate(item, 20)}
                </span>
              ))}
            </div>
          )}

          {/* Bottom row - Price and Nights */}
          <div className={cn(
            "flex items-end pt-1",
            position === 'left' || position === 'right' ? "justify-between" : "justify-between",
            position === 'right' && "flex-row-reverse"
          )}>
            {/* Price section */}
            <div className={position === 'right' ? 'text-right' : ''}>
              {data.hasDiscount && data.precoOriginal ? (
                <>
                  <p className="font-medium line-through opacity-70" style={{ color: colors.fontPrimary, fontSize: `${12 * scaleFactor}px` }}>
                    De {formatCurrency(data.precoOriginal, data.currency)}
                  </p>
                  <p className="font-medium" style={{ color: colors.fontSecondary, fontSize: `${12 * scaleFactor}px` }}>Por apenas</p>
                  <p className="font-black drop-shadow-lg" style={{ color: colors.fontPrimary, fontSize: `${30 * scaleFactor}px` }}>
                    {formatCurrency(data.preco || '2.999', data.currency)}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-medium" style={{ color: colors.fontSecondary, fontSize: `${12 * scaleFactor}px` }}>A partir de</p>
                  <p className="font-black drop-shadow-lg" style={{ color: colors.fontPrimary, fontSize: `${30 * scaleFactor}px` }}>
                    {formatCurrency(data.preco || '2.999', data.currency)}
                  </p>
                </>
              )}
              {data.hasInstallment && data.parcelas && data.valorParcela && (
                <p className="font-semibold mt-1" style={{ color: colors.fontSecondary, fontSize: `${12 * scaleFactor}px` }}>
                  {data.hasEntrada && data.entrada 
                    ? `Entrada ${formatCurrency(data.entrada, data.currency)} + ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
                    : `ou ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
                  }
                </p>
              )}
            </div>

            {/* Nights box */}
            {data.noites && (
              <div 
                className={cn(
                  "text-center shadow-lg relative overflow-hidden",
                  position === 'right' && "order-first"
                )}
                style={{
                  backgroundColor: hexToRgbaPercent(
                    colors.nightsCardColor || colors.headerColor,
                    colors.nightsCardOpacity ?? 100
                  ),
                  borderRadius: `${colors.nightsCardRadius ?? colors.headerRadius}px`,
                  padding: `${12 * scaleFactor}px ${16 * scaleFactor}px`,
                }}
              >
                {/* Glass-like blur effect for nights card */}
                {(colors.nightsCardBlur ?? 0) > 0 && (
                  <div
                    className="absolute inset-0 studio-nights-blur"
                    data-blur-fallback={colors.nightsCardColor || colors.headerColor}
                    style={{
                      borderRadius: `${colors.nightsCardRadius ?? colors.headerRadius}px`,
                      ...(isExportMode
                        ? {
                            background: `linear-gradient(135deg, ${hexToRgba(colors.nightsCardColor || colors.headerColor, 0.55)} 0%, ${hexToRgba(colors.secondary, 0.25)} 100%)`,
                            filter: `blur(${colors.nightsCardBlur}px)`,
                            transform: 'scale(1.08)',
                          }
                        : {
                            backdropFilter: `blur(${colors.nightsCardBlur}px)`,
                            WebkitBackdropFilter: `blur(${colors.nightsCardBlur}px)`,
                          }
                      ),
                    }}
                  />
                )}
                <p className="font-black relative z-10" style={{ color: colors.fontPrimary, fontSize: `${30 * scaleFactor}px` }}>
                  {data.noites}
                </p>
                <p className="font-bold tracking-wider uppercase relative z-10" style={{ color: colors.fontPrimary, opacity: 0.9, fontSize: `${12 * scaleFactor}px` }}>
                  Noites
                </p>
              </div>
            )}
          </div>

          {/* CTA */}
          {data.cta && (
            <div className={cn("pt-1", position === 'right' && "text-right")}>
              <span 
                className="inline-flex items-center gap-2 bg-green-500 text-white rounded-full font-bold shadow-lg"
                style={{
                  padding: `${8 * scaleFactor}px ${16 * scaleFactor}px`,
                  fontSize: `${14 * scaleFactor}px`,
                }}
              >
                <MessageCircle style={{ width: `${16 * scaleFactor}px`, height: `${16 * scaleFactor}px` }} />
                {data.cta}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Disclaimer - absolutely positioned at bottom */}
      <p 
        className={cn(
          "absolute bottom-3 left-5 right-5 text-[10px] opacity-60 z-20",
          position === 'right' && "text-right"
        )} 
        style={{ color: colors.fontPrimary }}
      >
        {data.disclaimer || 'Valores sujeitos a reajuste e disponibilidade.'}
      </p>
    </>
  );
}

function VooTemplate({ data, isVertical, colors, templateId, format, isStories, isExportMode, scaleFactor = 1 }: TemplateProps & { data: VooData }) {
  const logoSide: 'left' | 'right' = 'right';

  return (
    <>
      {/* Logo - always opposite side of the title */}
      {colors.logo && (
        <div className={cn('absolute z-20', isStories ? 'top-6' : 'top-4', logoSide === 'right' ? 'right-4' : 'left-4')}>
          <img
            src={colors.logo}
            alt="Logo"
            className="h-8 w-auto object-contain drop-shadow-lg"
            style={{ maxWidth: '80px' }}
          />
        </div>
      )}

      {/* Header */}
      <div
        className="z-10"
        style={{ 
          maxWidth: '70%',
          paddingTop: `${colors.headerTopSpacing ?? 20}px`,
        }}
      >
        <div
          className={cn(
            "inline-block overflow-hidden", 
            !colors.headerTransparent && "px-5 py-3 shadow-lg"
          )}
          style={{
            backgroundColor: colors.headerTransparent 
              ? 'transparent' 
              : hexToRgbaPercent(colors.headerColor, colors.headerOpacity ?? 100),
            minWidth: colors.headerTransparent ? 'auto' : '60%',
            borderRadius: colors.headerTransparent ? 0 : `${colors.headerRadius}px`,
            position: 'relative',
          }}
        >
           {colors.headerBlur > 0 && !colors.headerTransparent && (
             <div
               className="absolute inset-0 studio-header-blur"
               data-blur-fallback={colors.headerColor}
               style={{
                 borderRadius: `${colors.headerRadius}px`,
                 ...(isExportMode
                   ? {
                       background: `linear-gradient(135deg, ${hexToRgba(colors.headerColor, 0.55)} 0%, ${hexToRgba(colors.secondary, 0.25)} 100%)`,
                       filter: `blur(${colors.headerBlur}px)`,
                       transform: 'scale(1.08)',
                     }
                   : {
                       backdropFilter: `blur(${colors.headerBlur}px)`,
                       WebkitBackdropFilter: `blur(${colors.headerBlur}px)`,
                     }
                 ),
               }}
             />
           )}
          <div className="flex items-start gap-3 relative z-10">
            <Plane className="w-7 h-7" style={{ color: colors.headerTextColor || colors.fontPrimary }} />
            <div>
              {data.companhia && (
                <p className="text-xs opacity-80" style={{ color: colors.dateTextColor || colors.fontSecondary }}>
                  {truncate(data.companhia, 20)}
                </p>
              )}
              <p
                className="relative z-10"
                style={{
                  color: colors.headerTextColor || colors.fontPrimary,
                  fontSize: `${Math.max(Math.min(colors.titleFontSize * 0.85, 36), 28)}px`,
                  fontFamily: colors.titleFontFamily || 'Inter',
                  fontWeight: colors.titleFontWeight || 900,
                  fontStyle: colors.titleFontStyle || 'normal',
                  lineHeight: 1.1,
                }}
              >
                {truncate(data.destino || 'Destino', 24)}
              </p>
              <p
                className="text-xs font-medium mt-1"
                style={{ color: colors.dateTextColor || colors.fontSecondary }}
              >
                Saindo de {truncate(data.origem || 'origem', 24)}
              </p>
            </div>
          </div>
        </div>
      </div>

       {/* Spacer - only for non-stories */}
       {!isStories && <div className="flex-1 flex-shrink" style={{ minHeight: '5%' }} />}

      {/* Bottom content - centered in stories */}
      <div 
        className={cn(
          "z-10",
          !isStories && "space-y-3",
          isStories && "flex-1 flex flex-col justify-center"
        )}
        style={{ 
          maxWidth: '70%',
          ...(isStories && { gap: '12px' }),
        }}
      >
        {/* Flight details badges */}
        <div className="flex flex-wrap gap-2">
          {data.datas && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {truncate(data.datas, 20)}
            </span>
          )}
          {data.numeroVoo && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              <Plane className="w-3.5 h-3.5" />
              Voo {data.numeroVoo}
            </span>
          )}
          {data.bagagem && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              <Luggage className="w-3.5 h-3.5" />
              {truncate(data.bagagem, 18)}
            </span>
          )}
        </div>

        {/* Price box */}
        <div className="inline-block p-4 shadow-lg" style={{ backgroundColor: 'white', borderRadius: `${colors.headerRadius}px` }}>
          {data.hasDiscount && data.precoOriginal ? (
            <>
              <p className="text-gray-400 text-xs line-through">De {formatCurrency(data.precoOriginal, data.currency)}</p>
              <p className="text-gray-500 text-xs">Por apenas</p>
            </>
          ) : (
            <p className="text-gray-500 text-xs">A partir de</p>
          )}
          <p className="font-black text-4xl" style={{ color: colors.headerColor }}>
            {formatCurrency(data.preco || '999', data.currency)}
          </p>
          <p className="text-gray-400 text-xs">por pessoa</p>
          {data.hasInstallment && data.parcelas && data.valorParcela && (
            <p className="text-xs font-semibold mt-1" style={{ color: colors.headerColor }}>
              {data.hasEntrada && data.entrada 
                ? `Entrada ${formatCurrency(data.entrada, data.currency)} + ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
                : `ou ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
              }
            </p>
          )}
        </div>

        {/* CTA */}
        {data.cta && (
          <div>
            <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              <MessageCircle className="w-4 h-4" />
              {data.cta}
            </span>
          </div>
        )}
        
        {/* Disclaimer */}
        <p className="text-[10px] pt-4 pb-3 opacity-60" style={{ color: colors.fontPrimary }}>
          {data.disclaimer || 'Valores sujeitos a reajuste e disponibilidade.'}
        </p>
      </div>
    </>
  );
}

function HospedagemTemplate({ data, isVertical, colors, templateId, format, isStories, isExportMode, scaleFactor = 1 }: TemplateProps & { data: HospedagemData }) {
  const logoSide: 'left' | 'right' = 'right';

  return (
    <>
      {/* Logo - always opposite side of the title */}
      {colors.logo && (
        <div className={cn('absolute z-20', isStories ? 'top-6' : 'top-4', logoSide === 'right' ? 'right-4' : 'left-4')}>
          <img
            src={colors.logo}
            alt="Logo"
            className="h-8 w-auto object-contain drop-shadow-lg"
            style={{ maxWidth: '80px' }}
          />
        </div>
      )}

      {/* Header */}
      <div
        className="z-10"
        style={{ 
          maxWidth: '70%',
          paddingTop: `${colors.headerTopSpacing ?? 20}px`,
        }}
      >
        <div
          className={cn(
            "inline-block overflow-hidden", 
            !colors.headerTransparent && "px-5 py-3 shadow-lg"
          )}
          style={{
            backgroundColor: colors.headerTransparent 
              ? 'transparent' 
              : hexToRgbaPercent(colors.headerColor, colors.headerOpacity ?? 100),
            minWidth: colors.headerTransparent ? 'auto' : '65%',
            borderRadius: colors.headerTransparent ? 0 : `${colors.headerRadius}px`,
            position: 'relative',
          }}
        >
           {colors.headerBlur > 0 && !colors.headerTransparent && (
             <div
               className="absolute inset-0 studio-header-blur"
               data-blur-fallback={colors.headerColor}
               style={{
                 borderRadius: `${colors.headerRadius}px`,
                 ...(isExportMode
                   ? {
                       background: `linear-gradient(135deg, ${hexToRgba(colors.headerColor, 0.55)} 0%, ${hexToRgba(colors.secondary, 0.25)} 100%)`,
                       filter: `blur(${colors.headerBlur}px)`,
                       transform: 'scale(1.08)',
                     }
                   : {
                       backdropFilter: `blur(${colors.headerBlur}px)`,
                       WebkitBackdropFilter: `blur(${colors.headerBlur}px)`,
                     }
                 ),
               }}
             />
           )}
          <div className="flex items-center gap-3 relative z-10">
            <Hotel className="w-7 h-7" style={{ color: colors.headerTextColor || colors.fontPrimary }} />
            <div>
              {data.cidade && (
                <p className="text-xs opacity-80 flex items-center gap-1" style={{ color: colors.dateTextColor || colors.fontSecondary }}>
                  <MapPin className="w-3 h-3" />
                  {truncate(data.cidade, 20)}
                </p>
              )}
              <p 
                className="relative z-10" 
                style={{ 
                  color: colors.headerTextColor || colors.fontPrimary, 
                  fontSize: `${Math.min(colors.titleFontSize, 60)}px`,
                  fontFamily: colors.titleFontFamily || 'Inter',
                  fontWeight: colors.titleFontWeight || 900,
                  fontStyle: colors.titleFontStyle || 'normal',
                  lineHeight: 1.1,
                }}
              >
                {truncate(data.hotel || 'Nome do Hotel', 25)}
              </p>
            </div>
          </div>
        </div>
      </div>

       {/* Spacer - only for non-stories */}
       {!isStories && (
         <div
           className="flex-1 flex-shrink"
           style={{ minHeight: '5%' }}
         />
       )}

      {/* Bottom content - centered in stories */}
      <div 
        className={cn(
          "z-10",
          !isStories && "space-y-3",
          isStories && "flex-1 flex flex-col justify-center"
        )}
        style={{ 
          maxWidth: '70%',
          ...(isStories && { gap: '12px' }),
        }}
      >
        {/* Info badges */}
        <div className="flex flex-wrap gap-2">
          {data.checkIn && data.checkOut && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              <Calendar className="w-3.5 h-3.5" />
              {truncate(data.checkIn, 10)} - {truncate(data.checkOut, 10)}
            </span>
          )}
          {data.diarias && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              🌙 {data.diarias} diárias
            </span>
          )}
          {data.regime && (
            <span 
              className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold shadow-md"
              style={{ backgroundColor: 'rgba(255,255,255,0.95)', color: colors.headerColor }}
            >
              <Coffee className="w-3.5 h-3.5" />
              {truncate(data.regime, 18)}
            </span>
          )}
        </div>

        {/* Bottom row - Price and Nights */}
        <div className="flex items-end justify-between">
          {/* Nights box */}
          <div 
            className="px-4 py-3 text-center shadow-lg"
            style={{ backgroundColor: 'white', borderRadius: `${colors.headerRadius}px` }}
          >
            <p className="font-black text-3xl" style={{ color: colors.headerColor }}>
              {data.diarias || '5'}
            </p>
            <p className="font-bold text-xs tracking-wider uppercase" style={{ color: colors.headerColor }}>
              Diárias
            </p>
          </div>

          {/* Price */}
          <div className="text-right">
            {data.hasDiscount && data.precoOriginal ? (
              <>
                <p className="text-xs opacity-70 line-through" style={{ color: colors.fontPrimary }}>
                  De {formatCurrency(data.precoOriginal, data.currency)}
                </p>
                <p className="text-xs" style={{ color: colors.fontSecondary }}>Por apenas</p>
              </>
            ) : (
              <p className="text-xs opacity-80" style={{ color: colors.fontPrimary }}>A partir de</p>
            )}
            <p className="font-black text-4xl drop-shadow-lg" style={{ color: colors.fontPrimary }}>
              {formatCurrency(data.preco || '1.299', data.currency)}
            </p>
            <p className="text-xs opacity-70" style={{ color: colors.fontPrimary }}>por pessoa</p>
            {data.hasInstallment && data.parcelas && data.valorParcela && (
              <p className="text-xs font-semibold mt-1" style={{ color: colors.fontSecondary }}>
                {data.hasEntrada && data.entrada 
                  ? `Entrada ${formatCurrency(data.entrada, data.currency)} + ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
                  : `ou ${data.parcelas}x de ${formatCurrency(data.valorParcela, data.currency)}`
                }
              </p>
            )}
          </div>
        </div>

        {/* CTA */}
        {data.cta && (
          <div>
            <span className="inline-flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg">
              <MessageCircle className="w-4 h-4" />
              {data.cta}
            </span>
          </div>
        )}
        
        {/* Disclaimer */}
        <p className="text-[10px] pt-4 pb-3 opacity-60" style={{ color: colors.fontPrimary }}>
          {data.disclaimer || 'Valores sujeitos a reajuste e disponibilidade.'}
        </p>
      </div>
    </>
  );
}
