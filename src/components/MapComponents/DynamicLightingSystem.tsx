/**
 * Sistema de Iluminação Dinâmica
 * Implementa a funcionalidade de fontes de luz dinâmicas com diferentes intensidades e cores
 * Complementa o sistema de sombras projetadas e se integra ao sistema de linha de visão
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Point, Obstacle, RevealedArea, calculateVisibleArea } from '../../utils/fogOfWarUtils';
import { LightSource, calculateCombinedLighting } from '../../utils/lightingUtils';
import { saveLightSourcesLocally } from '../../utils/saveLightSourcesLocally';

interface DynamicLightingSystemProps {
  mapId: string;
  obstacles: Obstacle[];
  lightSources: LightSource[];
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
  onLightingChange?: (lightAreas: RevealedArea[]) => void;
  ambientLight?: number; // 0.0 = escuridão total, 1.0 = luz total
  timeOfDay?: 'dawn' | 'day' | 'dusk' | 'night'; // Período do dia
  weatherCondition?: 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy'; // Condição climática
  enableFlickering?: boolean; // Habilitar efeito de cintilação para tochas
}

interface LightArea extends RevealedArea {
  intensity: number; // 0.0 = sem luz, 1.0 = luz total
  source_id: string; // ID da fonte de luz
  flickering?: boolean; // Se a área tem efeito de cintilação
}

// Função para calcular a intensidade da luz ambiente com base no período do dia e clima
const calculateAmbientLight = (
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night',
  weatherCondition: 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy',
  baseAmbientLight: number
): number => {
  // Fatores de multiplicação para período do dia
  const timeFactors = {
    dawn: 0.6,
    day: 1.0,
    dusk: 0.5,
    night: 0.2
  };
  
  // Fatores de multiplicação para condições climáticas
  const weatherFactors = {
    clear: 1.0,
    cloudy: 0.8,
    foggy: 0.7,
    rainy: 0.6,
    stormy: 0.4
  };
  
  // Calcular luz ambiente ajustada
  const adjustedAmbientLight = baseAmbientLight * timeFactors[timeOfDay] * weatherFactors[weatherCondition];
  
  // Garantir que o valor esteja entre 0 e 1
  return Math.max(0, Math.min(1, adjustedAmbientLight));
};

// Função para aplicar efeito de cintilação em fontes de luz
const applyFlickeringEffect = (lightSource: LightSource): LightSource => {
  if (!lightSource.flickering || !lightSource.flickerIntensity) {
    return lightSource;
  }
  
  // Gerar variação aleatória para simular cintilação
  const flickerVariation = (Math.random() * 2 - 1) * lightSource.flickerIntensity;
  
  // Aplicar variação à intensidade e raio da luz
  const adjustedIntensity = Math.max(
    0.2,
    Math.min(1, (lightSource.intensity || 1) + flickerVariation * 0.3)
  );
  
  const adjustedRadius = Math.max(
    lightSource.radius * 0.8,
    Math.min(lightSource.radius * 1.2, lightSource.radius * (1 + flickerVariation * 0.1))
  );
  
  return {
    ...lightSource,
    intensity: adjustedIntensity,
    radius: adjustedRadius
  };
};

// Função para calcular a área iluminada por uma fonte de luz
const calculateLightArea = (
  lightSource: LightSource,
  obstacles: Obstacle[],
  mapWidth: number,
  mapHeight: number
): LightArea => {
  // Aplicar efeito de cintilação se necessário
  const processedLight = lightSource.flickering ? 
    applyFlickeringEffect(lightSource) : 
    lightSource;
  
  // Calcular área visível a partir da fonte de luz, considerando obstáculos
  const visiblePoints = calculateVisibleArea(
    processedLight.position,
    processedLight.radius,
    obstacles,
    mapWidth,
    mapHeight
  );
  
  // Criar área de luz como um polígono
  return {
    shape: 'polygon',
    points: visiblePoints,
    intensity: processedLight.intensity || 1.0,
    source_id: processedLight.id,
    color: processedLight.color || 'rgba(255, 255, 200, 0.8)',
    flickering: processedLight.flickering
  };
};

const DynamicLightingSystem: React.FC<DynamicLightingSystemProps> = ({
  mapId,
  obstacles,
  lightSources,
  mapWidth,
  mapHeight,
  gridSize,
  onLightingChange,
  ambientLight = 0.3,
  timeOfDay = 'day',
  weatherCondition = 'clear',
  enableFlickering = true
}) => {
  // Estado para armazenar áreas iluminadas calculadas
  const [lightAreas, setLightAreas] = useState<LightArea[]>([]);
  
  // Estado para armazenar a luz ambiente ajustada
  const [adjustedAmbientLight, setAdjustedAmbientLight] = useState<number>(ambientLight);
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Filtrar fontes de luz ativas
  const activeLightSources = useMemo(() => {
    return lightSources.filter(light => light.intensity && light.intensity > 0);
  }, [lightSources]);

  // Calcular luz ambiente com base no período do dia e clima
  useEffect(() => {
    const newAmbientLight = calculateAmbientLight(timeOfDay, weatherCondition, ambientLight);
    setAdjustedAmbientLight(newAmbientLight);
    
    // Sincronizar com o Supabase
    syncAmbientLightWithSupabase(newAmbientLight);
  }, [timeOfDay, weatherCondition, ambientLight]);

  // Função para calcular todas as áreas iluminadas
  const calculateAllLightAreas = useCallback(() => {
    if (activeLightSources.length === 0) {
      return [];
    }
    
    let allLightAreas: LightArea[] = [];
    
    // Para cada fonte de luz, calcular área iluminada
    for (const light of activeLightSources) {
      // Pular fontes de luz desativadas
      if (!light.intensity || light.intensity <= 0) continue;
      
      // Aplicar efeito de cintilação se habilitado e a fonte de luz suportar
      const processedLight = (enableFlickering && light.flickering) ? 
        applyFlickeringEffect(light) : 
        light;
      
      const lightArea = calculateLightArea(
        processedLight,
        obstacles,
        mapWidth,
        mapHeight
      );
      
      allLightAreas.push(lightArea);
    }
    
    return allLightAreas;
  }, [activeLightSources, obstacles, mapWidth, mapHeight, enableFlickering]);

  // Efeito para recalcular áreas iluminadas quando os parâmetros relevantes mudam
  useEffect(() => {
    const newLightAreas = calculateAllLightAreas();
    setLightAreas(newLightAreas);
    
    // Notificar componente pai sobre mudanças nas áreas iluminadas
    if (onLightingChange) {
      onLightingChange(newLightAreas);
    }
    
    // Sincronizar com o Supabase para outros jogadores
    syncLightAreasWithSupabase(newLightAreas);
  }, [activeLightSources, obstacles, calculateAllLightAreas, onLightingChange]);

  // Efeito para aplicar cintilação em intervalos regulares
  useEffect(() => {
    if (!enableFlickering) return;
    
    // Verificar se há fontes de luz com cintilação
    const hasFlickeringLights = activeLightSources.some(light => light.flickering);
    
    if (!hasFlickeringLights) return;
    
    // Configurar intervalo para atualizar efeito de cintilação
    const flickerInterval = setInterval(() => {
      const newLightAreas = calculateAllLightAreas();
      setLightAreas(newLightAreas);
      
      if (onLightingChange) {
        onLightingChange(newLightAreas);
      }
    }, 200); // Atualizar a cada 200ms para efeito de cintilação
    
    return () => clearInterval(flickerInterval);
  }, [enableFlickering, activeLightSources, calculateAllLightAreas, onLightingChange]);

  // Função para sincronizar áreas iluminadas com o Supabase
  const syncLightAreasWithSupabase = async (areas: LightArea[]) => {
    try {
      // Primeiro, remover áreas antigas deste mapa
      await supabase
        .from('light_areas')
        .delete()
        .eq('map_id', mapId);
      
      // Inserir novas áreas iluminadas
      if (areas.length > 0) {
        const areasToInsert = areas.map(area => ({
          map_id: mapId,
          shape: area.shape,
          points: area.points,
          intensity: area.intensity,
          source_id: area.source_id,
          color: area.color,
          flickering: area.flickering || false,
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('light_areas')
          .insert(areasToInsert);
      }
    } catch (error) {
      console.error('Erro ao sincronizar áreas iluminadas:', error);
    }
  };

  // Função para sincronizar luz ambiente com o Supabase
  const syncAmbientLightWithSupabase = async (ambientLightValue: number) => {
    try {
      await supabase
        .from('map_settings')
        .upsert({
          map_id: mapId,
          ambient_light: ambientLightValue,
          time_of_day: timeOfDay,
          weather_condition: weatherCondition,
          updated_at: new Date().toISOString()
        }, { onConflict: 'map_id' });
    } catch (error) {
      console.error('Erro ao sincronizar luz ambiente:', error);
    }
  };

  // Configurar assinatura em tempo real para atualizações de configurações do mapa
  useEffect(() => {
    const mapSettingsSubscription = supabase
      .channel(`map-settings-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'map_settings', filter: `map_id=eq.${mapId}` },
        async (payload) => {
          // Recarregar configurações quando houver mudanças
          try {
            const { data, error } = await supabase
              .from('map_settings')
              .select('*')
              .eq('map_id', mapId)
              .single();
              
            if (error) throw error;
            
            if (data) {
              setAdjustedAmbientLight(data.ambient_light || ambientLight);
            }
          } catch (error) {
            console.error('Erro ao atualizar configurações do mapa:', error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(mapSettingsSubscription);
    };
  }, [supabase, mapId, ambientLight]);

  // O componente não renderiza nada visualmente, apenas gerencia a lógica
  return null;
};

export default DynamicLightingSystem;