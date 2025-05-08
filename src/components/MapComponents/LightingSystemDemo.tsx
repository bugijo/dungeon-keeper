/**
 * Demonstração do Sistema de Iluminação
 * Componente para testar e visualizar o sistema integrado de iluminação e sombras
 * Inclui controles interativos e visualização em tempo real
 */

import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { Point, Obstacle, RevealedArea } from '../../utils/fogOfWarUtils';
import { LightSource, createLightSource } from '../../utils/lightingUtils';
import IntegratedLightingSystem from './IntegratedLightingSystem';
import LightingControlPanel, { LightingSettings } from './LightingControlPanel';

interface LightingSystemDemoProps {
  mapId: string;
  isGameMaster: boolean;
  mapWidth: number;
  mapHeight: number;
  gridSize: number;
}

const LightingSystemDemo: React.FC<LightingSystemDemoProps> = ({
  mapId,
  isGameMaster,
  mapWidth,
  mapHeight,
  gridSize
}) => {
  // Estados para armazenar obstáculos, fontes de luz e áreas visíveis
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [visibleAreas, setVisibleAreas] = useState<RevealedArea[]>([]);
  const [shadowAreas, setShadowAreas] = useState<RevealedArea[]>([]);
  
  // Estado para armazenar configurações de iluminação
  const [lightingSettings, setLightingSettings] = useState<LightingSettings>({
    ambientLight: 0.3,
    timeOfDay: 'day',
    weatherCondition: 'clear',
    shadowQuality: 'medium',
    enableSoftShadows: true,
    enableFlickering: true
  });
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Efeito para buscar obstáculos do Supabase
  useEffect(() => {
    if (!mapId) return;
    
    const fetchObstacles = async () => {
      try {
        const { data, error } = await supabase
          .from('obstacles')
          .select('*')
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        if (data) {
          const formattedObstacles: Obstacle[] = data.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            width: item.width,
            height: item.height,
            shape: item.shape,
            points: item.points,
            casts_shadow: item.casts_shadow !== false
          }));
          
          setObstacles(formattedObstacles);
        }
      } catch (error) {
        console.error('Erro ao buscar obstáculos:', error);
      }
    };
    
    fetchObstacles();
    
    // Configurar assinatura em tempo real para atualizações de obstáculos
    const obstaclesSubscription = supabase
      .channel(`obstacles-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'obstacles', filter: `map_id=eq.${mapId}` },
        () => {
          fetchObstacles();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(obstaclesSubscription);
    };
  }, [mapId, supabase]);

  // Efeito para buscar fontes de luz do Supabase
  useEffect(() => {
    if (!mapId) return;
    
    const fetchLightSources = async () => {
      try {
        const { data, error } = await supabase
          .from('light_sources')
          .select('*')
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        if (data) {
          const formattedLightSources: LightSource[] = data.map(item => ({
            id: item.id,
            position: { x: item.x, y: item.y },
            radius: item.radius,
            intensity: item.intensity,
            color: item.color,
            flickering: item.flickering || false,
            flickerIntensity: item.flicker_intensity || 0.2,
            castShadows: item.cast_shadows !== false
          }));
          
          setLightSources(formattedLightSources);
        }
      } catch (error) {
        console.error('Erro ao buscar fontes de luz:', error);
      }
    };
    
    fetchLightSources();
    
    // Configurar assinatura em tempo real para atualizações de fontes de luz
    const lightSourcesSubscription = supabase
      .channel(`light-sources-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'light_sources', filter: `map_id=eq.${mapId}` },
        () => {
          fetchLightSources();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(lightSourcesSubscription);
    };
  }, [mapId, supabase]);

  // Função para adicionar uma fonte de luz de teste
  const addTestLightSource = () => {
    if (!isGameMaster) return;
    
    const newLightSource = createLightSource({
      id: `light-${Date.now()}`,
      x: Math.random() * mapWidth,
      y: Math.random() * mapHeight,
      radius: 100 + Math.random() * 100,
      intensity: 0.7 + Math.random() * 0.3,
      color: `rgba(${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, ${Math.floor(Math.random() * 255)}, 0.8)`,
      flickering: Math.random() > 0.5,
      flickerIntensity: 0.1 + Math.random() * 0.3,
      castShadows: true
    });
    
    // Adicionar ao estado local
    setLightSources(prev => [...prev, newLightSource]);
    
    // Sincronizar com o Supabase
    syncLightSourceWithSupabase(newLightSource);
  };

  // Função para sincronizar uma fonte de luz com o Supabase
  const syncLightSourceWithSupabase = async (lightSource: LightSource) => {
    try {
      await supabase
        .from('light_sources')
        .insert({
          id: lightSource.id,
          map_id: mapId,
          x: lightSource.position.x,
          y: lightSource.position.y,
          radius: lightSource.radius,
          intensity: lightSource.intensity,
          color: lightSource.color,
          flickering: lightSource.flickering,
          flicker_intensity: lightSource.flickerIntensity,
          cast_shadows: lightSource.castShadows,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao sincronizar fonte de luz:', error);
    }
  };

  // Função para adicionar um obstáculo de teste
  const addTestObstacle = () => {
    if (!isGameMaster) return;
    
    const width = 50 + Math.random() * 100;
    const height = 50 + Math.random() * 100;
    
    const newObstacle: Obstacle = {
      id: `obstacle-${Date.now()}`,
      x: Math.random() * (mapWidth - width),
      y: Math.random() * (mapHeight - height),
      width,
      height,
      shape: 'rectangle',
      casts_shadow: true
    };
    
    // Adicionar ao estado local
    setObstacles(prev => [...prev, newObstacle]);
    
    // Sincronizar com o Supabase
    syncObstacleWithSupabase(newObstacle);
  };

  // Função para sincronizar um obstáculo com o Supabase
  const syncObstacleWithSupabase = async (obstacle: Obstacle) => {
    try {
      await supabase
        .from('obstacles')
        .insert({
          id: obstacle.id,
          map_id: mapId,
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height,
          shape: obstacle.shape,
          points: obstacle.points,
          casts_shadow: obstacle.casts_shadow,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao sincronizar obstáculo:', error);
    }
  };

  // Manipulador para mudanças na visibilidade
  const handleVisibilityChange = (visible: RevealedArea[], shadows: RevealedArea[]) => {
    setVisibleAreas(visible);
    setShadowAreas(shadows);
  };

  // Manipulador para mudanças nas configurações de iluminação
  const handleSettingsChange = (settings: LightingSettings) => {
    setLightingSettings(settings);
  };

  // Renderizar áreas visíveis e sombras para visualização
  const renderVisibleAreas = () => {
    return visibleAreas.map((area, index) => {
      if (area.shape === 'polygon' && area.points) {
        const points = area.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <polygon 
            key={`visible-${index}`}
            points={points}
            fill={area.color || 'rgba(255, 255, 200, 0.3)'}
            stroke="rgba(255, 255, 0, 0.5)"
            strokeWidth="1"
          />
        );
      }
      return null;
    });
  };

  const renderShadowAreas = () => {
    return shadowAreas.map((area, index) => {
      if (area.shape === 'polygon' && area.points) {
        const points = area.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <polygon 
            key={`shadow-${index}`}
            points={points}
            fill={area.color || 'rgba(0, 0, 0, 0.7)'}
          />
        );
      }
      return null;
    });
  };

  const renderObstacles = () => {
    return obstacles.map(obstacle => {
      if (obstacle.shape === 'rectangle') {
        return (
          <rect
            key={obstacle.id}
            x={obstacle.x}
            y={obstacle.y}
            width={obstacle.width}
            height={obstacle.height}
            fill="rgba(100, 100, 100, 0.8)"
            stroke="#333"
            strokeWidth="2"
          />
        );
      } else if (obstacle.shape === 'polygon' && obstacle.points) {
        const points = obstacle.points.map(p => `${p.x},${p.y}`).join(' ');
        return (
          <polygon
            key={obstacle.id}
            points={points}
            fill="rgba(100, 100, 100, 0.8)"
            stroke="#333"
            strokeWidth="2"
          />
        );
      }
      return null;
    });
  };

  const renderLightSources = () => {
    return lightSources.map(light => (
      <circle
        key={light.id}
        cx={light.position.x}
        cy={light.position.y}
        r={10}
        fill={light.color || 'rgba(255, 255, 0, 0.8)'}
        stroke="#fff"
        strokeWidth="2"
      />
    ));
  };

  return (
    <div className="lighting-system-demo">
      {/* Painel de controle de iluminação */}
      <LightingControlPanel
        mapId={mapId}
        isGameMaster={isGameMaster}
        onSettingsChange={handleSettingsChange}
        initialSettings={lightingSettings}
      />
      
      {/* Sistema integrado de iluminação */}
      <IntegratedLightingSystem
        mapId={mapId}
        obstacles={obstacles}
        lightSources={lightSources}
        mapWidth={mapWidth}
        mapHeight={mapHeight}
        gridSize={gridSize}
        onVisibilityChange={handleVisibilityChange}
        ambientLight={lightingSettings.ambientLight}
        timeOfDay={lightingSettings.timeOfDay}
        weatherCondition={lightingSettings.weatherCondition}
        shadowQuality={lightingSettings.shadowQuality}
        enableSoftShadows={lightingSettings.enableSoftShadows}
        enableFlickering={lightingSettings.enableFlickering}
      />
      
      {/* Visualização do sistema de iluminação */}
      <div className="lighting-visualization">
        <svg width={mapWidth} height={mapHeight}>
          {/* Fundo escuro representando a escuridão */}
          <rect x="0" y="0" width={mapWidth} height={mapHeight} fill="rgba(0, 0, 0, 0.9)" />
          
          {/* Renderizar áreas visíveis */}
          {renderVisibleAreas()}
          
          {/* Renderizar áreas de sombra */}
          {renderShadowAreas()}
          
          {/* Renderizar obstáculos */}
          {renderObstacles()}
          
          {/* Renderizar fontes de luz */}
          {renderLightSources()}
        </svg>
      </div>
      
      {/* Botões de teste (apenas para o mestre) */}
      {isGameMaster && (
        <div className="test-controls">
          <button onClick={addTestLightSource}>Adicionar Fonte de Luz</button>
          <button onClick={addTestObstacle}>Adicionar Obstáculo</button>
        </div>
      )}
      
      {/* Informações de depuração */}
      <div className="debug-info">
        <p>Fontes de Luz: {lightSources.length}</p>
        <p>Obstáculos: {obstacles.length}</p>
        <p>Áreas Visíveis: {visibleAreas.length}</p>
        <p>Áreas de Sombra: {shadowAreas.length}</p>
        <p>Luz Ambiente: {Math.round(lightingSettings.ambientLight * 100)}%</p>
        <p>Período: {lightingSettings.timeOfDay}</p>
        <p>Clima: {lightingSettings.weatherCondition}</p>
      </div>
    </div>
  );
};

export default LightingSystemDemo;