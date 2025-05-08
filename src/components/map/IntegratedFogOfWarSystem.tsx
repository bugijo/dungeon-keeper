/**
 * Sistema Integrado de Fog of War
 * Combina linha de visão baseada em obstáculos, iluminação dinâmica e memória de áreas reveladas
 * Implementa os 25% restantes do sistema de Fog of War conforme plano de execução
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Eye, EyeOff, Zap, Brain, Save, RefreshCw, Users, Sun, Moon } from 'lucide-react';
import { toast } from 'sonner';

// Importar componentes e utilitários existentes
import RevealedAreaMemorySystem from './RevealedAreaMemorySystem';
import { 
  Point, 
  RevealedArea, 
  Obstacle, 
  LightSource,
  calculateVisibleArea, 
  convertVisibleAreaToRevealed,
  lineIntersectsRectangle,
  isPointInObstacle,
  updateDynamicObstacles
} from '@/utils/fogOfWarUtils';
import { calculateCombinedLighting } from '@/utils/lightingUtils';

interface IntegratedFogOfWarSystemProps {
  mapId: string;
  userId: string;
  gameId?: string;
  isGameMaster?: boolean;
  playerPosition?: Point;
  obstacles: Obstacle[];
  lightSources: LightSource[];
  maxViewDistance?: number;
  gridSize?: number;
  width: number;
  height: number;
  onVisibleAreaChange?: (areas: RevealedArea[]) => void;
  onMemoryUpdate?: (memoryAreas: any[]) => void;
}

const IntegratedFogOfWarSystem: React.FC<IntegratedFogOfWarSystemProps> = ({
  mapId,
  userId,
  gameId,
  isGameMaster = false,
  playerPosition,
  obstacles = [],
  lightSources = [],
  maxViewDistance = 300,
  gridSize = 50,
  width,
  height,
  onVisibleAreaChange,
  onMemoryUpdate
}) => {
  // Estados para configuração do sistema
  const [activeTab, setActiveTab] = useState<string>('visao');
  const [lineOfSightEnabled, setLineOfSightEnabled] = useState(true);
  const [dynamicLightingEnabled, setDynamicLightingEnabled] = useState(true);
  const [memorySystemEnabled, setMemorySystemEnabled] = useState(true);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [viewDistance, setViewDistance] = useState(maxViewDistance);
  const [angleStep, setAngleStep] = useState(2); // Precisão do raycasting
  const [lightIntensity, setLightIntensity] = useState(0.8);
  const [lightColor, setLightColor] = useState('rgba(255, 255, 200, 0.8)');
  const [ambientLight, setAmbientLight] = useState(0.2); // Luz ambiente (0-1)
  const [timeOfDay, setTimeOfDay] = useState<'day' | 'night'>('day');
  const [currentPosition, setCurrentPosition] = useState<Point | undefined>(playerPosition);
  const [memoryFadeRate, setMemoryFadeRate] = useState(0.05);
  const [memoryOpacity, setMemoryOpacity] = useState(0.3);
  const [memoryColor, setMemoryColor] = useState('#6495ED');
  
  // Estados para armazenar áreas calculadas
  const [visibleAreas, setVisibleAreas] = useState<RevealedArea[]>([]);
  const [memoryAreas, setMemoryAreas] = useState<any[]>([]);
  const [combinedAreas, setCombinedAreas] = useState<RevealedArea[]>([]);
  const [dynamicObstacles, setDynamicObstacles] = useState<Obstacle[]>([]);
  const [dynamicLights, setDynamicLights] = useState<LightSource[]>([]);
  
  // Referências para os sistemas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Cache para otimização
  const visibilityCache = useRef<Map<string, boolean>>(new Map());
  const lastUpdateTime = useRef<number>(Date.now());
  
  // Efeito para sincronização em tempo real com Supabase
  useEffect(() => {
    if (!syncEnabled || !mapId) return;
    
    // Canais para sincronização em tempo real
    const visibilityChannel = supabase
      .channel(`visibility-${mapId}`)
      .on('broadcast', { event: 'visibility_update' }, payload => {
        if (payload.sender !== userId) {
          // Atualizar áreas visíveis de outros jogadores
          const newAreas = payload.areas as RevealedArea[];
          if (Array.isArray(newAreas)) {
            updateVisibleAreasFromRemote(newAreas);
          }
        }
      })
      .subscribe();
      
    const lightsChannel = supabase
      .channel(`lights-${mapId}`)
      .on('broadcast', { event: 'lights_update' }, payload => {
        if (payload.sender !== userId) {
          // Atualizar fontes de luz de outros jogadores
          const newLights = payload.lights as LightSource[];
          if (Array.isArray(newLights)) {
            updateLightSourcesFromRemote(newLights);
          }
        }
      })
      .subscribe();
      
    const obstaclesChannel = supabase
      .channel(`obstacles-${mapId}`)
      .on('broadcast', { event: 'obstacles_update' }, payload => {
        if (payload.sender !== userId) {
          // Atualizar obstáculos de outros jogadores
          const newObstacles = payload.obstacles as Obstacle[];
          if (Array.isArray(newObstacles)) {
            updateObstaclesFromRemote(newObstacles);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(visibilityChannel);
      supabase.removeChannel(lightsChannel);
      supabase.removeChannel(obstaclesChannel);
    };
  }, [mapId, userId, syncEnabled]);
  
  // Efeito para atualização de obstáculos dinâmicos
  useEffect(() => {
    if (!dynamicLightingEnabled) return;
    
    let lastFrameTime = performance.now();
    
    const updateFrame = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastFrameTime;
      lastFrameTime = currentTime;
      
      // Atualizar obstáculos dinâmicos
      const updatedObstacles = updateDynamicObstacles(obstacles, deltaTime);
      setDynamicObstacles(updatedObstacles);
      
      // Atualizar fontes de luz dinâmicas
      const updatedLights = updateDynamicLightSources(lightSources, deltaTime, updatedObstacles);
      setDynamicLights(updatedLights);
      
      // Recalcular visibilidade se necessário
      if (Date.now() - lastUpdateTime.current > 100) { // Limitar atualizações a cada 100ms
        calculateCombinedVisibility(updatedObstacles, updatedLights);
        lastUpdateTime.current = Date.now();
      }
      
      animationFrameRef.current = requestAnimationFrame(updateFrame);
    };
    
    animationFrameRef.current = requestAnimationFrame(updateFrame);
    
    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, [dynamicLightingEnabled, obstacles, lightSources]);
  
  // Atualizar posição do jogador
  const handlePositionUpdate = useCallback((position: Point) => {
    setCurrentPosition(position);
    
    // Recalcular visibilidade com nova posição
    if (lineOfSightEnabled && position) {
      calculateVisibilityFromPosition(position);
    }
    
    // Atualizar visualização nos canvas
    renderVisibleAreas();
    renderMemoryAreas();
    renderLightingEffects();
  }, [lineOfSightEnabled, calculateVisibilityFromPosition, renderVisibleAreas, renderMemoryAreas, renderLightingEffects]);
  
  // Efeito para desvanecer gradualmente áreas de memória
  useEffect(() => {
    if (!memorySystemEnabled || memoryFadeRate <= 0) return;
    
    const fadeInterval = setInterval(() => {
      setMemoryAreas(prevAreas => {
        // Reduzir intensidade de cada área de memória
        const updatedAreas = prevAreas.map(area => {
          const timeSinceLastSeen = new Date().getTime() - new Date(area.lastSeen).getTime();
          const hoursElapsed = timeSinceLastSeen / (1000 * 60 * 60);
          
          // Calcular nova intensidade baseada no tempo decorrido
          const newIntensity = Math.max(0, area.intensity - (memoryFadeRate * hoursElapsed));
          
          return {
            ...area,
            intensity: newIntensity
          };
        });
        
        // Filtrar áreas que ficaram completamente transparentes
        return updatedAreas.filter(area => area.intensity > 0.05);
      });
      
      // Atualizar visualização
      renderMemoryAreas();
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(fadeInterval);
  }, [memorySystemEnabled, memoryFadeRate, renderMemoryAreas]);
  
  // Efeito para atualizar visualização quando a posição do jogador mudar
  useEffect(() => {
    if (playerPosition && playerPosition !== currentPosition) {
      handlePositionUpdate(playerPosition);
    }
  }, [playerPosition, currentPosition, handlePositionUpdate]);
  
  // Função para atualizar fontes de luz dinâmicas
  const updateDynamicLightSources = (lights: LightSource[], deltaTime: number, currentObstacles: Obstacle[]): LightSource[] => {
    return lights.map(light => {
      if (!light.is_dynamic) return light;
      
      const updatedLight = { ...light };
      
      // Aplicar efeito de cintilação (flickering) se habilitado
      if (light.flickering) {
        const flickerAmount = Math.sin(Date.now() / 200) * (light.flickerIntensity || 0.1);
        updatedLight.intensity = (light.baseIntensity || light.intensity || 1) + flickerAmount;
      }
      
      // Aplicar movimento se configurado
      if (light.movement) {
        const { pattern, speed, radius } = light.movement;
        
        if (pattern === 'circular') {
          const angle = (Date.now() / 1000 * speed) % (2 * Math.PI);
          const centerX = light.centerX || light.position.x;
          const centerY = light.centerY || light.position.y;
          
          updatedLight.position = {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius
          };
        } else if (pattern === 'linear') {
          // Implementar movimento linear
          // ...
        }
      }
      
      return updatedLight;
    });
  };
  
  // Calcular áreas visíveis a partir da posição do jogador
  const calculateVisibilityFromPosition = useCallback((position: Point) => {
    if (!lineOfSightEnabled || !position) return;
    
    try {
      // Calcular pontos visíveis usando raycasting
      const visiblePoints = calculateVisibleArea(
        position,
        viewDistance,
        dynamicObstacles.length > 0 ? dynamicObstacles : obstacles,
        angleStep,
        true // useCache
      );
      
      // Converter pontos visíveis em uma área revelada
      const revealedArea = convertVisibleAreaToRevealed(
        visiblePoints,
        position,
        viewDistance
      );
      
      // Atualizar estado
      setVisibleAreas([revealedArea]);
      
      // Notificar componente pai
      if (onVisibleAreaChange) {
        onVisibleAreaChange([revealedArea]);
      }
      
      // Sincronizar com outros jogadores
      if (syncEnabled) {
        syncVisibleAreas([revealedArea]);
      }
      
      // Atualizar memória se habilitado
      if (memorySystemEnabled) {
        updateMemoryWithVisibleArea(revealedArea);
      }
    } catch (error) {
      console.error('Erro ao calcular visibilidade:', error);
      toast.error('Erro ao calcular área visível');
    }
  }, [lineOfSightEnabled, viewDistance, obstacles, dynamicObstacles, angleStep, onVisibleAreaChange, syncEnabled, memorySystemEnabled]);
  
  // Calcular visibilidade combinada (linha de visão + iluminação dinâmica)
  const calculateCombinedVisibility = useCallback((currentObstacles = obstacles, currentLights = lightSources) => {
    if (!currentPosition) return;
    
    // Áreas visíveis por linha de visão direta
    let areas: RevealedArea[] = [];
    
    if (lineOfSightEnabled) {
      const visiblePoints = calculateVisibleArea(
        currentPosition,
        viewDistance,
        currentObstacles,
        angleStep,
        true
      );
      
      const losArea = convertVisibleAreaToRevealed(
        visiblePoints,
        currentPosition,
        viewDistance
      );
      
      areas.push(losArea);
    }
    
    // Áreas iluminadas por fontes de luz
    if (dynamicLightingEnabled && currentLights.length > 0) {
      // Para cada fonte de luz, calcular área iluminada
      currentLights.forEach(light => {
        // Verificar se a luz está visível para o jogador
        const isLightVisible = lineOfSightEnabled ? 
          isPointVisibleFromPosition(light.position, currentPosition, currentObstacles) : 
          true;
        
        if (isLightVisible) {
          // Calcular pontos iluminados pela fonte de luz
          const lightPoints = calculateVisibleArea(
            light.position,
            light.radius,
            currentObstacles,
            angleStep,
            true
          );
          
          // Converter em área revelada
          const lightArea = convertVisibleAreaToRevealed(
            lightPoints,
            light.position,
            light.radius
          );
          
          // Adicionar propriedades específicas de iluminação
          lightArea.color = light.color || lightColor;
          lightArea.opacity = light.intensity || lightIntensity;
          
          areas.push(lightArea);
        }
      });
    }
    
    // Atualizar estado
    setVisibleAreas(areas);
    
    // Combinar com áreas de memória
    const combined = [...areas];
    if (memorySystemEnabled && memoryAreas.length > 0) {
      // Adicionar áreas de memória com opacidade reduzida
      memoryAreas.forEach(memArea => {
        const memoryRevealedArea: RevealedArea = {
          x: memArea.x,
          y: memArea.y,
          radius: memArea.radius,
          shape: 'circle',
          color: memoryColor,
          opacity: memoryOpacity
        };
        
        combined.push(memoryRevealedArea);
      });
    }
    
    setCombinedAreas(combined);
    
    // Notificar componente pai
    if (onVisibleAreaChange) {
      onVisibleAreaChange(combined);
    }
    
    // Sincronizar com outros jogadores
    if (syncEnabled) {
      syncVisibleAreas(areas);
    }
  }, [lineOfSightEnabled, dynamicLightingEnabled, memorySystemEnabled, currentPosition, viewDistance, obstacles, lightSources, angleStep, memoryAreas, memoryColor, memoryOpacity, onVisibleAreaChange, syncEnabled]);
  
  // Verificar se um ponto é visível a partir de uma posição
  const isPointVisibleFromPosition = (point: Point, fromPosition: Point, currentObstacles: Obstacle[]): boolean => {
    // Verificar cache primeiro
    const cacheKey = `${fromPosition.x},${fromPosition.y}-${point.x},${point.y}`;
    if (visibilityCache.current.has(cacheKey)) {
      return visibilityCache.current.get(cacheKey) || false;
    }
    
    // Verificar se há obstáculos bloqueando a visão
    const isVisible = !currentObstacles.some(obstacle => {
      if (!obstacle.blocks_vision) return false;
      
      return lineIntersectsRectangle(
        fromPosition.x, fromPosition.y,
        point.x, point.y,
        obstacle.x, obstacle.y,
        obstacle.width, obstacle.height
      );
    });
    
    // Armazenar no cache
    visibilityCache.current.set(cacheKey, isVisible);
    
    return isVisible;
  };
  
  // Atualizar memória com área visível
  const updateMemoryWithVisibleArea = (area: RevealedArea) => {
    // Implementação simplificada - na versão completa, isso seria persistido no banco de dados
    const newMemoryArea = {
      x: area.x,
      y: area.y,
      radius: area.radius,
      intensity: 1.0, // Intensidade inicial
      lastSeen: new Date(),
      seenBy: userId,
      mapId: mapId
    };
    
    // Verificar se já existe uma área de memória similar
    const existingIndex = memoryAreas.findIndex(mem => 
      Math.abs(mem.x - newMemoryArea.x) < 50 && 
      Math.abs(mem.y - newMemoryArea.y) < 50
    );
    
    if (existingIndex >= 0) {
      // Atualizar área existente
      const updatedMemory = [...memoryAreas];
      updatedMemory[existingIndex] = {
        ...updatedMemory[existingIndex],
        lastSeen: new Date(),
        intensity: 1.0 // Resetar intensidade ao ver novamente
      };
      
      setMemoryAreas(updatedMemory);
    } else {
      // Adicionar nova área
      setMemoryAreas(prev => [...prev, newMemoryArea]);
    }
    
    // Notificar componente pai
    if (onMemoryUpdate) {
      onMemoryUpdate([...memoryAreas, newMemoryArea]);
    }
  };
  
  // Sincronizar áreas visíveis com outros jogadores
  const syncVisibleAreas = async (areas: RevealedArea[]) => {
    if (!syncEnabled || !mapId) return;
    
    try {
      await supabase
        .channel(`visibility-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'visibility_update',
          payload: {
            areas,
            sender: userId
          }
        });
    } catch (error) {
      console.error('Erro ao sincronizar áreas visíveis:', error);
    }
  };
  
  // Atualizar áreas visíveis de outros jogadores
  const updateVisibleAreasFromRemote = (remoteAreas: RevealedArea[]) => {
    // Implementação simplificada - na versão completa, isso seria mesclado com áreas locais
    if (!isGameMaster) {
      // Jogadores só veem áreas que o mestre compartilhou
      setCombinedAreas(prev => {
        const localAreas = prev.filter(area => area.created_by === userId);
        return [...localAreas, ...remoteAreas];
      });
    }
  };
  
  // Atualizar fontes de luz de outros jogadores
  const updateLightSourcesFromRemote = (remoteLights: LightSource[]) => {
    setDynamicLights(prev => {
      const localLights = prev.filter(light => light.created_by === userId);
      return [...localLights, ...remoteLights];
    });
  };
  
  // Atualizar obstáculos de outros jogadores
  const updateObstaclesFromRemote = (remoteObstacles: Obstacle[]) => {
    setDynamicObstacles(prev => {
      const localObstacles = prev.filter(obs => obs.created_by === userId);
      return [...localObstacles, ...remoteObstacles];
    });
  };
  
  // Limpar memória
  const clearMemory = () => {
    setMemoryAreas([]);
    if (onMemoryUpdate) {
      onMemoryUpdate([]);
    }
    toast.success('Memória limpa com sucesso');
  };
  
  // Renderizar áreas visíveis no canvas
  const renderVisibleAreas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar áreas visíveis
    visibleAreas.forEach(area => {
      ctx.save();
      
      // Configurar estilo
      ctx.fillStyle = area.color || 'rgba(255, 255, 255, 0.7)';
      ctx.globalAlpha = area.opacity || 0.7;
      
      // Desenhar forma
      if (area.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (area.shape === 'polygon' && area.points) {
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
      
      ctx.restore();
    });
  }, [visibleAreas]);
  
  // Renderizar áreas de memória no canvas
  const renderMemoryAreas = useCallback(() => {
    const canvas = memoryCanvasRef.current;
    if (!canvas || !memorySystemEnabled) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar áreas de memória
    memoryAreas.forEach(area => {
      ctx.save();
      
      // Configurar estilo
      ctx.fillStyle = memoryColor;
      ctx.globalAlpha = memoryOpacity * (area.intensity || 1.0);
      
      // Desenhar círculo
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.restore();
    });
  }, [memoryAreas, memorySystemEnabled, memoryColor, memoryOpacity]);
  
  // Renderizar efeitos de iluminação no canvas
  const renderLightingEffects = useCallback(() => {
    const canvas = lightingCanvasRef.current;
    if (!canvas || !dynamicLightingEnabled) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Configurar luz ambiente baseada no período do dia
    const ambientLightLevel = timeOfDay === 'day' ? ambientLight : ambientLight * 0.5;
    
    // Aplicar luz ambiente
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - ambientLightLevel})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Aplicar fontes de luz
    if (dynamicLights.length > 0) {
      // Usar composição 'destination-out' para criar efeito de luz
      ctx.globalCompositeOperation = 'destination-out';
      
      dynamicLights.forEach(light => {
        const gradient = ctx.createRadialGradient(
          light.position.x, light.position.y, 0,
          light.position.x, light.position.y, light.radius
        );
        
        // Criar gradiente para efeito de luz
        gradient.addColorStop(0, `rgba(255, 255, 255, ${light.intensity || 1.0})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.position.x, light.position.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Restaurar modo de composição
      ctx.globalCompositeOperation = 'source-over';
    }
  }, [dynamicLightingEnabled, dynamicLights, timeOfDay, ambientLight]);
  
  // Efeito para atualizar visualização quando as áreas mudam
  useEffect(() => {
    renderVisibleAreas();
    renderMemoryAreas();
    renderLightingEffects();
  }, [visibleAreas, memoryAreas, dynamicLights, renderVisibleAreas, renderMemoryAreas, renderLightingEffects]);
  
  // Efeito para carregar configurações salvas
  useEffect(() => {
    const loadSavedSettings = async () => {
      if (!mapId || !userId) return;
      
      try {
        const { data, error } = await supabase
          .from('fog_of_war_settings')
          .select('settings')
          .eq('map_id', mapId)
          .eq('user_id', userId)
          .single();
          
        if (error) throw error;
        
        if (data?.settings) {
          const settings = data.settings;
          
          // Aplicar configurações salvas
          setLineOfSightEnabled(settings.lineOfSightEnabled ?? true);
          setDynamicLightingEnabled(settings.dynamicLightingEnabled ?? true);
          setMemorySystemEnabled(settings.memorySystemEnabled ?? true);
          setViewDistance(settings.viewDistance ?? maxViewDistance);
          setAngleStep(settings.angleStep ?? 2);
          setLightIntensity(settings.lightIntensity ?? 0.8);
          setLightColor(settings.lightColor ?? 'rgba(255, 255, 200, 0.8)');
          setAmbientLight(settings.ambientLight ?? 0.2);
          setTimeOfDay(settings.timeOfDay ?? 'day');
          setMemoryFadeRate(settings.memoryFadeRate ?? 0.05);
          setMemoryOpacity(settings.memoryOpacity ?? 0.3);
          setMemoryColor(settings.memoryColor ?? '#6495ED');
          
          toast.success('Configurações carregadas');
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    };
    
    loadSavedSettings();
  }, [mapId, userId, maxViewDistance]);
  
  // Renderizar o componente
  return (
    <Card className="w-full bg-card shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Sistema Integrado de Fog of War</span>
          {timeOfDay === 'day' ? (
            <Sun className="h-5 w-5 text-yellow-500" />
          ) : (
            <Moon className="h-5 w-5 text-blue-300" />
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="visao" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span>Linha de Visão</span>
            </TabsTrigger>
            <TabsTrigger value="iluminacao" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span>Iluminação</span>
            </TabsTrigger>
            <TabsTrigger value="memoria" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              <span>Memória</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="visao" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="los-enabled">Linha de Visão</Label>
              <Switch
                id="los-enabled"
                checked={lineOfSightEnabled}
                onCheckedChange={setLineOfSightEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="view-distance">Distância de Visão: {viewDistance}px</Label>
              <Slider
                id="view-distance"
                min={50}
                max={500}
                step={10}
                value={[viewDistance]}
                onValueChange={(values) => setViewDistance(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="angle-step">Precisão do Raycasting: {angleStep}°</Label>
              <Slider
                id="angle-step"
                min={1}
                max={10}
                step={1}
                value={[angleStep]}
                onValueChange={(values) => setAngleStep(values[0])}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="iluminacao" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="lighting-enabled">Iluminação Dinâmica</Label>
              <Switch
                id="lighting-enabled"
                checked={dynamicLightingEnabled}
                onCheckedChange={setDynamicLightingEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="ambient-light">Luz Ambiente: {Math.round(ambientLight * 100)}%</Label>
              <Slider
                id="ambient-light"
                min={0}
                max={1}
                step={0.05}
                value={[ambientLight]}
                onValueChange={(values) => setAmbientLight(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="time-of-day">Período do Dia</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant={timeOfDay === 'day' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeOfDay('day')}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  Dia
                </Button>
                <Button
                  variant={timeOfDay === 'night' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTimeOfDay('night')}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  Noite
                </Button>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="memoria" className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="memory-enabled">Sistema de Memória</Label>
              <Switch
                id="memory-enabled"
                checked={memorySystemEnabled}
                onCheckedChange={setMemorySystemEnabled}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memory-opacity">Opacidade da Memória: {Math.round(memoryOpacity * 100)}%</Label>
              <Slider
                id="memory-opacity"
                min={0.1}
                max={0.8}
                step={0.05}
                value={[memoryOpacity]}
                onValueChange={(values) => setMemoryOpacity(values[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="memory-fade">Taxa de Desvanecimento: {memoryFadeRate * 100}%</Label>
              <Slider
                id="memory-fade"
                min={0}
                max={0.2}
                step={0.01}
                value={[memoryFadeRate]}
                onValueChange={(values) => setMemoryFadeRate(values[0])}
              />
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={clearMemory}
              className="mt-2"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Limpar Memória
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex flex-col space-y-4">
        <div className="flex justify-between w-full">
          <div className="flex items-center space-x-2">
            <Label htmlFor="sync-enabled">Sincronização</Label>
            <Switch
              id="sync-enabled"
              checked={syncEnabled}
              onCheckedChange={setSyncEnabled}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => calculateCombinedVisibility()}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
            
            <Button
              variant="default"
              size="sm"
              onClick={async () => {
                try {
                  // Salvar configurações no banco de dados
                  if (mapId && userId) {
                    const settings = {
                      lineOfSightEnabled,
                      dynamicLightingEnabled,
                      memorySystemEnabled,
                      viewDistance,
                      angleStep,
                      lightIntensity,
                      lightColor,
                      ambientLight,
                      timeOfDay,
                      memoryFadeRate,
                      memoryOpacity,
                      memoryColor,
                      lastUpdated: new Date().toISOString(),
                      userId
                    };
                    
                    await supabase
                      .from('fog_of_war_settings')
                      .upsert({
                        map_id: mapId,
                        user_id: userId,
                        settings: settings,
                        updated_at: new Date().toISOString()
                      });
                      
                    toast.success('Configurações salvas com sucesso');
                  }
                } catch (error) {
                  console.error('Erro ao salvar configurações:', error);
                  toast.error('Erro ao salvar configurações');
                }
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>
        
        {isGameMaster && (
          <div className="flex justify-between w-full pt-2 border-t">
            <div className="flex items-center">
              <Users className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Controles do Mestre</span>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={async () => {
                  try {
                    // Compartilhar visibilidade atual com todos os jogadores
                    if (mapId && gameId) {
                      await supabase
                        .channel(`game-${gameId}`)
                        .send({
                          type: 'broadcast',
                          event: 'gm_reveal_all',
                          payload: {
                            areas: visibleAreas,
                            mapId: mapId
                          }
                        });
                        
                      toast.success('Áreas reveladas para todos os jogadores');
                    }
                  } catch (error) {
                    console.error('Erro ao compartilhar áreas:', error);
                    toast.error('Erro ao compartilhar áreas');
                  }
                }}
              >
                <Eye className="h-4 w-4 mr-2" />
                Revelar para Todos
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  // Renderizar áreas no canvas para visualização
                  renderVisibleAreas();
                  renderMemoryAreas();
                  renderLightingEffects();
                }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Atualizar Visualização
              </Button>
            </div>
          </div>
        )}
      </CardFooter>
      
      {/* Canvas para renderização das áreas visíveis e de memória */}
      <div className="relative mt-4 border rounded-md overflow-hidden">
        {/* Canvas principal para áreas visíveis */}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-10"
        />
        
        {/* Canvas para iluminação dinâmica */}
        <canvas
          ref={lightingCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-20"
        />
        
        {/* Canvas para áreas de memória */}
        <canvas
          ref={memoryCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-0"
        />
        
        {/* Overlay para controles de visualização */}
        <div className="absolute top-2 right-2 z-30 flex space-x-2">
          <Button
            variant="secondary"
            size="icon"
            title="Alternar Visibilidade"
            onClick={() => {
              const canvas = canvasRef.current;
              if (canvas) {
                const currentDisplay = canvas.style.opacity;
                canvas.style.opacity = currentDisplay === '0' ? '1' : '0';
              }
            }}
          >
            {canvasRef.current?.style.opacity === '0' ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default IntegratedFogOfWarSystem;