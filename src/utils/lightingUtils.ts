/**
 * Utilitários para gerenciamento de iluminação dinâmica
 * Complementa o sistema de Fog of War com suporte a fontes de luz
 */

import { Point, Obstacle, calculateDistance, calculateVisibleArea, lineIntersectsRectangle } from './fogOfWarUtils';

/**
 * Interface para fontes de luz dinâmicas
 */
export interface LightSource {
  id: string;
  position: Point;
  radius: number;
  color?: string;
  intensity?: number; // 0-1, afeta o brilho e alcance
  flickering?: boolean; // Se a luz oscila (como uma tocha)
  flickerIntensity?: number; // 0-1, quanto a luz oscila
  castShadows?: boolean; // Se a luz projeta sombras
}

/**
 * Cria uma fonte de luz dinâmica
 */
export const createLightSource = (params: {
  id: string;
  x: number;
  y: number;
  radius: number;
  color?: string;
  intensity?: number;
  flickering?: boolean;
  flickerIntensity?: number;
  castShadows?: boolean;
}): LightSource => {
  return {
    id: params.id,
    position: { x: params.x, y: params.y },
    radius: params.radius,
    color: params.color || 'rgba(255, 255, 200, 0.8)',
    intensity: params.intensity !== undefined ? params.intensity : 1,
    flickering: params.flickering || false,
    flickerIntensity: params.flickerIntensity || 0.2,
    castShadows: params.castShadows !== undefined ? params.castShadows : true
  };
};

/**
 * Atualiza a posição de uma fonte de luz
 */
export const updateLightSourcePosition = (
  lightSource: LightSource,
  newPosition: Point
): LightSource => {
  return {
    ...lightSource,
    position: { ...newPosition }
  };
};

/**
 * Aplica efeito de oscilação em fontes de luz (como tochas)
 */
export const applyLightFlickering = (
  lightSources: LightSource[],
  deltaTime: number
): LightSource[] => {
  return lightSources.map(source => {
    if (!source.flickering) return source;
    
    // Gerar variação aleatória baseada no tempo
    const flickerAmount = source.flickerIntensity || 0.2;
    const timeVariation = Math.sin(Date.now() / 200) * flickerAmount;
    const randomVariation = (Math.random() - 0.5) * flickerAmount;
    
    // Aplicar variação ao raio e intensidade
    const intensityVariation = 1 + timeVariation + randomVariation;
    
    return {
      ...source,
      radius: source.radius * (1 + timeVariation * 0.1),
      intensity: Math.max(0.5, Math.min(1, (source.intensity || 1) * intensityVariation))
    };
  });
};

/**
 * Calcula a iluminação combinada de múltiplas fontes de luz
 */
export const calculateCombinedLighting = (
  lightSources: LightSource[],
  point: Point,
  obstacles: Obstacle[]
): { isLit: boolean; intensity: number; color: string } => {
  // Valor padrão: sem iluminação
  let isLit = false;
  let maxIntensity = 0;
  let resultColor = 'rgba(0, 0, 0, 0)';
  
  // Verificar cada fonte de luz
  lightSources.forEach(source => {
    // Calcular distância até a fonte de luz
    const distance = calculateDistance(point, source.position);
    
    // Verificar se o ponto está dentro do raio da luz
    if (distance <= source.radius) {
      // Verificar se há obstáculos bloqueando a luz
      const hasLineOfSight = !obstacles.some(obstacle => {
        if (!obstacle.blocks_vision) return false;
        
        // Verificar se o obstáculo bloqueia a linha de visão
        return lineIntersectsRectangle(
          source.position.x, source.position.y,
          point.x, point.y,
          obstacle.x, obstacle.y,
          obstacle.width, obstacle.height
        );
      });
      
      if (hasLineOfSight) {
        // Calcular intensidade baseada na distância (mais forte no centro)
        const normalizedDistance = distance / source.radius;
        const falloff = 1 - normalizedDistance;
        const intensity = falloff * (source.intensity || 1);
        
        // Manter a fonte de luz mais intensa
        if (intensity > maxIntensity) {
          maxIntensity = intensity;
          isLit = true;
          
          // Ajustar cor baseada na intensidade
          const baseColor = source.color || 'rgba(255, 255, 200, 0.8)';
          resultColor = adjustLightColorByIntensity(baseColor, intensity);
        }
      }
    }
  });
  
  return { isLit, intensity: maxIntensity, color: resultColor };
};

/**
 * Ajusta a cor da luz baseada na intensidade
 */
