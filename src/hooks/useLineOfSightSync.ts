/**
 * Hook para sincronização em tempo real do sistema de linha de visão
 * Integra o cálculo de áreas visíveis com o Supabase para compartilhamento entre jogadores
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Point, RevealedArea, calculateVisibleArea, convertVisibleAreaToRevealed } from '@/utils/fogOfWarUtils';

interface UseLineOfSightSyncProps {
  mapId: string;
  userId: string;
  isGameMaster?: boolean;
  playerPosition?: Point;
  obstacles: { x: number; y: number; width: number; height: number }[];
  maxViewDistance: number;
  enabled?: boolean;
}

interface UseLineOfSightSyncReturn {
  visibleAreas: RevealedArea[];
  memoryAreas: RevealedArea[];
  isLoading: boolean;
  error: string | null;
  updatePlayerPosition: (position: Point) => void;
  clearMemory: () => void;
  syncVisibleAreas: () => Promise<boolean>;
}

/**
 * Hook para sincronização em tempo real do sistema de linha de visão
 */
export const useLineOfSightSync = ({
  mapId,
  userId,
  isGameMaster = false,
  playerPosition,
  obstacles,
  maxViewDistance,
  enabled = true
}: UseLineOfSightSyncProps): UseLineOfSightSyncReturn => {
  const [visibleAreas, setVisibleAreas] = useState<RevealedArea[]>([]);
  const [memoryAreas, setMemoryAreas] = useState<RevealedArea[]>([]);
  const [currentPosition, setCurrentPosition] = useState<Point | undefined>(playerPosition);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar áreas de memória do jogador
  const loadMemoryAreas = useCallback(async () => {
    if (!enabled || !mapId || !userId) return;

    try {
      const { data, error } = await supabase
        .from('player_memory_areas')
        .select('*')
        .eq('map_id', mapId)
        .eq('player_id', userId);

      if (error) throw error;

      setMemoryAreas(data || []);
    } catch (err: any) {
      console.error('Erro ao carregar áreas de memória:', err);
      setError(`Erro ao carregar áreas de memória: ${err.message}`);
    }
  }, [enabled, mapId, userId]);

  // Calcular áreas visíveis com base na posição do jogador
  const calculatePlayerVisibleAreas = useCallback(() => {
    if (!enabled || !currentPosition || !obstacles) return;

    try {
      // Calcular pontos visíveis usando raycasting
      const visiblePoints = calculateVisibleArea(
        currentPosition,
        maxViewDistance,
        obstacles,
        1, // angleStep - precisão do raycasting
        true // useCache - usar cache para otimização
      );

      // Converter pontos visíveis em uma área revelada
      const revealedArea = convertVisibleAreaToRevealed(
        visiblePoints,
        currentPosition,
        'rgba(0, 0, 0, 0.7)', // cor padrão
        0.7 // opacidade padrão
      );

      // Adicionar ID e mapId para sincronização
      const areaWithIds: RevealedArea = {
        ...revealedArea,
        id: `los-${userId}-${Date.now()}`,
        map_id: mapId,
        created_by: userId,
        is_dynamic: true // Marcar como área dinâmica
      };

      setVisibleAreas([areaWithIds]);
    } catch (err: any) {
      console.error('Erro ao calcular áreas visíveis:', err);
      setError(`Erro ao calcular áreas visíveis: ${err.message}`);
    }
  }, [enabled, currentPosition, obstacles, maxViewDistance, userId, mapId]);

  // Sincronizar áreas visíveis com o Supabase
  const syncVisibleAreas = async (): Promise<boolean> => {
    if (!enabled || !mapId || !userId || visibleAreas.length === 0) return false;

    try {
      // Enviar atualização via canal em tempo real
      await supabase
        .channel(`fog-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'fog_update',
          payload: {
            areas: visibleAreas,
            updated_by: userId,
            timestamp: new Date().toISOString()
          }
        });

      // Se for o mestre do jogo, também salvar no banco de dados
      if (isGameMaster) {
        // Remover áreas dinâmicas antigas
        await supabase
          .from('revealed_areas')
          .delete()
          .eq('map_id', mapId)
          .eq('is_dynamic', true);

        // Inserir novas áreas
        await supabase
          .from('revealed_areas')
          .insert(visibleAreas.map(area => ({
            ...area,
            map_id: mapId,
            created_by: userId,
            created_at: new Date().toISOString()
          })));
      }

      return true;
    } catch (err: any) {
      console.error('Erro ao sincronizar áreas visíveis:', err);
      setError(`Erro ao sincronizar áreas visíveis: ${err.message}`);
      return false;
    }
  };

  // Atualizar posição do jogador
  const updatePlayerPosition = (position: Point) => {
    setCurrentPosition(position);
  };

  // Salvar áreas atuais na memória do jogador
  const saveToMemory = async () => {
    if (!enabled || !mapId || !userId || visibleAreas.length === 0) return;

    try {
      // Converter áreas visíveis em áreas de memória
      const newMemoryAreas = visibleAreas.map(area => ({
        ...area,
        id: `memory-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        is_memory: true,
        is_dynamic: false,
        opacity: 0.4, // Áreas de memória são mais transparentes
        created_at: new Date().toISOString()
      }));

      // Salvar no banco de dados
      await supabase
        .from('player_memory_areas')
        .insert(newMemoryAreas.map(area => ({
          ...area,
          map_id: mapId,
          player_id: userId
        })));

      // Atualizar estado local
      setMemoryAreas(prev => [...prev, ...newMemoryAreas]);
    } catch (err: any) {
      console.error('Erro ao salvar áreas na memória:', err);
      setError(`Erro ao salvar áreas na memória: ${err.message}`);
    }
  };

  // Limpar memória do jogador
  const clearMemory = async () => {
    if (!enabled || !mapId || !userId) return;

    try {
      await supabase
        .from('player_memory_areas')
        .delete()
        .eq('map_id', mapId)
        .eq('player_id', userId);

      setMemoryAreas([]);
    } catch (err: any) {
      console.error('Erro ao limpar memória:', err);
      setError(`Erro ao limpar memória: ${err.message}`);
    }
  };

  // Configurar canal de tempo real para receber atualizações
  useEffect(() => {
    if (!enabled || !mapId) return;

    setIsLoading(true);

    // Carregar áreas de memória iniciais
    loadMemoryAreas()
      .then(() => setIsLoading(false))
      .catch(err => {
        console.error('Erro ao inicializar:', err);
        setError(`Erro ao inicializar: ${err.message}`);
        setIsLoading(false);
      });

    // Inscrever-se no canal de atualizações em tempo real
    const channel = supabase
      .channel(`fog-updates-${mapId}`)
      .on('broadcast', { event: 'fog_update' }, payload => {
        // Ignorar atualizações enviadas pelo próprio usuário
        if (payload.payload.updated_by === userId) return;

        // Processar áreas recebidas
        const receivedAreas = payload.payload.areas as RevealedArea[];
        if (receivedAreas && Array.isArray(receivedAreas)) {
          // Se for o mestre, mesclar com áreas existentes
          if (isGameMaster) {
            setVisibleAreas(prev => {
              // Remover áreas antigas do mesmo jogador
              const filteredAreas = prev.filter(
                area => !area.created_by || area.created_by !== payload.payload.updated_by
              );
              // Adicionar novas áreas
              return [...filteredAreas, ...receivedAreas];
            });
          }
          // Para jogadores, apenas atualizar se for relevante
          else if (payload.payload.updated_by === 'game_master') {
            setVisibleAreas(receivedAreas);
          }
        }
      })
      .subscribe();

    // Limpar inscrição ao desmontar
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, mapId, userId, isGameMaster, loadMemoryAreas]);

  // Recalcular áreas visíveis quando a posição do jogador mudar
  useEffect(() => {
    if (currentPosition) {
      calculatePlayerVisibleAreas();
    }
  }, [currentPosition, calculatePlayerVisibleAreas]);

  // Sincronizar automaticamente quando as áreas visíveis mudarem
  useEffect(() => {
    if (visibleAreas.length > 0) {
      syncVisibleAreas();

      // Salvar na memória a cada 5 segundos se não for o mestre
      if (!isGameMaster) {
        const memoryTimer = setTimeout(() => {
          saveToMemory();
        }, 5000);

        return () => clearTimeout(memoryTimer);
      }
    }
  }, [visibleAreas, isGameMaster]);

  return {
    visibleAreas,
    memoryAreas,
    isLoading,
    error,
    updatePlayerPosition,
    clearMemory,
    syncVisibleAreas
  };
};