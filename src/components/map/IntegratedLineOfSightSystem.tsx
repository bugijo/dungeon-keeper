/**
 * Sistema Integrado de Linha de Visão
 * Combina cálculo de linha de visão, memória de áreas reveladas e sincronização em tempo real
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff, Zap, Brain, Save, RefreshCw, Users } from 'lucide-react';
import { useLineOfSightSync } from '@/hooks/useLineOfSightSync';
import RevealedAreaMemorySystem from './RevealedAreaMemorySystem';
import { Point, RevealedArea, Obstacle, calculateVisibleArea, convertVisibleAreaToRevealed } from '@/utils/fogOfWarUtils';

interface IntegratedLineOfSightSystemProps {
  mapId: string;
  userId: string;
  gameId?: string;
  isGameMaster?: boolean;
  playerPosition?: Point;
  obstacles: Obstacle[];
  maxViewDistance?: number;
  gridSize?: number;
  onVisibleAreaChange?: (areas: RevealedArea[]) => void;
}

const IntegratedLineOfSightSystem: React.FC<IntegratedLineOfSightSystemProps> = ({
  mapId,
  userId,
  gameId,
  isGameMaster = false,
  playerPosition,
  obstacles = [],
  maxViewDistance = 300,
  gridSize = 50,
  onVisibleAreaChange
}) => {
  // Estados para configuração do sistema
  const [activeTab, setActiveTab] = useState<string>('visao');
  const [lineOfSightEnabled, setLineOfSightEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [viewDistance, setViewDistance] = useState(maxViewDistance);
  const [angleStep, setAngleStep] = useState(2); // Precisão do raycasting
  const [lightIntensity, setLightIntensity] = useState(0.8);
  const [lightColor, setLightColor] = useState('rgba(255, 255, 200, 0.8)');
  const [currentPosition, setCurrentPosition] = useState<Point | undefined>(playerPosition);
  
  // Referências para os sistemas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Hook de sincronização de linha de visão
  const {
    visibleAreas,
    memoryAreas,
    isLoading,
    error,
    updatePlayerPosition,
    clearMemory,
    syncVisibleAreas
  } = useLineOfSightSync({
    mapId,
    userId,
    isGameMaster,
    playerPosition: currentPosition,
    obstacles,
    maxViewDistance: viewDistance,
    enabled: lineOfSightEnabled && syncEnabled
  });
  
  // Estado combinado de áreas visíveis e memória
  const [combinedAreas, setCombinedAreas] = useState<RevealedArea[]>([]);
  
  // Atualizar posição do jogador
  const handlePositionUpdate = useCallback((position: Point) => {
    setCurrentPosition(position);
    updatePlayerPosition(position);
  }, [updatePlayerPosition]);
  
  // Calcular áreas visíveis localmente (sem sincronização)
  const calculateLocalVisibleAreas = useCallback(() => {
    if (!lineOfSightEnabled || !currentPosition) return [];
    
    try {
      // Calcular pontos visíveis usando raycasting
      const visiblePoints = calculateVisibleArea(
        currentPosition,
        viewDistance,
        obstacles,
        angleStep,
        true // useCache
      );
      
      // Converter pontos visíveis em uma área revelada
      const revealedArea = convertVisibleAreaToRevealed(
        visiblePoints,
        currentPosition,
        lightColor,
        lightIntensity
      );
      
      return [revealedArea];
    } catch (err) {
      console.error('Erro ao calcular áreas visíveis localmente:', err);
      return [];
    }
  }, [lineOfSightEnabled, currentPosition, viewDistance, obstacles, angleStep, lightColor, lightIntensity]);
  
  // Renderizar áreas visíveis no canvas
  const renderVisibleAreas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Renderizar áreas de memória primeiro (mais transparentes)
    memoryAreas.forEach(area => {
      ctx.fillStyle = area.color || 'rgba(100, 100, 255, 0.4)';
      ctx.globalAlpha = area.opacity || 0.4;
      
      if (area.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (area.shape === 'polygon' && area.points && area.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
    
    // Renderizar áreas visíveis por cima (mais opacas)
    const localVisibleAreas = calculateLocalVisibleAreas();
    const areasToRender = syncEnabled ? visibleAreas : localVisibleAreas;
    
    areasToRender.forEach(area => {
      ctx.fillStyle = area.color || lightColor;
      ctx.globalAlpha = area.opacity || lightIntensity;
      
      if (area.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (area.shape === 'polygon' && area.points && area.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });
    
    // Renderizar obstáculos para debug (opcional)
    if (isGameMaster) {
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
      obstacles.forEach(obstacle => {
        if (obstacle.blocks_vision) {
          ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        }
      });
    }
    
    // Renderizar posição do jogador
    if (currentPosition) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#ffcc00';
      ctx.beginPath();
      ctx.arc(currentPosition.x, currentPosition.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Combinar áreas para notificar componentes externos
    const allAreas = [...memoryAreas, ...areasToRender];
    setCombinedAreas(allAreas);
    
    if (onVisibleAreaChange) {
      onVisibleAreaChange(allAreas);
    }
    
    // Continuar animação
    animationFrameRef.current = requestAnimationFrame(renderVisibleAreas);
  }, [memoryAreas, visibleAreas, obstacles, currentPosition, calculateLocalVisibleAreas, 
      syncEnabled, lightColor, lightIntensity, isGameMaster, onVisibleAreaChange]);
  
  // Iniciar renderização quando o componente montar
  useEffect(() => {
    if (canvasRef.current) {
      // Configurar tamanho do canvas
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      
      // Iniciar loop de renderização
      renderVisibleAreas();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [renderVisibleAreas]);
  
  // Atualizar posição do jogador quando o prop mudar
  useEffect(() => {
    if (playerPosition) {
      handlePositionUpdate(playerPosition);
    }
  }, [playerPosition, handlePositionUpdate]);
  
  // Forçar sincronização quando as configurações mudarem
  useEffect(() => {
    if (syncEnabled && lineOfSightEnabled) {
      syncVisibleAreas();
    }
  }, [syncEnabled, lineOfSightEnabled, viewDistance, angleStep, lightIntensity, lightColor, syncVisibleAreas]);
  
  // Lidar com cliques no canvas para definir posição do jogador
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Alinhar ao grid se necessário
    const position = {
      x: Math.round(x / gridSize) * gridSize,
      y: Math.round(y / gridSize) * gridSize
    };
    
    handlePositionUpdate(position);
  };
  
  return (
    <div className="relative w-full h-full">
      {/* Canvas para renderização */}
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-auto"
        onClick={handleCanvasClick}
      />
      
      {/* Painel de controle */}
      <div className="absolute top-4 right-4 w-64 z-10">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full bg-fantasy-dark/90">
            <TabsTrigger value="visao" className="text-xs">
              <Eye size={14} className="mr-1" />
              Visão
            </TabsTrigger>
            <TabsTrigger value="memoria" className="text-xs">
              <Brain size={14} className="mr-1" />
              Memória
            </TabsTrigger>
            <TabsTrigger value="sync" className="text-xs">
              <Users size={14} className="mr-1" />
              Sync
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="visao" className="mt-1">
            <Card className="bg-fantasy-dark/90 border-fantasy-gold/30 text-fantasy-stone">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Eye size={16} className="text-fantasy-gold" />
                  Linha de Visão
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="los-enabled" className="text-xs">
                    Visão Ativada
                  </Label>
                  <Switch
                    id="los-enabled"
                    checked={lineOfSightEnabled}
                    onCheckedChange={setLineOfSightEnabled}
                    className="data-[state=checked]:bg-fantasy-gold"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="view-distance" className="text-xs">
                    Distância de Visão: {viewDistance}px
                  </Label>
                  <Slider
                    id="view-distance"
                    min={100}
                    max={1000}
                    step={50}
                    value={[viewDistance]}
                    onValueChange={(value) => setViewDistance(value[0])}
                    className="py-1"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="angle-step" className="text-xs">
                    Precisão: {angleStep}° (menor = melhor)
                  </Label>
                  <Slider
                    id="angle-step"
                    min={0.5}
                    max={5}
                    step={0.5}
                    value={[angleStep]}
                    onValueChange={(value) => setAngleStep(value[0])}
                    className="py-1"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="light-intensity" className="text-xs">
                    Intensidade: {Math.round(lightIntensity * 100)}%
                  </Label>
                  <Slider
                    id="light-intensity"
                    min={0.1}
                    max={1}
                    step={0.05}
                    value={[lightIntensity]}
                    onValueChange={(value) => setLightIntensity(value[0])}
                    className="py-1"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="light-color" className="text-xs">
                    Cor da Luz
                  </Label>
                  <input
                    id="light-color"
                    type="color"
                    value={lightColor.replace(/[^#\w]/g, '').replace('rgba', '#')}
                    onChange={(e) => {
                      const hex = e.target.value;
                      setLightColor(`rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${lightIntensity})`);
                    }}
                    className="w-8 h-8 rounded border-none bg-transparent"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="memoria" className="mt-1">
            <RevealedAreaMemorySystem
              mapId={mapId}
              userId={userId}
              gameId={gameId}
              isGameMaster={isGameMaster}
              currentVisibleAreas={visibleAreas}
              onMemoryUpdate={(areas) => {
                // Atualização de áreas de memória é tratada pelo hook useLineOfSightSync
              }}
            />
          </TabsContent>
          
          <TabsContent value="sync" className="mt-1">
            <Card className="bg-fantasy-dark/90 border-fantasy-gold/30 text-fantasy-stone">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Users size={16} className="text-fantasy-gold" />
                  Sincronização
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-3 pb-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="sync-enabled" className="text-xs">
                    Sincronização Ativada
                  </Label>
                  <Switch
                    id="sync-enabled"
                    checked={syncEnabled}
                    onCheckedChange={setSyncEnabled}
                    className="data-[state=checked]:bg-fantasy-gold"
                  />
                </div>
                
                {error && (
                  <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded">
                    Erro: {error}
                  </div>
                )}
                
                <div className="text-xs">
                  {isLoading ? (
                    <span className="text-fantasy-gold">Sincronizando...</span>
                  ) : (
                    <span className="text-green-400">
                      {syncEnabled ? 'Conectado' : 'Modo local ativado'}
                    </span>
                  )}
                </div>
                
                <div className="text-xs">
                  Áreas visíveis: {visibleAreas.length}
                  <br />
                  Áreas de memória: {memoryAreas.length}
                </div>
              </CardContent>
              
              <CardFooter className="flex justify-between pt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => syncVisibleAreas()}
                  disabled={isLoading || !syncEnabled}
                  className="text-xs h-8 border-fantasy-gold/30 hover:bg-fantasy-gold/20 hover:text-fantasy-stone"
                >
                  <RefreshCw size={14} className="mr-1" />
                  Sincronizar
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default IntegratedLineOfSightSystem;