export const adjustLightColorByIntensity = (baseColor: string, intensity: number): string => {
  // Extrair componentes RGBA da cor base
  const rgbaMatch = baseColor.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1]);
    const g = parseInt(rgbaMatch[2]);
    const b = parseInt(rgbaMatch[3]);
    const a = rgbaMatch[4] ? parseFloat(rgbaMatch[4]) : 1;
    
    // Ajustar opacidade baseada na intensidade
    const adjustedAlpha = a * intensity;
    
    return `rgba(${r}, ${g}, ${b}, ${adjustedAlpha})`;
  }
  
  // Fallback para cor padrão se o formato não for reconhecido
  return `rgba(255, 255, 200, ${intensity * 0.8})`;
};

/**
 * Renderiza o efeito de iluminação dinâmica em um canvas separado
 */
export const renderDynamicLighting = (
  ctx: CanvasRenderingContext2D,
  lightSources: LightSource[],
  obstacles: Obstacle[],
  mapWidth: number,
  mapHeight: number,
  ambientLight: number = 0.1 // Luz ambiente (0-1)
): void => {
  // Limpar o canvas antes de renderizar
  // Limpar o canvas
  ctx.clearRect(0, 0, mapWidth, mapHeight);
  
  // Aplicar luz ambiente (escuridão base)
  ctx.fillStyle = `rgba(0, 0, 0, ${1 - ambientLight})`;
  ctx.fillRect(0, 0, mapWidth, mapHeight);
  
  // Configurar para modo de composição 'lighter' para sobrepor luzes
  ctx.globalCompositeOperation = 'lighter';
  
  // Renderizar cada fonte de luz
  lightSources.forEach(source => {
    // Criar gradiente radial para a luz
    const gradient = ctx.createRadialGradient(
      source.position.x, source.position.y, 0,
      source.position.x, source.position.y, source.radius
    );
    
    // Extrair componentes de cor
    const baseColor = source.color || 'rgba(255, 255, 200, 0.8)';
    const intensity = source.intensity || 1;
    
    // Configurar gradiente
    gradient.addColorStop(0, adjustLightColorByIntensity(baseColor, intensity));
    gradient.addColorStop(0.7, adjustLightColorByIntensity(baseColor, intensity * 0.5));
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    
    ctx.fillStyle = gradient;
    
    // Se a luz projeta sombras, usar técnica de shadow mapping
    if (source.castShadows) {
      // Calcular área visível a partir da fonte de luz
      const visiblePoints = calculateVisibleArea(
        source.position,
        source.radius,
        obstacles.filter(obs => obs.blocks_vision),
        5, // Usar ângulo maior para melhor desempenho
        true // Usar cache
      );
      
      // Desenhar polígono de luz
      ctx.beginPath();
      if (visiblePoints.length > 2) {
        ctx.moveTo(visiblePoints[0].x, visiblePoints[0].y);
        
        for (let i = 1; i < visiblePoints.length; i++) {
          ctx.lineTo(visiblePoints[i].x, visiblePoints[i].y);
        }
      } else {
        // Fallback se não houver pontos suficientes
        ctx.arc(source.position.x, source.position.y, source.radius, 0, Math.PI * 2);
      }
      ctx.closePath();
      ctx.fill();
    } else {
      // Luz simples sem sombras
      ctx.beginPath();
      ctx.arc(source.position.x, source.position.y, source.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  });
  
  // Restaurar modo de composição
  ctx.globalCompositeOperation = 'source-over';
};

// Sincronizar fontes de luz com o Supabase
export const syncLightSources = async (
  mapId: string,
  userId: string,
  lightSources: LightSource[],
  supabase: any
) => {
  try {
    // Primeiro, excluir todas as fontes de luz existentes para este mapa
    const { error: deleteError } = await supabase
      .from('map_light_sources')
      .delete()
      .eq('map_id', mapId);

    if (deleteError) throw deleteError;

    // Inserir as novas fontes de luz
    const lightSourcesData = lightSources.map(source => ({
      id: source.id,
      map_id: mapId,
      position_x: source.position.x,
      position_y: source.position.y,
      radius: source.radius,
      color: source.color,
      intensity: source.intensity,
      flickering: source.flickering,
      flicker_intensity: source.flickerIntensity || 0.2,
      cast_shadows: source.castShadows,
      created_by: userId,
      updated_at: new Date().toISOString()
    }));

    const { error: insertError } = await supabase
      .from('map_light_sources')
      .insert(lightSourcesData);

    if (insertError) throw insertError;

    // Notificar outros usuários
    await supabase
      .channel(`lighting-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'lighting-update',
        payload: { lightSources }
      });

    return true;
  } catch (error) {
    console.error('Erro ao sincronizar fontes de luz:', error);
    return false;
  }
};

// Sincronizar movimento de uma fonte de luz específica
export const syncLightSourceMovement = async (
  mapId: string,
  lightSource: LightSource,
  supabase: any
) => {
  try {
    // Atualizar a posição da fonte de luz no banco de dados
    const { error } = await supabase
      .from('map_light_sources')
      .update({
        position_x: lightSource.position.x,
        position_y: lightSource.position.y,
        updated_at: new Date().toISOString()
      })
      .eq('id', lightSource.id);

    if (error) throw error;

    // Notificar outros usuários
    await supabase
      .channel(`lighting-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'light-source-moved',
        payload: { lightSource }
      });

    return true;
  } catch (error) {
    console.error('Erro ao sincronizar movimento da fonte de luz:', error);
    return false;
  }
};

/**
 * Interface para presets de iluminação
 */
export interface LightingPreset {
  id: string;
  name: string;
  mapId: string;
  gameId?: string;
  lightSources: LightSource[];
  ambientLight: number;
  createdBy: string;
  createdAt?: string;
}

/**
 * Cria um novo preset de iluminação
 */
export const createLightingPreset = (
  name: string,
  mapId: string,
  lightSources: LightSource[],
  ambientLight: number,
  userId: string,
  gameId?: string
): LightingPreset => {
  return {
    id: `preset-${Date.now()}`,
    name,
    mapId,
    gameId,
    lightSources,
    ambientLight,
    createdBy: userId,
    createdAt: new Date().toISOString()
  };
};

/**
 * Salva um preset de iluminação no Supabase
 */
export const saveLightingPreset = async (
  preset: LightingPreset,
  supabase: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lighting_presets')
      .insert({
        id: preset.id,
        name: preset.name,
        map_id: preset.mapId,
        game_id: preset.gameId,
        light_sources: preset.lightSources,
        ambient_light: preset.ambientLight,
        created_by: preset.createdBy,
        created_at: preset.createdAt
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao salvar preset de iluminação:', error);
    return false;
  }
};

/**
 * Carrega presets de iluminação do Supabase
 */
export const loadLightingPresets = async (
  mapId: string,
  supabase: any
): Promise<LightingPreset[]> => {
  try {
    const { data, error } = await supabase
      .from('lighting_presets')
      .select('*')
      .eq('map_id', mapId);

    if (error) throw error;

    if (!data || data.length === 0) {
      return [];
    }

    // Converter dados do banco para objetos LightingPreset
    return data.map(item => ({
      id: item.id,
      name: item.name,
      mapId: item.map_id,
      gameId: item.game_id,
      lightSources: item.light_sources,
      ambientLight: item.ambient_light,
      createdBy: item.created_by,
      createdAt: item.created_at
    }));
  } catch (error) {
    console.error('Erro ao carregar presets de iluminação:', error);
    return [];
  }
};

/**
 * Exclui um preset de iluminação do Supabase
 */
export const deleteLightingPreset = async (
  presetId: string,
  supabase: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('lighting_presets')
      .delete()
      .eq('id', presetId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao excluir preset de iluminação:', error);
    return false;
  }
};

/**
 * Aplica um preset de iluminação, atualizando as fontes de luz e a luz ambiente
 */
export const applyLightingPreset = async (
  preset: LightingPreset,
  mapId: string,
  supabase: any,
  onLightSourcesUpdate?: (lightSources: LightSource[]) => void,
  onAmbientLightUpdate?: (ambientLight: number) => void
): Promise<boolean> => {
  try {
    // Atualizar fontes de luz localmente se o callback estiver disponível
    if (onLightSourcesUpdate) {
      onLightSourcesUpdate(preset.lightSources);
    }
    
    // Atualizar luz ambiente localmente se o callback estiver disponível
    if (onAmbientLightUpdate) {
      onAmbientLightUpdate(preset.ambientLight);
    }
    
    // Notificar outros usuários sobre a mudança nas fontes de luz
    await supabase
      .channel(`lighting-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'lighting-update',
        payload: { lightSources: preset.lightSources }
      });
    
    // Notificar outros usuários sobre a mudança na luz ambiente
    await supabase
      .channel(`lighting-updates-${mapId}`)
      .send({
        type: 'broadcast',
        event: 'ambient-light-update',
        payload: { ambientLight: preset.ambientLight }
      });
    
    return true;
  } catch (error) {
    console.error('Erro ao aplicar preset de iluminação:', error);
    return false;
  }
};

// Exportar tipos e funções
export type { LightSource, Obstacle };
export { 
  createLightSource, 
  updateLightSourcePosition, 
  applyLightFlickering, 
  renderDynamicLighting, 
  syncLightSources, 
  syncLightSourceMovement,
  createLightingPreset,
  saveLightingPreset,
  loadLightingPresets,
  deleteLightingPreset,
  applyLightingPreset
};