import React, { useState, useEffect } from 'react';
import { Flame, Plus, Trash2, Settings, Sun, Moon, Sliders, Bookmark, Play, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  LightSource, 
  LightingPreset,
  createLightSource, 
  updateLightSourcePosition, 
  applyLightFlickering, 
  createLightingPreset,
  saveLightingPreset,
  loadLightingPresets,
  deleteLightingPreset,
  applyLightingPreset
} from '@/utils/lightingUtils';

interface DynamicLightingControllerProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  lightSources: LightSource[];
  onLightSourcesUpdate: (sources: LightSource[]) => void;
  gridSize: number;
  width: number;
  height: number;
  ambientLight?: number;
  onAmbientLightUpdate?: (value: number) => void;
}

const DynamicLightingController: React.FC<DynamicLightingControllerProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  lightSources,
  onLightSourcesUpdate,
  gridSize,
  width,
  height,
  ambientLight = 0.1,
  onAmbientLightUpdate
}) => {
  const [selectedLightSource, setSelectedLightSource] = useState<LightSource | null>(null);
  const [localAmbientLight, setLocalAmbientLight] = useState<number>(ambientLight); // 0-1, luz ambiente global
  const [showLightingControls, setShowLightingControls] = useState<boolean>(false);
  const [presetName, setPresetName] = useState<string>('');
  const [newLightName, setNewLightName] = useState<string>('');
  const [newLightRadius, setNewLightRadius] = useState<number>(5);
  const [newLightColor, setNewLightColor] = useState<string>('#FFF8E0');
  const [newLightIntensity, setNewLightIntensity] = useState<number>(1);
  const [newLightFlickering, setNewLightFlickering] = useState<boolean>(false);
  const [newLightCastShadows, setNewLightCastShadows] = useState<boolean>(true);
  
  // Atualizar estado local quando a prop ambientLight mudar
  useEffect(() => {
    setLocalAmbientLight(ambientLight);
  }, [ambientLight]);

  // Sincronizar fontes de luz com o servidor
  useEffect(() => {
    if (!mapId) return;

    // Carregar fontes de luz do banco de dados
    const loadLightSources = async () => {
      try {
        const { data, error } = await supabase
          .from('map_light_sources')
          .select('*')
          .eq('map_id', mapId);

        if (error) throw error;

        if (data && data.length > 0) {
          // Converter dados do banco para objetos LightSource
          const loadedSources: LightSource[] = data.map(item => ({
            id: item.id,
            position: { x: item.position_x, y: item.position_y },
            radius: item.radius,
            color: item.color,
            intensity: item.intensity,
            flickering: item.flickering,
            flickerIntensity: item.flicker_intensity,
            castShadows: item.cast_shadows
          }));

          onLightSourcesUpdate(loadedSources);
        }
      } catch (error) {
        console.error('Erro ao carregar fontes de luz:', error);
      }
    };

    loadLightSources();

    // Configurar canal de tempo real para atualizações de iluminação
    const channel = supabase
      .channel(`lighting-updates-${mapId}`)
      .on('broadcast', { event: 'lighting-update' }, (payload) => {
        if (payload.payload && Array.isArray(payload.payload.lightSources)) {
          onLightSourcesUpdate(payload.payload.lightSources);
        }
      })
      .on('broadcast', { event: 'ambient-light-update' }, (payload) => {
        if (payload.payload && typeof payload.payload.ambientLight === 'number') {
          setAmbientLight(payload.payload.ambientLight);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // Aplicar efeito de oscilação nas fontes de luz
  useEffect(() => {
    if (!lightSources.some(source => source.flickering)) return;

    const flickerInterval = setInterval(() => {
      const updatedSources = applyLightFlickering(lightSources, 16); // 16ms = ~60fps
      onLightSourcesUpdate(updatedSources);
    }, 100); // Atualizar a cada 100ms para melhor desempenho

    return () => clearInterval(flickerInterval);
  }, [lightSources, onLightSourcesUpdate]);
  
  // Atualizar luz ambiente
  const handleAmbientLightChange = (value: number) => {
    setLocalAmbientLight(value);
    if (onAmbientLightUpdate) {
      onAmbientLightUpdate(value);
    } else {
      // Fallback para atualização local se não houver callback
      updateAmbientLight(value);
    }
  };
  
  // Atualizar luz ambiente no servidor
  const updateAmbientLight = async (value: number) => {
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('map_settings')
        .upsert({
          map_id: mapId,
          ambient_light: value,
          updated_by: userId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'ambient-light-update',
          payload: { ambientLight: value }
        });
    } catch (error) {
      console.error('Erro ao atualizar luz ambiente:', error);
      toast.error('Erro ao atualizar luz ambiente');
    }
  };

  // Adicionar nova fonte de luz
  const addLightSource = async () => {
    if (!isGameMaster) return;

    try {
      // Posição padrão no centro do mapa
      const newLight = createLightSource({
        id: `light-${Date.now()}`,
        x: width / 2,
        y: height / 2,
        radius: newLightRadius * gridSize,
        color: newLightColor,
        intensity: newLightIntensity,
        flickering: newLightFlickering,
        flickerIntensity: 0.2,
        castShadows: newLightCastShadows
      });

      // Adicionar ao banco de dados
      const { data, error } = await supabase
        .from('map_light_sources')
        .insert({
          id: newLight.id,
          map_id: mapId,
          position_x: newLight.position.x,
          position_y: newLight.position.y,
          radius: newLight.radius,
          color: newLight.color,
          intensity: newLight.intensity,
          flickering: newLight.flickering,
          flicker_intensity: newLight.flickerIntensity,
          cast_shadows: newLight.castShadows,
          created_by: userId
        })
        .select();

      if (error) throw error;

      // Atualizar estado local
      const updatedSources = [...lightSources, newLight];
      onLightSourcesUpdate(updatedSources);

      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'lighting-update',
          payload: { lightSources: updatedSources }
        });

      toast.success('Fonte de luz adicionada');
      setSelectedLightSource(newLight);
    } catch (error) {
      console.error('Erro ao adicionar fonte de luz:', error);
      toast.error('Erro ao adicionar fonte de luz');
    }
  };

  // Remover fonte de luz
  const removeLightSource = async (id: string) => {
    if (!isGameMaster) return;

    try {
      // Remover do banco de dados
      const { error } = await supabase
        .from('map_light_sources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Atualizar estado local
      const updatedSources = lightSources.filter(source => source.id !== id);
      onLightSourcesUpdate(updatedSources);

      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'lighting-update',
          payload: { lightSources: updatedSources }
        });

      toast.success('Fonte de luz removida');
      if (selectedLightSource?.id === id) {
        setSelectedLightSource(null);
      }
    } catch (error) {
      console.error('Erro ao remover fonte de luz:', error);
      toast.error('Erro ao remover fonte de luz');
    }
  };

  // Atualizar fonte de luz
  const updateLightSource = async (updatedSource: LightSource) => {
    if (!isGameMaster) return;

    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('map_light_sources')
        .update({
          position_x: updatedSource.position.x,
          position_y: updatedSource.position.y,
          radius: updatedSource.radius,
          color: updatedSource.color,
          intensity: updatedSource.intensity,
          flickering: updatedSource.flickering,
          flicker_intensity: updatedSource.flickerIntensity,
          cast_shadows: updatedSource.castShadows
        })
        .eq('id', updatedSource.id);

      if (error) throw error;

      // Atualizar estado local
      const updatedSources = lightSources.map(source => 
        source.id === updatedSource.id ? updatedSource : source
      );
      onLightSourcesUpdate(updatedSources);

      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'lighting-update',
          payload: { lightSources: updatedSources }
        });

      setSelectedLightSource(updatedSource);
    } catch (error) {
      console.error('Erro ao atualizar fonte de luz:', error);
      toast.error('Erro ao atualizar fonte de luz');
    }
  };

  // Esta função foi substituída pela nova implementação de updateAmbientLight
  // Mantida para compatibilidade com código existente
  const legacyUpdateAmbientLight = async (value: number) => {
    if (!isGameMaster) return;

    setLocalAmbientLight(value);
    
    if (onAmbientLightUpdate) {
      onAmbientLightUpdate(value);
    } else {
      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'ambient-light-update',
          payload: { ambientLight: value }
        });
    }
  };

  // Salvar preset de iluminação
  const saveLightingPreset = async () => {
    if (!isGameMaster) return;

    const presetName = prompt('Nome do preset de iluminação:');
    if (!presetName) return;

    try {
      // Criar objeto de preset usando a função utilitária
      const preset = createLightingPreset(
        presetName,
        mapId,
        lightSources,
        localAmbientLight,
        userId,
        gameId
      );

      // Salvar preset usando a função utilitária
      const success = await saveLightingPreset(preset, supabase);

      if (success) {
        toast.success('Preset de iluminação salvo');
      } else {
        throw new Error('Falha ao salvar preset');
      }
    } catch (error) {
      console.error('Erro ao salvar preset de iluminação:', error);
      toast.error('Erro ao salvar preset de iluminação');
    }
  };

  // Carregar preset de iluminação
  const loadLightingPreset = async () => {
    if (!isGameMaster) return;

    try {
      // Usar a função utilitária para carregar presets
      const presets = await loadLightingPresets(mapId, supabase);

      if (presets.length === 0) {
        toast.info('Nenhum preset encontrado para este mapa');
        return;
      }

      // Mostrar lista de presets disponíveis
      const presetOptions = presets.map(preset => `${preset.name} (${new Date(preset.createdAt || '').toLocaleDateString()})`);
      const selectedIndex = prompt(`Selecione um preset (0-${presetOptions.length - 1}):\n${presetOptions.map((name, i) => `${i}: ${name}`).join('\n')}`);
      
      if (selectedIndex === null) return;
      const index = parseInt(selectedIndex);
      
      if (isNaN(index) || index < 0 || index >= presets.length) {
        toast.error('Seleção inválida');
        return;
      }

      const selectedPreset = presets[index];
      onLightSourcesUpdate(selectedPreset.lightSources);
      
      // Atualizar luz ambiente
      if (onAmbientLightUpdate) {
        onAmbientLightUpdate(selectedPreset.ambientLight);
      } else {
        setLocalAmbientLight(selectedPreset.ambientLight);
      }

      // Notificar outros usuários
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'lighting-update',
          payload: { lightSources: selectedPreset.lightSources }
        });

      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'ambient-light-update',
          payload: { ambientLight: selectedPreset.ambientLight }
        });

      toast.success(`Preset "${selectedPreset.name}" carregado`);
    } catch (error) {
      console.error('Erro ao carregar preset de iluminação:', error);
      toast.error('Erro ao carregar preset de iluminação');
    }
  };
  
  // Adicionar hook para carregar presets disponíveis
  const [availablePresets, setAvailablePresets] = useState<LightingPreset[]>([]);
  
  // Carregar presets disponíveis quando o componente montar
  useEffect(() => {
    if (!mapId) return;
    
    const fetchPresets = async () => {
      try {
        const presets = await loadLightingPresets(mapId, supabase);
        setAvailablePresets(presets);
      } catch (error) {
        console.error('Erro ao carregar presets disponíveis:', error);
      }
    };
    
    fetchPresets();
  }, [mapId]);


  // Renderizar controles apenas para o mestre
  if (!isGameMaster) return null;

  return (
    <div className="p-2 bg-background/80 backdrop-blur-sm rounded-lg shadow-md border border-border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium flex items-center gap-1">
          <Flame className="h-4 w-4" /> Iluminação Dinâmica
        </h3>
        <Toggle
          pressed={showLightingControls}
          onPressedChange={setShowLightingControls}
          size="sm"
          aria-label="Mostrar controles de iluminação"
        >
          <Settings className="h-4 w-4" />
        </Toggle>
      </div>

      {showLightingControls && (
        <div className="space-y-3">
          <Tabs defaultValue="sources">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sources">Fontes de Luz</TabsTrigger>
              <TabsTrigger value="ambient">Ambiente</TabsTrigger>
            </TabsList>

            <TabsContent value="sources" className="space-y-3 pt-2">
              <div className="flex flex-col gap-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="light-radius" className="text-xs">Raio (tiles)</Label>
                    <Slider
                      id="light-radius"
                      min={1}
                      max={20}
                      step={1}
                      value={[newLightRadius]}
                      onValueChange={(value) => setNewLightRadius(value[0])}
                      className="py-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="light-intensity" className="text-xs">Intensidade</Label>
                    <Slider
                      id="light-intensity"
                      min={0.1}
                      max={1}
                      step={0.1}
                      value={[newLightIntensity]}
                      onValueChange={(value) => setNewLightIntensity(value[0])}
                      className="py-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="light-color" className="text-xs">Cor</Label>
                    <div className="flex gap-1">
                      <Input
                        id="light-color"
                        type="color"
                        value={newLightColor}
                        onChange={(e) => setNewLightColor(e.target.value)}
                        className="w-10 h-8 p-1"
                      />
                      <Select
                        value={newLightColor}
                        onValueChange={setNewLightColor}
                      >
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Cor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="#FFF8E0">Tocha</SelectItem>
                          <SelectItem value="#E0F8FF">Lua</SelectItem>
                          <SelectItem value="#FFE0E0">Fogo</SelectItem>
                          <SelectItem value="#E0FFE0">Mágica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="light-flickering" className="text-xs">Oscilação</Label>
                      <Switch
                        id="light-flickering"
                        checked={newLightFlickering}
                        onCheckedChange={setNewLightFlickering}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="light-shadows" className="text-xs">Sombras</Label>
                      <Switch
                        id="light-shadows"
                        checked={newLightCastShadows}
                        onCheckedChange={setNewLightCastShadows}
                      />
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={addLightSource}
                  className="w-full mt-1"
                >
                  <Plus className="h-4 w-4 mr-1" /> Adicionar Fonte de Luz
                </Button>
              </div>

              {lightSources.length > 0 && (
                <div className="max-h-40 overflow-y-auto border rounded-md p-1">
                  {lightSources.map(source => (
                    <div
                      key={source.id}
                      className={`flex items-center justify-between p-1 rounded-sm mb-1 ${selectedLightSource?.id === source.id ? 'bg-accent' : 'hover:bg-muted'}`}
                      onClick={() => setSelectedLightSource(source)}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: source.color || '#FFF8E0' }}
                        />
                        <span className="text-xs truncate max-w-[120px]">{source.id}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeLightSource(source.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {selectedLightSource && (
                <div className="border rounded-md p-2 space-y-2">
                  <h4 className="text-xs font-medium">Editar Fonte de Luz</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Raio</Label>
                      <Slider
                        min={1 * gridSize}
                        max={20 * gridSize}
                        step={gridSize}
                        value={[selectedLightSource.radius]}
                        onValueChange={(value) => {
                          updateLightSource({
                            ...selectedLightSource,
                            radius: value[0]
                          });
                        }}
                        className="py-2"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Intensidade</Label>
                      <Slider
                        min={0.1}
                        max={1}
                        step={0.1}
                        value={[selectedLightSource.intensity || 1]}
                        onValueChange={(value) => {
                          updateLightSource({
                            ...selectedLightSource,
                            intensity: value[0]
                          });
                        }}
                        className="py-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Cor</Label>
                      <Input
                        type="color"
                        value={selectedLightSource.color || '#FFF8E0'}
                        onChange={(e) => {
                          updateLightSource({
                            ...selectedLightSource,
                            color: e.target.value
                          });
                        }}
                        className="w-full h-8"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Oscilação</Label>
                        <Switch
                          checked={selectedLightSource.flickering || false}
                          onCheckedChange={(checked) => {
                            updateLightSource({
                              ...selectedLightSource,
                              flickering: checked
                            });
                          }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-xs">Sombras</Label>
                        <Switch
                          checked={selectedLightSource.castShadows !== false}
                          onCheckedChange={(checked) => {
                            updateLightSource({
                              ...selectedLightSource,
                              castShadows: checked
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ambient" className="space-y-3 pt-2">
              <div className="space-y-2">
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ambient-light" className="text-xs">Luz Ambiente</Label>
                    <span className="text-xs">{Math.round(localAmbientLight * 100)}%</span>
                  </div>
                  <Slider
                    id="ambient-light"
                    min={0}
                    max={1}
                    step={0.05}
                    value={[localAmbientLight]}
                    onValueChange={(value) => handleAmbientLightChange(value[0])}
                    className="py-2"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="presets" className="space-y-3 pt-2">
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input 
                      placeholder="Nome do preset" 
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      className="h-8 text-xs"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (presetName.trim()) {
                          const preset = createLightingPreset(
                            presetName,
                            mapId,
                            lightSources,
                            localAmbientLight,
                            userId,
                            gameId
                          );
                          saveLightingPreset(preset, supabase).then(success => {
                            if (success) {
                              toast.success('Preset salvo com sucesso');
                              setPresetName('');
                              // Recarregar a lista de presets
                              loadLightingPresets(mapId, supabase).then(presets => {
                                setAvailablePresets(presets);
                              });
                            } else {
                              toast.error('Erro ao salvar preset');
                            }
                          });
                        } else {
                          toast.error('Digite um nome para o preset');
                        }
                      }}
                      className="h-8"
                    >
                      <Save className="h-3 w-3 mr-1" /> Salvar
                    </Button>
                  </div>
                </div>
                
                <div className="border rounded-md p-1">
                  <h4 className="text-xs font-medium mb-1">Presets Disponíveis</h4>
                  {availablePresets.length > 0 ? (
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {availablePresets.map(preset => (
                        <div 
                          key={preset.id}
                          className="flex items-center justify-between p-1 rounded-sm hover:bg-muted text-xs"
                        >
                          <div className="flex items-center gap-1">
                            <Bookmark className="h-3 w-3" />
                            <span className="truncate max-w-[120px]">{preset.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={async () => {
                                try {
                                  // Usar a função utilitária para aplicar o preset
                                  const success = await applyLightingPreset(
                                    preset,
                                    mapId,
                                    supabase,
                                    onLightSourcesUpdate,
                                    onAmbientLightUpdate || ((value) => setLocalAmbientLight(value))
                                  );
                                  
                                  if (success) {
                                    toast.success(`Preset "${preset.name}" carregado`);
                                  } else {
                                    throw new Error('Falha ao aplicar preset');
                                  }
                                } catch (error) {
                                  console.error('Erro ao aplicar preset:', error);
                                  toast.error('Erro ao aplicar preset');
                                }
                              }}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={async () => {
                                if (confirm(`Deseja excluir o preset "${preset.name}"?`)) {
                                  try {
                                    // Usar a função utilitária para excluir o preset
                                    const success = await deleteLightingPreset(preset.id, supabase);
                                    
                                    if (success) {
                                      // Atualizar lista de presets
                                      const updatedPresets = availablePresets.filter(p => p.id !== preset.id);
                                      setAvailablePresets(updatedPresets);
                                      toast.success('Preset excluído');
                                    } else {
                                      throw new Error('Falha ao excluir preset');
                                    }
                                  } catch (error) {
                                    console.error('Erro ao excluir preset:', error);
                                    toast.error('Erro ao excluir preset');
                                  }
                                }
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground p-2 text-center">
                      Nenhum preset disponível
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default DynamicLightingController;