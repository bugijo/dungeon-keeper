import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { toast } from 'sonner';
import LineOfSightVisualizer from './LineOfSightVisualizer';
import FogPresetManager from './FogPresetManager';

interface FogOfWarProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  onFogUpdate?: (revealedAreas: RevealedArea[]) => void;
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

interface FogState {
  revealedAreas: RevealedArea[];
  currentTool: 'reveal' | 'hide' | 'select' | 'lineOfSight';
  brushSize: number;
  brushShape: 'circle' | 'square' | 'polygon';
  selectedAreaId: string | null;
  isDrawing: boolean;
  polygonPoints: { x: number; y: number }[];
  fogOpacity: number;
  lineOfSightStart: { x: number; y: number } | null;
  lineOfSightEnd: { x: number; y: number } | null;
  snapToGrid: boolean;
  edgeBlur: number;
  transitionSpeed: number;
}

const FogOfWar: React.FC<FogOfWarProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  onFogUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fogLayerRef = useRef<HTMLCanvasElement>(null);
  const { sendNotification } = useNotificationContext();
  
  const [fogState, setFogState] = useState<FogState>({
    revealedAreas: [],
    currentTool: 'reveal',
    brushSize: 3 * gridSize,
    brushShape: 'circle',
    selectedAreaId: null,
    isDrawing: false,
    polygonPoints: [],
    fogOpacity: 0.7,
    lineOfSightStart: null,
    lineOfSightEnd: null,
    snapToGrid: false,
    edgeBlur: 0,
    transitionSpeed: 300
  });

  /**
   * Função para alinhar coordenadas ao grid mais próximo
   * @param x Coordenada X
   * @param y Coordenada Y
   * @returns Coordenadas alinhadas ao grid
   */
  const snapToGrid = (x: number, y: number) => {
    if (!fogState.snapToGrid) return { x, y };
    
    const snappedX = Math.round(x / gridSize) * gridSize;
    const snappedY = Math.round(y / gridSize) * gridSize;
    
    return { x: snappedX, y: snappedY };
  };
  
  /**
   * Aplica uma predefinição rápida de tamanho de pincel
   * @param preset Tamanho predefinido (pequeno, médio, grande)
   */
  const applyPreset = (preset: 'small' | 'medium' | 'large') => {
    let newBrushSize = fogState.brushSize;
    
    switch (preset) {
      case 'small':
        newBrushSize = gridSize;
        break;
      case 'medium':
        newBrushSize = 3 * gridSize;
        break;
      case 'large':
        newBrushSize = 5 * gridSize;
        break;
    }
    
    setFogState(prev => ({
      ...prev,
      brushSize: newBrushSize
    }));
  };
  
  // Carregar áreas reveladas do banco de dados
  useEffect(() => {
    const fetchRevealedAreas = async () => {
      try {
        const { data, error } = await supabase
          .from('map_fog_of_war')
          .select('*')
          .eq('map_id', mapId);

        if (error) throw error;

        if (data) {
          const formattedAreas = data.map(area => ({
            id: area.id,
            x: area.x,
            y: area.y,
            radius: area.radius,
            shape: area.shape,
            points: area.points ? JSON.parse(area.points) : undefined,
            color: area.color || 'rgba(0, 0, 0, 0.7)',
            opacity: area.opacity || 0.7,
            created_by: area.created_by,
            created_at: area.created_at
          }));

          setFogState(prev => ({
            ...prev,
            revealedAreas: formattedAreas
          }));

          if (onFogUpdate) {
            onFogUpdate(formattedAreas);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar áreas reveladas:', error);
        toast.error('Não foi possível carregar o estado da névoa de guerra');
      }
    };

    fetchRevealedAreas();

    // Configurar canal em tempo real para atualizações de névoa
    const channel = supabase
      .channel(`fog-updates-${mapId}`)
      .on('broadcast', { event: 'fog_update' }, (payload) => {
        const updatedArea = payload.payload as RevealedArea;
        
        setFogState(prev => {
          // Verificar se a área já existe e atualizá-la, ou adicionar uma nova
          const areaExists = prev.revealedAreas.some(area => area.id === updatedArea.id);
          
          let newAreas;
          if (areaExists) {
            newAreas = prev.revealedAreas.map(area => 
              area.id === updatedArea.id ? updatedArea : area
            );
          } else {
            newAreas = [...prev.revealedAreas, updatedArea];
          }
          
          if (onFogUpdate) {
            onFogUpdate(newAreas);
          }
          
          return {
            ...prev,
            revealedAreas: newAreas
          };
        });
        
        // Notificar jogadores sobre a atualização da névoa
        if (updatedArea.created_by !== userId) {
          toast.info('O mestre revelou uma nova área do mapa!');
        }
      })
      .on('broadcast', { event: 'fog_delete' }, (payload) => {
        const deletedAreaId = payload.payload.id;
        
        setFogState(prev => {
          const newAreas = prev.revealedAreas.filter(area => area.id !== deletedAreaId);
          
          if (onFogUpdate) {
            onFogUpdate(newAreas);
          }
          
          return {
            ...prev,
            revealedAreas: newAreas
          };
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, userId, onFogUpdate]);

  // Renderizar a névoa de guerra
  useEffect(() => {
    const renderFog = () => {
      const fogCanvas = fogLayerRef.current;
      if (!fogCanvas) return;

      const ctx = fogCanvas.getContext('2d');
      if (!ctx) return;

      // Limpar o canvas
      ctx.clearRect(0, 0, width, height);

      // Desenhar a névoa completa com a opacidade definida
      ctx.fillStyle = `rgba(0, 0, 0, ${fogState.fogOpacity})`;
      ctx.fillRect(0, 0, width, height);

      // Configurar para modo de composição 'destination-out' para criar buracos na névoa
      ctx.globalCompositeOperation = 'destination-out';

      // Desenhar áreas reveladas (transparentes)
      fogState.revealedAreas.forEach(area => {
        if (area.shape === 'circle') {
          ctx.beginPath();
          ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
          ctx.fill();
        } else if (area.shape === 'square') {
          ctx.fillRect(
            area.x - area.radius,
            area.y - area.radius,
            area.radius * 2,
            area.radius * 2
          );
        } else if (area.shape === 'polygon' && area.points && area.points.length > 2) {
          ctx.beginPath();
          ctx.moveTo(area.points[0].x, area.points[0].y);
          
          for (let i = 1; i < area.points.length; i++) {
            ctx.lineTo(area.points[i].x, area.points[i].y);
          }
          
          ctx.closePath();
          ctx.fill();
        }
      });

      // Restaurar o modo de composição padrão
      ctx.globalCompositeOperation = 'source-over';

      // Código movido para cima para evitar duplicação
    };

    renderFog();
  }, [fogState, width, height, gridSize]);

  // Manipuladores de eventos para interação com o mouse (apenas para o mestre)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameMaster) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (fogState.currentTool === 'lineOfSight') {
      // Modo de linha de visão
      if (!fogState.lineOfSightStart) {
        // Definir ponto inicial
        setFogState(prev => ({
          ...prev,
          lineOfSightStart: { x, y },
          lineOfSightEnd: null
        }));
      } else {
        // Definir ponto final
        setFogState(prev => ({
          ...prev,
          lineOfSightEnd: { x, y }
        }));
      }
      return;
    }

    if (fogState.brushShape === 'polygon') {
      // Adicionar ponto ao polígono
      setFogState(prev => ({
        ...prev,
        polygonPoints: [...prev.polygonPoints, { x, y }]
      }));
    } else {
      // Iniciar desenho com círculo ou quadrado
      setFogState(prev => ({
        ...prev,
        isDrawing: true
      }));

      // Adicionar área revelada
      addRevealedArea(x, y);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameMaster || !fogState.isDrawing) return;
    if (fogState.brushShape === 'polygon') return; // Não fazer nada durante o desenho de polígono

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Adicionar área revelada enquanto arrasta
    addRevealedArea(x, y);
  };

  const handleMouseUp = () => {
    if (!isGameMaster) return;

    // Se estiver desenhando um polígono e tiver pelo menos 3 pontos, finalizar o polígono
    if (fogState.brushShape === 'polygon' && fogState.polygonPoints.length >= 3) {
      addPolygonArea();
    }

    setFogState(prev => ({
      ...prev,
      isDrawing: false
    }));
  };

  const addRevealedArea = async (x: number, y: number) => {
    const newArea: RevealedArea = {
      x,
      y,
      radius: fogState.brushSize,
      shape: fogState.brushShape === 'polygon' ? 'polygon' : fogState.brushShape,
      color: 'rgba(0, 0, 0, 0.7)',
      opacity: 0.7
    };

    try {
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
        setFogState(prev => ({
          ...prev,
          revealedAreas: [...prev.revealedAreas, newArea]
        }));

        // Notificar outros usuários
        await supabase
          .channel(`fog-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'fog_update',
            payload: newArea
          });

        // Enviar notificação para jogadores
        await sendNotification({
          user_id: '*', // Enviar para todos os jogadores da sessão
          title: 'Atualização do Mapa',
          content: 'O mestre revelou uma nova área do mapa!',
          type: 'fog_update',
          reference_id: mapId,
          reference_type: 'tactical_map'
        });

        if (onFogUpdate) {
          onFogUpdate([...fogState.revealedAreas, newArea]);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar área revelada:', error);
      toast.error('Não foi possível atualizar a névoa de guerra');
    }
  };

  const addPolygonArea = async () => {
    if (fogState.polygonPoints.length < 3) return;

    const newArea: RevealedArea = {
      x: fogState.polygonPoints[0].x, // Usar o primeiro ponto como referência
      y: fogState.polygonPoints[0].y,
      radius: 0, // Não usado para polígonos
      shape: 'polygon',
      points: fogState.polygonPoints,
      color: 'rgba(0, 0, 0, 0.7)',
      opacity: 0.7
    };

    try {
      // Adicionar ao banco de dados
      const { data, error } = await supabase
        .from('map_fog_of_war')
        .insert({
          map_id: mapId,
          game_id: gameId,
          x: newArea.x,
          y: newArea.y,
          shape: newArea.shape,
          points: JSON.stringify(newArea.points),
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
        setFogState(prev => ({
          ...prev,
          revealedAreas: [...prev.revealedAreas, newArea],
          polygonPoints: [] // Limpar pontos do polígono
        }));

        // Notificar outros usuários
        await supabase
          .channel(`fog-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'fog_update',
            payload: newArea
          });

        // Enviar notificação para jogadores
        await sendNotification({
          user_id: '*', // Enviar para todos os jogadores da sessão
          title: 'Atualização do Mapa',
          content: 'O mestre revelou uma nova área do mapa!',
          type: 'fog_update',
          reference_id: mapId,
          reference_type: 'tactical_map'
        });

        if (onFogUpdate) {
          onFogUpdate([...fogState.revealedAreas, newArea]);
        }
      }
    } catch (error) {
      console.error('Erro ao adicionar área de polígono:', error);
      toast.error('Não foi possível atualizar a névoa de guerra');
    }
  };

  const clearPolygonPoints = () => {
    setFogState(prev => ({
      ...prev,
      polygonPoints: []
    }));
  };

  const changeBrushSize = (size: number) => {
    setFogState(prev => ({
      ...prev,
      brushSize: size * gridSize
    }));
  };

  const changeBrushShape = (shape: 'circle' | 'square' | 'polygon') => {
    setFogState(prev => ({
      ...prev,
      brushShape: shape,
      polygonPoints: [] // Limpar pontos do polígono ao mudar a forma
    }));
  };
  
  const changeFogOpacity = (opacity: number) => {
    setFogState(prev => ({
      ...prev,
      fogOpacity: opacity
    }));
    
    // Atualizar opacidade no banco de dados para todos os jogadores
    if (isGameMaster && mapId) {
      supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_opacity_update',
          payload: { opacity }
        })
        .catch(error => {
          console.error('Erro ao atualizar opacidade da névoa:', error);
        });
    }
  };
  
  const addLineOfSightArea = async (startPoint: { x: number; y: number }, endPoint: { x: number; y: number }) => {
    if (!isGameMaster) return;
    
    // Calcular distância entre os pontos
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );
    
    // Criar área revelada baseada na linha de visão
    const newArea: RevealedArea = {
      x: endPoint.x,
      y: endPoint.y,
      radius: distance / 3, // Usar um terço da distância como raio
      shape: 'circle',
      color: 'rgba(0, 0, 0, 0.7)',
      opacity: fogState.fogOpacity
    };
    
    try {
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
        setFogState(prev => ({
          ...prev,
          revealedAreas: [...prev.revealedAreas, newArea],
          lineOfSightStart: null, // Resetar pontos de linha de visão
          lineOfSightEnd: null
        }));

        // Notificar outros usuários
        await supabase
          .channel(`fog-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'fog_update',
            payload: newArea
          });

        // Enviar notificação para jogadores
        await sendNotification({
          user_id: '*', // Enviar para todos os jogadores da sessão
          title: 'Atualização do Mapa',
          content: 'O mestre revelou uma nova área do mapa usando linha de visão!',
          type: 'fog_update',
          reference_id: mapId,
          reference_type: 'tactical_map'
        });

        if (onFogUpdate) {
          onFogUpdate([...fogState.revealedAreas, newArea]);
        }
        
        toast.success('Área revelada com base na linha de visão!');
      }
    } catch (error) {
      console.error('Erro ao adicionar área de linha de visão:', error);
      toast.error('Não foi possível atualizar a névoa de guerra');
    }
  };

  const changeCurrentTool = (tool: 'reveal' | 'hide' | 'select' | 'lineOfSight') => {
    setFogState(prev => ({
      ...prev,
      currentTool: tool,
      polygonPoints: [], // Limpar pontos do polígono ao mudar a ferramenta
      lineOfSightStart: null,
      lineOfSightEnd: null
    }));
  };

  const resetFog = async () => {
    if (!isGameMaster) return;

    try {
      // Remover todas as áreas reveladas do banco de dados
      const { error } = await supabase
        .from('map_fog_of_war')
        .delete()
        .eq('map_id', mapId);

      if (error) throw error;

      // Atualizar estado local
      setFogState(prev => ({
        ...prev,
        revealedAreas: []
      }));

      // Notificar outros usuários
      await supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_reset',
          payload: { map_id: mapId }
        });

      // Enviar notificação para jogadores
      await sendNotification({
        user_id: '*', // Enviar para todos os jogadores da sessão
        title: 'Mapa Reiniciado',
        content: 'O mestre reiniciou a névoa de guerra do mapa!',
        type: 'fog_update',
        reference_id: mapId,
        reference_type: 'tactical_map'
      });

      if (onFogUpdate) {
        onFogUpdate([]);
      }

      toast.success('Névoa de guerra reiniciada com sucesso!');
    } catch (error) {
      console.error('Erro ao reiniciar névoa de guerra:', error);
      toast.error('Não foi possível reiniciar a névoa de guerra');
    }
  };

  return (
    <div className="relative">
      {/* Canvas para interação do usuário (invisível) */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 z-20 cursor-crosshair"
        style={{ opacity: 0 }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />
      
      {/* Canvas para renderizar a névoa de guerra */}
      <canvas
        ref={fogLayerRef}
        width={width}
        height={height}
        className="absolute top-0 left-0 z-10 pointer-events-none"
      />
      
      {/* Visualizador de linha de visão */}
      {fogState.currentTool === 'lineOfSight' && (
        <LineOfSightVisualizer
          startPoint={fogState.lineOfSightStart}
          endPoint={fogState.lineOfSightEnd}
          width={width}
          height={height}
          gridSize={gridSize}
          onVisibleAreaChange={(areas) => {
            if (areas.length > 0 && fogState.lineOfSightEnd) {
              // Adicionar área revelada baseada na linha de visão
              addLineOfSightArea(fogState.lineOfSightStart!, fogState.lineOfSightEnd);
            }
          }}
        />
      )}
      
      {/* Controles para o mestre (opcional) */}
      {isGameMaster && (
        <div className="absolute top-2 right-2 bg-fantasy-dark/80 p-2 rounded-md z-30 flex flex-col gap-2 max-h-[90vh] overflow-y-auto">
          <div className="flex gap-2 flex-wrap">
            <button
              className={`p-1 rounded ${fogState.currentTool === 'reveal' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeCurrentTool('reveal')}
              title="Revelar área"
            >
              Revelar
            </button>
            <button
              className={`p-1 rounded ${fogState.currentTool === 'hide' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeCurrentTool('hide')}
              title="Esconder área"
            >
              Esconder
            </button>
            <button
              className={`p-1 rounded ${fogState.currentTool === 'lineOfSight' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeCurrentTool('lineOfSight')}
              title="Linha de Visão"
            >
              Visão
            </button>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            <button
              className={`p-1 rounded ${fogState.brushShape === 'circle' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeBrushShape('circle')}
              title="Forma circular"
            >
              Círculo
            </button>
            <button
              className={`p-1 rounded ${fogState.brushShape === 'square' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeBrushShape('square')}
              title="Forma quadrada"
            >
              Quadrado
            </button>
            <button
              className={`p-1 rounded ${fogState.brushShape === 'polygon' ? 'bg-fantasy-gold text-fantasy-dark' : 'bg-fantasy-dark/50 text-fantasy-stone'}`}
              onClick={() => changeBrushShape('polygon')}
              title="Forma poligonal"
            >
              Polígono
            </button>
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-xs text-fantasy-stone">Tamanho:</span>
            <input
              type="range"
              min="1"
              max="10"
              step="1"
              value={fogState.brushSize / gridSize}
              onChange={(e) => changeBrushSize(parseInt(e.target.value))}
              className="w-24"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <span className="text-xs text-fantasy-stone">Opacidade:</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={fogState.fogOpacity}
              onChange={(e) => changeFogOpacity(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
          
          {fogState.brushShape === 'polygon' && fogState.polygonPoints.length > 0 && (
            <div className="flex gap-2">
              <button
                className="p-1 rounded bg-fantasy-red text-white text-xs"
                onClick={clearPolygonPoints}
                title="Cancelar polígono"
              >
                Cancelar
              </button>
              {fogState.polygonPoints.length >= 3 && (
                <button
                  className="p-1 rounded bg-fantasy-green text-white text-xs"
                  onClick={addPolygonArea}
                  title="Finalizar polígono"
                >
                  Finalizar
                </button>
              )}
            </div>
          )}
          
          {fogState.currentTool === 'lineOfSight' && (
            <div className="bg-fantasy-dark/50 p-1 rounded text-xs text-fantasy-stone">
              {!fogState.lineOfSightStart ? 
                "Clique para definir o ponto de origem" : 
                "Clique para definir o ponto de destino"}
            </div>
          )}
          
          <button
            className="p-1 rounded bg-fantasy-red text-white text-xs mt-2"
            onClick={resetFog}
            title="Reiniciar névoa de guerra"
          >
            Reiniciar Névoa
          </button>
          
          {/* Gerenciador de presets integrado */}
          <div className="border-t border-fantasy-stone/30 my-1 pt-1">
            <FogPresetManager
              mapId={mapId}
              gameId={gameId}
              userId={userId}
              isGameMaster={isGameMaster}
              currentAreas={fogState.revealedAreas}
              onPresetLoad={(areas) => {
                setFogState(prev => ({
                  ...prev,
                  revealedAreas: areas
                }));
                
                if (onFogUpdate) {
                  onFogUpdate(areas);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FogOfWar;