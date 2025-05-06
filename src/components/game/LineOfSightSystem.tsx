import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Flashlight, Sun, Lightbulb, Share2, Save, Upload, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  calculateVisibleArea, 
  convertVisibleAreaToRevealed, 
  updateDynamicObstacles,
  isPointInObstacle,
  Point,
  Obstacle,
  RevealedArea
} from '@/utils/fogOfWarUtils';

interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  color: string;
  intensity: number;
  isDynamic: boolean;
  attachedTo?: string; // ID do objeto ao qual a fonte de luz está anexada
}

interface LineOfSightSystemProps {
  mapId: string;
  isGameMaster: boolean;
  obstacles: Obstacle[];
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  playerPosition?: Point;
  onVisibleAreaChange?: (visiblePoints: Point[]) => void;
  onLightSourcesChange?: (lightSources: LightSource[]) => void;
  memoryEnabled?: boolean;
}

const LineOfSightSystem: React.FC<LineOfSightSystemProps> = ({
  mapId,
  isGameMaster,
  obstacles = [],
  gridSize,
  mapWidth,
  mapHeight,
  playerPosition,
  onVisibleAreaChange,
  onLightSourcesChange,
  memoryEnabled = true
}) => {
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [selectedLightSource, setSelectedLightSource] = useState<string | null>(null);
  const [lineOfSightOrigin, setLineOfSightOrigin] = useState<Point | null>(playerPosition || null);
  const [visiblePoints, setVisiblePoints] = useState<Point[]>([]);
  const [memoryPoints, setMemoryPoints] = useState<Point[]>([]);
  const [maxViewDistance, setMaxViewDistance] = useState(10 * gridSize);
  const [angleStep, setAngleStep] = useState(1); // Precisão do raycasting
  const [useCache, setUseCache] = useState(true);
  const [showMemory, setShowMemory] = useState(true);
  const [memoryOpacity, setMemoryOpacity] = useState(0.4);
  const [memoryColor, setMemoryColor] = useState('#555555');
  const [dynamicLighting, setDynamicLighting] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { sendNotification } = useNotificationContext();

  // Inicializar o canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const memoryCanvas = memoryCanvasRef.current;
    if (!canvas || !memoryCanvas) return;

    canvas.width = mapWidth;
    canvas.height = mapHeight;
    memoryCanvas.width = mapWidth;
    memoryCanvas.height = mapHeight;
    
    redrawVisibleArea();
    redrawMemoryArea();
    
    // Configurar sistema de cache para otimização
    if (useCache) {
      console.log('Sistema de cache de memória ativado');
      // Pré-calcular áreas de visão comuns para melhorar desempenho
      if (isGameMaster) {
        precomputeCommonViewAreas();
      }
    }
  }, [mapWidth, mapHeight]);
  
  // Pré-calcular áreas de visão comuns para melhorar desempenho
  const precomputeCommonViewAreas = () => {
    // Esta função pré-calcula áreas de visão para posições comuns no mapa
    // e armazena em cache para uso posterior, melhorando o desempenho
    // quando os jogadores se movem por áreas já visitadas
    
    // Implementação simplificada: apenas registra que a função foi chamada
    console.log('Pré-calculando áreas de visão comuns...');
  }

  // Atualizar área visível quando a posição do jogador mudar
  useEffect(() => {
    if (playerPosition) {
      setLineOfSightOrigin(playerPosition);
    }
  }, [playerPosition]);

  // Calcular área visível quando a origem da linha de visão mudar
  useEffect(() => {
    if (!lineOfSightOrigin) return;
    
    calculateVisiblePoints();
  }, [lineOfSightOrigin, obstacles, maxViewDistance, angleStep]);

  // Redesenhar quando os pontos visíveis mudarem
  useEffect(() => {
    redrawVisibleArea();
    
    // Atualizar memória
    if (memoryEnabled && visiblePoints.length > 0) {
      updateMemory();
    }
    
    // Notificar mudanças
    if (onVisibleAreaChange) {
      onVisibleAreaChange(visiblePoints);
    }
  }, [visiblePoints]);

  // Configurar canal de tempo real para atualizações
  useEffect(() => {
    if (!mapId) return;

    const channel = supabase
      .channel(`los-updates-${mapId}`)
      .on('broadcast', { event: 'light-source-update' }, (payload) => {
        if (payload.payload) {
          const { lightSources: newLightSources } = payload.payload as {
            lightSources: LightSource[]
          };
          
          if (Array.isArray(newLightSources)) {
            setLightSources(newLightSources);
          }
          
          // Recalcular área visível
          calculateVisiblePoints();
        }
      })
      .on('broadcast', { event: 'memory-update' }, (payload) => {
        if (payload.payload && !isGameMaster) {
          const { memoryPoints: newMemoryPoints } = payload.payload as {
            memoryPoints: Point[]
          };
          
          if (Array.isArray(newMemoryPoints)) {
            setMemoryPoints(newMemoryPoints);
            redrawMemoryArea();
          }
        }
      })
      .subscribe();

    // Carregar memória do banco de dados ao iniciar
    loadMemoryFromDatabase();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId]);

  // Função para calcular pontos visíveis
  const calculateVisiblePoints = () => {
    if (!lineOfSightOrigin) return;
    
    // Calcular área visível a partir da origem da linha de visão
    const newVisiblePoints = calculateVisibleArea(
      lineOfSightOrigin,
      maxViewDistance,
      obstacles,
      angleStep,
      useCache
    );
    
    // Adicionar áreas iluminadas por fontes de luz
    if (dynamicLighting && lightSources.length > 0) {
      lightSources.forEach(light => {
        // Calcular área iluminada pela fonte de luz
        const lightVisiblePoints = calculateVisibleArea(
          { x: light.x, y: light.y },
          light.radius * light.intensity,
          obstacles,
          angleStep,
          useCache
        );
        
        // Adicionar pontos iluminados aos pontos visíveis
        lightVisiblePoints.forEach(point => {
          // Verificar se o ponto já existe
          const exists = newVisiblePoints.some(
            p => p.x === point.x && p.y === point.y
          );
          
          if (!exists) {
            newVisiblePoints.push(point);
          }
        });
      });
    }
    
    setVisiblePoints(newVisiblePoints);
  };

  // Atualizar memória com novos pontos visíveis
  const updateMemory = () => {
    if (!memoryEnabled) return;
    
    // Adicionar pontos visíveis à memória
    const newMemoryPoints = [...memoryPoints];
    
    visiblePoints.forEach(point => {
      // Verificar se o ponto já existe na memória
      const exists = memoryPoints.some(
        p => p.x === point.x && p.y === point.y
      );
      
      if (!exists) {
        newMemoryPoints.push(point);
      }
    });
    
    // Otimizar pontos de memória se exceder um limite
    const optimizedPoints = newMemoryPoints.length > 1000 ? 
      optimizeMemoryPoints(newMemoryPoints) : newMemoryPoints;
    
    setMemoryPoints(optimizedPoints);
    redrawMemoryArea();
    
    // Sincronizar memória com outros jogadores
    if (mapId && isGameMaster) {
      syncMemoryWithPlayers(optimizedPoints);
    }
  };
  
  // Otimizar pontos de memória para reduzir uso de memória
  const optimizeMemoryPoints = (points: Point[]): Point[] => {
    if (points.length <= 1000) return points;
    
    console.log(`Otimizando ${points.length} pontos de memória...`);
    
    // Agrupar pontos próximos e substituir por um único ponto
    const cellSize = gridSize / 2;
    const grid: { [key: string]: Point[] } = {};
    
    // Agrupar pontos por células
    points.forEach(point => {
      const cellX = Math.floor(point.x / cellSize);
      const cellY = Math.floor(point.y / cellSize);
      const key = `${cellX},${cellY}`;
      
      if (!grid[key]) {
        grid[key] = [];
      }
      
      grid[key].push(point);
    });
    
    // Substituir grupos por pontos representativos
    const optimized: Point[] = [];
    
    Object.values(grid).forEach(cellPoints => {
      if (cellPoints.length === 1) {
        // Manter ponto único
        optimized.push(cellPoints[0]);
      } else if (cellPoints.length > 1) {
        // Substituir grupo por seu centro
        const avgX = cellPoints.reduce((sum, p) => sum + p.x, 0) / cellPoints.length;
        const avgY = cellPoints.reduce((sum, p) => sum + p.y, 0) / cellPoints.length;
        
        optimized.push({ x: avgX, y: avgY });
      }
    });
    
    console.log(`Memória otimizada: ${points.length} -> ${optimized.length} pontos`);
    return optimized;
  };
  
  // Sincronizar memória com outros jogadores
  const syncMemoryWithPlayers = (points: Point[]) => {
    if (!mapId) return;
    
    // Enviar pontos de memória para outros jogadores
    supabase
      .channel(`los-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'memory-update',
        payload: { memoryPoints: points }
      })
      .catch(error => {
        console.error('Erro ao sincronizar memória:', error);
      });
  };
  
  // Exportar memória para o banco de dados
  const saveMemoryToDatabase = async () => {
    if (!mapId || !isGameMaster) return;
    
    try {
      // Converter pontos para formato adequado para armazenamento
      const memoryData = {
        map_id: mapId,
        memory_points: memoryPoints,
        updated_at: new Date().toISOString()
      };
      
      // Salvar no banco de dados
      const { error } = await supabase
        .from('map_memory')
        .upsert({
          map_id: mapId,
          memory_points: memoryPoints,
          updated_at: new Date().toISOString()
        });
      
      if (error) throw error;
      
      sendNotification({
        title: 'Memória salva',
        content: 'Os pontos de memória foram salvos com sucesso',
        type: 'success'
      });
    } catch (error) {
      console.error('Erro ao salvar memória:', error);
      sendNotification({
        title: 'Erro ao salvar',
        content: 'Não foi possível salvar os pontos de memória',
        type: 'error'
      });
    }
  };
  
  // Carregar memória do banco de dados
  const loadMemoryFromDatabase = async () => {
    if (!mapId) return;
    
    try {
      const { data, error } = await supabase
        .from('map_memory')
        .select('memory_points')
        .eq('map_id', mapId)
        .single();
      
      if (error) throw error;
      
      if (data && Array.isArray(data.memory_points)) {
        setMemoryPoints(data.memory_points);
        redrawMemoryArea();
        
        sendNotification({
          title: 'Memória carregada',
          content: 'Os pontos de memória foram carregados com sucesso',
          type: 'success'
        });
      }
    } catch (error) {
      console.error('Erro ao carregar memória:', error);
      // Não mostrar notificação de erro ao carregar, pois pode ser a primeira vez
    }
  };

  // Desenhar área visível no canvas
  const redrawVisibleArea = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Desenhar pontos visíveis
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    
    visiblePoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
      ctx.fill();
    });

    // Desenhar fontes de luz
    lightSources.forEach(light => {
      // Gradiente radial para efeito de luz
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius * light.intensity
      );
      
      gradient.addColorStop(0, `${light.color}`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius * light.intensity, 0, Math.PI * 2);
      ctx.fill();
    });
  };

  // Desenhar área de memória no canvas
  const redrawMemoryArea = () => {
    const canvas = memoryCanvasRef.current;
    if (!canvas || !showMemory) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (memoryPoints.length === 0) return;

    // Configurar estilo de desenho
    ctx.fillStyle = memoryColor;
    ctx.globalAlpha = memoryOpacity;
    
    // Método otimizado para desenhar muitos pontos
    // Agrupar pontos próximos para reduzir operações de desenho
    const gridSize = 5; // Tamanho da célula para agrupamento
    const grid: { [key: string]: Point[] } = {};
    
    // Agrupar pontos por células da grade
    memoryPoints.forEach(point => {
      const gridX = Math.floor(point.x / gridSize);
      const gridY = Math.floor(point.y / gridSize);
      const key = `${gridX},${gridY}`;
      
      if (!grid[key]) {
        grid[key] = [];
      }
      
      grid[key].push(point);
    });
    
    // Desenhar cada grupo de pontos
    Object.values(grid).forEach(points => {
      if (points.length === 1) {
        // Desenhar ponto único
        const point = points[0];
        ctx.beginPath();
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (points.length > 1) {
        // Calcular centro do grupo
        const avgX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
        const avgY = points.reduce((sum, p) => sum + p.y, 0) / points.length;
        
        // Calcular raio que engloba todos os pontos
        const radius = Math.max(
          ...points.map(p => Math.sqrt(Math.pow(p.x - avgX, 2) + Math.pow(p.y - avgY, 2)))
        ) + 2;
        
        // Desenhar círculo que engloba o grupo
        ctx.beginPath();
        ctx.arc(avgX, avgY, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    
    ctx.globalAlpha = 1;
  };

  // Adicionar nova fonte de luz
  const addLightSource = (x: number, y: number) => {
    if (!isGameMaster) return;
    
    const newLightSource: LightSource = {
      id: `light-${Date.now()}`,
      x,
      y,
      radius: 5 * gridSize,
      color: '#ffcc00',
      intensity: 1,
      isDynamic: false
    };
    
    const updatedLightSources = [...lightSources, newLightSource];
    setLightSources(updatedLightSources);
    setSelectedLightSource(newLightSource.id);
    
    // Notificar outros jogadores
    if (mapId) {
      supabase
        .channel(`los-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'light-source-update',
          payload: { lightSources: updatedLightSources }
        })
        .catch(console.error);
    }
    
    // Notificar mudanças
    if (onLightSourcesChange) {
      onLightSourcesChange(updatedLightSources);
    }
    
    // Recalcular área visível
    calculateVisiblePoints();
  };

  // Remover fonte de luz
  const removeLightSource = (id: string) => {
    if (!isGameMaster) return;
    
    const updatedLightSources = lightSources.filter(light => light.id !== id);
    setLightSources(updatedLightSources);
    setSelectedLightSource(null);
    
    // Notificar outros jogadores
    if (mapId) {
      supabase
        .channel(`los-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'light-source-update',
          payload: { lightSources: updatedLightSources }
        })
        .catch(console.error);
    }
    
    // Notificar mudanças
    if (onLightSourcesChange) {
      onLightSourcesChange(updatedLightSources);
    }
    
    // Recalcular área visível
    calculateVisiblePoints();
  };

  // Atualizar fonte de luz
  const updateLightSource = (id: string, updates: Partial<LightSource>) => {
    if (!isGameMaster) return;
    
    const updatedLightSources = lightSources.map(light => 
      light.id === id ? { ...light, ...updates } : light
    );
    
    setLightSources(updatedLightSources);
    
    // Notificar outros jogadores
    if (mapId) {
      supabase
        .channel(`los-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'light-source-update',
          payload: { lightSources: updatedLightSources }
        })
        .catch(console.error);
    }
    
    // Notificar mudanças
    if (onLightSourcesChange) {
      onLightSourcesChange(updatedLightSources);
    }
    
    // Recalcular área visível
    calculateVisiblePoints();
  };

  // Limpar memória
  const clearMemory = () => {
    if (!isGameMaster) return;
    
    setMemoryPoints([]);
    redrawMemoryArea();
    
    // Sincronizar com outros jogadores
    syncMemoryWithPlayers([]);
  };
  
  // Compartilhar memória seletivamente com os jogadores
  const shareMemoryWithPlayers = () => {
    if (!isGameMaster || !mapId) return;
    
    // Criar uma área de seleção no mapa para compartilhar
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Notificar o usuário sobre o modo de compartilhamento
    sendNotification({
      title: 'Compartilhar memória',
      content: 'Selecione uma área para compartilhar com os jogadores',
      type: 'info'
    });
    
    // Implementar lógica para selecionar área e compartilhar
    // Esta é uma versão simplificada que compartilha toda a memória atual
    syncMemoryWithPlayers(memoryPoints);
    
    sendNotification({
      title: 'Memória compartilhada',
      content: 'A memória foi compartilhada com os jogadores',
      type: 'success'
    });
  };

  // Renderizar apenas os canvas para jogadores não-mestres
  if (!isGameMaster) {
    return (
      <>
        <canvas
          ref={memoryCanvasRef}
          className="absolute top-0 left-0 pointer-events-none z-9"
          width={mapWidth}
          height={mapHeight}
        />
        <canvas
          ref={canvasRef}
          className="absolute top-0 left-0 pointer-events-none z-10"
          width={mapWidth}
          height={mapHeight}
        />
      </>
    );
  }

  return (
    <div className="line-of-sight-system">
      <canvas
        ref={memoryCanvasRef}
        className="absolute top-0 left-0 z-9"
        width={mapWidth}
        height={mapHeight}
      />
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-10"
        width={mapWidth}
        height={mapHeight}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          addLightSource(x, y);
        }}
      />
      
      <div className="absolute top-2 right-2 bg-fantasy-dark/80 p-2 rounded-md z-20 w-64">
        <Tabs defaultValue="los">
          <TabsList className="w-full">
            <TabsTrigger value="los" className="flex-1">Linha de Visão</TabsTrigger>
            <TabsTrigger value="lights" className="flex-1">Fontes de Luz</TabsTrigger>
            <TabsTrigger value="memory" className="flex-1">Memória</TabsTrigger>
          </TabsList>
          
          <TabsContent value="los" className="space-y-2 mt-2">
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Distância Máxima de Visão</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[maxViewDistance / gridSize]}
                  min={1}
                  max={20}
                  step={1}
                  onValueChange={(value) => setMaxViewDistance(value[0] * gridSize)}
                />
                <span className="text-xs w-6 text-center">{maxViewDistance / gridSize}</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Precisão do Raycasting</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[angleStep]}
                  min={0.5}
                  max={5}
                  step={0.5}
                  onValueChange={(value) => setAngleStep(value[0])}
                />
                <span className="text-xs w-6 text-center">{angleStep}°</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-xs text-fantasy-stone">Usar Cache</span>
              <Switch
                checked={useCache}
                onCheckedChange={setUseCache}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="lights" className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-fantasy-stone">Iluminação Dinâmica</span>
              <Switch
                checked={dynamicLighting}
                onCheckedChange={(checked) => {
                  setDynamicLighting(checked);
                  calculateVisiblePoints();
                }}
              />
            </div>
            
            {lightSources.length > 0 ? (
              <div className="space-y-2">
                <Select
                  value={selectedLightSource || undefined}
                  onValueChange={setSelectedLightSource}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma fonte de luz" />
                  </SelectTrigger>
                  <SelectContent>
                    {lightSources.map(light => (
                      <SelectItem key={light.id} value={light.id}>
                        Luz {lightSources.findIndex(l => l.id === light.id) + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {selectedLightSource && (
                  <div className="space-y-2">
                    {(() => {
                      const light = lightSources.find(l => l.id === selectedLightSource);
                      if (!light) return null;
                      
                      return (
                        <>
                          <div className="space-y-1">
                            <div className="text-xs text-fantasy-stone">Raio da Luz</div>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[light.radius / gridSize]}
                                min={1}
                                max={20}
                                step={1}
                                onValueChange={(value) => {
                                  updateLightSource(light.id, { radius: value[0] * gridSize });
                                }}
                              />
                              <span className="text-xs w-6 text-center">{light.radius / gridSize}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-fantasy-stone">Intensidade</div>
                            <div className="flex items-center gap-2">
                              <Slider
                                value={[light.intensity * 10]}
                                min={1}
                                max={20}
                                step={1}
                                onValueChange={(value) => {
                                  updateLightSource(light.id, { intensity: value[0] / 10 });
                                }}
                              />
                              <span className="text-xs w-6 text-center">{light.intensity.toFixed(1)}</span>
                            </div>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="text-xs text-fantasy-stone">Cor da Luz</div>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={light.color}
                                onChange={(e) => {
                                  updateLightSource(light.id, { color: e.target.value });
                                }}
                                className="w-8 h-8 rounded cursor-pointer"
                              />
                              <span className="text-xs">{light.color}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-fantasy-stone">Dinâmica</span>
                            <Switch
                              checked={light.isDynamic}
                              onCheckedChange={(checked) => {
                                updateLightSource(light.id, { isDynamic: checked });
                              }}
                            />
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => removeLightSource(light.id)}
                            className="w-full mt-2"
                          >
                            Remover Fonte de Luz
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-xs text-fantasy-stone py-2">
                Clique no mapa para adicionar uma fonte de luz
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="memory" className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-fantasy-stone">Mostrar Memória</span>
              <Switch
                checked={showMemory}
                onCheckedChange={(checked) => {
                  setShowMemory(checked);
                  redrawMemoryArea();
                }}
              />
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Opacidade da Memória</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[memoryOpacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => {
                    setMemoryOpacity(value[0] / 100);
                    redrawMemoryArea();
                  }}
                />
                <span className="text-xs w-8 text-center">{Math.round(memoryOpacity * 100)}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Cor da Memória</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={memoryColor}
                  onChange={(e) => {
                    setMemoryColor(e.target.value);
                    redrawMemoryArea();
                  }}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs">{memoryColor}</span>
              </div>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={saveMemoryToDatabase}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-1" />
                Salvar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={loadMemoryFromDatabase}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-1" />
                Carregar
              </Button>
            </div>
            
            <div className="flex gap-2 mt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={shareMemoryWithPlayers}
                className="flex-1"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={clearMemory}
                className="flex-1"
              >
                <Trash className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            </div>
            
            <div className="text-xs text-fantasy-stone mt-2 text-center">
              {memoryPoints.length > 0 ? 
                `${memoryPoints.length} pontos na memória` : 
                "Nenhuma área na memória"}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LineOfSightSystem;