import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface AdvancedLineOfSightProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  characterPositions: { id: string; x: number; y: number; visionRadius: number }[];
  obstacles: Obstacle[];
  lightSources: LightSource[];
  onVisibleAreaChange: (areas: { x: number; y: number; radius: number; intensity: number }[]) => void;
}

const AdvancedLineOfSight: React.FC<AdvancedLineOfSightProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  characterPositions,
  obstacles,
  lightSources,
  onVisibleAreaChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visibleAreas, setVisibleAreas] = useState<{ x: number; y: number; radius: number; intensity: number }[]>([]);
  const [memoryAreas, setMemoryAreas] = useState<{ x: number; y: number; radius: number; intensity: number }[]>([]);
  
  // Função para calcular se um ponto está visível a partir de uma origem
  const isPointVisible = (originX: number, originY: number, targetX: number, targetY: number): boolean => {
    // Verificar se há obstáculos bloqueando a visão
    return !obstacles.some(obstacle => {
      if (!obstacle.blocksVision) return false;
      
      return lineIntersectsRectangle(
        originX, originY,
        targetX, targetY,
        obstacle.x, obstacle.y,
        obstacle.width, obstacle.height
      );
    });
  };
  
  // Função para verificar se uma linha intersecta um retângulo
  const lineIntersectsRectangle = (
    x1: number, y1: number,
    x2: number, y2: number,
    rectX: number, rectY: number,
    rectWidth: number, rectHeight: number
  ): boolean => {
    // Verificar se a linha intersecta alguma das 4 bordas do retângulo
    return (
      lineIntersectsLine(x1, y1, x2, y2, rectX, rectY, rectX + rectWidth, rectY) ||
      lineIntersectsLine(x1, y1, x2, y2, rectX + rectWidth, rectY, rectX + rectWidth, rectY + rectHeight) ||
      lineIntersectsLine(x1, y1, x2, y2, rectX + rectWidth, rectY + rectHeight, rectX, rectY + rectHeight) ||
      lineIntersectsLine(x1, y1, x2, y2, rectX, rectY + rectHeight, rectX, rectY)
    );
  };
  
  // Função para verificar se duas linhas se intersectam
  const lineIntersectsLine = (
    x1: number, y1: number,
    x2: number, y2: number,
    x3: number, y3: number,
    x4: number, y4: number
  ): boolean => {
    const denominator = ((y4 - y3) * (x2 - x1)) - ((x4 - x3) * (y2 - y1));
    
    // Linhas são paralelas
    if (denominator === 0) return false;
    
    const ua = (((x4 - x3) * (y1 - y3)) - ((y4 - y3) * (x1 - x3))) / denominator;
    const ub = (((x2 - x1) * (y1 - y3)) - ((y2 - y1) * (x1 - x3))) / denominator;
    
    // Verificar se a interseção está dentro dos segmentos de linha
    return (ua >= 0 && ua <= 1) && (ub >= 0 && ub <= 1);
  };
  
  // Calcular áreas visíveis com base nas posições dos personagens e fontes de luz
  useEffect(() => {
    const calculateVisibleAreas = () => {
      const newVisibleAreas: { x: number; y: number; radius: number; intensity: number }[] = [];
      
      // Adicionar áreas visíveis a partir das posições dos personagens
      characterPositions.forEach(character => {
        // Criar uma grade de pontos ao redor do personagem para verificar visibilidade
        const visionRadius = character.visionRadius || 5 * gridSize;
        const step = gridSize / 2; // Metade do tamanho do grid para maior precisão
        
        for (let angle = 0; angle < 360; angle += 10) {
          const radians = (angle * Math.PI) / 180;
          let maxVisibleDistance = 0;
          
          // Verificar até onde o personagem consegue ver nesta direção
          for (let distance = step; distance <= visionRadius; distance += step) {
            const checkX = character.x + Math.cos(radians) * distance;
            const checkY = character.y + Math.sin(radians) * distance;
            
            if (!isPointVisible(character.x, character.y, checkX, checkY)) {
              break;
            }
            
            maxVisibleDistance = distance;
          }
          
          if (maxVisibleDistance > 0) {
            const visibleX = character.x + Math.cos(radians) * maxVisibleDistance;
            const visibleY = character.y + Math.sin(radians) * maxVisibleDistance;
            
            newVisibleAreas.push({
              x: visibleX,
              y: visibleY,
              radius: gridSize / 2, // Pequena área visível no ponto final
              intensity: 1.0 - (maxVisibleDistance / visionRadius) // Intensidade diminui com a distância
            });
          }
        }
        
        // Adicionar a posição do personagem como área visível
        newVisibleAreas.push({
          x: character.x,
          y: character.y,
          radius: gridSize,
          intensity: 1.0
        });
      });
      
      // Adicionar áreas visíveis a partir das fontes de luz
      lightSources.forEach(light => {
        // Criar uma grade de pontos ao redor da fonte de luz para verificar visibilidade
        const step = gridSize / 2;
        
        for (let angle = 0; angle < 360; angle += 10) {
          const radians = (angle * Math.PI) / 180;
          let maxVisibleDistance = 0;
          
          // Verificar até onde a luz consegue alcançar nesta direção
          for (let distance = step; distance <= light.radius; distance += step) {
            const checkX = light.x + Math.cos(radians) * distance;
            const checkY = light.y + Math.sin(radians) * distance;
            
            if (!isPointVisible(light.x, light.y, checkX, checkY)) {
              break;
            }
            
            maxVisibleDistance = distance;
          }
          
          if (maxVisibleDistance > 0) {
            const visibleX = light.x + Math.cos(radians) * maxVisibleDistance;
            const visibleY = light.y + Math.sin(radians) * maxVisibleDistance;
            
            newVisibleAreas.push({
              x: visibleX,
              y: visibleY,
              radius: gridSize / 2,
              intensity: light.intensity * (1.0 - (maxVisibleDistance / light.radius))
            });
          }
        }
        
        // Adicionar a posição da fonte de luz como área visível
        newVisibleAreas.push({
          x: light.x,
          y: light.y,
          radius: gridSize,
          intensity: light.intensity
        });
      });
      
      setVisibleAreas(newVisibleAreas);
      
      // Atualizar áreas de memória (áreas já vistas)
      const newMemoryAreas = [...memoryAreas];
      
      newVisibleAreas.forEach(area => {
        // Verificar se esta área já está na memória
        const existingIndex = newMemoryAreas.findIndex(
          memory => Math.abs(memory.x - area.x) < gridSize && Math.abs(memory.y - area.y) < gridSize
        );
        
        if (existingIndex >= 0) {
          // Atualizar área existente com maior intensidade
          newMemoryAreas[existingIndex].intensity = Math.max(newMemoryAreas[existingIndex].intensity, area.intensity * 0.5);
        } else {
          // Adicionar nova área à memória com intensidade reduzida
          newMemoryAreas.push({
            ...area,
            intensity: area.intensity * 0.3 // Áreas de memória são mais escuras
          });
        }
      });
      
      setMemoryAreas(newMemoryAreas);
      
      // Notificar sobre mudanças nas áreas visíveis
      if (onVisibleAreaChange) {
        onVisibleAreaChange([...newMemoryAreas, ...newVisibleAreas]);
      }
    };
    
    calculateVisibleAreas();
  }, [characterPositions, lightSources, obstacles, gridSize, onVisibleAreaChange]);
  
  // Renderizar visualização da linha de visão
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar o canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar áreas de memória (áreas já vistas)
    memoryAreas.forEach(area => {
      ctx.fillStyle = `rgba(100, 100, 255, ${area.intensity * 0.2})`;
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Desenhar áreas visíveis
    visibleAreas.forEach(area => {
      ctx.fillStyle = `rgba(0, 255, 0, ${area.intensity * 0.3})`;
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Desenhar obstáculos
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.blocksVision ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Desenhar fontes de luz
    lightSources.forEach(light => {
      const gradient = ctx.createRadialGradient(
        light.x, light.y, 0,
        light.x, light.y, light.radius
      );
      
      gradient.addColorStop(0, `rgba(255, 255, 200, ${light.intensity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 200, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(light.x, light.y, light.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [visibleAreas, memoryAreas, obstacles, lightSources, width, height]);
  
  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
    />
  );
};

export default AdvancedLineOfSight;