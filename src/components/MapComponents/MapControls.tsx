import React, { useState } from 'react';
import { Eye, EyeOff, Eraser, Paintbrush, Save, Download, Upload, Settings, Layers, Grid, Move, Ruler } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MapControlsProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  gridSize: number;
  onGridSizeChange: (size: number) => void;
  showGrid: boolean;
  onToggleGrid: (show: boolean) => void;
  showFog: boolean;
  onToggleFog: (show: boolean) => void;
  fogOpacity: number;
  onFogOpacityChange: (opacity: number) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  brushShape: 'circle' | 'square' | 'polygon';
  onBrushShapeChange: (shape: 'circle' | 'square' | 'polygon') => void;
  currentTool: 'reveal' | 'hide' | 'select' | 'lineOfSight';
  onToolChange: (tool: 'reveal' | 'hide' | 'select' | 'lineOfSight') => void;
  snapToGrid: boolean;
  onToggleSnapToGrid: (snap: boolean) => void;
  edgeBlur: number;
  onEdgeBlurChange: (blur: number) => void;
  transitionSpeed: number;
  onTransitionSpeedChange: (speed: number) => void;
  onSavePreset: () => void;
  onLoadPreset: (presetId: string) => void;
  presets: Array<{ id: string; name: string }>;
  onClearFog: () => void;
  onApplyPreset: (preset: 'small' | 'medium' | 'large') => void;
}

