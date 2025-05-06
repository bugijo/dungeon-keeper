import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, Paintbrush, Save, Download, Settings, Layers, Ruler, Grid, Sun, Moon } from 'lucide-react';

import AdvancedLineOfSight from './AdvancedLineOfSight';
import FogMemorySystem from './FogMemorySystem';
import CharacterVisionSystem from './CharacterVisionSystem';
import FogOfWar from './FogOfWar';

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'door' | 'window' | 'furniture';
  blocksVision: boolean;
}

interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  flickering: boolean;
}

interface Character {
  id: string;
  name: string;
  x: number;
  y: number;
  visionRadius: number;
  visionColor?: string;
  ownerId: string;
  hasNightVision?: boolean;
  hasBlindSight?: boolean;
  hasTruesight?: boolean;
  visionBonuses?: {
    darkvision?: number;
    blindsight?: number;
    truesight?: number;
  };
}

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

interface MemoryArea {
  id?: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  lastSeen: Date;
  seenBy: string;
  mapId: string;
}

interface IntegratedVisionSystemProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  characters: Character[];
  obstacles: Obstacle[];
  lightSources: LightSource[];
  activeCharacterId?: string;
  onFogUpdate?: (revealedAreas: RevealedArea[]) => void;
}

const IntegratedVisionSystem: React.FC<IntegratedVisionSystemProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  characters,
  obstacles,
  lightSources,
  activeCharacterId,
  onFogUpdate
}) => {
  // Estado para controlar qual sistema está ativo
  const [activeSystem, setActiveSystem] = useState<'fog' | 'lineOfSight' | 'memory' | 'character'>('fog');
  const [showFog, setShowFog] = useState<boolean>(true);
  const [snapToGrid, setSnapToGrid] = useState<boolean>(true);
  const [edgeBlur, setEdgeBlur] = useState<number>(0);
  const [transitionSpeed, setTransitionSpeed] = useState<number>(300);
  const [fogOpacity, setFogOpacity] = useState<number>(0.7);
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true);
  const [memoryOpacity, setMemoryOpacity] = useState<number>(0.3);
  const [visionQuality, setVisionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night' | 'dusk'>('day');
  
  // Estados para armazenar áreas visíveis e de memória
  const [visibleAreas, setVisibleAreas] = useState<{ x: number; y: number; radius: number; intensity?: number }[]>([]);
  const [memoryAreas, setMemoryAreas] = useState<MemoryArea[]>([]);
  const [revealedAreas, setRevealedAreas] = useState<RevealedArea[]>([]);
  
  // Referências para os sistemas
  const fogOfWarRef = useRef<any>(null);
  const lineOfSightRef = useRef<any>(null);
  const memorySystemRef = useRef<any>(null);
  const characterVisionRef = useRef<any>(null);
  
  // Atualizar áreas visíveis quando o sistema de linha de visão detectar mudanças
  const handleLineOfSightUpdate = (areas: { x: number; y: number; radius: number; intensity: number }[]) => {
    setVisibleAreas(areas);
  };
  
  // Atualizar áreas de memória quando o sistema de memória detectar mudanças
  const handleMemoryUpdate = (areas: MemoryArea[]) => {
    setMemoryAreas(areas);
  };
  
  // Atualizar áreas visíveis quando o sistema de visão de personagem detectar mudanças
  const handleCharacterVisionUpdate = (areas: { x: number; y: number; radius: number }[]) => {
    setVisibleAreas(areas);
  };
  
  // Atualizar áreas reveladas quando o sistema de névoa detectar mudanças
  const handleFogUpdate = (areas: RevealedArea[]) => {
    setRevealedAreas(areas);
    if (onFogUpdate) {
      onFogUpdate(areas);
    }
  };
  
  // Alternar exibição da névoa
  const toggleFog = () => {
    setShowFog(prev => !prev);
  };
  
  // Alternar alinhamento ao grid
  const toggleSnapToGrid = () => {
    setSnapToGrid(prev => !prev);
  };
  
  // Alternar sistema de memória
  const toggleMemory = () => {
    setMemoryEnabled(prev => !prev);
  };
  
  // Alternar qualidade da visão
  const toggleVisionQuality = () => {
    setVisionQuality(prev => {
      if (prev === 'low') return 'medium';
      if (prev === 'medium') return 'high';
      return 'low';
    });
  };
  
  // Alternar hora do dia
  const toggleTimeOfDay = () => {
    setTimeOfDay(prev => {
      if (prev === 'day') return 'dusk';
      if (prev === 'dusk') return 'night';
      return 'day';
    });
  };
  
  // Aplicar predefinições rápidas de tamanho de pincel
  const applyPreset = (preset: 'small' | 'medium' | 'large') => {
    if (fogOfWarRef.current) {
      fogOfWarRef.current.applyPreset(preset);
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
        setRevealedAreas([]);
        if (onFogUpdate) {
          onFogUpdate([]);
        }

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
          const formattedArea: RevealedArea = {
            id: data.id,
            x: data.x,
            y: data.y,
            radius: data.radius,
            shape: data.shape,
            color: data.color,
            opacity: data.opacity,
            created_by: data.created_by,
            created_at: data.created_at
          };

          // Atualizar estado local
          const updatedAreas = [...revealedAreas, formattedArea];
          setRevealedAreas(updatedAreas);
          if (onFogUpdate) {
            onFogUpdate(updatedAreas);
          }

          // Notificar outros usuários
          await supabase
            .channel(`fog-updates-${mapId}`)
            .send({
              type: 'broadcast',
              event: 'fog_update',
              payload: { map_id: mapId, areas: updatedAreas }
            });

          toast.success('Mapa revelado com sucesso!');
        }
      } catch (error) {
        console.error('Erro ao revelar mapa:', error);
        toast.error('Não foi possível revelar o mapa');
      }
    }
  };
  
  // Limpar todas as áreas de memória
  const clearAllMemory = async () => {
    if (memorySystemRef.current) {
      memorySystemRef.current.clearAllMemory();
    }
  };
  
  // Efeito para ajustar configurações com base na hora do dia
  useEffect(() => {
    switch (timeOfDay) {
      case 'day':
        setFogOpacity(0.7);
        setMemoryOpacity(0.3);
        break;
      case 'dusk':
        setFogOpacity(0.8);
        setMemoryOpacity(0.4);
        break;
      case 'night':
        setFogOpacity(0.9);
        setMemoryOpacity(0.5);
        break;
    }
  }, [timeOfDay]);
  
  return (
    <div className="integrated-vision-system">
      {/* Camadas de visualização */}
      <div className="vision-layers" style={{ position: 'relative', width, height }}>
        {/* Camada de névoa de guerra */}
        {activeSystem === 'fog' && (
          <FogOfWar
            ref={fogOfWarRef}
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            width={width}
            height={height}
            gridSize={gridSize}
            onFogUpdate={handleFogUpdate}
          />
        )}
        
        {/* Camada de linha de visão */}
        {activeSystem === 'lineOfSight' && (
          <AdvancedLineOfSight
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            width={width}
            height={height}
            gridSize={gridSize}
            characterPositions={characters.map(c => ({
              id: c.id,
              x: c.x,
              y: c.y,
              visionRadius: c.visionRadius
            }))}
            obstacles={obstacles}
            lightSources={lightSources}
            onVisibleAreaChange={handleLineOfSightUpdate}
          />
        )}
        
        {/* Camada de memória */}
        {activeSystem === 'memory' && memoryEnabled && (
          <FogMemorySystem
            ref={memorySystemRef}
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            width={width}
            height={height}
            gridSize={gridSize}
            currentVisibleAreas={visibleAreas}
            onMemoryUpdate={handleMemoryUpdate}
          />
        )}
        
        {/* Camada de visão por personagem */}
        {activeSystem === 'character' && (
          <CharacterVisionSystem
            ref={characterVisionRef}
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            width={width}
            height={height}
            gridSize={gridSize}
            characters={characters}
            obstacles={obstacles}
            activeCharacterId={activeCharacterId}
            onVisionUpdate={handleCharacterVisionUpdate}
          />
        )}
      </div>
      
      {/* Painel de controle */}
      <div className="vision-controls" style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0, 0, 0, 0.7)', padding: 10, borderRadius: 5 }}>
        <Tabs defaultValue="fog" onValueChange={(value) => setActiveSystem(value as any)}>
          <TabsList>
            <TabsTrigger value="fog">Névoa</TabsTrigger>
            <TabsTrigger value="lineOfSight">Linha de Visão</TabsTrigger>
            <TabsTrigger value="memory">Memória</TabsTrigger>
            <TabsTrigger value="character">Personagens</TabsTrigger>
          </TabsList>
          
          <TabsContent value="fog">
            <div className="fog-controls">
              <div className="flex items-center space-x-2 mb-2">
                <Switch id="show-fog" checked={showFog} onCheckedChange={toggleFog} />
                <Label htmlFor="show-fog">Mostrar Névoa</Label>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Switch id="snap-grid" checked={snapToGrid} onCheckedChange={toggleSnapToGrid} />
                <Label htmlFor="snap-grid">Alinhar ao Grid</Label>
              </div>
              
              <div className="mb-2">
                <Label htmlFor="fog-opacity">Opacidade da Névoa</Label>
                <Slider
                  id="fog-opacity"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[fogOpacity]}
                  onValueChange={(value) => setFogOpacity(value[0])}
                />
              </div>
              
              <div className="mb-2">
                <Label htmlFor="edge-blur">Suavização de Bordas</Label>
                <Slider
                  id="edge-blur"
                  min={0}
                  max={10}
                  step={1}
                  value={[edgeBlur]}
                  onValueChange={(value) => setEdgeBlur(value[0])}
                />
              </div>
              
              <div className="mb-2">
                <Label htmlFor="transition-speed">Velocidade de Transição</Label>
                <Slider
                  id="transition-speed"
                  min={0}
                  max={1000}
                  step={50}
                  value={[transitionSpeed]}
                  onValueChange={(value) => setTransitionSpeed(value[0])}
                />
              </div>
              
              <div className="flex space-x-2 mb-2">
                <Button size="sm" onClick={() => applyPreset('small')}>Pequeno</Button>
                <Button size="sm" onClick={() => applyPreset('medium')}>Médio</Button>
                <Button size="sm" onClick={() => applyPreset('large')}>Grande</Button>
              </div>
              
              {isGameMaster && (
                <div className="flex space-x-2">
                  <Button variant="destructive" size="sm" onClick={clearAllFog}>Limpar Névoa</Button>
                  <Button variant="outline" size="sm" onClick={revealAllMap}>Revelar Tudo</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="lineOfSight">
            <div className="line-of-sight-controls">
              <div className="flex items-center space-x-2 mb-2">
                <Switch id="show-los" checked={true} />
                <Label htmlFor="show-los">Mostrar Linha de Visão</Label>
              </div>
              
              <div className="mb-2">
                <Label htmlFor="vision-quality">Qualidade da Visão</Label>
                <Select value={visionQuality} onValueChange={(value) => setVisionQuality(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualidade da Visão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2 mb-2">
                <Button size="sm" onClick={toggleTimeOfDay}>
                  {timeOfDay === 'day' ? <Sun className="mr-2" size={16} /> : 
                   timeOfDay === 'night' ? <Moon className="mr-2" size={16} /> : 
                   <Sun className="mr-2" size={16} />}
                  {timeOfDay === 'day' ? 'Dia' : timeOfDay === 'night' ? 'Noite' : 'Crepúsculo'}
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="memory">
            <div className="memory-controls">
              <div className="flex items-center space-x-2 mb-2">
                <Switch id="enable-memory" checked={memoryEnabled} onCheckedChange={toggleMemory} />
                <Label htmlFor="enable-memory">Ativar Memória</Label>
              </div>
              
              <div className="mb-2">
                <Label htmlFor="memory-opacity">Opacidade da Memória</Label>
                <Slider
                  id="memory-opacity"
                  min={0}
                  max={1}
                  step={0.1}
                  value={[memoryOpacity]}
                  onValueChange={(value) => setMemoryOpacity(value[0])}
                />
              </div>
              
              {isGameMaster && (
                <div className="flex space-x-2">
                  <Button variant="destructive" size="sm" onClick={clearAllMemory}>Limpar Memória</Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="character">
            <div className="character-vision-controls">
              <div className="mb-2">
                <Label htmlFor="active-character">Personagem Ativo</Label>
                <Select value={activeCharacterId || ''} onValueChange={(value) => {}}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um personagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {characters.map(character => (
                      <SelectItem key={character.id} value={character.id}>
                        {character.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mb-2">
                <Label htmlFor="vision-quality">Qualidade da Visão</Label>
                <Select value={visionQuality} onValueChange={(value) => setVisionQuality(value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Qualidade da Visão" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntegratedVisionSystem;