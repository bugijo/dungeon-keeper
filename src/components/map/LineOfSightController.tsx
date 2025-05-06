import { useState, useEffect } from 'react';
import { Slider, Switch } from 'react-slider';
import { toast } from 'react-toast-notifications';
import { Card, Button } from 'react-bootstrap';
import { Sun, Moon, Trash2, Move, Target } from 'react-icons/all';
import { LineIntersectsRectangle } from '../../utils/lineIntersectsRectangle';
import { updateDynamicObstacles } from '../../utils/updateDynamicObstacles';
import { loadGameLocally } from '../../utils/loadGameLocally';
import { saveGameLocally } from '../../utils/saveGameLocally';
import { saveLightSourcesLocally, loadLightSourcesLocally } from '../../utils/saveLightSourcesLocally';
import { Point } from '../../types/point';
import { Obstacle } from '../../types/obstacle';
import { LightSource } from '../../types/lightSource';
import { calculateLineIntersection } from '../../utils/lineIntersectsRectangle';
import { supabase } from '../../lib/supabaseClient';

const LineOfSightController = ({
  mapId,
  gameId,
  userId,
  memoryEnabled,
  isGameMaster,
  obstacles,
  lightSources,
  memoryPoints,
  settings: {
    ambientLight,
    timeOfDay,
    memoryEnabled,
    memoryOpacity,
    memoryColor
  },
  lastUpdated
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showMemory, setShowMemory] = useState(true);
  const [realtimeSimulation, setRealtimeSimulation] = useState(true);
  const [maxViewDistance, setMaxViewDistance] = useState(30);
  const [memoryOpacity, setMemoryOpacity] = useState(1);
  const [memoryColor, setMemoryColor] = useState('rgba(255, 255, 255, 0.6)');
  const [testMode, setTestMode] = useState(false);
  const [testOrigin, setTestOrigin] = useState(null);
  const [testTarget, setTestTarget] = useState(null);
  const [visiblePoints, setVisiblePoints] = useState([]);
  const [newObstacleWidth, setNewObstacleWidth] = useState(gridSize);
  const [newObstacleHeight, setNewObstacleHeight] = useState(gridSize);
  const [newObstacleOpacity, setNewObstacleOpacity] = useState(1);
  const [newObstacleBlocksVision, setNewObstacleBlocksVision] = useState(true);
  const [newObstacleBlocksMovement, setNewObstacleBlocksMovement] = useState(true);
  const [newLightRadius, setNewLightRadius] = useState(gridSize);
  const [newLightColor, setNewLightColor] = useState('rgba(255, 255, 255, 0.6)');
  const [newLightIntensity, setNewLightIntensity] = useState(1);
  const [newLightFlickering, setNewLightFlickering] = useState(false);
  const [newLightCastShadows, setNewLightCastShadows] = useState(false);
  const [selectedLightSource, setSelectedLightSource] = useState(null);
  const [selectedObstacle, setSelectedObstacle] = useState(null);
  const [memoryCanvasRef, setMemoryCanvasRef] = useState(null);
  const [canvasRef, setCanvasRef] = useState(null);
  const [lightingCanvasRef, setLightingCanvasRef] = useState(null);

  useEffect(() => {
    const channel = `los-updates-${mapId}`;
    
    supabase
      .channel(channel)
      .on('light_sources', (event) => {
        const newLightSources = event.payload as {
          lightSources: LightSource[]
        };
        
        if (Array.isArray(newLightSources)) {
          setLightSources(newLightSources);
          if (onLightSourcesUpdate) {
            onLightSourcesUpdate(newLightSources);
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, gameId, userId, memoryEnabled, isGameMaster]);
  
  // Atualizar área visível quando as fontes de luz ou obstáculos mudarem
  useEffect(() => {
    if (realtimeSimulation) {
      calculateCombinedVisibility();
    }
  }, [lightSources, obstacles, realtimeSimulation, ambientLight]);
  
  // Renderizar área visível quando os pontos mudarem
  useEffect(() => {
    if (testMode && visiblePoints.length > 0) {
      renderVisibleArea();
    }
  }, [visiblePoints, testOrigin, testTarget, testMode]);
  
  // Adicionar manipuladores de eventos para mover pontos de teste
  useEffect(() => {
    if (!testMode || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    let isDraggingOrigin = false;
    let isDraggingTarget = false;
    
    const handleMouseDown = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // Verificar se o clique foi próximo à origem ou destino
      if (testOrigin && Math.sqrt(Math.pow(mouseX - testOrigin.x, 2) + Math.pow(mouseY - testOrigin.y, 2)) < 15) {
        isDraggingOrigin = true;
      } else if (testTarget && Math.sqrt(Math.pow(mouseX - testTarget.x, 2) + Math.pow(mouseY - testTarget.y, 2)) < 15) {
        isDraggingTarget = true;
      }
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingOrigin && !isDraggingTarget) return;
      
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      if (isDraggingOrigin) {
        setTestOrigin({ x: mouseX, y: mouseY });
        
        // Recalcular área visível se o destino já estiver definido
        if (testTarget) {
          const points = calculateVisibleArea(
            { x: mouseX, y: mouseY },
            maxViewDistance,
            obstacles.filter(obs => obs.blocks_vision),
            0.1
          );
          
          setVisiblePoints(points);
          
          // Atualizar memória se estiver habilitada
          if (memoryEnabled) {
            updateMemory(points);
          }
        }
      } else if (isDraggingTarget) {
        setTestTarget({ x: mouseX, y: mouseY });
      }
    };
    
    const handleMouseUp = () => {
      isDraggingOrigin = false;
      isDraggingTarget = false;
    };
    
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
    };
  }, [testMode, testOrigin, testTarget, obstacles, maxViewDistance, memoryEnabled]);
  
  // Calcular visibilidade combinada de todas as fontes de luz
  const calculateCombinedVisibility = () => {
    if (!realtimeSimulation) return;
    
    const allVisiblePoints: Point[] = [];
    
    // Adicionar pontos visíveis de cada fonte de luz
    lightSources.forEach(light => {
      const lightPoints = calculateVisibleArea(
        { x: light.x, y: light.y },
        light.radius * light.intensity,
        obstacles.filter(obs => obs.blocks_vision),
        0.5 // Passo angular para melhor desempenho
      );
      
      allVisiblePoints.push(...lightPoints);
    });
    
    // Adicionar pontos do teste de linha de visão, se estiver ativo
    if (testMode && testOrigin) {
      const testPoints = calculateVisibleArea(
        testOrigin,
        maxViewDistance,
        obstacles.filter(obs => obs.blocks_vision),
        0.1
      );
      
      allVisiblePoints.push(...testPoints);
    }
    
    setVisiblePoints(allVisiblePoints);
    
    // Notificar mudanças na área visível
    if (onVisibleAreaChange) {
      onVisibleAreaChange(allVisiblePoints);
    }
    
    // Atualizar memória se estiver habilitada
    if (memoryEnabled && allVisiblePoints.length > 0) {
      updateMemory(allVisiblePoints);
    }
  };
  
  // Atualizar memória de áreas reveladas
  const updateMemory = (newVisiblePoints: Point[] = visiblePoints) => {
    if (!memoryEnabled || newVisiblePoints.length === 0) return;
    
    // Adicionar novos pontos visíveis à memória, evitando duplicatas
    const updatedMemory = [...memoryPoints];
    
    newVisiblePoints.forEach(point => {
      // Verificar se o ponto já existe na memória (aproximadamente)
      const exists = memoryPoints.some(memPoint => 
        Math.abs(memPoint.x - point.x) < gridSize / 2 && 
        Math.abs(memPoint.y - point.y) < gridSize / 2
      );
      
      if (!exists) {
        updatedMemory.push(point);
      }
    });
    
    if (updatedMemory.length !== memoryPoints.length) {
      setMemoryPoints(updatedMemory);
      
      // Salvar memória localmente
      const localGame = loadGameLocally(gameId) || { 
        id: gameId, 
        name: 'Jogo Atual', 
        lastUpdated: new Date().toISOString(),
        mapId
      };
      
      saveGameLocally({
        ...localGame,
        memoryPoints: updatedMemory
      });
      
      console.log('Memória atualizada:', updatedMemory.length, 'pontos');
    }
  };
  
  // Renderizar memória no canvas
  const renderMemory = () => {
    const canvas = memoryCanvasRef.current;
    if (!canvas || !showMemory || memoryPoints.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Configurar estilo
    ctx.fillStyle = memoryColor + Math.round(memoryOpacity * 255).toString(16).padStart(2, '0');
    
    // Desenhar cada ponto de memória como um pequeno círculo
    memoryPoints.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, gridSize / 4, 0, Math.PI * 2);
      ctx.fill();
    });
  };
  
  // Efeito para renderizar memória quando os pontos mudarem
  useEffect(() => {
    renderMemory();
  }, [memoryPoints, showMemory, memoryOpacity, memoryColor]);
  
  // Adicionar nova fonte de luz
  const addLightSource = () => {
    if (!isGameMaster) return;
    
    const newLight: LightSource = {
      id: `light-${Date.now()}`,
      x: width / 2,
      y: height / 2,
      radius: newLightRadius,
      color: newLightColor,
      intensity: newLightIntensity,
      flickering: newLightFlickering,
      castShadows: newLightCastShadows
    };
    
    const updatedLightSources = [...lightSources, newLight];
    setLightSources(updatedLightSources);
    
    // Notificar mudanças
    if (onLightSourcesUpdate) {
      onLightSourcesUpdate(updatedLightSources);
    }
    
    // Salvar localmente
    saveLightSourcesLocally(mapId, updatedLightSources);
    
    // Sincronizar com o banco de dados
    if (mapId) {
      supabase
        .from('light_sources')
        .insert([{
          ...newLight,
          map_id: mapId,
          created_by: userId
        }])
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao salvar fonte de luz:', error);
          }
        });
        
      // Notificar outros usuários
      supabase
        .channel(`los-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'light-update',
          payload: { lightSources: updatedLightSources }
        });
    }
    
    toast({
      title: 'Fonte de luz adicionada',
      description: 'Uma nova fonte de luz foi adicionada ao mapa'
    });
  };
  
  // Remover fonte de luz
  const removeLightSource = (lightId: string) => {
    if (!isGameMaster) return;
    
    const updatedLightSources = lightSources.filter(light => light.id !== lightId);
    setLightSources(updatedLightSources);
    
    if (selectedLightSource?.id === lightId) {
      setSelectedLightSource(null);
    }
    
    // Notificar mudanças
    if (onLightSourcesUpdate) {
      onLightSourcesUpdate(updatedLightSources);
    }
    
    // Salvar localmente
    saveLightSourcesLocally(mapId, updatedLightSources);
    
    // Sincronizar com o banco de dados
    if (mapId) {
      supabase
        .from('light_sources')
        .delete()
        .eq('id', lightId)
        .eq('map_id', mapId)
        .then(({ error }) => {
          if (error) {
            console.error('Erro ao remover fonte de luz:', error);
          }
        });
        
      // Notificar outros usuários
      supabase
        .channel(`los-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'light-update',
          payload: { lightSources: updatedLightSources }
        });
    }
    
    toast({
      title: 'Fonte de luz removida',
      description: 'A fonte de luz foi removida do mapa'
    });
  };
  
  // Atualizar propriedades da fonte de luz
  const updateLightProperty = (lightId: string, property: string, value: any) => {
    if (!isGameMaster) return;
    
    const updatedLightSources = lightSources.map(light => {
      if (light.id === lightId) {
        return { ...light, [property]: value };
      }
      return light;
    });
    
    setLightSources(updatedLightSources);
    
    // Atualizar a fonte de luz selecionada se for a mesma
    if (selectedLightSource?.id === lightId) {
      setSelectedLightSource({ ...selectedLightSource, [property]: value });
    }
    
    // Notificar mudanças
    if (onLightSourcesUpdate) {
      onLightSourcesUpdate(updatedLightSources);
    }
    
    // Salvar localmente
    saveLightSourcesLocally(mapId, updatedLightSources);
    
    // Sincronizar com o banco de dados (com debounce para evitar muitas requisições)
    if (mapId) {
      const debounceTimeout = setTimeout(() => {
        supabase
          .from('light_sources')
          .update({ [property]: value })
          .eq('id', lightId)
          .eq('map_id', mapId)
          .then(({ error }) => {
            if (error) {
              console.error('Erro ao atualizar fonte de luz:', error);
            }
          });
          
        // Notificar outros usuários
        supabase
          .channel(`los-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'light-update',
            payload: { lightSources: updatedLightSources }
          });
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    }
  };

  // Adicionar novo obstáculo
  const addObstacle = () => {
    if (!isGameMaster) return;

    const newObstacle: Obstacle = {
      id: `obstacle-${Date.now()}`,
      x: width / 2 - newObstacleWidth / 2,
      y: height / 2 - newObstacleHeight / 2,
      width: newObstacleWidth,
      height: newObstacleHeight,
      blocks_vision: newObstacleBlocksVision,
      blocks_movement: newObstacleBlocksMovement,
      opacity: newObstacleOpacity,
      is_dynamic: false
    };

    onObstaclesUpdate([...obstacles, newObstacle]);
    
    toast({
      title: 'Obstáculo adicionado',
      description: 'Um novo obstáculo foi adicionado ao mapa'
    });
  };

  // Remover obstáculo
  const removeObstacle = (obstacleId: string) => {
    if (!isGameMaster) return;
    
    const updatedObstacles = obstacles.filter(obs => obs.id !== obstacleId);
    onObstaclesUpdate(updatedObstacles);
    
    if (selectedObstacle?.id === obstacleId) {
      setSelectedObstacle(null);
    }
    
    toast({
      title: 'Obstáculo removido',
      description: 'O obstáculo foi removido do mapa'
    });
  };

  // Atualizar propriedades do obstáculo
  const updateObstacleProperty = (obstacleId: string, property: string, value: any) => {
    if (!isGameMaster) return;
    
    const updatedObstacles = obstacles.map(obs => {
      if (obs.id === obstacleId) {
        return { ...obs, [property]: value };
      }
      return obs;
    });
    
    onObstaclesUpdate(updatedObstacles);
    
    // Atualizar o obstáculo selecionado se for o mesmo
    if (selectedObstacle?.id === obstacleId) {
      setSelectedObstacle({ ...selectedObstacle, [property]: value });
    }
  };

  // Calcular área visível a partir de um ponto, considerando obstáculos
  const calculateVisibilityFromPoint = (x: number, y: number, radius: number): boolean[][] => {
    // Criar uma matriz de visibilidade
    const visibilityMatrix: boolean[][] = [];
    const cellSize = gridSize / 2; // Usar metade do tamanho do grid para maior precisão
    
    const cols = Math.ceil(width / cellSize);
    const rows = Math.ceil(height / cellSize);
    
    // Inicializar matriz com false (não visível)
    for (let r = 0; r < rows; r++) {
      visibilityMatrix[r] = [];
      for (let c = 0; c < cols; c++) {
        visibilityMatrix[r][c] = false;
      }
    }
    
    // Calcular visibilidade para cada célula
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cellX = c * cellSize + cellSize / 2;
        const cellY = r * cellSize + cellSize / 2;
        
        // Verificar se a célula está dentro do raio de visão
        const distance = Math.sqrt(Math.pow(cellX - x, 2) + Math.pow(cellY - y, 2));
        if (distance <= radius) {
          // Verificar se há linha de visão direta (sem obstáculos)
          let hasLineOfSight = true;
          
          // Verificar cada obstáculo que bloqueia visão
          for (const obstacle of obstacles) {
            if (obstacle.blocks_vision) {
              // Verificar se a linha entre o ponto de origem e a célula intersecta o obstáculo
              if (LineIntersectsRectangle(
                x, y,
                cellX, cellY,
                obstacle.x, obstacle.y,
                obstacle.width, obstacle.height
              )) {
                hasLineOfSight = false;
                break;
              }
            }
          }
          
          visibilityMatrix[r][c] = hasLineOfSight;
        }
      }
    }
    
    return visibilityMatrix;
  };
  
  // Iniciar teste de linha de visão
  const startLineOfSightTest = () => {
    setTestMode(true);
    setTestOrigin(null);
    setTestTarget(null);
    setVisiblePoints([]);
    
    toast({
      title: 'Teste de linha de visão iniciado',
      description: 'Clique em dois pontos no mapa para testar a visibilidade'
    });
  };
  
  // Finalizar teste de linha de visão
  const endLineOfSightTest = () => {
    setTestMode(false);
    setTestOrigin(null);
    setTestTarget(null);
    setVisiblePoints([]);
  };
  
  // Estados para arrastar e soltar elementos
  const [draggedItem, setDraggedItem] = useState<{ type: 'obstacle' | 'light', id: string } | null>(null);
  const [dragStartPos, setDragStartPos] = useState<Point | null>(null);
  
  // Renderizar área visível no canvas
  const renderVisibleArea = () => {
    const canvas = canvasRef.current;
    if (!canvas || visiblePoints.length === 0) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar área visível com gradiente
    const gradient = ctx.createRadialGradient(
      testOrigin?.x || width/2, testOrigin?.y || height/2, 0,
      testOrigin?.x || width/2, testOrigin?.y || height/2, maxViewDistance
    );
    
    gradient.addColorStop(0, 'rgba(255, 255, 200, 0.6)');
    gradient.addColorStop(0.7, 'rgba(255, 255, 150, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 255, 100, 0.1)');
    
    // Desenhar polígono de visibilidade
    if (visiblePoints.length > 2) {
      ctx.beginPath();
      ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
      
      for (let i = 1; i < visiblePoints.length; i++) {
        ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
      }
      
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();
      
      // Desenhar borda suave
      ctx.strokeStyle = 'rgba(255, 255, 200, 0.4)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    // Desenhar origem e destino
    if (testOrigin) {
      ctx.beginPath();
      ctx.arc(testOrigin.x, testOrigin.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    
    if (testTarget) {
      ctx.beginPath();
      ctx.arc(testTarget.x, testTarget.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
      ctx.fill();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Desenhar linha entre origem e destino
      if (testOrigin) {
        ctx.beginPath();
        ctx.moveTo(testOrigin.x, testOrigin.y);
        ctx.lineTo(testTarget.x, testTarget.y);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
  };
  
  // Calcular área visível a partir de um ponto de origem, considerando obstáculos
  const calculateVisibleArea = (
    origin: Point,
    maxDistance: number,
    obstacleList: Obstacle[],
    angleStep: number = 1
  ): Point[] => {
    const visiblePoints: Point[] = [];
    const visibleEdges: Point[] = []; // Pontos nas bordas da área visível
    
    // Gerar raios em um círculo ao redor da origem
    for (let angle = 0; angle < 360; angle += angleStep) {
      const radians = (angle * Math.PI) / 180;
      const endX = origin.x + Math.cos(radians) * maxDistance;
      const endY = origin.y + Math.sin(radians) * maxDistance;
      
      let closestIntersection: Point | null = null;
      let closestDistance = maxDistance;
      
      // Verificar interseção com cada obstáculo
      for (const obstacle of obstacleList) {
        if (!obstacle.blocks_vision) continue;
        
        // Converter obstáculo em 4 linhas (bordas)
        const edges = [
          // Borda superior
          { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y },
          // Borda direita
          { x1: obstacle.x + obstacle.width, y1: obstacle.y, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
          // Borda inferior
          { x1: obstacle.x, y1: obstacle.y + obstacle.height, x2: obstacle.x + obstacle.width, y2: obstacle.y + obstacle.height },
          // Borda esquerda
          { x1: obstacle.x, y1: obstacle.y, x2: obstacle.x, y2: obstacle.y + obstacle.height }
        ];
        
        // Verificar interseção com cada borda
        for (const edge of edges) {
          // Calcular interseção entre o raio e a borda
          const intersection = calculateLineIntersection(
            origin.x, origin.y, endX, endY,
            edge.x1, edge.y1, edge.x2, edge.y2
          );
          
          if (intersection) {
            const distance = Math.sqrt(
              Math.pow(intersection.x - origin.x, 2) + 
              Math.pow(intersection.y - origin.y, 2)
            );
            
            // Manter apenas a interseção mais próxima
            if (distance < closestDistance) {
              closestDistance = distance;
              closestIntersection = intersection;
            }
          }
        }
      }
      
      // Se encontrou uma interseção, usar esse ponto como limite visível
      if (closestIntersection) {
        visibleEdges.push(closestIntersection);
        
        // Adicionar alguns pontos ao longo do raio até a interseção
        const linePoints = getPointsOnLine(
          origin.x, origin.y, 
          closestIntersection.x, closestIntersection.y
        );
        
        // Adicionar pontos ao longo do raio (exceto o último que já está em visibleEdges)
        for (let i = 0; i < linePoints.length - 1; i++) {
          visiblePoints.push(linePoints[i]);
        }
      } else {
        // Se não houver obstáculo, usar o ponto máximo
        const maxPoint = { x: endX, y: endY };
        visibleEdges.push(maxPoint);
        
        // Adicionar pontos ao longo do raio
        const linePoints = getPointsOnLine(origin.x, origin.y, endX, endY);
        for (const point of linePoints) {
          visiblePoints.push(point);
        }
      }
    }
    
    // Adicionar os pontos de borda à lista de pontos visíveis
    visibleEdges.forEach(edge => visiblePoints.push(edge));
    
    return visiblePoints;
  };
  
  // Obter pontos ao longo de uma linha usando o algoritmo de Bresenham
  const getPointsOnLine = (x1: number, y1: number, x2: number, y2: number): Point[] => {
    const points: Point[] = [];
    const dx = Math.abs(x2 - x1);
    const dy = Math.abs(y2 - y1);
    const sx = x1 < x2 ? 1 : -1;
    const sy = y1 < y2 ? 1 : -1;
    let err = dx - dy;
    
    let x = x1;
    let y = y1;
    
    const maxPoints = 100; // Limitar número de pontos para evitar problemas de desempenho
    const step = Math.max(dx, dy) / maxPoints;
    
    if (step <= 1) {
      // Se a linha for curta, usar algoritmo de Bresenham normal
      while (true) {
        points.push({ x, y });
        
        if (x === x2 && y === y2) break;
        
        const e2 = 2 * err;
        if (e2 > -dy) {
          err -= dy;
          x += sx;
        }
        if (e2 < dx) {
          err += dx;
          y += sy;
        }
      }
    } else {
      // Se a linha for longa, amostrar pontos ao longo dela
      for (let i = 0; i <= maxPoints; i++) {
        const t = i / maxPoints;
        const px = Math.round(x1 + (x2 - x1) * t);
        const py = Math.round(y1 + (y2 - y1) * t);
        points.push({ x: px, y: py });
      }
    }
    
    return points;
  };
  
  // Manipular clique no mapa durante teste de linha de visão
  const handleMapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!testMode) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    if (!testOrigin) {
      // Primeiro clique: definir origem
      setTestOrigin({ x, y });
    } else if (!testTarget) {
      // Segundo clique: definir alvo e calcular visibilidade
      setTestTarget({ x, y });
      
      // Calcular área visível a partir da origem
      const points = calculateVisibleArea(
        testOrigin,
        maxViewDistance,
        obstacles.filter(obs => obs.blocks_vision),
        0.5
      );
      
      setVisiblePoints(points);
      
      // Atualizar memória se estiver habilitada
      if (memoryEnabled) {
        updateMemory(points);
      }
      
      toast({
        title: 'Teste de linha de visão',
        description: `${points.length} pontos visíveis calculados`
      });
    }
      
      setVisiblePoints(points);
      
      // Notificar mudanças na área visível
      if (onVisibleAreaChange) {
        onVisibleAreaChange(points);
      }
      
      // Atualizar memória se estiver habilitada
      if (memoryEnabled) {
        updateMemory(points);
      }
      
      toast({
        title: 'Área visível calculada',
        description: `${points.length} pontos visíveis a partir da origem`
      });
    } else {
      // Terceiro clique: reiniciar teste
      setTestOrigin({ x, y });
      setTestTarget(null);
      setVisiblePoints([]);
    }
  };
  
  // Manipular início de arrasto de elementos
  const handleDragStart = (e: React.MouseEvent, type: 'obstacle' | 'light', id: string) => {
    if (!isGameMaster) return;
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;
    
    setDraggedItem({ type, id });
    setDragStartPos({ x: startX, y: startY });
    
    // Adicionar eventos de mouse ao documento
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  // Manipular movimento durante arrasto
  const handleDragMove = (e: MouseEvent) => {
    if (!draggedItem || !dragStartPos) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const deltaX = x - dragStartPos.x;
    const deltaY = y - dragStartPos.y;
    
    if (draggedItem.type === 'obstacle') {
      // Atualizar posição do obstáculo
      const updatedObstacles = obstacles.map(obs => {
        if (obs.id === draggedItem.id) {
          return {
            ...obs,
            x: obs.x + deltaX,
            y: obs.y + deltaY
          };
        }
        return obs;
      });
      
      onObstaclesUpdate(updatedObstacles);
    } else if (draggedItem.type === 'light') {
      // Atualizar posição da fonte de luz
      const updatedLightSources = lightSources.map(light => {
        if (light.id === draggedItem.id) {
          return {
            ...light,
            x: light.x + deltaX,
            y: light.y + deltaY
          };
        }
        return light;
      });
      
      setLightSources(updatedLightSources);
      if (onLightSourcesUpdate) {
        onLightSourcesUpdate(updatedLightSources);
      }
    }
    
    setDragStartPos({ x, y });
  };
  
  // Manipular fim de arrasto
  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragStartPos(null);
    
    // Remover eventos de mouse do documento
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    // Salvar alterações no banco de dados
    if (mapId) {
      if (draggedItem?.type === 'light') {
        // Salvar fontes de luz
        saveLightSourcesLocally(mapId, lightSources);
        
        // Notificar outros usuários
        supabase
          .channel(`los-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'light-update',
            payload: { lightSources }
          });
      } else if (draggedItem?.type === 'obstacle') {
        // Notificar outros usuários
        supabase
          .channel(`los-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'obstacle-update',
            payload: { obstacles }
          });
      }
    }
  };
  
  // Limpar eventos de arrasto ao desmontar o componente
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };
  }, []);
  
  // Renderizar visualização da linha de visão
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !testMode) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Habilitar interação com fontes de luz e obstáculos no modo de teste
    const handleLightInteraction = (e: MouseEvent) => {
      if (!isGameMaster) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Verificar se clicou em alguma fonte de luz
      for (const light of lightSources) {
        const distance = Math.sqrt(Math.pow(x - light.x, 2) + Math.pow(y - light.y, 2));
        if (distance <= 10) { // Raio de 10px para interação
          // Iniciar arrasto da fonte de luz
          setDraggedItem({ type: 'light', id: light.id });
          setDragStartPos({ x, y });
          
          // Adicionar eventos de mouse ao documento
          document.addEventListener('mousemove', handleDragMove);
          document.addEventListener('mouseup', handleDragEnd);
          return;
        }
      }
      
      // Verificar se clicou em algum obstáculo
      for (const obstacle of obstacles) {
        if (x >= obstacle.x && x <= obstacle.x + obstacle.width &&
            y >= obstacle.y && y <= obstacle.y + obstacle.height) {
          // Iniciar arrasto do obstáculo
          setDraggedItem({ type: 'obstacle', id: obstacle.id });
          setDragStartPos({ x, y });
          
          // Adicionar eventos de mouse ao documento
          document.addEventListener('mousemove', handleDragMove);
          document.addEventListener('mouseup', handleDragEnd);
          return;
        }
      }
    };
    
    // Adicionar evento de clique para interação
    if (isGameMaster && realtimeSimulation) {
      canvas.addEventListener('mousedown', handleLightInteraction);
      
      return () => {
        canvas.removeEventListener('mousedown', handleLightInteraction);
      };
    }
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar obstáculos
    obstacles.forEach(obstacle => {
      if (obstacle.blocks_vision) {
        ctx.fillStyle = `rgba(255, 0, 0, ${obstacle.opacity || 0.3})`;
      } else {
        ctx.fillStyle = `rgba(100, 100, 100, ${obstacle.opacity || 0.3})`;
      }
      ctx.strokeStyle = 'rgba(80, 80, 80, 0.8)';
      ctx.lineWidth = 1;
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Desenhar ponto de origem
    if (testOrigin) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(testOrigin.x, testOrigin.y, 5, 0, Math.PI * 2);
      ctx.fill();
      
      // Desenhar área visível
      if (visiblePoints.length > 0) {
        ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
        ctx.beginPath();
        ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
        for (let i = 1; i < visiblePoints.length; i++) {
          ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }
    
    // Desenhar linha entre origem e alvo
    if (testOrigin && testTarget) {
      // Verificar se há linha de visão direta
      const hasLineOfSight = !obstacles.some(obstacle => {
        if (!obstacle.blocks_vision) return false;
        return lineIntersectsRectangle(
          testOrigin.x, testOrigin.y,
          testTarget.x, testTarget.y,
          obstacle.x, obstacle.y,
          obstacle.width, obstacle.height
        );
      });
      
      // Desenhar linha
      ctx.strokeStyle = hasLineOfSight ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(testOrigin.x, testOrigin.y);
      ctx.lineTo(testTarget.x, testTarget.y);
      ctx.stroke();
      
      // Desenhar ponto alvo
      ctx.fillStyle = hasLineOfSight ? 'rgba(0, 255, 0, 0.7)' : 'rgba(255, 0, 0, 0.7)';
      ctx.beginPath();
      ctx.arc(testTarget.x, testTarget.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [testMode, testOrigin, testTarget, visiblePoints, obstacles, width, height]);
  
  // Renderizar iluminação dinâmica em tempo real
  useEffect(() => {
    if (!realtimeSimulation) return;
    
    const canvas = lightingCanvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar fundo com luz ambiente
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - ambientLight})`;
    ctx.fillRect(0, 0, width, height);
    
    // Configurar modo de composição para iluminação
    ctx.globalCompositeOperation = 'lighter';
    
    // Desenhar cada fonte de luz
    lightSources.forEach(light => {
      // Criar gradiente radial para a luz
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      
      // Extrair componentes RGB da cor da luz
      let color = light.color;
      if (color.startsWith('#')) {
        const r = parseInt(color.slice(1, 3), 16);
        const g = parseInt(color.slice(3, 5), 16);
        const b = parseInt(color.slice(5, 7), 16);
        color = `rgba(${r}, ${g}, ${b}`;
      } else if (color.startsWith('rgb')) {
        color = color.replace('rgb', 'rgba').replace(')', '');
      }
      
      // Configurar gradiente
      gradient.addColorStop(0, `${color}, ${light.intensity})`);
      gradient.addColorStop(0.5, `${color}, ${light.intensity * 0.5})`);
      gradient.addColorStop(1, `${color}, 0)`);
      
      ctx.fillStyle = gradient;
      
      // Se a luz projeta sombras, calcular área visível
      if (light.castShadows) {
        // Calcular pontos visíveis a partir da fonte de luz
        const lightPoints = calculateVisibleArea(
          { x: light.x, y: light.y },
          light.radius,
          obstacles.filter(obs => obs.blocks_vision),
          0.5 // Passo angular para melhor desempenho
        );
        
        // Desenhar área iluminada como polígono
        if (lightPoints.length > 0) {
          ctx.beginPath();
          ctx.moveTo(lightPoints[0].x, lightPoints[0].y);
          for (let i = 1; i < lightPoints.length; i++) {
            ctx.lineTo(lightPoints[i].x, lightPoints[i].y);
          }
          ctx.closePath();
          ctx.fill();
        }
      } else {
        // Se não projeta sombras, desenhar círculo simples
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // Desenhar indicador da fonte de luz
      ctx.fillStyle = 'rgba(255, 255, 200, 0.8)';
      ctx.beginPath();
      ctx.arc(light.x, light.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });
    
    // Restaurar modo de composição
    ctx.globalCompositeOperation = 'source-over';
    
    // Aplicar efeito de oscilação nas fontes de luz com flickering
    if (lightSources.some(light => light.flickering)) {
      const flickerTimeout = setTimeout(() => {
        // Atualizar intensidade das fontes de luz com efeito de oscilação
        const updatedLights = lightSources.map(light => {
          if (!light.flickering) return light;
          
          // Calcular nova intensidade com variação aleatória
          const flickerAmount = light.flickering || 0.2;
          const randomFactor = 1 - (flickerAmount / 2) + (Math.random() * flickerAmount);
          
          return {
            ...light,
            intensity: light.intensity * randomFactor
          };
        });
        
        setLightSources(updatedLights);
      }, 150); // Atualizar a cada 150ms para efeito de oscilação
      
      return () => clearTimeout(flickerTimeout);
    }
  }, [realtimeSimulation, lightSources, obstacles, ambientLight, width, height]);
  
  // Efeito para atualizar obstáculos dinâmicos
  useEffect(() => {
    if (!realtimeSimulation) return;
    
    // Atualizar posição de obstáculos dinâmicos a cada frame
    const animationFrame = requestAnimationFrame(() => {
      const dynamicObstacles = obstacles.filter(obs => obs.is_dynamic);
      if (dynamicObstacles.length === 0) return;
      
      // Atualizar posição dos obstáculos dinâmicos
      const updatedObstacles = updateDynamicObstacles(obstacles, 16/1000);
      onObstaclesUpdate(updatedObstacles);
      
      // Recalcular visibilidade
      calculateCombinedVisibility();
    });
    
    return () => cancelAnimationFrame(animationFrame);
  }, [realtimeSimulation, obstacles]);

  // Renderizar visualização de obstáculos (para o mestre)
  const renderObstaclePreview = () => {
    if (!isGameMaster || obstacles.length === 0) return null;
    
    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Obstáculos no Mapa</h4>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {obstacles.map(obstacle => (
            <div 
              key={obstacle.id} 
              className={`p-2 border rounded-md flex justify-between items-center cursor-move ${
                selectedObstacle?.id === obstacle.id ? 'border-primary bg-primary/10' : ''
              }`}
              onClick={() => setSelectedObstacle(obstacle)}
              onMouseDown={(e) => handleDragStart(e, 'obstacle', obstacle.id)}
            >
              <div>
                <p className="text-sm font-medium">{obstacle.id.replace('obstacle-', 'Obstáculo ')}</p>
                <p className="text-xs text-muted-foreground">
                  {obstacle.width}x{obstacle.height}, 
                  {obstacle.blocks_vision ? ' Bloqueia visão' : ''}
                  {obstacle.blocks_movement ? ' Bloqueia movimento' : ''}
                </p>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={(e) => {
                  e.stopPropagation();
                  removeObstacle(obstacle.id || '');
                }}
              >
                <Trash2 className="h-4 w-4" />
                <Move className="h-4 w-4 ml-1 opacity-50" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="line-of-sight-controller">
      {testMode && (
        <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm p-2 rounded-md border shadow-md">
          <div className="flex flex-col gap-2">
            <Button variant="destructive" size="sm" onClick={endLineOfSightTest}>
              Finalizar Teste
            </Button>
            <div className="text-xs text-muted-foreground">
              {!testOrigin ? 'Clique para definir origem' : 
               !testTarget ? 'Clique para definir alvo' : 
               'Clique para redefinir origem'}
            </div>
          </div>
        </div>
      )}
      
      {testMode && (
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 cursor-crosshair z-30"
          onClick={handleMapClick}
        />
      )}
      
      {showMemory && memoryEnabled && (
        <canvas
          ref={memoryCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 pointer-events-none z-20"
        />
      )}
      
      {realtimeSimulation && (
        <canvas
          ref={lightingCanvasRef}
          width={width}
          height={height}
          className="absolute top-0 left-0 z-25"
          onClick={(e) => {
            if (!isGameMaster) return;
            
            // Adicionar nova fonte de luz ao clicar no mapa quando estiver no modo de simulação
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // Verificar se já existe uma fonte de luz próxima
            const existingLight = lightSources.find(light => {
              const distance = Math.sqrt(Math.pow(x - light.x, 2) + Math.pow(y - light.y, 2));
              return distance <= 20; // Raio de 20px para evitar sobreposição
            });
            
            if (existingLight) {
              // Selecionar a fonte de luz existente
              setSelectedLightSource(existingLight);
            } else {
              // Criar nova fonte de luz no ponto clicado
              const newLight: LightSource = {
                id: `light-${Date.now()}`,
                x,
                y,
                radius: newLightRadius,
                color: newLightColor,
                intensity: newLightIntensity,
                flickering: newLightFlickering,
                castShadows: newLightCastShadows
              };
              
              const updatedLightSources = [...lightSources, newLight];
              setLightSources(updatedLightSources);
              setSelectedLightSource(newLight);
              
              // Notificar mudanças
              if (onLightSourcesUpdate) {
                onLightSourcesUpdate(updatedLightSources);
              }
              
              // Salvar localmente
              saveLightSourcesLocally(mapId, updatedLightSources);
              
              toast({
                title: 'Fonte de luz adicionada',
                description: 'Uma nova fonte de luz foi adicionada ao mapa'
              });
            }
          }}
        />
      )}
      
      {/* Overlay para mostrar dicas de interação */}
      {realtimeSimulation && isGameMaster && (
        <div className="absolute top-4 left-4 z-40 bg-background/80 backdrop-blur-sm p-2 rounded-md border shadow-md">
          <p className="text-xs text-muted-foreground">Clique no mapa para adicionar fontes de luz</p>
          <p className="text-xs text-muted-foreground">Arraste para mover fontes de luz e obstáculos</p>
        </div>
      )}
      
      {isGameMaster && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Controlador de Linha de Visão</span>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Salvar configuração atual
                    const config = {
                      obstacles,
                      lightSources,
                      memoryPoints,
                      settings: {
                        ambientLight,
                        timeOfDay,
                        memoryEnabled,
                        memoryOpacity,
                        memoryColor
                      }
                    };
                    
                    // Salvar localmente
                    const localGame = loadGameLocally(gameId) || { 
                      id: gameId, 
                      name: 'Jogo Atual', 
                      lastUpdated: new Date().toISOString(),
                      mapId
                    };
                    
                    saveGameLocally({
                      ...localGame,
                      obstacles,
                      lightSources,
                      memoryPoints,
                      losSettings: {
                        ambientLight,
                        timeOfDay,
                        memoryEnabled,
                        memoryOpacity,
                        memoryColor
                      },
                      lastUpdated: new Date().toISOString()
                    });
                    
                    // Salvar no banco de dados
                    if (mapId) {
                      supabase
                        .from('map_configurations')
                        .upsert({
                          map_id: mapId,
                          game_id: gameId,
                          user_id: userId,
                          config: JSON.stringify(config),
                          created_at: new Date().toISOString()
                        })
                        .then(({ error }) => {
                          if (error) {
                            console.error('Erro ao salvar configuração:', error);
                            toast({
                              title: 'Erro ao salvar',
                              description: 'A configuração foi salva apenas localmente'
                            });
                          } else {
                            toast({
                              title: 'Configuração salva',
                              description: 'Todas as configurações de linha de visão foram salvas'
                            });
                          }
                        });
                    } else {
                      toast({
                        title: 'Configuração salva localmente',
                        description: 'As configurações foram salvas apenas no navegador'
                      });
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                </Button>
                <Switch 
                  checked={showControls} 
                  onCheckedChange={setShowControls} 
                />
              </div>
            </CardTitle>
            <CardDescription>
              Gerencie obstáculos e controle o que os jogadores podem ver
            </CardDescription>
          </CardHeader>
          
          {showControls && (
            <CardContent>
              <Tabs defaultValue="add">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="add">Adicionar</TabsTrigger>
                  <TabsTrigger value="edit">Editar</TabsTrigger>
                  <TabsTrigger value="light">Iluminação</TabsTrigger>
                  <TabsTrigger value="test">Testar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="add" className="space-y-4 pt-4">
                  <div className="grid gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="obstacle-width">Largura</Label>
                        <Input
                          id="obstacle-width"
                          type="number"
                          value={newObstacleWidth}
                          onChange={(e) => setNewObstacleWidth(Number(e.target.value))}
                          min={gridSize / 2}
                          step={gridSize / 2}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="obstacle-height">Altura</Label>
                        <Input
                          id="obstacle-height"
                          type="number"
                          value={newObstacleHeight}
                          onChange={(e) => setNewObstacleHeight(Number(e.target.value))}
                          min={gridSize / 2}
                          step={gridSize / 2}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="obstacle-opacity">Opacidade</Label>
                      <Slider
                        id="obstacle-opacity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[newObstacleOpacity]}
                        onValueChange={(values) => setNewObstacleOpacity(values[0])}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="blocks-vision"
                        checked={newObstacleBlocksVision}
                        onCheckedChange={setNewObstacleBlocksVision}
                      />
                      <Label htmlFor="blocks-vision">Bloqueia visão</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="blocks-movement"
                        checked={newObstacleBlocksMovement}
                        onCheckedChange={setNewObstacleBlocksMovement}
                      />
                      <Label htmlFor="blocks-movement">Bloqueia movimento</Label>
                    </div>
                    
                    <Button onClick={addObstacle} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Obstáculo
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="edit" className="pt-4">
                  {renderObstaclePreview()}
                  
                  {selectedObstacle && (
                    <div className="mt-4 space-y-4 border-t pt-4">
                      <h4 className="font-medium">Editar Obstáculo</h4>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="edit-width">Largura</Label>
                          <Input
                            id="edit-width"
                            type="number"
                            value={selectedObstacle.width}
                            onChange={(e) => updateObstacleProperty(
                              selectedObstacle.id || '',
                              'width',
                              Number(e.target.value)
                            )}
                            min={gridSize / 2}
                            step={gridSize / 2}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="edit-height">Altura</Label>
                          <Input
                            id="edit-height"
                            type="number"
                            value={selectedObstacle.height}
                            onChange={(e) => updateObstacleProperty(
                              selectedObstacle.id || '',
                              'height',
                              Number(e.target.value)
                            )}
                            min={gridSize / 2}
                            step={gridSize / 2}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="edit-opacity">Opacidade</Label>
                        <Slider
                          id="edit-opacity"
                          min={0}
                          max={1}
                          step={0.1}
                          value={[selectedObstacle.opacity || 1]}
                          onValueChange={(values) => updateObstacleProperty(
                            selectedObstacle.id || '',
                            'opacity',
                            values[0]
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-blocks-vision"
                          checked={selectedObstacle.blocks_vision !== false}
                          onCheckedChange={(checked) => updateObstacleProperty(
                            selectedObstacle.id || '',
                            'blocks_vision',
                            checked
                          )}
                        />
                        <Label htmlFor="edit-blocks-vision">Bloqueia visão</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Switch
                          id="edit-blocks-movement"
                          checked={selectedObstacle.blocks_movement !== false}
                          onCheckedChange={(checked) => updateObstacleProperty(
                            selectedObstacle.id || '',
                            'blocks_movement',
                            checked
                          )}
                        />
                        <Label htmlFor="edit-blocks-movement">Bloqueia movimento</Label>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="light" className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="light-radius">Raio da Luz (metros)</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            id="light-radius"
                            min={1}
                            max={20}
                            step={1}
                            value={[newLightRadius / gridSize]}
                            onValueChange={(values) => setNewLightRadius(values[0] * gridSize)}
                          />
                          <span className="min-w-[3rem] text-right">{newLightRadius / gridSize}m</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="light-intensity">Intensidade</Label>
                        <div className="flex items-center gap-2">
                          <Slider
                            id="light-intensity"
                            min={0.1}
                            max={1.0}
                            step={0.1}
                            value={[newLightIntensity]}
                            onValueChange={(values) => setNewLightIntensity(values[0])}
                          />
                          <span className="min-w-[3rem] text-right">{Math.round(newLightIntensity * 100)}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="light-color">Cor da Luz</Label>
                      <div className="flex items-center gap-2">
                        <Input
                          id="light-color"
                          type="color"
                          value={newLightColor}
                          onChange={(e) => setNewLightColor(e.target.value)}
                          className="w-12 h-8 p-0"
                        />
                        <Input
                          type="text"
                          value={newLightColor}
                          onChange={(e) => setNewLightColor(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="light-flickering"
                        checked={newLightFlickering}
                        onCheckedChange={setNewLightFlickering}
                      />
                      <Label htmlFor="light-flickering">Efeito de oscilação (tochas, fogueiras)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="light-shadows"
                        checked={newLightCastShadows}
                        onCheckedChange={setNewLightCastShadows}
                      />
                      <Label htmlFor="light-shadows">Projetar sombras</Label>
                    </div>
                    
                    <Button onClick={addLightSource} className="w-full">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Adicionar Fonte de Luz
                    </Button>
                    
                    {lightSources.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium mb-2">Fontes de Luz no Mapa</h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {lightSources.map(light => (
                            <div 
                              key={light.id} 
                              className={`p-2 border rounded-md flex justify-between items-center cursor-move ${
                                selectedLightSource?.id === light.id ? 'border-primary bg-primary/10' : ''
                              }`}
                              onClick={() => setSelectedLightSource(light)}
                              onMouseDown={(e) => handleDragStart(e, 'light', light.id)}
                            >
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-4 h-4 rounded-full" 
                                  style={{ backgroundColor: light.color }}
                                />
                                <div>
                                  <p className="text-sm font-medium">{light.id.replace('light-', 'Luz ')}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Raio: {light.radius / gridSize}m, 
                                    Int: {Math.round(light.intensity * 100)}%
                                  </p>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeLightSource(light.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedLightSource && (
                      <div className="mt-4 space-y-4 border-t pt-4">
                        <h4 className="font-medium">Editar Fonte de Luz</h4>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-light-radius">Raio da Luz (metros)</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id="edit-light-radius"
                              min={1}
                              max={20}
                              step={1}
                              value={[selectedLightSource.radius / gridSize]}
                              onValueChange={(values) => updateLightProperty(
                                selectedLightSource.id,
                                'radius',
                                values[0] * gridSize
                              )}
                            />
                            <span className="min-w-[3rem] text-right">{selectedLightSource.radius / gridSize}m</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-light-intensity">Intensidade</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id="edit-light-intensity"
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              value={[selectedLightSource.intensity]}
                              onValueChange={(values) => updateLightProperty(
                                selectedLightSource.id,
                                'intensity',
                                values[0]
                              )}
                            />
                            <span className="min-w-[3rem] text-right">{Math.round(selectedLightSource.intensity * 100)}%</span>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="edit-light-color">Cor da Luz</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              id="edit-light-color"
                              type="color"
                              value={selectedLightSource.color}
                              onChange={(e) => updateLightProperty(
                                selectedLightSource.id,
                                'color',
                                e.target.value
                              )}
                              className="w-12 h-8 p-0"
                            />
                            <Input
                              type="text"
                              value={selectedLightSource.color}
                              onChange={(e) => updateLightProperty(
                                selectedLightSource.id,
                                'color',
                                e.target.value
                              )}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edit-light-flickering"
                            checked={selectedLightSource.flickering || false}
                            onCheckedChange={(checked) => updateLightProperty(
                              selectedLightSource.id,
                              'flickering',
                              checked
                            )}
                          />
                          <Label htmlFor="edit-light-flickering">Efeito de oscilação</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="edit-light-shadows"
                            checked={selectedLightSource.castShadows !== false}
                            onCheckedChange={(checked) => updateLightProperty(
                              selectedLightSource.id,
                              'castShadows',
                              checked
                            )}
                          />
                          <Label htmlFor="edit-light-shadows">Projetar sombras</Label>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="test" className="pt-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="view-distance">Distância Máxima de Visão (metros)</Label>
                      <div className="flex items-center gap-2">
                        <Slider
                          id="view-distance"
                          min={1}
                          max={30}
                          step={1}
                          value={[maxViewDistance / gridSize]}
                          onValueChange={(values) => setMaxViewDistance(values[0] * gridSize)}
                        />
                        <span className="min-w-[3rem] text-right">{maxViewDistance / gridSize}m</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-memory">Mostrar Memória</Label>
                        <Switch
                          id="toggle-memory"
                          checked={showMemory}
                          onCheckedChange={setShowMemory}
                        />
                      </div>
                      
                      {showMemory && (
                        <div className="space-y-2 mt-2">
                          <Label htmlFor="memory-opacity">Opacidade da Memória</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id="memory-opacity"
                              min={0.1}
                              max={1.0}
                              step={0.1}
                              value={[memoryOpacity]}
                              onValueChange={(values) => setMemoryOpacity(values[0])}
                            />
                            <span className="min-w-[3rem] text-right">{Math.round(memoryOpacity * 100)}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="toggle-realtime">Simulação em Tempo Real</Label>
                        <Switch
                          id="toggle-realtime"
                          checked={realtimeSimulation}
                          onCheckedChange={setRealtimeSimulation}
                        />
                      </div>
                      
                      {realtimeSimulation && (
                        <div className="space-y-2 mt-2">
                          <Label htmlFor="ambient-light">Luz Ambiente</Label>
                          <div className="flex items-center gap-2">
                            <Slider
                              id="amb