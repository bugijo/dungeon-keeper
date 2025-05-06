import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Eraser, Brush, Layers, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { snapToGrid } from '@/utils/fogOfWarUtils';

interface FogPoint {
  x: number;
  y: number;
  radius: number;
}

interface EnhancedFogOfWarProps {
  mapId: string;
  isGameMaster: boolean;
  initialFogPoints?: FogPoint[];
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  onFogChange?: (fogPoints: FogPoint[]) => void;
}

const EnhancedFogOfWar: React.FC<EnhancedFogOfWarProps> = ({
  mapId,
  isGameMaster,
  initialFogPoints = [],
  gridSize,
  mapWidth,
  mapHeight,
  onFogChange
}) => {
  const [fogPoints, setFogPoints] = useState<FogPoint[]>(initialFogPoints);
  const [showFog, setShowFog] = useState(true);
  const [brushSize, setBrushSize] = useState(2);
  const [brushMode, setBrushMode] = useState<'reveal' | 'hide'>('reveal');
  const [fogOpacity, setFogOpacity] = useState(0.7);
  const [fogColor, setFogColor] = useState('#1a1a1a');
  const [edgeBlur, setEdgeBlur] = useState(0); // 0-10 para controle de suavização
  const [transitionSpeed, setTransitionSpeed] = useState(300); // em ms
  const [snapToGridEnabled, setSnapToGridEnabled] = useState(true);
  const [selectedPreset, setSelectedPreset] = useState<string>('default');
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPoint, setLastPoint] = useState<{x: number, y: number} | null>(null);
  const [currentTransition, setCurrentTransition] = useState<{
    startTime: number;
    points: FogPoint[];
    targetPoints: FogPoint[];
  } | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { sendNotification } = useNotificationContext();

  // Inicializar o canvas e desenhar o fog inicial
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = mapWidth;
    canvas.height = mapHeight;
    redrawFog();
  }, [mapWidth, mapHeight]);

  // Redesenhar o fog quando os pontos mudarem
  useEffect(() => {
    redrawFog();
    if (onFogChange) {
      onFogChange(fogPoints);
    }
  }, [fogPoints, showFog, fogOpacity, fogColor]);

  // Configurar canal de tempo real para atualizações de fog
  useEffect(() => {
    if (!mapId) return;

    const channel = supabase
      .channel(`fog-updates-${mapId}`)
      .on('broadcast', { event: 'fog-update' }, (payload) => {
        if (payload.payload) {
          const { fogPoints: newFogPoints, settings } = payload.payload as {
            fogPoints: FogPoint[],
            settings?: {
              opacity?: number,
              color?: string,
              edgeBlur?: number,
              transitionSpeed?: number,
              snapToGrid?: boolean
            }
          };
          
          if (Array.isArray(newFogPoints)) {
            // Se tiver velocidade de transição, animar a mudança
            if (transitionSpeed > 0) {
              startTransition(fogPoints, newFogPoints);
            } else {
              setFogPoints(newFogPoints);
            }
          }
          
          // Atualizar configurações se fornecidas
          if (settings) {
            if (settings.opacity !== undefined) setFogOpacity(settings.opacity);
            if (settings.color !== undefined) setFogColor(settings.color);
            if (settings.edgeBlur !== undefined) setEdgeBlur(settings.edgeBlur);
            if (settings.transitionSpeed !== undefined) setTransitionSpeed(settings.transitionSpeed);
            if (settings.snapToGrid !== undefined) setSnapToGridEnabled(settings.snapToGrid);
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
  }, [mapId, isGameMaster, transitionSpeed]);

  const redrawFog = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar o canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (!showFog) return;
    
    // Aplicar configurações de suavização de bordas
    if (edgeBlur > 0) {
      ctx.filter = `blur(${edgeBlur}px)`;
    } else {
      ctx.filter = 'none';
    }

    // Desenhar o fog base (cobrindo todo o mapa)
    ctx.fillStyle = fogColor;
    ctx.globalAlpha = fogOpacity;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Configurar para modo de composição 'destination-out' para criar buracos no fog
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;

    // Desenhar áreas reveladas (buracos no fog)
    fogPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x * gridSize, point.y * gridSize, point.radius * gridSize, 0, Math.PI * 2);
      ctx.fill();
    });

    // Resetar o modo de composição e filtros
    ctx.globalCompositeOperation = 'source-over';
    ctx.filter = 'none';
  };

  // Gerenciar animações
  useEffect(() => {
    if (currentTransition) {
      const animate = (timestamp: number) => {
        if (!currentTransition) return;
        
        const elapsed = timestamp - currentTransition.startTime;
        const duration = transitionSpeed;
        
        if (elapsed >= duration) {
          // Transição completa
          setFogPoints(currentTransition.targetPoints);
          setCurrentTransition(null);
        } else {
          // Calcular pontos intermediários
          const progress = elapsed / duration;
          const interpolatedPoints = currentTransition.points.map((startPoint, index) => {
            const targetPoint = currentTransition.targetPoints[index] || startPoint;
            
            return {
              x: startPoint.x + (targetPoint.x - startPoint.x) * progress,
              y: startPoint.y + (targetPoint.y - startPoint.y) * progress,
              radius: startPoint.radius + (targetPoint.radius - startPoint.radius) * progress
            };
          });
          
          setFogPoints(interpolatedPoints);
          animationFrameRef.current = requestAnimationFrame(animate);
        }
      };
      
      animationFrameRef.current = requestAnimationFrame(animate);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [currentTransition, transitionSpeed]);

  // Iniciar uma transição animada entre dois conjuntos de pontos
  const startTransition = (fromPoints: FogPoint[], toPoints: FogPoint[]) => {
    // Garantir que os arrays tenham o mesmo tamanho para interpolação
    const normalizedFromPoints = [...fromPoints];
    const normalizedToPoints = [...toPoints];
    
    // Preencher o array menor com pontos do outro array
    while (normalizedFromPoints.length < normalizedToPoints.length) {
      const lastPoint = normalizedFromPoints[normalizedFromPoints.length - 1] || { x: 0, y: 0, radius: 0 };
      normalizedFromPoints.push({ ...lastPoint });
    }
    
    while (normalizedToPoints.length < normalizedFromPoints.length) {
      const lastPoint = normalizedToPoints[normalizedToPoints.length - 1] || { x: 0, y: 0, radius: 0 };
      normalizedToPoints.push({ ...lastPoint });
    }
    
    setCurrentTransition({
      startTime: performance.now(),
      points: normalizedFromPoints,
      targetPoints: normalizedToPoints
    });
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameMaster) return;

    setIsDrawing(true);
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    
    // Aplicar snap to grid se necessário
    let gridX, gridY;
    if (snapToGridEnabled) {
      const snapped = snapToGrid(offsetX, offsetY, gridSize);
      gridX = snapped.x / gridSize;
      gridY = snapped.y / gridSize;
    } else {
      gridX = Math.floor(offsetX / gridSize);
      gridY = Math.floor(offsetY / gridSize);
    }
    
    setLastPoint({ x: gridX, y: gridY });
    
    // Adicionar ou remover ponto de fog
    updateFogAtPoint(gridX, gridY);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameMaster || !isDrawing || !lastPoint) return;

    const { offsetX, offsetY } = getCanvasCoordinates(e);
    
    // Aplicar snap to grid se necessário
    let gridX, gridY;
    if (snapToGridEnabled) {
      const snapped = snapToGrid(offsetX, offsetY, gridSize);
      gridX = snapped.x / gridSize;
      gridY = snapped.y / gridSize;
    } else {
      gridX = Math.floor(offsetX / gridSize);
      gridY = Math.floor(offsetY / gridSize);
    }
    
    // Evitar atualizar se estiver na mesma célula do grid
    if (gridX === lastPoint.x && gridY === lastPoint.y) return;
    
    // Desenhar linha entre o último ponto e o atual
    drawLineBetweenPoints(lastPoint.x, lastPoint.y, gridX, gridY);
    
    setLastPoint({ x: gridX, y: gridY });
  };

  const handleCanvasMouseUp = () => {
    if (!isGameMaster) return;

    setIsDrawing(false);
    setLastPoint(null);
    
    // Enviar atualização para outros jogadores via Supabase Realtime
    if (mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog-update',
          payload: { 
            fogPoints,
            settings: {
              opacity: fogOpacity,
              color: fogColor,
              edgeBlur: edgeBlur,
              transitionSpeed: transitionSpeed,
              snapToGrid: snapToGridEnabled
            }
          }
        })
        .catch(console.error);
    }
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { offsetX: 0, offsetY: 0 };

    const rect = canvas.getBoundingClientRect();
    return {
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top
    };
  };

  const updateFogAtPoint = (x: number, y: number) => {
    if (brushMode === 'reveal') {
      // Verificar se já existe um ponto próximo
      const existingPointIndex = fogPoints.findIndex(p => 
        Math.abs(p.x - x) <= 1 && Math.abs(p.y - y) <= 1
      );

      if (existingPointIndex >= 0) {
        // Aumentar o raio do ponto existente
        const updatedPoints = [...fogPoints];
        updatedPoints[existingPointIndex].radius = Math.max(
          updatedPoints[existingPointIndex].radius,
          brushSize
        );
        setFogPoints(updatedPoints);
      } else {
        // Adicionar novo ponto
        setFogPoints([...fogPoints, { x, y, radius: brushSize }]);
      }
    } else {
      // Modo de esconder - remover pontos na área
      const updatedPoints = fogPoints.filter(p => 
        Math.sqrt(Math.pow(p.x - x, 2) + Math.pow(p.y - y, 2)) > brushSize
      );
      setFogPoints(updatedPoints);
    }
  };

  const drawLineBetweenPoints = (x1: number, y1: number, x2: number, y2: number) => {
    // Algoritmo de Bresenham para desenhar linha entre dois pontos
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;

    while (true) {
      updateFogAtPoint(x1, y1);

      if (x1 === x2 && y1 === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) {
        err -= dy;
        x1 += sx;
      }
      if (e2 < dx) {
        err += dx;
        y1 += sy;
      }
    }
  };

  const clearAllFog = () => {
    if (!isGameMaster) return;
    
    // Criar um único ponto grande que cobre todo o mapa
    const maxDimension = Math.max(mapWidth, mapHeight) / gridSize;
    const centerX = Math.floor((mapWidth / gridSize) / 2);
    const centerY = Math.floor((mapHeight / gridSize) / 2);
    
    setFogPoints([{ x: centerX, y: centerY, radius: maxDimension }]);
  };

  const resetFog = () => {
    if (!isGameMaster) return;
    setFogPoints([]);
  };

  const saveFogPreset = () => {
    if (!isGameMaster || !mapId) return;
    
    // Salvar o preset atual no localStorage
    const presetName = `fog-preset-${mapId}-${selectedPreset}`;
    localStorage.setItem(presetName, JSON.stringify(fogPoints));
    
    // Notificar o usuário
    alert(`Preset "${selectedPreset}" salvo com sucesso!`);
  };

  const loadFogPreset = (presetName: string) => {
    if (!mapId) return;
    
    setSelectedPreset(presetName);
    
    // Carregar do localStorage
    const savedPreset = localStorage.getItem(`fog-preset-${mapId}-${presetName}`);
    if (savedPreset) {
      try {
        const parsedPreset = JSON.parse(savedPreset);
        setFogPoints(parsedPreset);
      } catch (error) {
        console.error('Erro ao carregar preset:', error);
      }
    }
  };

  // Renderizar apenas o canvas para jogadores não-mestres
  if (!isGameMaster) {
    return (
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 pointer-events-none z-10"
        width={mapWidth}
        height={mapHeight}
      />
    );
  }

  return (
    <div className="fog-of-war-controls">
      <canvas
        ref={canvasRef}
        className="absolute top-0 left-0 z-10"
        width={mapWidth}
        height={mapHeight}
        onMouseDown={handleCanvasMouseDown}
        onMouseMove={handleCanvasMouseMove}
        onMouseUp={handleCanvasMouseUp}
        onMouseLeave={handleCanvasMouseUp}
      />
      
      <div className="absolute top-2 right-2 bg-fantasy-dark/80 p-2 rounded-md z-20 w-64">
        <Tabs defaultValue="brush">
          <TabsList className="w-full">
            <TabsTrigger value="brush" className="flex-1">Pincel</TabsTrigger>
            <TabsTrigger value="settings" className="flex-1">Configurações</TabsTrigger>
            <TabsTrigger value="presets" className="flex-1">Presets</TabsTrigger>
          </TabsList>
          
          <TabsContent value="brush" className="space-y-2 mt-2">
            <div className="flex justify-between">
              <Button
                variant={brushMode === 'reveal' ? "default" : "outline"}
                size="sm"
                onClick={() => setBrushMode('reveal')}
                className="flex-1 mr-1"
              >
                <Eye size={16} className="mr-1" /> Revelar
              </Button>
              <Button
                variant={brushMode === 'hide' ? "default" : "outline"}
                size="sm"
                onClick={() => setBrushMode('hide')}
                className="flex-1 ml-1"
              >
                <EyeOff size={16} className="mr-1" /> Ocultar
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Tamanho do Pincel</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[brushSize]}
                  min={1}
                  max={10}
                  step={1}
                  onValueChange={(value) => setBrushSize(value[0])}
                />
                <span className="text-xs w-6 text-center">{brushSize}</span>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-2 mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-fantasy-stone">Mostrar Névoa</span>
              <Button
                variant={showFog ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFog(!showFog)}
              >
                {showFog ? <Eye size={16} /> : <EyeOff size={16} />}
              </Button>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Opacidade</div>
              <div className="flex items-center gap-2">
                <Slider
                  value={[fogOpacity * 100]}
                  min={10}
                  max={100}
                  step={5}
                  onValueChange={(value) => setFogOpacity(value[0] / 100)}
                />
                <span className="text-xs w-8 text-center">{Math.round(fogOpacity * 100)}%</span>
              </div>
            </div>
            
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Cor da Névoa</div>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fogColor}
                  onChange={(e) => setFogColor(e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                />
                <span className="text-xs">{fogColor}</span>
              </div>
            </div>
            
            <div className="flex justify-between mt-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={resetFog}
                className="flex-1 mr-1"
              >
                <Eraser size={16} className="mr-1" /> Resetar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFog}
                className="flex-1 ml-1"
              >
                <Layers size={16} className="mr-1" /> Limpar Tudo
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="presets" className="space-y-2 mt-2">
            <div className="space-y-1">
              <div className="text-xs text-fantasy-stone">Preset Atual</div>
              <Select value={selectedPreset} onValueChange={loadFogPreset}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um preset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Padrão</SelectItem>
                  <SelectItem value="start">Início</SelectItem>
                  <SelectItem value="midgame">Meio do Jogo</SelectItem>
                  <SelectItem value="boss">Sala do Chefe</SelectItem>
                  <SelectItem value="complete">Mapa Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={saveFogPreset}
              className="w-full mt-2"
            >
              <Settings size={16} className="mr-1" /> Salvar Preset Atual
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EnhancedFogOfWar;