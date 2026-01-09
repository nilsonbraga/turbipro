import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { FormatType, ArtType } from '@/pages/Studio';

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

export interface TemplateColors {
  primary: string;
  secondary: string;
}

interface StudioTemplateSelectorProps {
  format: FormatOption;
  artType: ArtTypeOption;
  onSelect: (templateId: number, colors: TemplateColors) => void;
}

// Template styles with modern brand-inspired color schemes
const templateStyles = {
  pacote: [
    { id: 1, name: 'Terra', description: 'Destaque inferior', colors: { primary: '#344331', secondary: '#837d24' } },
  ],
  voo: [
    { id: 1, name: 'Terra', description: 'Destaque inferior', colors: { primary: '#344331', secondary: '#837d24' } },
  ],
  hospedagem: [
    { id: 1, name: 'Terra', description: 'Destaque inferior', colors: { primary: '#344331', secondary: '#837d24' } },
  ],
};

export function StudioTemplateSelector({ format, artType, onSelect }: StudioTemplateSelectorProps) {
  const templates = templateStyles[artType.id];
  
  const handleSelect = (template: typeof templates[0]) => {
    onSelect(template.id, template.colors);
  };
  
  // Calculate aspect ratio for preview - match actual format
  const aspectRatio = format.width / format.height;
  const isVertical = aspectRatio < 1;
  const isStories = format.height > format.width * 1.5;

  // Preview dimensions that match the format
  const previewMaxHeight = isVertical ? 220 : 140;
  const previewWidth = previewMaxHeight * aspectRatio;
  const previewHeight = previewMaxHeight;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Escolha um modelo</h2>
      <p className="text-muted-foreground">
        Modelo clássico com destaque inferior.
      </p>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {templates.map((template) => (
          <Card 
            key={template.id}
            className={cn(
              "cursor-pointer rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg overflow-hidden",
              "transition-colors group hover:bg-white"
            )}
            onClick={() => handleSelect(template)}
          >
            <CardContent className="p-5 space-y-3">
              {/* Template Preview - Correct aspect ratio */}
              <div 
                className="relative rounded-2xl overflow-hidden mx-auto group-hover:scale-[1.02] transition-transform"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  background: `linear-gradient(135deg, ${template.colors.primary}40 0%, ${template.colors.secondary}30 100%)`
                }}
              >
                {/* Photo placeholder - subtle gradient */}
                <div 
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(180deg, rgba(200,200,200,0.3) 0%, rgba(150,150,150,0.2) 100%)'
                  }}
                />
                
                {/* Template-specific blur preview */}
                {template.id === 1 && (
                  // Terra - blur from bottom
                  <div 
                    className="absolute left-0 right-0 bottom-0"
                    style={{
                      height: isStories ? '55%' : '50%',
                      background: `linear-gradient(180deg, transparent 0%, ${template.colors.primary}88 40%, ${template.colors.secondary}cc 100%)`,
                    }}
                  />
                )}
                
                
                {/* Mock content elements - positioned based on template */}
                {template.id === 1 && (
                  <div className="absolute inset-0 p-2 flex flex-col pointer-events-none">
                    <div
                      className="rounded shadow-sm flex-shrink-0 self-start"
                      style={{ 
                        backgroundColor: template.colors.primary,
                        width: isStories ? '55%' : '50%',
                        height: isStories ? 14 : 10,
                        marginTop: isStories ? 8 : 4,
                      }}
                    />
                    <div
                      className="self-start mt-1 rounded-full bg-white/90"
                      style={{
                        width: isStories ? '35%' : '30%',
                        height: isStories ? 8 : 6,
                      }}
                    />
                    <div className="flex-1" />
                    <div
                      className={cn("space-y-1 flex-shrink-0", isStories && "self-center text-center")}
                      style={{
                        marginBottom: isStories ? '15%' : 4,
                        width: '100%',
                      }}
                    >
                      <div
                        className={cn("bg-white/70 rounded", isStories && "mx-auto")}
                        style={{ width: isStories ? '40%' : '35%', height: isStories ? 6 : 4 }}
                      />
                      <div className={cn("flex items-end gap-1", isStories && "justify-center")}>
                        <div className="space-y-0.5">
                          <div
                            className="bg-white/50 rounded"
                            style={{ width: isStories ? 20 : 16, height: isStories ? 4 : 3 }}
                          />
                          <div
                            className="bg-white/90 rounded font-bold"
                            style={{ width: isStories ? 40 : 32, height: isStories ? 10 : 8 }}
                          />
                        </div>
                        <div
                          className="rounded"
                          style={{
                            backgroundColor: template.colors.primary,
                            width: isStories ? 20 : 16,
                            height: isStories ? 20 : 16,
                          }}
                        />
                      </div>
                      <div
                        className={cn("bg-green-500 rounded-full", isStories && "mx-auto")}
                        style={{ width: isStories ? '45%' : '40%', height: isStories ? 10 : 8 }}
                      />
                    </div>
                    <div className="bg-white/30 rounded absolute bottom-1 left-2 right-2" style={{ height: 3 }} />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <h3 className="font-semibold text-sm">{template.name}</h3>
                <p className="text-xs text-muted-foreground">{template.description}</p>
                {/* Color preview */}
                <div className="flex justify-center gap-1 mt-1">
                  <div 
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: template.colors.primary }}
                  />
                  <div 
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: template.colors.secondary }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
