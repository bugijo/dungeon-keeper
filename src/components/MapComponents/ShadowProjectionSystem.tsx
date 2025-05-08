/**
 * Sistema de Projeção de Sombras
 * Implementa a funcionalidade de sombras projetadas por obstáculos
 * Parte do sistema avançado de Fog of War e iluminação do Dungeon Kreeper
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Point, Obstacle, RevealedArea } from '../../utils/fogOfWarUtils';
import { LightSource } from '../../utils/lightingUtils';

interface ShadowProjectionSystemProps {
  mapId: string;
  obstacles: Obstacle[];
  lightSources: LightSource[];
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
  onShadowsChange?: (shadowAreas: RevealedArea[]) => void;
  shadowQuality?: 'low' | 'medium' | 'high';
  enableSoftShadows?: boolean;
}

interface ShadowArea extends RevealedArea {
  intensity: number; // 0.0 = sem sombra, 1.0 = sombra total
  source_id: string; // ID da fonte de luz que projeta esta sombra
}

// Função auxiliar para calcular o ponto de interseção entre uma linha e um segmento
const calculateIntersection = (p1: Point, p2: Point, p3: Point, p4: Point): Point | null => {
  const denominator = ((p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y));
  
  // Linhas paralelas
  if (denominator === 0) return null;
  
  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denominator;
  const ub = ((p2.x - p1.x) * (p1.y - p3.y) - (p2.y - p1.y) * (p1.x - p3.x)) / denominator;
  
  // Verificar se a interseção está nos segmentos
  if (ua < 0 || ua > 1 || ub < 0 || ub > 1) return null;
  
  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y)
  };
};

// Função para calcular a projeção de sombra de um obstáculo a partir de uma fonte de luz
const calculateShadowProjection = (
  lightSource: LightSource,
  obstacle: Obstacle,
  mapWidth: number,
  mapHeight: number,
  shadowQuality: 'low' | 'medium' | 'high' = 'medium'
): ShadowArea[] => {
  // Determinar o número de raios a serem projetados com base na qualidade
  let rayCount = 8; // low
  if (shadowQuality === 'medium') rayCount = 16;
  if (shadowQuality === 'high') rayCount = 32;
  
  const shadowAreas: ShadowArea[] = [];
  
  // Obter os vértices do obstáculo
  let vertices: Point[] = [];
  
  if (obstacle.shape === 'rectangle') {
    const { x, y, width, height } = obstacle;
    vertices = [
      { x, y },
      { x: x + width, y },
      { x: x + width, y: y + height },
      { x, y: y + height }
    ];
  } else if (obstacle.shape === 'polygon' && obstacle.points) {
    vertices = obstacle.points;
  } else {
    // Formas não suportadas para projeção de sombra
    return [];
  }
  
  // Para cada vértice do obstáculo, projetar sombra
  for (let i = 0; i < vertices.length; i++) {
    const vertex = vertices[i];
    const nextVertex = vertices[(i + 1) % vertices.length];
    
    // Calcular vetor do ponto de luz para o vértice
    const dx1 = vertex.x - lightSource.position.x;
    const dy1 = vertex.y - lightSource.position.y;
    
    // Calcular vetor do ponto de luz para o próximo vértice
    const dx2 = nextVertex.x - lightSource.position.x;
    const dy2 = nextVertex.y - lightSource.position.y;
    
    // Normalizar e estender os vetores para alcançar os limites do mapa
    const extendFactor = Math.max(mapWidth, mapHeight) * 2;
    
    // Pontos projetados nos limites do mapa
    const projectedVertex1 = {
      x: vertex.x + dx1 * extendFactor,
      y: vertex.y + dy1 * extendFactor
    };
    
    const projectedVertex2 = {
      x: nextVertex.x + dx2 * extendFactor,
      y: nextVertex.y + dy2 * extendFactor
    };
    
    // Criar área de sombra como um polígono
    const shadowArea: ShadowArea = {
      shape: 'polygon',
      points: [
        vertex,
        nextVertex,
        projectedVertex2,
        projectedVertex1
      ],
      intensity: 0.8, // Intensidade da sombra (pode ser ajustada com base na distância)
      source_id: lightSource.id,
      color: 'rgba(0, 0, 0, 0.8)' // Cor da sombra
    };
    
    shadowAreas.push(shadowArea);
  }
  
  return shadowAreas;
};

const ShadowProjectionSystem: React.FC<ShadowProjectionSystemProps> = ({
  mapId,
  obstacles,
  lightSources,
  mapWidth,
  mapHeight,
  gridSize,
  onShadowsChange,
  shadowQuality = 'medium',
  enableSoftShadows = true
}) => {
  // Estado para armazenar áreas de sombra calculadas
  const [shadowAreas, setShadowAreas] = useState<ShadowArea[]>([]);
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Filtrar obstáculos que projetam sombras
  const shadowCastingObstacles = useMemo(() => {
    return obstacles.filter(obstacle => obstacle.casts_shadow !== false);
  }, [obstacles]);

  // Filtrar fontes de luz que projetam sombras
  const shadowCastingLights = useMemo(() => {
    return lightSources.filter(light => light.castShadows !== false);
  }, [lightSources]);

  // Função para calcular todas as sombras projetadas
  const calculateAllShadows = useCallback(() => {
    if (shadowCastingLights.length === 0 || shadowCastingObstacles.length === 0) {
      return [];
    }
    
    let allShadowAreas: ShadowArea[] = [];
    
    // Para cada fonte de luz, calcular sombras projetadas por cada obstáculo
    for (const light of shadowCastingLights) {
      for (const obstacle of shadowCastingObstacles) {
        // Verificar se o obstáculo está dentro do alcance da luz
        const distanceToObstacle = Math.sqrt(
          Math.pow(light.position.x - obstacle.x, 2) + 
          Math.pow(light.position.y - obstacle.y, 2)
        );
        
        // Só calcular sombras para obstáculos dentro do alcance da luz
        if (distanceToObstacle <= light.radius * 1.5) {
          const shadowsFromObstacle = calculateShadowProjection(
            light,
            obstacle,
            mapWidth,
            mapHeight,
            shadowQuality
          );
          
          allShadowAreas = [...allShadowAreas, ...shadowsFromObstacle];
        }
      }
    }
    
    // Aplicar efeito de sombras suaves se habilitado
    if (enableSoftShadows) {
      allShadowAreas = allShadowAreas.map(shadow => ({
        ...shadow,
        color: shadow.color.replace('0.8', '0.6'), // Reduzir opacidade para sombras mais suaves
        intensity: shadow.intensity * 0.75 // Reduzir intensidade
      }));
    }
    
    return allShadowAreas;
  }, [shadowCastingLights, shadowCastingObstacles, mapWidth, mapHeight, shadowQuality, enableSoftShadows]);

  // Efeito para recalcular sombras quando os parâmetros relevantes mudam
  useEffect(() => {
    const newShadowAreas = calculateAllShadows();
    setShadowAreas(newShadowAreas);
    
    // Notificar componente pai sobre mudanças nas sombras
    if (onShadowsChange) {
      onShadowsChange(newShadowAreas);
    }
    
    // Sincronizar com o Supabase para outros jogadores
    syncShadowsWithSupabase(newShadowAreas);
  }, [shadowCastingLights, shadowCastingObstacles, calculateAllShadows, onShadowsChange]);

  // Função para sincronizar sombras com o Supabase
  const syncShadowsWithSupabase = async (shadows: ShadowArea[]) => {
    try {
      // Primeiro, remover sombras antigas deste mapa
      await supabase
        .from('shadow_projections')
        .delete()
        .eq('map_id', mapId);
      
      // Inserir novas sombras
      if (shadows.length > 0) {
        const shadowsToInsert = shadows.map(shadow => ({
          map_id: mapId,
          shape: shadow.shape,
          points: shadow.points,
          intensity: shadow.intensity,
          source_id: shadow.source_id,
          color: shadow.color,
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('shadow_projections')
          .insert(shadowsToInsert);
      }
    } catch (error) {
      console.error('Erro ao sincronizar sombras projetadas:', error);
    }
  };

  // Configurar assinatura em tempo real para atualizações de obstáculos e fontes de luz
  useEffect(() => {
    const shadowsSubscription = supabase
      .channel(`shadows-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'shadow_projections', filter: `map_id=eq.${mapId}` },
        async () => {
          // Recarregar sombras quando houver mudanças
          try {
            const { data, error } = await supabase
              .from('shadow_projections')
              .select('*')
              .eq('map_id', mapId);
              
            if (error) throw error;
            
            if (data) {
              const formattedShadows: ShadowArea[] = data.map(item => ({
                shape: item.shape,
                points: item.points,
                intensity: item.intensity,
                source_id: item.source_id,
                color: item.color
              }));
              
              setShadowAreas(formattedShadows);
              
              if (onShadowsChange) {
                onShadowsChange(formattedShadows);
              }
            }
          } catch (error) {
            console.error('Erro ao atualizar sombras:', error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(shadowsSubscription);
    };
  }, [supabase, mapId, onShadowsChange]);

  // O componente não renderiza nada visualmente, apenas gerencia a lógica
  return null;
};

export default ShadowProjectionSystem;