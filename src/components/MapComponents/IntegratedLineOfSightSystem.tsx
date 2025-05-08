/**
 * Sistema Integrado de Linha de Visão
 * Implementa a funcionalidade de linha de visão baseada em obstáculos
 * Parte do sistema avançado de Fog of War do Dungeon Kreeper
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Point, Obstacle, RevealedArea, calculateVisibleArea, isPointInObstacle } from '../../utils/fogOfWarUtils';
import { LightSource, calculateCombinedLighting } from '../../utils/lightingUtils';

interface IntegratedLineOfSightSystemProps {
  mapId: string;
  playerId: string;
  isDungeonMaster: boolean;
  gridSize: number;
  mapWidth: number;
  mapHeight: number;
  playerPosition: Point;
  visionRadius: number;
  obstacles: Obstacle[];
  lightSources: LightSource[];
  onVisibilityChange?: (visibleAreas: RevealedArea[]) => void;
}

const IntegratedLineOfSightSystem: React.FC<IntegratedLineOfSightSystemProps> = ({
  mapId,
  playerId,
  isDungeonMaster,
  gridSize,
  mapWidth,
  mapHeight,
  playerPosition,
  visionRadius,
  obstacles,
  lightSources,
  onVisibilityChange
}) => {
  // Estado para armazenar áreas visíveis calculadas
  const [visibleAreas, setVisibleAreas] = useState<RevealedArea[]>([]);
  
  // Estado para controlar a atualização dinâmica
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(Date.now());
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Filtrar obstáculos que bloqueiam a visão
  const visionBlockingObstacles = useMemo(() => {
    return obstacles.filter(obstacle => obstacle.blocks_vision !== false);
  }, [obstacles]);

  // Função para calcular áreas visíveis com base na posição do jogador e obstáculos
  const calculatePlayerVisibility = useCallback(() => {
    if (!playerPosition) return [];
    
    // Se for o mestre, pode ver tudo (opcional, dependendo das regras do jogo)
    if (isDungeonMaster) {
      const fullMapArea: RevealedArea = {
        x: 0,
        y: 0,
        radius: Math.max(mapWidth, mapHeight),
        shape: 'square'
      };
      return [fullMapArea];
    }
    
    // Calcular área visível considerando obstáculos
    const visibleArea = calculateVisibleArea({
      origin: playerPosition,
      radius: visionRadius,
      obstacles: visionBlockingObstacles,
      mapWidth,
      mapHeight,
      gridSize
    });
    
    // Adicionar áreas iluminadas por fontes de luz
    const litAreas = lightSources.map(light => {
      // Verificar se a fonte de luz está visível para o jogador
      const isLightVisible = !visionBlockingObstacles.some(obstacle => 
        isPointInObstacle(light.position, obstacle) && 
        isPointInObstacle(playerPosition, obstacle)
      );
      
      if (!isLightVisible) return null;
      
      // Calcular área iluminada pela fonte de luz
      return calculateVisibleArea({
        origin: light.position,
        radius: light.radius * (light.intensity || 1),
        obstacles: visionBlockingObstacles,
        mapWidth,
        mapHeight,
        gridSize
      });
    }).filter(Boolean) as RevealedArea[];
    
    return [visibleArea, ...litAreas];
  }, [playerPosition, visionRadius, visionBlockingObstacles, lightSources, isDungeonMaster, mapWidth, mapHeight, gridSize]);

  // Efeito para recalcular visibilidade quando os parâmetros relevantes mudam
  useEffect(() => {
    const newVisibleAreas = calculatePlayerVisibility();
    setVisibleAreas(newVisibleAreas);
    
    // Notificar componente pai sobre mudanças na visibilidade
    if (onVisibilityChange) {
      onVisibilityChange(newVisibleAreas);
    }
    
    // Sincronizar com o Supabase para outros jogadores
    if (!isDungeonMaster) {
      syncVisibilityWithSupabase(newVisibleAreas);
    }
    
    setLastUpdateTime(Date.now());
  }, [playerPosition, visionRadius, obstacles, lightSources, calculatePlayerVisibility, onVisibilityChange]);

  // Função para sincronizar visibilidade com o Supabase
  const syncVisibilityWithSupabase = async (areas: RevealedArea[]) => {
    try {
      // Primeiro, remover áreas antigas deste jogador
      await supabase
        .from('revealed_areas')
        .delete()
        .eq('created_by', playerId)
        .eq('map_id', mapId);
      
      // Inserir novas áreas visíveis
      if (areas.length > 0) {
        const areasToInsert = areas.map(area => ({
          ...area,
          created_by: playerId,
          map_id: mapId,
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('revealed_areas')
          .insert(areasToInsert);
      }
    } catch (error) {
      console.error('Erro ao sincronizar áreas visíveis:', error);
    }
  };

  // Configurar assinatura em tempo real para atualizações de obstáculos
  useEffect(() => {
    const obstaclesSubscription = supabase
      .channel(`obstacles-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'obstacles', filter: `map_id=eq.${mapId}` },
        () => {
          // Recarregar obstáculos quando houver mudanças
          // Nota: A implementação completa exigiria uma função para buscar obstáculos atualizados
          // Esta é uma versão simplificada que apenas força uma recalculação
          setLastUpdateTime(Date.now());
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(obstaclesSubscription);
    };
  }, [supabase, mapId]);

  // O componente não renderiza nada visualmente, apenas gerencia a lógica
  return null;
};

export default IntegratedLineOfSightSystem;