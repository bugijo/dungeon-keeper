import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Eraser, Paintbrush, Save, Download, Upload, Grid, Layers, Settings, ZoomIn, ZoomOut, Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FogPoint {
  x: number;
  y: number;
  radius: number;
}

interface MapControlsProps {
  sessionId: string;
  mapId: string;
  isGameMaster: boolean;
  fogOfWar: FogPoint[];
  onFogChange: (fog: FogPoint[]) => void;
  onToggleFog: (show: boolean) => void;
  showFog: boolean;
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  onZoomChange?: (zoom: number) => void;
  onGridVisibilityChange?: (visible: boolean) => void;
  onGridSizeChange?: (size: number) => void;
}

const EnhancedMapControls: React.FC<MapControlsProps> = ({
  sessionId,
  mapId,
  isGameMaster,
  fogOfWar,
  onFogChange,
  onToggleFog,
  showFog,
  gridSize,
  mapWidth,
  mapHeight,
  onZoomChange,
  onGridVisibilityChange,
  onGridSizeChange
}) => {
  // Estados para controle de névoa
  const [brushSize, setBrushSize] = useState(2);
  const [brushMode, setBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [fogOpacity, setFogOpacity] = useState(0.7);
  const [fogColor, setFogColor] = useState('#1a1a1a');
  const [edgeBlur, setEdgeBlur] = useState(0); // 0-10 para controle de suavização
  const [transitionSpeed, setTransitionSpeed] = useState(300); // em ms
  const [snapToGrid, setSnapToGrid] = useState(true);
  
  // Estados para controle de mapa
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [activeTab, setActiveTab] = useState('fog');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [presets, setPresets] = useState<{id: string, name: string, data: FogPoint[]}[]>([]);
  
  // Carregar presets salvos
  useEffect(() => {
    if (!isGameMaster || !mapId) return;
    
    const fetchPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('fog_of_war_presets')
          .select('*')
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        if (data) {
          setPresets(data);
        }
      } catch (error) {
        console.error('Erro ao carregar presets de Fog of War:', error);
      }
    };
    
    fetchPresets();
  }, [isGameMaster, mapId]);
  
  // Configurar canal de tempo real para atualizações de Fog of War
  useEffect(() => {
    if (!sessionId) return;
    
    // Canal para atualizações de Fog of War
    const channel = supabase
      .channel(`fog-${sessionId}`)
      .on('broadcast', { event: 'fog_update' }, (payload) => {
        if (!isGameMaster) {
          // Jogadores recebem atualizações do mestre
          const { fogData, fogSettings } = payload.payload as { 
            fogData: FogPoint[], 
            fogSettings: {
              opacity: number,
              color: string,
              edgeBlur: number,
              transitionSpeed: number
            } 
          };
          
          onFogChange(fogData);
          
          // Atualizar configurações de fog
          if (fogSettings) {
            setFogOpacity(fogSettings.opacity);
            setFogColor(fogSettings.color);
            setEdgeBlur(fogSettings.edgeBlur);
            setTransitionSpeed(fogSettings.transitionSpeed);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isGameMaster]);
  
  // Sincronizar Fog of War com outros jogadores
  const syncFogOfWar = async () => {
    if (!isGameMaster || !sessionId) return;
    
    try {
      // Enviar dados de Fog of War e configurações para todos os jogadores
      await supabase.channel(`fog-${sessionId}`).send({
        type: 'broadcast',
        event: 'fog_update',
        payload: { 
          fogData: fogOfWar,
          fogSettings: {
            opacity: fogOpacity,
            color: fogColor,
            edgeBlur: edgeBlur,
            transitionSpeed: transitionSpeed
          }
        }
      });
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('tactical_maps')
        .update({ 
          fog_of_war: fogOfWar,
          fog_settings: {
            opacity: fogOpacity,
            color: fogColor,
            edgeBlur: edgeBlur,
            transitionSpeed: transitionSpeed,
            snapToGrid: snapToGrid
          }
        })
        .eq('id', mapId);
        
      if (error) throw error;
      
      setLastSyncTime(new Date());
      toast.success('Fog of War sincronizado com sucesso!');
    } catch (error) {
      console.error('Erro ao sincronizar Fog of War:', error);
      toast.error('Erro ao sincronizar Fog of War');
    }
  };
  
  // Limpar todo o Fog of War
  const clearAllFog = () => {
    if (!isGameMaster) return;
    
    if (window.confirm('Tem certeza que deseja limpar toda a névoa de guerra?')) {
      onFogChange([]);
      
      if (autoSync) {
        syncFogOfWar();
      }
    }
  };
  
  // Revelar todo o mapa
  const revealAll = () => {
    if (!isGameMaster) return;
    
    if (window.confirm('Tem certeza que deseja revelar todo o mapa?')) {
      // Criar um array com pontos que cobrem todo o mapa
      const allPoints: FogPoint[] = [];
      const coverageRadius = 5; // Raio grande o suficiente para cobrir áreas significativas
      
      // Calcular quantos pontos são necessários para cobrir o mapa
      const spacingFactor = snapToGrid ? gridSize : gridSize / 2;
      
      for (let y = 0; y < mapHeight; y += spacingFactor * coverageRadius) {
        for (let x = 0; x < mapWidth; x += spacingFactor * coverageRadius) {
          allPoints.push({ 
            x: x / gridSize, 
            y: y / gridSize, 
            radius: coverageRadius 
          });
        }
      }
      
      onFogChange(allPoints);
      
      if (autoSync) {
        syncFogOfWar();
      }
      
      toast.success('Todo o mapa foi revelado!');
    }
  };
  
  // Salvar preset atual
  const savePreset = async () => {
    if (!isGameMaster || !mapId) return;
    
    const presetName = prompt('Digite um nome para este preset:');
    if (!presetName) return;
    
    try {
      const { data, error } = await supabase
        .from('fog_of_war_presets')
        .insert({
          map_id: mapId,
          name: presetName,
          data: fogOfWar,
          settings: {
            opacity: fogOpacity,
            color: fogColor,
            edgeBlur: edgeBlur,
            transitionSpeed: transitionSpeed,
            snapToGrid: snapToGrid
          }
        })
        .select()
        .single();
        
      if (error) throw error;
      
      setPresets([...presets, data]);
      toast.success(`Preset "${presetName}" salvo com sucesso!`);
    } catch (error) {
      console.error('Erro ao salvar preset:', error);
      toast.error('Erro ao salvar preset');
    }
  };
  
  // Carregar preset
  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    onFogChange(preset.data);
    
    // Carregar configurações do preset, se disponíveis
    if (preset.settings) {
      const settings = preset.settings as any;
      if (settings.opacity !== undefined) setFogOpacity(settings.opacity);
      if (settings.color !== undefined) setFogColor(settings.color);
      if (settings.edgeBlur !== undefined) setEdgeBlur(settings.edgeBlur);
      if (settings.transitionSpeed !== undefined) setTransitionSpeed(settings.transitionSpeed);
      if (settings.snapToGrid !== undefined) setSnapToGrid(settings.snapToGrid);
    }
    
    if (autoSync) {
      syncFogOfWar();
    }
    
    toast.success(`Preset "${preset.name}" carregado!`);
  };
  
  // Aplicar predefinições rápidas
  const applyQuickPreset = (size: 'small' | 'medium' | 'large') => {
    if (!isGameMaster) return;
    
    let radius;
    switch (size) {
      case 'small':
        radius = 1;
        break;
      case 'medium':
        radius = 3;
        break;
      case 'large':
        radius = 5;
        break;
      default:
        radius = 2;
    }
    
    setBrushSize(radius);
    toast.success(`Tamanho do pincel ajustado para ${size}`);
  };
  
  // Controle de zoom
  const handleZoomChange = (newZoom: number) => {
    setZoom(newZoom);
    if (onZoomChange) {
      onZoomChange(newZoom);
    }
  };
  
  // Controle de visibilidade do grid
  const handleGridVisibilityChange = (visible: boolean) => {
    setShowGrid(visible);
    if (onGridVisibilityChange) {
      onGridVisibilityChange(visible);
    }
  };
  
  // Controle de tamanho do grid
  const handleGridSizeChange = (size: number) => {
    if (onGridSizeChange) {
      onGridSizeChange(size);
    }
  };
  
  return (
    <div className="p-4 bg-background border rounded-lg shadow-md">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="fog">Névoa de Guerra</TabsTrigger>
          <TabsTrigger value="map">Mapa</TabsTrigger>
          <TabsTrigger value="visibility">Visibilidade</TabsTrigger>
        </TabsList>
        
        {/* Controles de Névoa de Guerra */}
        <TabsContent value="fog" className="space-y-4">
          {isGameMaster && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Controles de Névoa</h3>
                <Toggle
                  pressed={showFog}
                  onPressedChange={onToggleFog}
                  aria-label="Mostrar/Esconder Névoa"
                >
                  {showFog ? <Eye size={16} /> : <EyeOff size={16} />}
                </Toggle>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Modo do Pincel:</span>
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant={brushMode === 'reveal' ? "default" : "outline"}
                      onClick={() => setBrushMode('reveal')}
                    >
                      <Paintbrush size={14} className="mr-1" /> Revelar
                    </Button>
                    <Button
                      size="sm"
                      variant={brushMode === 'hide' ? "default" : "outline"}
                      onClick={() => setBrushMode('hide')}
                    >
                      <Eraser size={14} className="mr-1" /> Esconder
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="brush-size">Tamanho do Pincel: {brushSize}</Label>
                  </div>
                  <Slider
                    id="brush-size"
                    min={1}
                    max={10}
                    step={1}
                    value={[brushSize]}
                    onValueChange={(value) => setBrushSize(value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="edge-blur">Suavização de Bordas: {edgeBlur}</Label>
                  </div>
                  <Slider
                    id="edge-blur"
                    min={0}
                    max={10}
                    step={1}
                    value={[edgeBlur]}
                    onValueChange={(value) => setEdgeBlur(value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="transition-speed">Velocidade de Transição: {transitionSpeed}ms</Label>
                  </div>
                  <Slider
                    id="transition-speed"
                    min={0}
                    max={1000}
                    step={50}
                    value={[transitionSpeed]}
                    onValueChange={(value) => setTransitionSpeed(value[0])}
                  />
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="fog-opacity">Opacidade: {Math.round(fogOpacity * 100)}%</Label>
                  </div>
                  <Slider
                    id="fog-opacity"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[fogOpacity]}
                    onValueChange={(value) => setFogOpacity(value[0])}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="fog-color">Cor da Névoa:</Label>
                  <input
                    id="fog-color"
                    type="color"
                    value={fogColor}
                    onChange={(e) => setFogColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="snap-to-grid">Alinhar ao Grid:</Label>
                  <Switch
                    id="snap-to-grid"
                    checked={snapToGrid}
                    onCheckedChange={setSnapToGrid}
                  />
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="space-x-1">
                    <Button size="sm" onClick={() => applyQuickPreset('small')}>
                      Pequeno
                    </Button>
                    <Button size="sm" onClick={() => applyQuickPreset('medium')}>
                      Médio
                    </Button>
                    <Button size="sm" onClick={() => applyQuickPreset('large')}>
                      Grande
                    </Button>
                  </div>
                  
                  <div className="space-x-1">
                    <Button size="sm" variant="outline" onClick={clearAllFog}>
                      <Eraser size={14} className="mr-1" /> Limpar Tudo
                    </Button>
                    <Button size="sm" variant="outline" onClick={revealAll}>
                      <Eye size={14} className="mr-1" /> Revelar Tudo
                    </Button>
                  </div>
                </div>
                
                <div className="flex justify-between mt-4">
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="auto-sync">Sincronização Automática:</Label>
                    <Switch
                      id="auto-sync"
                      checked={autoSync}
                      onCheckedChange={setAutoSync}
                    />
                  </div>
                  
                  <Button size="sm" onClick={syncFogOfWar} disabled={!isGameMaster}>
                    <Upload size={14} className="mr-1" /> Sincronizar
                  </Button>
                </div>
                
                <div className="flex justify-between mt-4">
                  <Button size="sm" variant="outline" onClick={savePreset} disabled={!isGameMaster}>
                    <Save size={14} className="mr-1" /> Salvar Preset
                  </Button>
                  
                  <Select onValueChange={loadPreset}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Carregar Preset" />
                    </SelectTrigger>
                    <SelectContent>
                      {presets.map(preset => (
                        <SelectItem key={preset.id} value={preset.id}>
                          {preset.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
          
          {!isGameMaster && (
            <div className="text-center py-4">
              <p>Apenas o mestre pode controlar a névoa de guerra.</p>
            </div>
          )}
        </TabsContent>
        
        {/* Controles do Mapa */}
        <TabsContent value="map" className="space-y-4">
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="zoom">Zoom: {Math.round(zoom * 100)}%</Label>
              </div>
              <Slider
                id="zoom"
                min={0.5}
                max={2}
                step={0.1}
                value={[zoom]}
                onValueChange={(value) => handleZoomChange(value[0])}
              />
              <div className="flex justify-center space-x-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => handleZoomChange(Math.max(0.5, zoom - 0.1))}>
                  <ZoomOut size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleZoomChange(1)}>
                  <Maximize size={14} />
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleZoomChange(Math.min(2, zoom + 0.1))}>
                  <ZoomIn size={14} />
                </Button>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Label htmlFor="show-grid">Mostrar Grid:</Label>
              <Switch
                id="show-grid"
                checked={showGrid}
                onCheckedChange={handleGridVisibilityChange}
              />
            </div>
            
            {showGrid && (
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label htmlFor="grid-size">Tamanho do Grid</Label>
                </div>
                <Select onValueChange={(value) => handleGridSizeChange(parseInt(value))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={`${gridSize}px`} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="20">20px</SelectItem>
                    <SelectItem value="30">30px</SelectItem>
                    <SelectItem value="40">40px</SelectItem>
                    <SelectItem value="50">50px</SelectItem>
                    <SelectItem value="60">60px</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </TabsContent>
        
        {/* Controles de Visibilidade */}
        <TabsContent value="visibility" className="space-y-4">
          {isGameMaster && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Visibilidade para Jogadores</h3>
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="player-fog">Névoa de Guerra:</Label>
                  <Switch
                    id="player-fog"
                    checked={showFog}
                    onCheckedChange={onToggleFog}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Label htmlFor="player-grid">Grid:</Label>
                  <Switch
                    id="player-grid"
                    checked={showGrid}
                    onCheckedChange={handleGridVisibilityChange}
                  />
                </div>
                
                <div className="mt-4">
                  <h4 className="text-sm font-medium mb-2">Camadas Visíveis</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="layer-base">Mapa Base:</Label>
                      <Switch id="layer-base" checked={true} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="layer-objects">Objetos:</Label>
                      <Switch id="layer-objects" checked={true} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="layer-tokens">Tokens:</Label>
                      <Switch id="layer-tokens" checked={true} />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Label htmlFor="layer-effects">Efeitos:</Label>
                      <Switch id="layer-effects" checked={true} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!isGameMaster && (
            <div className="text-center py-4">
              <p>Apenas o mestre pode controlar a visibilidade.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {lastSyncTime && (
        <div className="mt-4 text-xs text-muted-foreground">
          Última sincronização: {lastSyncTime.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default EnhancedMapControls;