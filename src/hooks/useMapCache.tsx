import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CachedMap {
  id: string;
  name: string;
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  gridSize: number;
  lastAccessed: Date;
  dataSize: number; // tamanho em bytes
  cachedAt: Date;
}

interface CachedResource {
  id: string;
  type: 'token' | 'obstacle' | 'light' | 'sound' | 'texture';
  url: string;
  thumbnailUrl?: string;
  lastAccessed: Date;
  dataSize: number; // tamanho em bytes
  cachedAt: Date;
}

interface MapCacheOptions {
  maxCacheSize?: number; // tamanho máximo do cache em MB
  maxMapCount?: number; // número máximo de mapas em cache
  maxResourceCount?: number; // número máximo de recursos em cache
  autoCleanup?: boolean; // limpar automaticamente o cache quando cheio
  persistCache?: boolean; // persistir cache entre sessões
  compressionLevel?: 'none' | 'low' | 'medium' | 'high'; // nível de compressão
}

const DEFAULT_OPTIONS: MapCacheOptions = {
  maxCacheSize: 100, // 100 MB
  maxMapCount: 20,
  maxResourceCount: 100,
  autoCleanup: true,
  persistCache: true,
  compressionLevel: 'medium'
};

export const useMapCache = (options: MapCacheOptions = {}) => {
  const [cachedMaps, setCachedMaps] = useState<CachedMap[]>([]);
  const [cachedResources, setCachedResources] = useState<CachedResource[]>([]);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [totalCacheSize, setTotalCacheSize] = useState<number>(0); // em bytes
  const [isCacheLoading, setIsCacheLoading] = useState<boolean>(true);
  
  // Mesclar opções padrão com as fornecidas
  const cacheOptions = { ...DEFAULT_OPTIONS, ...options };
  
  // Inicializar o cache
  useEffect(() => {
    const initializeCache = async () => {
      setIsCacheLoading(true);
      
      try {
        // Carregar cache persistente se habilitado
        if (cacheOptions.persistCache) {
          const storedMaps = localStorage.getItem('dk_cached_maps');
          const storedResources = localStorage.getItem('dk_cached_resources');
          
          if (storedMaps) {
            setCachedMaps(JSON.parse(storedMaps));
          }
          
          if (storedResources) {
            setCachedResources(JSON.parse(storedResources));
          }
        }
        
        // Calcular tamanho total do cache
        calculateTotalCacheSize();
        
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar cache de mapas:', error);
        toast.error('Não foi possível inicializar o cache de mapas');
        
        // Resetar cache em caso de erro
        resetCache();
      } finally {
        setIsCacheLoading(false);
      }
    };
    
    initializeCache();
  }, []);
  
  // Persistir cache quando alterado
  useEffect(() => {
    if (!isInitialized || !cacheOptions.persistCache) return;
    
    localStorage.setItem('dk_cached_maps', JSON.stringify(cachedMaps));
    localStorage.setItem('dk_cached_resources', JSON.stringify(cachedResources));
    
    // Calcular tamanho total do cache
    calculateTotalCacheSize();
  }, [cachedMaps, cachedResources, isInitialized, cacheOptions.persistCache]);
  
  // Calcular tamanho total do cache
  const calculateTotalCacheSize = () => {
    const mapsSize = cachedMaps.reduce((total, map) => total + map.dataSize, 0);
    const resourcesSize = cachedResources.reduce((total, resource) => total + resource.dataSize, 0);
    
    setTotalCacheSize(mapsSize + resourcesSize);
    
    // Verificar se o cache excedeu o limite
    if (cacheOptions.autoCleanup && (mapsSize + resourcesSize) > (cacheOptions.maxCacheSize! * 1024 * 1024)) {
      cleanupCache();
    }
  };
  
  // Adicionar um mapa ao cache
  const cacheMap = async (map: Omit<CachedMap, 'lastAccessed' | 'cachedAt'>) => {
    try {
      // Verificar se o mapa já está em cache
      const existingIndex = cachedMaps.findIndex(m => m.id === map.id);
      
      if (existingIndex >= 0) {
        // Atualizar mapa existente
        const updatedMaps = [...cachedMaps];
        updatedMaps[existingIndex] = {
          ...updatedMaps[existingIndex],
          ...map,
          lastAccessed: new Date()
        };
        
        setCachedMaps(updatedMaps);
        return updatedMaps[existingIndex];
      }
      
      // Verificar se o cache de mapas está cheio
      if (cachedMaps.length >= cacheOptions.maxMapCount!) {
        // Remover o mapa menos recentemente acessado
        const sortedMaps = [...cachedMaps].sort(
          (a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
        );
        
        const updatedMaps = sortedMaps.slice(1);
        
        // Adicionar novo mapa
        const newMap: CachedMap = {
          ...map,
          lastAccessed: new Date(),
          cachedAt: new Date()
        };
        
        setCachedMaps([...updatedMaps, newMap]);
        return newMap;
      }
      
      // Adicionar novo mapa ao cache
      const newMap: CachedMap = {
        ...map,
        lastAccessed: new Date(),
        cachedAt: new Date()
      };
      
      setCachedMaps([...cachedMaps, newMap]);
      return newMap;
    } catch (error) {
      console.error('Erro ao adicionar mapa ao cache:', error);
      toast.error('Não foi possível adicionar o mapa ao cache');
      return null;
    }
  };
  
  // Adicionar um recurso ao cache
  const cacheResource = async (resource: Omit<CachedResource, 'lastAccessed' | 'cachedAt'>) => {
    try {
      // Verificar se o recurso já está em cache
      const existingIndex = cachedResources.findIndex(r => r.id === resource.id);
      
      if (existingIndex >= 0) {
        // Atualizar recurso existente
        const updatedResources = [...cachedResources];
        updatedResources[existingIndex] = {
          ...updatedResources[existingIndex],
          ...resource,
          lastAccessed: new Date()
        };
        
        setCachedResources(updatedResources);
        return updatedResources[existingIndex];
      }
      
      // Verificar se o cache de recursos está cheio
      if (cachedResources.length >= cacheOptions.maxResourceCount!) {
        // Remover o recurso menos recentemente acessado
        const sortedResources = [...cachedResources].sort(
          (a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
        );
        
        const updatedResources = sortedResources.slice(1);
        
        // Adicionar novo recurso
        const newResource: CachedResource = {
          ...resource,
          lastAccessed: new Date(),
          cachedAt: new Date()
        };
        
        setCachedResources([...updatedResources, newResource]);
        return newResource;
      }
      
      // Adicionar novo recurso ao cache
      const newResource: CachedResource = {
        ...resource,
        lastAccessed: new Date(),
        cachedAt: new Date()
      };
      
      setCachedResources([...cachedResources, newResource]);
      return newResource;
    } catch (error) {
      console.error('Erro ao adicionar recurso ao cache:', error);
      toast.error('Não foi possível adicionar o recurso ao cache');
      return null;
    }
  };
  
  // Obter um mapa do cache
  const getMapFromCache = (mapId: string) => {
    const cachedMap = cachedMaps.find(m => m.id === mapId);
    
    if (cachedMap) {
      // Atualizar data de último acesso
      const updatedMaps = cachedMaps.map(m => {
        if (m.id === mapId) {
          return { ...m, lastAccessed: new Date() };
        }
        return m;
      });
      
      setCachedMaps(updatedMaps);
      return cachedMap;
    }
    
    return null;
  };
  
  // Obter um recurso do cache
  const getResourceFromCache = (resourceId: string) => {
    const cachedResource = cachedResources.find(r => r.id === resourceId);
    
    if (cachedResource) {
      // Atualizar data de último acesso
      const updatedResources = cachedResources.map(r => {
        if (r.id === resourceId) {
          return { ...r, lastAccessed: new Date() };
        }
        return r;
      });
      
      setCachedResources(updatedResources);
      return cachedResource;
    }
    
    return null;
  };
  
  // Remover um mapa do cache
  const removeMapFromCache = (mapId: string) => {
    const updatedMaps = cachedMaps.filter(m => m.id !== mapId);
    setCachedMaps(updatedMaps);
  };
  
  // Remover um recurso do cache
  const removeResourceFromCache = (resourceId: string) => {
    const updatedResources = cachedResources.filter(r => r.id !== resourceId);
    setCachedResources(updatedResources);
  };
  
  // Limpar cache automaticamente quando cheio
  const cleanupCache = () => {
    // Ordenar por data de último acesso (mais antigo primeiro)
    const sortedMaps = [...cachedMaps].sort(
      (a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
    );
    
    const sortedResources = [...cachedResources].sort(
      (a, b) => new Date(a.lastAccessed).getTime() - new Date(b.lastAccessed).getTime()
    );
    
    // Remover itens até que o cache esteja abaixo do limite
    let currentSize = totalCacheSize;
    const updatedMaps = [...sortedMaps];
    const updatedResources = [...sortedResources];
    
    // Primeiro remover recursos (menos críticos)
    while (currentSize > (cacheOptions.maxCacheSize! * 1024 * 1024) && updatedResources.length > 0) {
      const removedResource = updatedResources.shift();
      if (removedResource) {
        currentSize -= removedResource.dataSize;
      }
    }
    
    // Se ainda estiver acima do limite, remover mapas
    while (currentSize > (cacheOptions.maxCacheSize! * 1024 * 1024) && updatedMaps.length > 0) {
      const removedMap = updatedMaps.shift();
      if (removedMap) {
        currentSize -= removedMap.dataSize;
      }
    }
    
    setCachedMaps(updatedMaps);
    setCachedResources(updatedResources);
    setTotalCacheSize(currentSize);
  };
  
  // Resetar cache completamente
  const resetCache = () => {
    setCachedMaps([]);
    setCachedResources([]);
    setTotalCacheSize(0);
    
    if (cacheOptions.persistCache) {
      localStorage.removeItem('dk_cached_maps');
      localStorage.removeItem('dk_cached_resources');
    }
    
    toast.success('Cache de mapas limpo com sucesso!');
  };
  
  // Pré-carregar mapas frequentemente usados
  const preloadFrequentMaps = async (gameId: string) => {
    try {
      setIsCacheLoading(true);
      
      // Buscar mapas mais usados recentemente para este jogo
      const { data, error } = await supabase
        .from('maps')
        .select('*')
        .eq('game_id', gameId)
        .order('last_accessed', { ascending: false })
        .limit(5);
        
      if (error) throw error;
      
      if (data) {
        // Adicionar mapas ao cache
        for (const map of data) {
          await cacheMap({
            id: map.id,
            name: map.name,
            imageUrl: map.image_url,
            thumbnailUrl: map.thumbnail_url,
            width: map.width,
            height: map.height,
            gridSize: map.grid_size,
            dataSize: map.data_size || 1024 * 1024, // 1MB padrão se não especificado
          });
        }
        
        toast.success('Mapas pré-carregados com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao pré-carregar mapas:', error);
      toast.error('Não foi possível pré-carregar os mapas');
    } finally {
      setIsCacheLoading(false);
    }
  };
  
  return {
    cachedMaps,
    cachedResources,
    totalCacheSize,
    isCacheLoading,
    cacheMap,
    cacheResource,
    getMapFromCache,
    getResourceFromCache,
    removeMapFromCache,
    removeResourceFromCache,
    cleanupCache,
    resetCache,
    preloadFrequentMaps
  };
};

export default useMapCache;