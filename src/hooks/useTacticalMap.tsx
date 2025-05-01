import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { mapService, TacticalMap, MapToken, RevealedArea } from '@/services/mapService';

interface UseTacticalMapProps {
  mapId?: string;
  initialTokens?: Omit<MapToken, 'id' | 'map_id'>[];
  initialAreas?: Omit<RevealedArea, 'id' | 'map_id'>[];
}

interface UseTacticalMapReturn {
  map: TacticalMap | null;
  tokens: MapToken[];
  revealedAreas: RevealedArea[];
  loading: boolean;
  error: string | null;
  addToken: (token: Omit<MapToken, 'id' | 'map_id'>) => Promise<void>;
  updateTokenPosition: (tokenId: string, x: number, y: number) => Promise<void>;
  deleteToken: (tokenId: string) => Promise<void>;
  addRevealedArea: (area: Omit<RevealedArea, 'id' | 'map_id'>) => Promise<void>;
  deleteRevealedArea: (areaId: string) => Promise<void>;
}

/**
 * Hook para gerenciar um mapa tático e seus elementos
 */
export const useTacticalMap = ({ 
  mapId, 
  initialTokens = [], 
  initialAreas = [] 
}: UseTacticalMapProps): UseTacticalMapReturn => {
  const { user } = useAuth();
  const [map, setMap] = useState<TacticalMap | null>(null);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [revealedAreas, setRevealedAreas] = useState<RevealedArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar dados do mapa
  useEffect(() => {
    if (!mapId) {
      setLoading(false);
      return;
    }

    const loadMapData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Carregar mapa
        const mapData = await mapService.getMapById(mapId);
        setMap(mapData);
        
        // Carregar tokens
        const tokensData = await mapService.getMapTokens(mapId);
        setTokens(tokensData);
        
        // Carregar áreas reveladas
        const areasData = await mapService.getRevealedAreas(mapId);
        setRevealedAreas(areasData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    };

    loadMapData();
  }, [mapId]);

  // Configurar tempo real para atualizações
  useEffect(() => {
    if (!mapId) return;

    const unsubscribe = mapService.subscribeToMapUpdates(mapId, (payload) => {
      // Atualizar dados com base no tipo de alteração
      const { table, new: newRecord, old: oldRecord, eventType } = payload;
      
      if (table === 'tactical_maps') {
        if (eventType === 'UPDATE') {
          setMap(prev => prev ? { ...prev, ...newRecord } : null);
        } else if (eventType === 'DELETE') {
          setMap(null);
        }
      } 
      else if (table === 'map_tokens') {
        if (eventType === 'INSERT') {
          setTokens(prev => [...prev, mapService.mapDbTokenToMapToken(newRecord)]);
        } else if (eventType === 'UPDATE') {
          setTokens(prev => prev.map(token => 
            token.id === newRecord.id ? { ...token, ...newRecord } : token
          ));
        } else if (eventType === 'DELETE') {
          setTokens(prev => prev.filter(token => token.id !== oldRecord.id));
        }
      }
      else if (table === 'revealed_areas') {
        if (eventType === 'INSERT') {
          setRevealedAreas(prev => [...prev, mapService.mapDbAreaToRevealedArea(newRecord)]);
        } else if (eventType === 'DELETE') {
          setRevealedAreas(prev => prev.filter(area => area.id !== oldRecord.id));
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [mapId]);

  // Inicializar com tokens e áreas iniciais se não houver mapId
  useEffect(() => {
    if (!mapId && initialTokens.length > 0) {
      const mappedTokens = initialTokens.map(token => ({
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        map_id: 'temp',
        ...token
      }));
      setTokens(mappedTokens);
    }

    if (!mapId && initialAreas.length > 0) {
      const mappedAreas = initialAreas.map(area => ({
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        map_id: 'temp',
        ...area
      }));
      setRevealedAreas(mappedAreas);
    }
  }, [mapId, initialTokens, initialAreas]);

  // Funções para manipular tokens
  const addToken = async (token: Omit<MapToken, 'id' | 'map_id'>) => {
    if (!mapId || !user) {
      // Modo local (sem persistência)
      const newToken: MapToken = {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        map_id: 'temp',
        ...token
      };
      setTokens(prev => [...prev, newToken]);
      return;
    }

    try {
      const newToken = await mapService.addToken({
        ...token,
        map_id: mapId,
        owner_id: user.id
      });
      // O token será adicionado via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar token');
    }
  };

  const updateTokenPosition = async (tokenId: string, x: number, y: number) => {
    if (!mapId) {
      // Modo local (sem persistência)
      setTokens(prev => prev.map(token => 
        token.id === tokenId ? { ...token, x, y } : token
      ));
      return;
    }

    try {
      await mapService.updateTokenPosition(tokenId, x, y);
      // A posição será atualizada via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar posição do token');
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!mapId) {
      // Modo local (sem persistência)
      setTokens(prev => prev.filter(token => token.id !== tokenId));
      return;
    }

    try {
      await mapService.deleteToken(tokenId);
      // O token será removido via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir token');
    }
  };

  // Funções para manipular áreas reveladas
  const addRevealedArea = async (area: Omit<RevealedArea, 'id' | 'map_id'>) => {
    if (!mapId) {
      // Modo local (sem persistência)
      const newArea: RevealedArea = {
        id: `temp-${Math.random().toString(36).substr(2, 9)}`,
        map_id: 'temp',
        ...area
      };
      setRevealedAreas(prev => [...prev, newArea]);
      return;
    }

    try {
      await mapService.addRevealedArea({
        ...area,
        map_id: mapId
      });
      // A área será adicionada via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar área revelada');
    }
  };

  const deleteRevealedArea = async (areaId: string) => {
    if (!mapId) {
      // Modo local (sem persistência)
      setRevealedAreas(prev => prev.filter(area => area.id !== areaId));
      return;
    }

    try {
      await mapService.deleteRevealedArea(areaId);
      // A área será removida via subscription
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao excluir área revelada');
    }
  };

  return {
    map,
    tokens,
    revealedAreas,
    loading,
    error,
    addToken,
    updateTokenPosition,
    deleteToken,
    addRevealedArea,
    deleteRevealedArea
  };
};