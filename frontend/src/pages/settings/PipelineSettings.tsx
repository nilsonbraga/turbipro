import { useState } from 'react';
import { usePipelineStages, PipelineStage, PipelineStageInput, PipelineStageTemplate } from '@/hooks/usePipelineStages';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { formatSlaMinutes, parseSlaInput } from '@/utils/sla';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Palette, Plus, Edit, Trash2, GripVertical, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableStageItemProps {
  stage: PipelineStage;
  onEdit: () => void;
  onDelete: () => void;
}

function SortableStageItem({ stage, onEdit, onDelete }: SortableStageItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-4 p-4 bg-white border border-slate-100 rounded-2xl shadow-sm"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4 text-slate-400" />
      </div>
      <div 
        className="w-4 h-4 rounded-full" 
        style={{ backgroundColor: stage.color }} 
      />
      <div className="flex-1">
        <p className="font-medium">{stage.name}</p>
        <div className="flex gap-2 mt-1">
          {stage.is_closed && (
            <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">Fechado</Badge>
          )}
          {stage.is_lost && (
            <Badge variant="destructive" className="text-xs">Perdido</Badge>
          )}
          {stage.sla_minutes !== null && stage.sla_minutes !== undefined && (
            <Badge variant="outline" className="text-xs text-slate-500">
              SLA {formatSlaMinutes(stage.sla_minutes)}
            </Badge>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="ghost" size="icon" onClick={onEdit}>
          <Edit className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-destructive hover:text-destructive"
          onClick={onDelete}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

const colorOptions = [
  '#6366F1', '#8B5CF6', '#EC4899', '#EF4444', '#F59E0B', 
  '#10B981', '#14B8A6', '#3B82F6', '#6B7280', '#1F2937'
];

export default function PipelineSettings() {
  const { stages, createStage, updateStage, deleteStage, reorderStages, isCreating, isUpdating, isDeleting } = usePipelineStages();
  
  const [stageDialogOpen, setStageDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageName, setStageName] = useState('');
  const [stageColor, setStageColor] = useState('#3B82F6');
  const [stageIsClosed, setStageIsClosed] = useState(false);
  const [stageIsLost, setStageIsLost] = useState(false);
  const [stageSla, setStageSla] = useState('');
  const [stageTemplates, setStageTemplates] = useState<PipelineStageTemplate[]>([]);
  
  const [deleteStageDialog, setDeleteStageDialog] = useState(false);
  const [stageToDelete, setStageToDelete] = useState<PipelineStage | null>(null);

  const openStageDialog = (stage?: PipelineStage) => {
    if (stage) {
      setEditingStage(stage);
      setStageName(stage.name);
      setStageColor(stage.color);
      setStageIsClosed(stage.is_closed);
      setStageIsLost(stage.is_lost);
      setStageSla(formatSlaMinutes(stage.sla_minutes));
      setStageTemplates(Array.isArray(stage.templates) ? stage.templates : []);
    } else {
      setEditingStage(null);
      setStageName('');
      setStageColor('#3B82F6');
      setStageIsClosed(false);
      setStageIsLost(false);
      setStageSla('');
      setStageTemplates([]);
    }
    setStageDialogOpen(true);
  };

  const handleAddTemplate = () => {
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`;
    setStageTemplates((current) => [
      ...current,
      { id, title: 'Novo template', content: '' },
    ]);
  };

  const handleRemoveTemplate = (id: string) => {
    setStageTemplates((current) => current.filter((template) => template.id !== id));
  };

  const handleUpdateTemplate = (id: string, data: Partial<PipelineStageTemplate>) => {
    setStageTemplates((current) =>
      current.map((template) => (template.id === id ? { ...template, ...data } : template)),
    );
  };

  const handleMoveTemplate = (id: string, direction: 'up' | 'down') => {
    setStageTemplates((current) => {
      const index = current.findIndex((template) => template.id === id);
      if (index === -1) return current;
      const nextIndex = direction === 'up' ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      return arrayMove(current, index, nextIndex);
    });
  };

  const handleSaveStage = () => {
    const slaMinutes = parseSlaInput(stageSla);
    const cleanedTemplates = stageTemplates
      .map((template) => ({
        ...template,
        title: template.title.trim(),
        content: template.content.trim(),
      }))
      .filter((template) => template.title || template.content);

    const data: PipelineStageInput = {
      name: stageName,
      color: stageColor,
      is_closed: stageIsClosed,
      is_lost: stageIsLost,
      sla_minutes: slaMinutes,
      templates: cleanedTemplates,
    };
    
    if (editingStage) {
      updateStage({ ...data, id: editingStage.id });
    } else {
      createStage(data);
    }
    setStageDialogOpen(false);
  };

  const handleDeleteStage = (stage: PipelineStage) => {
    setStageToDelete(stage);
    setDeleteStageDialog(true);
  };

  const confirmDeleteStage = () => {
    if (stageToDelete) {
      deleteStage(stageToDelete.id);
      setDeleteStageDialog(false);
      setStageToDelete(null);
    }
  };

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
          <Palette className="w-5 h-5" />
          Pipeline
        </h1>
        <p className="text-sm text-muted-foreground">Personalize os estágios do seu funil de vendas</p>
      </div>

      <Card className="rounded-2xl border-0 shadow-none bg-slate-50/80 backdrop-blur-lg">
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-lg">Estágios do Pipeline</CardTitle>
              <CardDescription>
                Arraste para reordenar os estágios
              </CardDescription>
            </div>
            <Button onClick={() => openStageDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Estágio
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <DndContext
            sensors={useSensors(
              useSensor(PointerSensor),
              useSensor(KeyboardSensor, {
                coordinateGetter: sortableKeyboardCoordinates,
              })
            )}
            collisionDetection={closestCenter}
            onDragEnd={(event: DragEndEvent) => {
              const { active, over } = event;
              if (over && active.id !== over.id) {
                const oldIndex = stages.findIndex((s) => s.id === active.id);
                const newIndex = stages.findIndex((s) => s.id === over.id);
                const newStages = arrayMove(stages, oldIndex, newIndex);
                const reorderData = newStages.map((s, index) => ({ id: s.id, order: index }));
                reorderStages(reorderData);
              }
            }}
          >
            <div className="space-y-3">
              {stages.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum estágio configurado. Crie o primeiro estágio do seu pipeline.
                </p>
              ) : (
                <SortableContext
                  items={stages.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {stages.map((stage) => (
                    <SortableStageItem
                      key={stage.id}
                      stage={stage}
                      onEdit={() => openStageDialog(stage)}
                      onDelete={() => handleDeleteStage(stage)}
                    />
                  ))}
                </SortableContext>
              )}
            </div>
          </DndContext>
        </CardContent>
      </Card>

      {/* Stage Dialog */}
      <Dialog open={stageDialogOpen} onOpenChange={setStageDialogOpen}>
        <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingStage ? 'Editar Estágio' : 'Novo Estágio'}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
            <div className="space-y-2">
              <Label>Nome do Estágio</Label>
              <Input
                value={stageName}
                onChange={(e) => setStageName(e.target.value)}
                placeholder="Ex: Negociação"
                className="h-10 bg-white border-slate-200"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex gap-2 flex-wrap">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      stageColor === color ? 'border-slate-900 scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setStageColor(color)}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>SLA da etapa (hh:mm)</Label>
              <Input
                value={stageSla}
                onChange={(e) => setStageSla(e.target.value)}
                placeholder="Ex: 24:00"
                className="h-10 bg-white border-slate-200"
              />
              <p className="text-xs text-muted-foreground">
                Defina o tempo máximo que um lead deve ficar nesta etapa.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Templates de mensagem</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddTemplate}>
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar template
                </Button>
              </div>
              {stageTemplates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-muted-foreground">
                  Nenhum template cadastrado para esta etapa.
                </div>
              ) : (
                <div className="space-y-3">
                  {stageTemplates.map((template, index) => (
                    <div key={template.id} className="rounded-xl border border-slate-200 bg-white p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <Input
                          value={template.title}
                          onChange={(e) => handleUpdateTemplate(template.id, { title: e.target.value })}
                          placeholder="Título do template"
                          className="h-9 bg-white border-slate-200"
                        />
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === 0}
                            onClick={() => handleMoveTemplate(template.id, 'up')}
                          >
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            disabled={index === stageTemplates.length - 1}
                            onClick={() => handleMoveTemplate(template.id, 'down')}
                          >
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveTemplate(template.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={template.content}
                        onChange={(e) => handleUpdateTemplate(template.id, { content: e.target.value })}
                        placeholder="Mensagem pronta para copiar..."
                        className="min-h-[90px] bg-white border-slate-200"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Estágio Fechado</p>
                  <p className="text-sm text-muted-foreground">
                    Indica que a proposta foi ganha
                  </p>
                </div>
                <Switch 
                  checked={stageIsClosed} 
                  onCheckedChange={(checked) => {
                    setStageIsClosed(checked);
                    if (checked) setStageIsLost(false);
                  }}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Estágio Perdido</p>
                  <p className="text-sm text-muted-foreground">
                    Indica que a proposta foi perdida
                  </p>
                </div>
                <Switch 
                  checked={stageIsLost} 
                  onCheckedChange={(checked) => {
                    setStageIsLost(checked);
                    if (checked) setStageIsClosed(false);
                  }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStageDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveStage} disabled={isCreating || isUpdating || !stageName}>
              {(isCreating || isUpdating) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Stage Confirmation */}
      <AlertDialog open={deleteStageDialog} onOpenChange={setDeleteStageDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Estágio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o estágio "{stageToDelete?.name}"?
              Propostas neste estágio precisarão ser movidas para outro estágio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteStage} className="bg-destructive text-destructive-foreground">
              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
