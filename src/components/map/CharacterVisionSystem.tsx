import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'wall' | 'door' | 'window' | 'furniture';
  blocksVision: boolean;
}

interface CharacterVisionSystemProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  characters: Character[];
  obstacles: Obstacle[];
  activeCharacterId?: string;
  onVisionUpdate?: (visibleAreas: { x: number; y: number; radius: number }[]) => void;
}

const CharacterVisionSystem: React.FC<CharacterVisionSystemProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  characters,
  obstacles,
  activeCharacterId,
  onVisionUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visibleAreas, setVisibleAreas] = useState<{ x: number; y: number; radius: number }[]>([]);
  const [visionMode, setVisionMode] = useState<'all' | 'active' | 'owned'>('owned');
  const [showVisionOverlay, setShowVisionOverlay] = useState<boolean>(true);
  const [visionQuality, setVisionQuality] = useState<'low' | 'medium' | 'high'>('medium');
  
  // Função para verificar se um ponto está visível a partir de uma origem
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
  
  // Calcular áreas visíveis com base nas posições dos personagens
  useEffect(() => {
    const calculateVisibleAreas = () => {
      const newVisibleAreas: { x: number; y: number; radius: number }[] = [];
      
      // Filtrar personagens com base no modo de visão
      const visibleCharacters = characters.filter(character => {
        if (isGameMaster) return true; // Mestre vê tudo
        if (visionMode === 'all') return true;
        if (visionMode === 'active' && character.id === activeCharacterId) return true;
        if (visionMode === 'owned' && character.ownerId === userId) return true;
        return false;
      });
      
      // Definir a qualidade da visão (número de raios)
      const rayCount = visionQuality === 'low' ? 36 : visionQuality === 'medium' ? 72 : 144;
      const angleStep = 360 / rayCount;
      
      // Adicionar áreas visíveis a partir das posições dos personagens
      visibleCharacters.forEach(character => {
        // Criar uma grade de pontos ao redor do personagem para verificar visibilidade
        const visionRadius = character.visionRadius || 5 * gridSize;
        const step = gridSize / (visionQuality === 'low' ? 4 : visionQuality === 'medium' ? 2 : 1);
        
        for (let angle = 0; angle < 360; angle += angleStep) {
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
              radius: gridSize / 2
            });
          }
        }
        
        // Adicionar a posição do personagem como área visível
        newVisibleAreas.push({
          x: character.x,
          y: character.y,
          radius: gridSize
        });
        
        // Adicionar áreas especiais para personagens com visões especiais
        if (character.hasNightVision || (character.visionBonuses?.darkvision ?? 0) > 0) {
          const darkvisionRadius = character.visionBonuses?.darkvision ?? (3 * gridSize);
          newVisibleAreas.push({
            x: character.x,
            y: character.y,
            radius: darkvisionRadius
          });
        }
        
        if (character.hasBlindSight || (character.visionBonuses?.blindsight ?? 0) > 0) {
          const blindsightRadius = character.visionBonuses?.blindsight ?? (2 * gridSize);
          // Visão cega ignora obstáculos em um raio curto
          newVisibleAreas.push({
            x: character.x,
            y: character.y,
            radius: blindsightRadius
          });
        }
        
        if (character.hasTruesight || (character.visionBonuses?.truesight ?? 0) > 0) {
          const truesightRadius = character.visionBonuses?.truesight ?? (4 * gridSize);
          // Visão verdadeira ignora ilusões e vê através de paredes mágicas
          newVisibleAreas.push({
            x: character.x,
            y: character.y,
            radius: truesightRadius
          });
        }
      });
      
      setVisibleAreas(newVisibleAreas);
      
      // Notificar sobre mudanças nas áreas visíveis
      if (onVisionUpdate) {
        onVisionUpdate(newVisibleAreas);
      }
    };
    
    calculateVisibleAreas();
  }, [characters, obstacles, gridSize, visionMode, activeCharacterId, userId, isGameMaster, visionQuality, onVisionUpdate]);
  
  // Renderizar visualização da visão dos personagens
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !showVisionOverlay) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar o canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar áreas visíveis
    visibleAreas.forEach(area => {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });
    
    // Desenhar personagens
    characters.forEach(character => {
      const isActive = character.id === activeCharacterId;
      const isOwned = character.ownerId === userId;
      
      ctx.fillStyle = character.visionColor || (isActive ? 'rgba(0, 255, 0, 0.7)' : isOwned ? 'rgba(0, 0, 255, 0.7)' : 'rgba(255, 255, 0, 0.7)');
      ctx.beginPath();
      ctx.arc(character.x, character.y, gridSize / 2, 0, Math.PI * 2);
      ctx.fill();
      
      // Desenhar nome do personagem
      ctx.fillStyle = 'white';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(character.name, character.x, character.y - gridSize / 2 - 5);
      
      // Desenhar círculo de visão
      ctx.strokeStyle = character.visionColor || (isActive ? 'rgba(0, 255, 0, 0.3)' : isOwned ? 'rgba(0, 0, 255, 0.3)' : 'rgba(255, 255, 0, 0.3)');
      ctx.beginPath();
      ctx.arc(character.x, character.y, character.visionRadius || 5 * gridSize, 0, Math.PI * 2);
      ctx.stroke();
    });
    
    // Desenhar obstáculos
    obstacles.forEach(obstacle => {
      ctx.fillStyle = obstacle.blocksVision ? 'rgba(255, 0, 0, 0.3)' : 'rgba(255, 255, 0, 0.3)';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  }, [visibleAreas, characters, obstacles, width, height, showVisionOverlay, activeCharacterId, userId, gridSize]);
  
  // Alternar modo de visão
  const toggleVisionMode = () => {
    setVisionMode(prev => {
      if (prev === 'all') return 'active';
      if (prev === 'active') return 'owned';
      return 'all';
    });
  };
  
  // Alternar exibição da sobreposição de visão
  const toggleVisionOverlay = () => {
    setShowVisionOverlay(prev => !prev);
  };
  
  // Alternar qualidade da visão
  const toggleVisionQuality = () => {
    setVisionQuality(prev => {
      if (prev === 'low') return 'medium';
      if (prev === 'medium') return 'high';
      return 'low';
    });
  };
  
  return {
    canvasElement: (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    ),
    visibleAreas,
    visionMode,
    showVisionOverlay,
    visionQuality,
    toggleVisionMode,
    toggleVisionOverlay,
    toggleVisionQuality
  };
};

export default CharacterVisionSystem;