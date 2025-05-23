import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Eraser, Brush, Layers, Settings, Save, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FogPoint {
  x: number;
  y: number;
  radius: number;
}

interface FogSettings {
  opacity: number;
  color: string;
  edgeBlur: number;
  transitionSpeed: number;
  snapToGrid: boolean;
}

interface EnhancedFogOfWarControllerProps {
  mapId: string;
  sessionId: string;
  isGameMaster: boolean;
  initialFogPoints?: FogPoint[];
  initialSettings?: Partial<FogSettings>;
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  onFogChange?: (fogPoints: FogPoint[], settings: FogSettings) => void;
  onToggleFog?: (show: boolean) => void;
}

const DEFAULT_SETTINGS: FogSettings = {
  opacity: 0.7,
  color: '#1a1a1a',
  edgeBlur: 0,
  transitionSpeed: 300,
  snapToGrid: true
};

const EnhancedFogOfWarController: React.FC<EnhancedFogOfWarControllerProps> = ({
  mapId,
  sessionId,
  isGameMaster,
  initialFogPoints = [],
  initialSettings = {},
  gridSize,
  mapWidth,
  mapHeight,
  onFogChange,
  onToggleFog
}) => {
  const [fogPoints, setFogPoints] = useState<FogPoint[]>(initialFogPoints);
  const [showFog, setShowFog] = useState(true);
  const [brushSize, setBrushSize] = useState(2);
  const [brushMode, setBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [settings, setSettings] = useState<FogSettings>({
    ...DEFAULT_SETTINGS,
    ...initialSettings
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [presets, setPresets] = useState<{id: string, name: string, data: FogPoint[], settings: FogSettings}[]>([]);
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  
  const { sendNotification } = useNotificationContext();

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

  // Configurar canal de tempo real para atualizações de fog
  useEffect(() => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`fog-updates-${sessionId}`)
      .on('broadcast', { event: 'fog-update' }, (payload) => {
        if (payload.payload) {
          const { fogPoints: newFogPoints, settings: newSettings } = payload.payload as {
            fogPoints: FogPoint[],
            settings: FogSettings
          };
          
          if (Array.isArray(newFogPoints)) {
            setFogPoints(newFogPoints);
          }
          
          if (newSettings) {
            setSettings(prev => ({ ...prev, ...newSettings }));
          }
          
          // Notificar o jogador sobre a atualização do fog
          if (!isGameMaster) {
            sendNotification({
              user_id: 'current-user-id', // Isso seria substituído pelo ID real do usuário
              title: 'Mapa atualizado',
              content: 'O mestre revelou uma nova área do mapa',
              type: 'fog_update',
              reference_id: mapId,
              reference_type: 'tactical_map'
            }).catch(console.error);
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, isGameMaster, mapId]);

  // Notificar mudanças no fog
  useEffect(() => {
    if (onFogChange) {
      onFogChange(fogPoints, settings);
    }
  }, [fogPoints, settings, onFogChange]);

  // Sincronizar Fog of War com outros jogadores
  const syncFogOfWar = async () => {
    if (!isGameMaster || !sessionId) return;
    
    try {
      // Enviar dados de Fog of War para todos os jogadores
      await supabase.channel(`fog-updates-${sessionId}`).send({
        type: 'broadcast',
        event: 'fog-update',
        payload: { fogPoints, settings }
      });
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('tactical_maps')
        .update({ 
          fog_of_war: fogPoints,
          fog_settings: settings
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
      setFogPoints([]);
      
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
      const spacingFactor = settings.snapToGrid ? gridSize : gridSize / 2;
      
      for (let y = 0; y < mapHeight; y += spacingFactor * coverageRadius) {
        for (let x = 0; x < mapWidth; x += spacingFactor * coverageRadius) {
          allPoints.push({ 
            x: x / gridSize, 
            y: y / gridSize, 
            radius: coverageRadius 
          });
        }
      }
      
      setFogPoints(allPoints);
      
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
          data: fogPoints,
          settings: settings
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
    
    setFogPoints(preset.data);
    
    // Carregar configurações do preset, se disponíveis
    if (preset.settings) {
      setSettings(prev => ({ ...prev, ...preset.settings }));
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

  // Alternar visibilidade do fog
  const toggleFogVisibility = () => {
    setShowFog(!showFog);
    if (onToggleFog) {
      onToggleFog(!showFog);
    }
  };

  // Atualizar configurações
  const updateSettings = (key: keyof FogSettings, value: string | number | boolean | null) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isGameMaster) {
    return null; // Não mostrar controles para jogadores
  }

  return (
    <div className="p-4 bg-background border rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Controles de Névoa de Guerra</h3>
        <Button
          size="sm"
          variant="ghost"
          onClick={toggleFogVisibility}
          aria-label="Mostrar/Esconder Névoa"
        >
          {showFog ? <Eye size={16} /> : <EyeOff size={16} />}
        </Button>
      </div>

      <Tabs defaultValue="brush">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="brush">Pincel</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>

        <TabsContent value="brush" className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Modo do Pincel:</span>
            <div className="flex space-x-1">
              <Button
                size="sm"
                variant={brushMode === 'reveal' ? "default" : "outline"}
                onClick={() => setBrushMode('reveal')}
              >
                <Brush size={14} className="mr-1" /> Revelar
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
          </div>

          <div className="flex justify-between mt-4">
            <Button size="sm" variant="outline" onClick={clearAllFog}>
              <Eraser size={14} className="mr-1" /> Limpar Tudo
            </Button>
            <Button size="sm" variant="outline" onClick={revealAll}>
              <Eye size={14} className="mr-1" /> Revelar Tudo
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="edge-blur">Suavização de Bordas: {settings.edgeBlur}</Label>
            </div>
            <Slider
              id="edge-blur"
              min={0}
              max={10}
              step={1}
              value={[settings.edgeBlur]}
              onValueChange={(value) => updateSettings('edgeBlur', value[0])}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="transition-speed">Velocidade de Transição: {settings.transitionSpeed}ms</Label>
            </div>
            <Slider
              id="transition-speed"
              min={0}
              max={1000}
              step={50}
              value={[settings.transitionSpeed]}
              onValueChange={(value) => updateSettings('transitionSpeed', value[0])}
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label htmlFor="fog-opacity">Opacidade: {Math.round(settings.opacity * 100)}%</Label>
            </div>
            <Slider
              id="fog-opacity"
              min={0.1}
              max={1}
              step={0.05}
              value={[settings.opacity]}
              onValueChange={(value) => updateSettings('opacity', value[0])}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="fog-color">Cor da Névoa:</Label>
            <input
              id="fog-color"
              type="color"
              value={settings.color}
              onChange={(e) => updateSettings('color', e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="snap-to-grid">Alinhar ao Grid:</Label>
            <Switch
              id="snap-to-grid"
              checked={settings.snapToGrid}
              onCheckedChange={(checked) => updateSettings('snapToGrid', checked)}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Label htmlFor="auto-sync">Sincronização Automática:</Label>
            <Switch
              id="auto-sync"
              checked={autoSync}
              onCheckedChange={setAutoSync}
            />
          </div>

          <Button size="sm" onClick={syncFogOfWar} className="w-full mt-2">
            Sincronizar Agora
          </Button>
        </TabsContent>

        <TabsContent value="presets" className="space-y-4">
          <div className="space-y-4">
            <div className="flex justify-between">
              <Button size="sm" variant="outline" onClick={savePreset}>
                <Save size={14} className="mr-1" /> Salvar Configuração Atual
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Presets Salvos</Label>
              <Select onValueChange={loadPreset}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um preset" />
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

            <div className="space-y-2">
              <Label>Exportar/Importar</Label>
              <div className="flex space-x-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const data = JSON.stringify({ fogPoints, settings });
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `fog-${mapId}-${new Date().toISOString().slice(0, 10)}.json`;
                  a.click();
                }}>
                  <Download size={14} className="mr-1" /> Exportar
                </Button>
                <Button size="sm" variant="outline" onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.json';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const content = JSON.parse(event.target?.result as string);
                          if (content.fogPoints && content.settings) {
                            setFogPoints(content.fogPoints);
                            setSettings(content.settings);
                            toast.success('Configuração importada com sucesso!');
                            if (autoSync) syncFogOfWar();
                          }
                        } catch (error) {
                          toast.error('Erro ao importar arquivo');
                        }
                      };
                      reader.readAsText(file);
                    }
                  };
                  input.click();
                }}>
                  <Download size={14} className="mr-1" /> Importar
                </Button>
              </div>
            </div>
          </div>
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

export default EnhancedFogOfWarController;