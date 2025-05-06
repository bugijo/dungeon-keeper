/**
 * Salva fontes de luz localmente
 */
import { LightSource } from '../types/lightSource';

export const saveLightSourcesLocally = (mapId: string, lightSources: LightSource[]): void => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return;
    }
    
    // Buscar dados existentes
    const lightSourcesData = localStorage.getItem('dungeon_kreeper_light_sources');
    let mapLightSources: Record<string, LightSource[]> = {};
    
    if (lightSourcesData) {
      mapLightSources = JSON.parse(lightSourcesData);
    }
    
    // Atualizar ou adicionar as fontes de luz para o mapa específico
    mapLightSources[mapId] = lightSources;
    
    // Salvar de volta no localStorage
    localStorage.setItem('dungeon_kreeper_light_sources', JSON.stringify(mapLightSources));
    
    console.log(`${lightSources.length} fontes de luz salvas localmente para o mapa ${mapId}`);
  } catch (error) {
    console.error('Erro ao salvar fontes de luz localmente:', error);
  }
};

/**
 * Carrega fontes de luz armazenadas localmente
 */
export const loadLightSourcesLocally = (mapId: string): LightSource[] => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return [];
    }
    
    // Buscar dados das fontes de luz no localStorage
    const lightSourcesData = localStorage.getItem('dungeon_kreeper_light_sources');
    
    if (!lightSourcesData) {
      return [];
    }
    
    // Converter string JSON para objeto
    const mapLightSources: Record<string, LightSource[]> = JSON.parse(lightSourcesData);
    
    // Retornar as fontes de luz para o mapa específico
    if (mapLightSources[mapId]) {
      return mapLightSources[mapId];
    }
    
    return [];
  } catch (error) {
    console.error('Erro ao carregar fontes de luz localmente:', error);
    return [];
  }
};

/**
 * Remove fontes de luz de um mapa do armazenamento local
 */
export const removeLightSourcesLocally = (mapId: string): void => {
  try {
    // Verificar se o localStorage está disponível
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage não está disponível');
      return;
    }
    
    // Buscar dados existentes
    const lightSourcesData = localStorage.getItem('dungeon_kreeper_light_sources');
    
    if (!lightSourcesData) {
      return;
    }
    
    const mapLightSources: Record<string, LightSource[]> = JSON.parse(lightSourcesData);
    
    // Remover as fontes de luz do mapa se existirem
    if (mapLightSources[mapId]) {
      delete mapLightSources[mapId];
      
      // Salvar de volta no localStorage
      localStorage.setItem('dungeon_kreeper_light_sources', JSON.stringify(mapLightSources));
      
      console.log(`Fontes de luz do mapa ${mapId} removidas localmente`);
    }
  } catch (error) {
    console.error('Erro ao remover fontes de luz localmente:', error);
  }
};