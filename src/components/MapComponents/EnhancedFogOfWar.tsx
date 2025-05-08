import React, { useState, useEffect, useRef } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { RevealedArea, Point, Obstacle } from '../../types/game';
import { LightSource } from '../../types/lightSource';
import {
  calculateVisibleArea,
  lineIntersectsRectangle,
  isPointInRevealedArea
} from '../../utils/fogOfWarUtils';
import { calculateCombinedLighting } from '../../utils/lightingUtils';
import { saveLightSourcesLocally } from '../../utils/saveLightSourcesLocally';
import { saveGameLocally } from '../../utils/saveGameLocally';
import useMapCache from '../../hooks/useMapCache';
import useAutoSave from '../../hooks/useAutoSave';
import useLineOfSightSync from '../../hooks/useLineOfSightSync';

interface EnhancedFogOfWarProps {
  mapId: string;
  revealedAreas: RevealedArea[];
  obstacles: Obstacle[];
  lightSources: LightSource[];
  playerPosition?: Point;
  isGameMaster: boolean;
  fogColor: string;
  fogOpacity: number;
  edgeBlur: number;
  transitionSpeed: number;
  snapToGridEnabled: boolean;
  gridSize: number;
  enableLineOfSight: boolean;
  enableLightSources: boolean;
  enableMemorySystem: boolean;
  onAreaRevealed?: (area: RevealedArea) => void;
}