const MapControls: React.FC<MapControlsProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  gridSize,
  onGridSizeChange,
  showGrid,
  onToggleGrid,
  showFog,
  onToggleFog,
  fogOpacity,
  onFogOpacityChange,
  brushSize,
  onBrushSizeChange,
  brushShape,
  onBrushShapeChange,
  currentTool,
  onToolChange,
  snapToGrid,
  onToggleSnapToGrid,
  edgeBlur,
  onEdgeBlurChange,
  transitionSpeed,
  onTransitionSpeedChange,
  onSavePreset,
  onLoadPreset,
  presets,
  onClearFog,
  onApplyPreset
}) => {
  const [activeTab, setActiveTab] = useState('fog');
  const [presetName, setPresetName] = useState('');

  // Aplicar predefinições rápidas
  const applyQuickPreset = (preset: 'small' | 'medium' | 'large') => {
    onApplyPreset(preset);
    toast.success(`Predefinição ${preset} aplicada com sucesso`);
  };

  if (!isGameMaster) {
    return (
      <Card className="w-full shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Controles do Mapa</CardTitle>
          <CardDescription>Visualização do jogador</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="toggle-grid">Mostrar Grid</Label>
              <Switch
                id="toggle-grid"
                checked={showGrid}
                onCheckedChange={onToggleGrid}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Controles Avançados do Mapa</CardTitle>
        <CardDescription>Gerencie o mapa tático e a névoa de guerra</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="fog" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="fog">Névoa</TabsTrigger>
            <TabsTrigger value="grid">Grid</TabsTrigger>
            <TabsTrigger value="tokens">Tokens</TabsTrigger>
            <TabsTrigger value="visibility">Visibilidade</TabsTrigger>
          </TabsList>
          
          {/* Aba de Controles da Névoa */}
          <TabsContent value="fog" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="toggle-fog">Mostrar Névoa</Label>
              <Switch
                id="toggle-fog"
                checked={showFog}
                onCheckedChange={onToggleFog}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Opacidade da Névoa</Label>
                <span className="text-sm text-muted-foreground">{Math.round(fogOpacity * 100)}%</span>
              </div>
              <Slider
                value={[fogOpacity * 100]}
                min={0}
                max={100}
                step={1}
                onValueChange={(value) => onFogOpacityChange(value[0] / 100)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Ferramenta Atual</Label>
              <div className="flex gap-2">
                <Toggle
                  pressed={currentTool === 'reveal'}
                  onClick={() => onToolChange('reveal')}
                  aria-label="Revelar Névoa"
                  title="Revelar Névoa"
                >
                  <Eye className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={currentTool === 'hide'}
                  onClick={() => onToolChange('hide')}
                  aria-label="Esconder Névoa"
                  title="Esconder Névoa"
                >
                  <EyeOff className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={currentTool === 'select'}
                  onClick={() => onToolChange('select')}
                  aria-label="Selecionar Área"
                  title="Selecionar Área"
                >
                  <Move className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={currentTool === 'lineOfSight'}
                  onClick={() => onToolChange('lineOfSight')}
                  aria-label="Linha de Visão"
                  title="Linha de Visão"
                >
                  <Ruler className="h-4 w-4" />
                </Toggle>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Forma do Pincel</Label>
              <div className="flex gap-2">
                <Toggle
                  pressed={brushShape === 'circle'}
                  onClick={() => onBrushShapeChange('circle')}
                  aria-label="Círculo"
                  title="Círculo"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <div className="h-4 w-4 rounded-full bg-current" />
                </Toggle>
                <Toggle
                  pressed={brushShape === 'square'}
                  onClick={() => onBrushShapeChange('square')}
                  aria-label="Quadrado"
                  title="Quadrado"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <div className="h-4 w-4 bg-current" />
                </Toggle>
                <Toggle
                  pressed={brushShape === 'polygon'}
                  onClick={() => onBrushShapeChange('polygon')}
                  aria-label="Polígono"
                  title="Polígono"
                  className="h-8 w-8 p-0 flex items-center justify-center"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                    <path d="M3,12L7,4L15,4L19,12L15,20L7,20L3,12Z" />
                  </svg>
                </Toggle>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tamanho do Pincel</Label>
                <span className="text-sm text-muted-foreground">{brushSize}px</span>
              </div>
              <Slider
                value={[brushSize]}
                min={1}
                max={10 * gridSize}
                step={gridSize / 2}
                onValueChange={(value) => onBrushSizeChange(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Suavização de Bordas</Label>
                <span className="text-sm text-muted-foreground">{edgeBlur}</span>
              </div>
              <Slider
                value={[edgeBlur]}
                min={0}
                max={10}
                step={0.5}
                onValueChange={(value) => onEdgeBlurChange(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Velocidade de Transição</Label>
                <span className="text-sm text-muted-foreground">{transitionSpeed}ms</span>
              </div>
              <Slider
                value={[transitionSpeed]}
                min={0}
                max={1000}
                step={50}
                onValueChange={(value) => onTransitionSpeedChange(value[0])}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <Label htmlFor="snap-to-grid">Alinhar ao Grid</Label>
              <Switch
                id="snap-to-grid"
                checked={snapToGrid}
                onCheckedChange={onToggleSnapToGrid}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Predefinições Rápidas</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset('small')}
                >
                  Pequeno
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset('medium')}
                >
                  Médio
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => applyQuickPreset('large')}
                >
                  Grande
                </Button>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={onClearFog}
                className="w-full"
              >
                <Eraser className="h-4 w-4 mr-2" />
                Limpar Toda a Névoa
              </Button>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label>Gerenciar Predefinições</Label>
              <div className="flex gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Predefinição
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-80">
                    <div className="space-y-4">
                      <h4 className="font-medium">Salvar Configuração Atual</h4>
                      <div className="space-y-2">
                        <Label htmlFor="preset-name">Nome da Predefinição</Label>
                        <Input
                          id="preset-name"
                          value={presetName}
                          onChange={(e) => setPresetName(e.target.value)}
                          placeholder="Minha Predefinição"
                        />
                      </div>
                      <Button
                        onClick={() => {
                          if (presetName) {
                            onSavePreset();
                            setPresetName('');
                          } else {
                            toast.error('Digite um nome para a predefinição');
                          }
                        }}
                        className="w-full"
                      >
                        Salvar
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
                
                <Select onValueChange={onLoadPreset}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Carregar Predefinição" />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((preset) => (
                      <SelectItem key={preset.id} value={preset.id}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
          
          {/* Aba de Controles do Grid */}
          <TabsContent value="grid" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="toggle-grid">Mostrar Grid</Label>
              <Switch
                id="toggle-grid"
                checked={showGrid}
                onCheckedChange={onToggleGrid}
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Tamanho do Grid</Label>
                <span className="text-sm text-muted-foreground">{gridSize}px</span>
              </div>
              <Slider
                value={[gridSize]}
                min={10}
                max={50}
                step={5}
                onValueChange={(value) => onGridSizeChange(value[0])}
              />
            </div>
          </TabsContent>
          
          {/* Aba de Controles de Tokens */}
          <TabsContent value="tokens" className="space-y-4">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-center">
                Controles de tokens serão implementados em uma atualização futura.
              </p>
            </div>
          </TabsContent>
          
          {/* Aba de Controles de Visibilidade */}
          <TabsContent value="visibility" className="space-y-4">
            <div className="flex items-center justify-center h-40">
              <p className="text-muted-foreground text-center">
                Controles de visibilidade por jogador serão implementados em uma atualização futura.
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MapControls;