import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Eraser, Paintbrush, Save, Download, Upload, Settings, Layers, Ruler, Grid } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import FogPresetManager from './FogPresetManager';

interface RevealedArea {
  id?: string;
  x: number;
  y: number;
  radius: number;
  shape: 'circle' | 'square' | 'polygon';
  points?: { x: number; y: number }[];
  color?: string;
  opacity?: number;
  created_by?: string;
  created_at?: string;
}

interface EnhancedFogOfWarControllerProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  revealedAreas: RevealedArea[];
  onFogUpdate: (areas: RevealedArea[]) => void;
  onToggleFog: (show: boolean) => void;
  showFog: boolean;
  gridSize: number;
  width: number;
  height: number;
}

const EnhancedFogOfWarController: React.FC<EnhancedFogOfWarControllerProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  revealedAreas,
  onFogUpdate,
  onToggleFog,
  showFog,
  gridSize,
  width,
  height
}) => {
  const [brushSize, setBrushSize] = useState(3);
  const [brushShape, setBrushShape] = useState<'circle' | 'square' | 'polygon'>('circle');
  const [currentTool, setCurrentTool] = useState<'reveal' | 'hide' | 'select' | 'lineOfSight'>('reveal');
  const [fogOpacity, setFogOpacity] = useState(0.7);
  const [fogColor, setFogColor] = useState('#000000');
  const [snapToGrid, setSnapToGrid] = useState(false);
  const [edgeBlur, setEdgeBlur] = useState(0);
  const [transitionSpeed, setTransitionSpeed] = useState(300);
  const [presets, setPresets] = useState<{id: string, name: string, data: RevealedArea[]}[]>([]);
  
  // Atualizar opacidade da névoa
  const handleOpacityChange = (value: number) => {
    setFogOpacity(value);
    
    // Enviar atualização para todos os jogadores
    if (isGameMaster && mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_opacity_update',
          payload: { opacity: value }
        })
        .catch(error => {
          console.error('Erro ao atualizar opacidade da névoa:', error);
        });
    }
  };
  
  // Limpar toda a névoa
  const clearAllFog = async () => {
    if (!isGameMaster) return;
    
    if (window.confirm('Tem certeza que deseja limpar toda a névoa de guerra?')) {
      try {
        // Remover todas as áreas reveladas do banco de dados
        const { error } = await supabase
          .from('map_fog_of_war')
          .delete()
          .eq('map_id', mapId);

        if (error) throw error;

        // Atualizar estado local
        onFogUpdate([]);

        // Notificar outros usuários
        await supabase
          .channel(`fog-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'fog_reset',
            payload: { map_id: mapId }
          });

        toast.success('Névoa de guerra reiniciada com sucesso!');
      } catch (error) {
        console.error('Erro ao reiniciar névoa de guerra:', error);
        toast.error('Não foi possível reiniciar a névoa de guerra');
      }
    }
  };
  
  // Revelar todo o mapa
  const revealAllMap = async () => {
    if (!isGameMaster) return;
    
    if (window.confirm('Tem certeza que deseja revelar todo o mapa?')) {
      try {
        // Criar uma área grande que cobre todo o mapa
        const newArea: RevealedArea = {
          x: width / 2,
          y: height / 2,
          radius: Math.max(width, height),
          shape: 'circle',
          color: 'rgba(0, 0, 0, 0.7)',
          opacity: fogOpacity
        };
        
        // Adicionar ao banco de dados
        const { data, error } = await supabase
          .from('map_fog_of_war')
          .insert({
            map_id: mapId,
            game_id: gameId,
            x: newArea.x,
            y: newArea.y,
            radius: newArea.radius,
            shape: newArea.shape,
            color: newArea.color,
            opacity: newArea.opacity,
            created_by: userId
          })
          .select()
          .single();

        if (error) throw error;

        if (data) {
          newArea.id = data.id;
          newArea.created_at = data.created_at;
          newArea.created_by = data.created_by;

          // Atualizar estado local
          onFogUpdate([...revealedAreas, newArea]);

          // Notificar outros usuários
          await supabase
            .channel(`fog-updates-${mapId}`)
            .send({
              type: 'broadcast',
              event: 'fog_update',
              payload: newArea
            });

          toast.success('Mapa totalmente revelado!');
        }
      } catch (error) {
        console.error('Erro ao revelar todo o mapa:', error);
        toast.error('Não foi possível revelar todo o mapa');
      }
    }
  };
  
  // Carregar preset
  const handlePresetLoad = (areas: RevealedArea[]) => {
    if (!isGameMaster) return;
    onFogUpdate(areas);
    toast.success('Preset carregado com sucesso!');
  };
  
  // Exportar configuração atual
  const exportFogConfig = () => {
    const config = {
      mapId,
      revealedAreas,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fog-of-war-${mapId}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
    toast.success('Configuração de névoa exportada com sucesso!');
  };
  
  // Aplicar predefinição rápida de tamanho de pincel
  const applyQuickPreset = (preset: 'small' | 'medium' | 'large') => {
    let newBrushSize = brushSize;
    
    switch (preset) {
      case 'small':
        newBrushSize = 1;
        break;
      case 'medium':
        newBrushSize = 3;
        break;
      case 'large':
        newBrushSize = 5;
        break;
    }
    
    setBrushSize(newBrushSize);
    toast.success(`Predefinição ${preset} aplicada`);
  };
  
  // Alternar alinhamento ao grid
  const onToggleSnapToGrid = (value: boolean) => {
    setSnapToGrid(value);
    
    // Enviar atualização para todos os jogadores
    if (isGameMaster && mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_snap_update',
          payload: { snapToGrid: value }
        })
        .catch(error => {
          console.error('Erro ao atualizar alinhamento ao grid:', error);
        });
    }
  };
  
  // Atualizar suavização de bordas
  const onEdgeBlurChange = (value: number) => {
    setEdgeBlur(value);
    
    // Enviar atualização para todos os jogadores
    if (isGameMaster && mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_blur_update',
          payload: { edgeBlur: value }
        })
        .catch(error => {
          console.error('Erro ao atualizar suavização de bordas:', error);
        });
    }
  };
  
  // Atualizar velocidade de transição
  const onTransitionSpeedChange = (value: number) => {
    setTransitionSpeed(value);
    
    // Enviar atualização para todos os jogadores
    if (isGameMaster && mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_transition_update',
          payload: { transitionSpeed: value }
        })
        .catch(error => {
          console.error('Erro ao atualizar velocidade de transição:', error);
        });
    }
  };
  
  // Salvar preset
  const savePreset = async (name: string) => {
    if (!isGameMaster || !mapId) return;
    
    try {
      const { data, error } = await supabase
        .from('fog_presets')
        .insert({
          map_id: mapId,
          name: name,
          data: revealedAreas,
          created_by: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        setPresets(prev => [...prev, data]);
        toast.success(`Predefinição "${name}" salva com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao salvar predefinição:', error);
      toast.error('Não foi possível salvar a predefinição');
    }
  };
  
  // Carregar preset
  const loadPreset = async (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;
    
    try {
      // Limpar áreas existentes
      await supabase
        .from('map_fog_of_war')
        .delete()
        .eq('map_id', mapId);
      
      // Adicionar novas áreas
      const promises = preset.data.map(async (area: RevealedArea) => {
        const { data } = await supabase
          .from('map_fog_of_war')
          .insert({
            map_id: mapId,
            game_id: gameId,
            x: area.x,
            y: area.y,
            radius: area.radius,
            shape: area.shape,
            points: area.points ? JSON.stringify(area.points) : null,
            color: area.color || 'rgba(0, 0, 0, 0.7)',
            opacity: area.opacity || 0.7,
            created_by: userId
          })
          .select()
          .single();
          
        return data;
      });
      
      await Promise.all(promises);
      
      // Atualizar estado local
      onFogUpdate(preset.data);
      
      toast.success(`Predefinição "${preset.name}" carregada com sucesso!`);
    } catch (error) {
      console.error('Erro ao carregar predefinição:', error);
      toast.error('Não foi possível carregar a predefinição');
    }
  };
  
  // Carregar presets do banco de dados
  useEffect(() => {
    if (!isGameMaster || !mapId) return;
    
    const fetchPresets = async () => {
      try {
        const { data, error } = await supabase
          .from('fog_presets')
          .select('*')
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        if (data) {
          setPresets(data);
        }
      } catch (error) {
        console.error('Erro ao carregar predefinições:', error);
      }
    };
    
    fetchPresets();
  }, [mapId, isGameMaster]);
  
  // Importar configuração
  const importFogConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = async (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const config = JSON.parse(content);
          
          if (!config.revealedAreas || !Array.isArray(config.revealedAreas)) {
            throw new Error('Formato de arquivo inválido');
          }
          
          // Limpar áreas existentes
          await supabase
            .from('map_fog_of_war')
            .delete()
            .eq('map_id', mapId);
          
          // Adicionar novas áreas
          const promises = config.revealedAreas.map(async (area: RevealedArea) => {
            const { data } = await supabase
              .from('map_fog_of_war')
              .insert({
                map_id: mapId,
                game_id: gameId,
                x: area.x,
                y: area.y,
                radius: area.radius,
                shape: area.shape,
                points: area.points ? JSON.stringify(area.points) : null,
                color: area.color || 'rgba(0, 0, 0, 0.7)',
                opacity: area.opacity || 0.7,
                created_by: userId
              })
              .select()
              .single();
              
            return data;
          });
          
          await Promise.all(promises);
          
          // Atualizar estado local
          onFogUpdate(config.revealedAreas);
          
          toast.success('Configuração de névoa importada com sucesso!');
        } catch (error) {
          console.error('Erro ao importar configuração:', error);
          toast.error('Erro ao importar configuração de névoa');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  return (
    <div className="p-4 bg-card rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">Controles Avançados da Névoa de Guerra</h3>
      
      <div className="space-y-4">
        {/* Controle de Visibilidade */}
        <div className="flex items-center justify-between">
          <span>Mostrar Névoa:</span>
          <Button
            variant={showFog ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleFog(!showFog)}
          >
            {showFog ? <Eye className="h-4 w-4 mr-2" /> : <EyeOff className="h-4 w-4 mr-2" />}
            {showFog ? "Visível" : "Oculta"}
          </Button>
        </div>
        
        {/* Controle de Opacidade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Opacidade:</span>
            <span>{Math.round(fogOpacity * 100)}%</span>
          </div>
          <Slider
            value={[fogOpacity * 100]}
            min={0}
            max={100}
            step={5}
            onValueChange={(value) => handleOpacityChange(value[0] / 100)}
          />
        </div>
        
        {/* Ferramentas de Edição */}
        <div className="space-y-2">
          <span>Ferramenta:</span>
          <div className="flex space-x-2">
            <Toggle
              pressed={currentTool === 'reveal'}
              onClick={() => setCurrentTool('reveal')}
              aria-label="Revelar Névoa"
            >
              <Eye className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={currentTool === 'hide'}
              onClick={() => setCurrentTool('hide')}
              aria-label="Esconder Névoa"
            >
              <EyeOff className="h-4 w-4" />
            </Toggle>
            <Toggle
              pressed={currentTool === 'select'}
              onClick={() => setCurrentTool('select')}
              aria-label="Selecionar Área"
            >
              <Paintbrush className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
        
        {/* Forma do Pincel */}
        <div className="space-y-2">
          <span>Forma do Pincel:</span>
          <Select
            value={brushShape}
            onValueChange={(value: 'circle' | 'square' | 'polygon') => setBrushShape(value)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione a forma" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="circle">Círculo</SelectItem>
              <SelectItem value="square">Quadrado</SelectItem>
              <SelectItem value="polygon">Polígono</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Tamanho do Pincel */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span>Tamanho do Pincel:</span>
            <span>{brushSize * gridSize}px</span>
          </div>
          <Slider
            value={[brushSize]}
            min={1}
            max={10}
            step={1}
            onValueChange={(value) => setBrushSize(value[0])}
          />
        </div>
        
        {/* Predefinições Rápidas */}
        <div className="space-y-2">
          <span>Predefinições Rápidas:</span>
          <div className="flex space-x-2">
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
        
        {/* Controles Avançados */}
        <div className="space-y-4">
          <h4 className="font-medium">Controles Avançados</h4>
          
          {/* Alinhamento ao Grid */}
          <div className="flex items-center justify-between">
            <span>Alinhar ao Grid:</span>
            <Toggle
              pressed={snapToGrid}
              onClick={() => onToggleSnapToGrid(!snapToGrid)}
              aria-label="Alinhar ao Grid"
            >
              <Grid className="h-4 w-4" />
            </Toggle>
          </div>
          
          {/* Suavização de Bordas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Suavização de Bordas:</span>
              <span>{edgeBlur}</span>
            </div>
            <Slider
              value={[edgeBlur]}
              min={0}
              max={10}
              step={0.5}
              onValueChange={(value) => onEdgeBlurChange(value[0])}
            />
          </div>
          
          {/* Velocidade de Transição */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Velocidade de Transição:</span>
              <span>{transitionSpeed}ms</span>
            </div>
            <Slider
              value={[transitionSpeed]}
              min={0}
              max={1000}
              step={50}
              onValueChange={(value) => onTransitionSpeedChange(value[0])}
            />
          </div>
        </div>
        
        {/* Botões de Ação */}
        <div className="pt-2 space-y-2">
          <Button
            variant="destructive"
            size="sm"
            className="w-full"
            onClick={clearAllFog}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Limpar Toda a Névoa
          </Button>
          
          {/* Gerenciamento de Predefinições */}
          <div className="space-y-2">
            <span>Gerenciar Predefinições:</span>
            <div className="flex space-x-2">
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
                        placeholder="Minha Predefinição"
                        onChange={(e) => e.target.value}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const input = document.getElementById('preset-name') as HTMLInputElement;
                        if (input && input.value) {
                          savePreset(input.value);
                          input.value = '';
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
              
              <Select onValueChange={loadPreset}>
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
          
          <FogPresetManager
            mapId={mapId}
            userId={userId}
            onPresetSelect={(preset) => {
              // Implementar lógica para aplicar preset
              console.log('Preset selecionado:', preset);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default EnhancedFogOfWarController;