import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Eraser, Paintbrush, Save, Download, Upload, Settings, Layers, Ruler } from 'lucide-react';
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
    <div className="bg-fantasy-dark/80 p-3 rounded-md flex flex-col gap-3 max-w-xs">
      <h3 className="text-fantasy-gold font-medievalsharp text-lg">Controle de Névoa</h3>
      
      {/* Controles de visibilidade */}
      <div className="flex justify-between items-center">
        <span className="text-fantasy-stone text-sm">Mostrar Névoa:</span>
        <Toggle
          pressed={showFog}
          onPressedChange={onToggleFog}
          aria-label="Alternar visibilidade da névoa"
          className={showFog ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}
        >
          {showFog ? <Eye size={16} /> : <EyeOff size={16} />}
        </Toggle>
      </div>
      
      {isGameMaster && (
        <>
          {/* Abas de ferramentas */}
          <Tabs defaultValue="tools" className="w-full">
            <TabsList className="grid grid-cols-3 mb-2">
              <TabsTrigger value="tools">Ferramentas</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
              <TabsTrigger value="presets">Presets</TabsTrigger>
            </TabsList>
            
            {/* Aba de ferramentas */}
            <TabsContent value="tools" className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={currentTool === 'reveal' ? 'bg-fantasy-gold text-fantasy-dark' : ''}
                  onClick={() => setCurrentTool('reveal')}
                >
                  <Paintbrush size={16} className="mr-1" /> Revelar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={currentTool === 'hide' ? 'bg-fantasy-gold text-fantasy-dark' : ''}
                  onClick={() => setCurrentTool('hide')}
                >
                  <Eraser size={16} className="mr-1" /> Esconder
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={currentTool === 'lineOfSight' ? 'bg-fantasy-gold text-fantasy-dark' : ''}
                  onClick={() => setCurrentTool('lineOfSight')}
                >
                  <Ruler size={16} className="mr-1" /> Visão
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={currentTool === 'select' ? 'bg-fantasy-gold text-fantasy-dark' : ''}
                  onClick={() => setCurrentTool('select')}
                >
                  <Layers size={16} className="mr-1" /> Selecionar
                </Button>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-fantasy-stone text-sm">Forma:</span>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className={`p-1 h-8 w-8 ${brushShape === 'circle' ? 'bg-fantasy-gold text-fantasy-dark' : ''}`}
                      onClick={() => setBrushShape('circle')}
                      title="Círculo"
                    >
                      ⭕
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`p-1 h-8 w-8 ${brushShape === 'square' ? 'bg-fantasy-gold text-fantasy-dark' : ''}`}
                      onClick={() => setBrushShape('square')}
                      title="Quadrado"
                    >
                      ⬛
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`p-1 h-8 w-8 ${brushShape === 'polygon' ? 'bg-fantasy-gold text-fantasy-dark' : ''}`}
                      onClick={() => setBrushShape('polygon')}
                      title="Polígono"
                    >
                      🔺
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-fantasy-stone text-sm">Tamanho:</span>
                    <span className="text-fantasy-stone text-sm">{brushSize}</span>
                  </div>
                  <Slider
                    value={[brushSize]}
                    min={1}
                    max={10}
                    step={1}
                    onValueChange={(value) => setBrushSize(value[0])}
                    className="w-full"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={clearAllFog}
                >
                  <Eraser size={16} className="mr-1" /> Limpar Tudo
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={revealAllMap}
                >
                  <Eye size={16} className="mr-1" /> Revelar Tudo
                </Button>
              </div>
            </TabsContent>
            
            {/* Aba de configurações */}
            <TabsContent value="settings" className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-fantasy-stone text-sm">Opacidade:</span>
                  <span className="text-fantasy-stone text-sm">{Math.round(fogOpacity * 100)}%</span>
                </div>
                <Slider
                  value={[fogOpacity]}
                  min={0.1}
                  max={1}
                  step={0.05}
                  onValueChange={(value) => handleOpacityChange(value[0])}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-1">
                <span className="text-fantasy-stone text-sm">Cor da Névoa:</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fogColor}
                    onChange={(e) => setFogColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <span className="text-fantasy-stone text-sm">{fogColor}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportFogConfig}
                >
                  <Download size={16} className="mr-1" /> Exportar
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={importFogConfig}
                >
                  <Upload size={16} className="mr-1" /> Importar
                </Button>
              </div>
            </TabsContent>
            
            {/* Aba de presets */}
            <TabsContent value="presets" className="space-y-3">
              <FogPresetManager
                mapId={mapId}
                gameId={gameId}
                userId={userId}
                isGameMaster={isGameMaster}
                currentAreas={revealedAreas}
                onPresetLoad={handlePresetLoad}
              />
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default EnhancedFogOfWarController;