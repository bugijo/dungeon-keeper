/**
 * Sistema Integrado de Iluminação
 * Combina o sistema de sombras projetadas com o sistema de iluminação dinâmica
 * Fornece uma experiência visual completa para o Fog of War avançado
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Point, Obstacle, RevealedArea } from '../../utils/fogOfWarUtils';
import { LightSource } from '../../utils/lightingUtils';
import ShadowProjectionSystem from './ShadowProjectionSystem';
import DynamicLightingSystem from './DynamicLightingSystem';

interface IntegratedLightingSystemProps {
  mapId: string;
  obstacles: Obstacle[];
  lightSources: LightSource[];
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
  onVisibilityChange?: (visibleAreas: RevealedArea[], shadowAreas: RevealedArea[]) => void;
  ambientLight?: number;
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night';
  weatherCondition?: 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy';
  shadowQuality?: 'low' | 'medium' | 'high';
  enableSoftShadows?: boolean;
  enableFlickering?: boolean;
}

const IntegratedLightingSystem: React.FC<IntegratedLightingSystemProps> = ({
  mapId,
  obstacles,
  lightSources,
  mapWidth,
  mapHeight,
  gridSize,
  onVisibilityChange,
  ambientLight = 0.3,
  timeOfDay = 'day',
  weatherCondition = 'clear',
  shadowQuality = 'medium',
  enableSoftShadows = true,
  enableFlickering = true
}) => {
  // Estados para armazenar áreas iluminadas e áreas de sombra
  const [lightAreas, setLightAreas] = useState<RevealedArea[]>([]);
  const [shadowAreas, setShadowAreas] = useState<RevealedArea[]>([]);
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Calcular áreas visíveis combinando áreas iluminadas e áreas de sombra
  const visibleAreas = useMemo(() => {
    // Se não houver áreas iluminadas, retornar vazio
    if (lightAreas.length === 0) return [];
    
    // Se não houver áreas de sombra, retornar apenas áreas iluminadas
    if (shadowAreas.length === 0) return lightAreas;
    
    // Combinar áreas iluminadas com áreas de sombra
    // Neste caso, estamos simplesmente retornando ambas as áreas
    // Em uma implementação mais avançada, poderíamos calcular a interseção
    // e ajustar a intensidade da luz nas áreas sombreadas
    return [...lightAreas];
  }, [lightAreas, shadowAreas]);

  // Efeito para notificar o componente pai sobre mudanças na visibilidade
  useEffect(() => {
    if (onVisibilityChange) {
      onVisibilityChange(visibleAreas, shadowAreas);
    }
    
    // Sincronizar com o Supabase para outros jogadores
    syncVisibilityWithSupabase(visibleAreas, shadowAreas);
  }, [visibleAreas, shadowAreas, onVisibilityChange]);

  // Função para sincronizar visibilidade com o Supabase
  const syncVisibilityWithSupabase = async (visible: RevealedArea[], shadows: RevealedArea[]) => {
    try {
      // Atualizar configurações de visibilidade do mapa
      await supabase
        .from('map_visibility')
        .upsert({
          map_id: mapId,
          visible_areas_count: visible.length,
          shadow_areas_count: shadows.length,
          has_dynamic_lighting: true,
          updated_at: new Date().toISOString()
        }, { onConflict: 'map_id' });
    } catch (error) {
      console.error('Erro ao sincronizar visibilidade:', error);
    }
  };

  // Manipuladores para mudanças nas áreas iluminadas e áreas de sombra
  const handleLightingChange = (areas: RevealedArea[]) => {
    setLightAreas(areas);
  };

  const handleShadowsChange = (areas: RevealedArea[]) => {
    setShadowAreas(areas);
  };

  return (
    <>
      {/* Sistema de Iluminação Dinâmica */}
      <DynamicLightingSystem
        mapId={mapId}
        obstacles={obstacles}
        lightSources={lightSources}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        gridSize={gridSize}
        onLightingChange={handleLightingChange}
        ambientLight={ambientLight}
        timeOfDay={timeOfDay}
        weatherCondition={weatherCondition}
        enableFlickering={enableFlickering}
      />
      
      {/* Sistema de Projeção de Sombras */}
      <ShadowProjectionSystem
        mapId={mapId}
        obstacles={obstacles}
        lightSources={lightSources}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        gridSize={gridSize}
        onShadowsChange={handleShadowsChange}
        shadowQuality={shadowQuality}
        enableSoftShadows={enableSoftShadows}
      />
    </>
  );
};

export default IntegratedLightingSystem;