const EnhancedFogOfWar: React.FC<EnhancedFogOfWarProps> = ({
  mapId,
  revealedAreas,
  obstacles,
  lightSources,
  playerPosition,
  isGameMaster,
  fogColor,
  fogOpacity,
  edgeBlur,
  transitionSpeed,
  snapToGridEnabled,
  gridSize,
  enableLineOfSight,
  enableLightSources,
  enableMemorySystem,
  onAreaRevealed
}) => {
  const supabase = useSupabaseClient();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visibleAreas, setVisibleAreas] = useState<RevealedArea[]>([]);
  const [memoryAreas, setMemoryAreas] = useState<RevealedArea[]>([]);
  const [dynamicLightMap, setDynamicLightMap] = useState<Map<string, { isLit: boolean, intensity: number, color: string }>>(
    new Map()
  );
  
  // Hooks personalizados
  const { cacheMap, updateCache } = useMapCache(mapId);
  const { autoSave } = useAutoSave(mapId, 30000); // Auto-save a cada 30 segundos
  const { syncLineOfSight } = useLineOfSightSync(mapId, supabase);

  // Efeito para calcular áreas visíveis baseadas em linha de visão
  useEffect(() => {
    if (!enableLineOfSight || !playerPosition) return;
    
    // Calcular áreas visíveis a partir da posição do jogador
    const newVisibleAreas = calculateVisibleArea(
      playerPosition,
      obstacles.filter(obs => obs.blocks_vision),
      150 // Raio de visão padrão
    );
    
    setVisibleAreas(prev => {
      // Manter apenas áreas que ainda são visíveis ou foram reveladas pelo mestre
      const masterRevealedAreas = revealedAreas.filter(area => 
        !area.is_dynamic && area.created_by === 'master'
      );
      
      return [...masterRevealedAreas, ...newVisibleAreas];
    });
    
    // Sincronizar linha de visão com outros jogadores
    if (playerPosition) {
      syncLineOfSight(playerPosition, obstacles);
    }
  }, [playerPosition, obstacles, enableLineOfSight, revealedAreas]);

  // Efeito para processar fontes de luz
  useEffect(() => {
    if (!enableLightSources || lightSources.length === 0) return;
    
    // Criar mapa de iluminação dinâmica
    const newLightMap = new Map<string, { isLit: boolean, intensity: number, color: string }>();
    
    // Processar cada célula do grid para determinar iluminação
    const gridCellSize = 20; // Tamanho de cada célula para cálculos de iluminação
    const mapWidth = canvasRef.current?.width || 2000;
    const mapHeight = canvasRef.current?.height || 2000;
    
    for (let x = 0; x < mapWidth; x += gridCellSize) {
      for (let y = 0; y < mapHeight; y += gridCellSize) {
        const point = { x: x + gridCellSize/2, y: y + gridCellSize/2 };
        const lighting = calculateCombinedLighting(lightSources, point, obstacles);
        
        if (lighting.isLit) {
          const key = `${Math.floor(x/gridCellSize)},${Math.floor(y/gridCellSize)}`;
          newLightMap.set(key, lighting);
        }
      }
    }
    
    setDynamicLightMap(newLightMap);
    
    // Salvar fontes de luz localmente
    saveLightSourcesLocally(mapId, lightSources);
  }, [lightSources, obstacles, enableLightSources, mapId]);

  // Efeito para sistema de memória
  useEffect(() => {
    if (!enableMemorySystem) return;
    
    // Adicionar áreas visíveis à memória
    setMemoryAreas(prev => {
      const newMemoryAreas = [...prev];
      
      visibleAreas.forEach(area => {
        // Verificar se a área já está na memória
        const existingIndex = newMemoryAreas.findIndex(memArea => 
          memArea.x === area.x && memArea.y === area.y && memArea.radius === area.radius
        );
        
        if (existingIndex === -1) {
          // Adicionar à memória com opacidade reduzida
          newMemoryAreas.push({
            ...area,
            opacity: (area.opacity || 1) * 0.5, // Memória é mais transparente
            color: area.color || fogColor
          });
        }
      });
      
      return newMemoryAreas;
    });
    
    // Salvar áreas de memória localmente
    if (memoryAreas.length > 0) {
      const gameData = {
        id: mapId,
        name: `Map ${mapId}`,
        lastUpdated: new Date().toISOString(),
        mapId,
        revealedAreas,
        memoryPoints: memoryAreas.map(area => ({ x: area.x, y: area.y })),
        lightSources,
        obstacles
      };
      
      saveGameLocally(gameData);
    }
  }, [visibleAreas, enableMemorySystem, mapId, revealedAreas, lightSources, obstacles, fogColor]);

  // Renderização do canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar névoa base
    ctx.fillStyle = fogColor;
    ctx.globalAlpha = fogOpacity;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Configurar desfoque de borda
    if (edgeBlur > 0) {
      ctx.shadowBlur = edgeBlur;
      ctx.shadowColor = fogColor;
    }
    
    // Função para desenhar área revelada
    const drawRevealedArea = (area: RevealedArea, alpha: number = 1) => {
      ctx.globalAlpha = alpha * (area.opacity || 1);
      ctx.globalCompositeOperation = 'destination-out';
      
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
      } else if (area.shape === 'polygon' && area.points) {
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
      
      // Restaurar modo de composição
      ctx.globalCompositeOperation = 'source-over';
    };
    
    // Desenhar áreas de memória (mais transparentes)
    if (enableMemorySystem) {
      memoryAreas.forEach(area => {
        drawRevealedArea(area, 0.5);
      });
    }
    
    // Desenhar áreas reveladas
    revealedAreas.forEach(area => {
      drawRevealedArea(area);
    });
    
    // Desenhar áreas visíveis por linha de visão
    if (enableLineOfSight) {
      visibleAreas.forEach(area => {
        drawRevealedArea(area);
      });
    }
    
    // Desenhar efeitos de iluminação dinâmica
    if (enableLightSources && dynamicLightMap.size > 0) {
      ctx.globalCompositeOperation = 'lighter';
      
      dynamicLightMap.forEach((lighting, key) => {
        const [gridX, gridY] = key.split(',').map(Number);
        const x = gridX * 20;
        const y = gridY * 20;
        
        // Criar gradiente radial para efeito de luz
        const gradient = ctx.createRadialGradient(
          x + 10, y + 10, 0,
          x + 10, y + 10, 30
        );
        
        gradient.addColorStop(0, lighting.color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalAlpha = lighting.intensity;
        ctx.fillStyle = gradient;
        ctx.fillRect(x - 10, y - 10, 40, 40);
      });
      
      // Restaurar modo de composição
      ctx.globalCompositeOperation = 'source-over';
    }
    
    // Restaurar alpha
    ctx.globalAlpha = 1;
    
    // Atualizar cache do mapa
    updateCache(canvas.toDataURL());
    
    // Auto-save
    autoSave({
      revealedAreas,
      visibleAreas,
      memoryAreas,
      lightSources,
      obstacles
    });
  }, [
    revealedAreas,
    visibleAreas,
    memoryAreas,
    dynamicLightMap,
    fogColor,
    fogOpacity,
    edgeBlur,
    enableLineOfSight,
    enableLightSources,
    enableMemorySystem,
    updateCache,
    autoSave
  ]);

  // Função para revelar área (para o mestre)
  const handleRevealArea = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isGameMaster) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Ajustar para snap to grid se necessário
    if (snapToGridEnabled && gridSize > 0) {
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }
    
    const newArea: RevealedArea = {
      id: `area-${Date.now()}`,
      x,
      y,
      radius: 100, // Raio padrão
      shape: 'circle',
      created_by: 'master',
      created_at: new Date().toISOString()
    };
    
    if (onAreaRevealed) {
      onAreaRevealed(newArea);
    }
  };

  return (
    <canvas
      ref={canvasRef}
      width={2000}
      height={2000}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: isGameMaster ? 'auto' : 'none',
        transition: `opacity ${transitionSpeed}ms ease-in-out`
      }}
      onClick={handleRevealArea}
    />
  );
};

export default EnhancedFogOfWar;