import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Eraser, Paintbrush, Save, Download, Upload, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FogOfWarControllerProps {
  sessionId: string;
  mapId: string;
  isGameMaster: boolean;
  fogOfWar: { x: number, y: number }[];
  onFogChange: (fog: { x: number, y: number }[]) => void;
  onToggleFog: (show: boolean) => void;
  showFog: boolean;
  gridSize: { width: number, height: number };
}

const FogOfWarController: React.FC<FogOfWarControllerProps> = ({
  sessionId,
  mapId,
  isGameMaster,
  fogOfWar,
  onFogChange,
  onToggleFog,
  showFog,
  gridSize
}) => {
  const [brushSize, setBrushSize] = useState(1);
  const [brushMode, setBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [autoSync, setAutoSync] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [presets, setPresets] = useState<{id: string, name: string, data: {x: number, y: number}[]}[]>([]);
  
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
          const { fogData } = payload.payload as { fogData: {x: number, y: number}[] };
          onFogChange(fogData);
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
      // Enviar dados de Fog of War para todos os jogadores
      await supabase.channel(`fog-${sessionId}`).send({
        type: 'broadcast',
        event: 'fog_update',
        payload: { fogData: fogOfWar }
      });
      
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('tactical_maps')
        .update({ fog_of_war: fogOfWar })
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
      // Criar um array com todas as células do grid
      const allCells: {x: number, y: number}[] = [];
      
      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          allCells.push({ x, y });
        }
      }
      
      onFogChange(allCells);
      
      if (autoSync) {
        syncFogOfWar();
      }
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
          data: fogOfWar
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
    
    if (autoSync) {
      syncFogOfWar();
    }
    
    toast.success(`Preset "${preset.name}" carregado!`);
  };
  
  // Exportar configuração atual
  const exportFogConfig = () => {
    const config = {
      mapId,
      fogOfWar,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fog-of-war-${mapId}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Importar configuração
  const importFogConfig = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const config = JSON.parse(event.target?.result as string);
          
          if (config.mapId !== mapId) {
            if (!window.confirm('Este arquivo é de outro mapa. Deseja importar mesmo assim?')) {
              return;
            }
          }
          
          onFogChange(config.fogOfWar);
          
          if (autoSync) {
            syncFogOfWar();
          }
          
          toast.success('Configuração de Fog of War importada com sucesso!');
        } catch (error) {
          console.error('Erro ao importar configuração:', error);
          toast.error('Arquivo inválido');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };
  
  // Se não for mestre, mostrar apenas o toggle de visibilidade
  if (!isGameMaster) {
    return null; // Jogadores não veem os controles
  }
  
  return (
    <div className="bg-fantasy-dark/80 border border-fantasy-purple/30 rounded-lg p-3 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-fantasy-gold font-medievalsharp text-sm">Controle de Névoa de Guerra</h3>
        
        <Toggle 
          pressed={showFog} 
          onPressedChange={onToggleFog}
          aria-label="Toggle Fog of War"
          className="data-[state=on]:bg-fantasy-purple/30"
        >
          {showFog ? <Eye size={14} /> : <EyeOff size={14} />}
        </Toggle>
      </div>
      
      {showFog && (
        <>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <p className="text-xs text-fantasy-stone mb-1">Tamanho do Pincel: {brushSize}</p>
              <Slider 
                value={[brushSize]} 
                min={1} 
                max={5} 
                step={1} 
                onValueChange={(value) => setBrushSize(value[0])}
              />
            </div>
            
            <div className="flex border border-fantasy-purple/30 rounded-md overflow-hidden">
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-2 h-8 rounded-none ${brushMode === 'reveal' ? 'bg-fantasy-purple/30' : ''}`}
                onClick={() => setBrushMode('reveal')}
              >
                <Paintbrush size={14} className="mr-1" /> Revelar
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className={`px-2 h-8 rounded-none ${brushMode === 'hide' ? 'bg-fantasy-purple/30' : ''}`}
                onClick={() => setBrushMode('hide')}
              >
                <Eraser size={14} className="mr-1" /> Ocultar
              </Button>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={clearAllFog}
            >
              <Eraser size={14} className="mr-1" /> Limpar Tudo
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={revealAll}
            >
              <Eye size={14} className="mr-1" /> Revelar Tudo
            </Button>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 text-xs"
              onClick={syncFogOfWar}
            >
              <Save size={14} className="mr-1" /> Sincronizar
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs"
                >
                  <Settings size={14} className="mr-1" /> Presets
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3 bg-fantasy-dark border-fantasy-purple/30">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium text-fantasy-gold">Presets Salvos</h4>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={savePreset}
                    >
                      <Save size={12} className="mr-1" /> Salvar
                    </Button>
                  </div>
                  
                  {presets.length === 0 ? (
                    <p className="text-xs text-fantasy-stone/70 text-center py-2">
                      Nenhum preset salvo.
                    </p>
                  ) : (
                    <div className="max-h-40 overflow-y-auto space-y-1">
                      {presets.map(preset => (
                        <Button 
                          key={preset.id}
                          variant="ghost" 
                          size="sm"
                          className="w-full justify-start text-xs h-7"
                          onClick={() => loadPreset(preset.id)}
                        >
                          {preset.name}
                        </Button>
                      ))}
                    </div>
                  )}
                  
                  <div className="pt-2 border-t border-fantasy-purple/20 flex justify-between">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={exportFogConfig}
                    >
                      <Download size={12} className="mr-1" /> Exportar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-7 text-xs"
                      onClick={importFogConfig}
                    >
                      <Upload size={12} className="mr-1" /> Importar
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="flex items-center gap-2">
            <Toggle 
              pressed={autoSync} 
              onPressedChange={setAutoSync}
              aria-label="Auto Sync"
              className="data-[state=on]:bg-fantasy-purple/30 h-7 text-xs"
            >
              Auto Sync
            </Toggle>
            
            {lastSyncTime && (
              <p className="text-xs text-fantasy-stone/70">
                Última sincronização: {lastSyncTime.toLocaleTimeString()}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default FogOfWarController;