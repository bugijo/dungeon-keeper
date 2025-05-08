/**
 * Sistema de Memória de Áreas Reveladas
 * Implementa a funcionalidade de lembrar áreas já visitadas pelos jogadores
 * Parte do sistema avançado de Fog of War do Dungeon Kreeper
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { RevealedArea } from '../../utils/fogOfWarUtils';

interface RevealedAreaMemorySystemProps {
  mapId: string;
  playerId: string;
  isDungeonMaster: boolean;
  currentVisibleAreas: RevealedArea[];
  memoryDuration?: number; // Duração da memória em milissegundos (null = permanente)
  memoryFadeTime?: number; // Tempo para desvanecer a memória em milissegundos
  onMemoryChange?: (memorizedAreas: RevealedArea[]) => void;
}

interface MemorizedArea extends RevealedArea {
  last_seen_at: string;
  visibility_level: number; // 1.0 = totalmente visível, 0.0 = invisível
  player_id: string;
}

const RevealedAreaMemorySystem: React.FC<RevealedAreaMemorySystemProps> = ({
  mapId,
  playerId,
  isDungeonMaster,
  currentVisibleAreas,
  memoryDuration = null, // null = memória permanente
  memoryFadeTime = 300000, // 5 minutos para desvanecer por padrão
  onMemoryChange
}) => {
  // Estado para armazenar áreas memorizadas
  const [memorizedAreas, setMemorizedAreas] = useState<MemorizedArea[]>([]);
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Carregar áreas memorizadas do Supabase ao iniciar
  useEffect(() => {
    const loadMemorizedAreas = async () => {
      try {
        // Se for o mestre, pode ver todas as áreas memorizadas de todos os jogadores
        const query = supabase
          .from('player_memory')
          .select('*')
          .eq('map_id', mapId);
          
        if (!isDungeonMaster) {
          // Se for jogador, ver apenas suas próprias áreas memorizadas
          query.eq('player_id', playerId);
        }
        
        const { data, error } = await query;
          
        if (error) throw error;
        
        if (data && data.length > 0) {
          const formattedAreas: MemorizedArea[] = data.map(item => ({
            id: item.id,
            x: item.x,
            y: item.y,
            radius: item.radius,
            shape: item.shape,
            points: item.points,
            color: item.color,
            opacity: item.visibility_level, // Usar nível de visibilidade como opacidade
            last_seen_at: item.last_seen_at,
            visibility_level: item.visibility_level,
            player_id: item.player_id
          }));
          
          setMemorizedAreas(formattedAreas);
          
          if (onMemoryChange) {
            onMemoryChange(formattedAreas);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar áreas memorizadas:', error);
      }
    };
    
    loadMemorizedAreas();
  }, [supabase, mapId, playerId, isDungeonMaster, onMemoryChange]);

  // Atualizar áreas memorizadas com base nas áreas atualmente visíveis
  useEffect(() => {
    if (!currentVisibleAreas || currentVisibleAreas.length === 0) return;
    
    const updateMemorizedAreas = async () => {
      try {
        const now = new Date().toISOString();
        const newMemorizedAreas: MemorizedArea[] = [];
        
        // Para cada área atualmente visível, criar ou atualizar uma área memorizada
        for (const visibleArea of currentVisibleAreas) {
          // Verificar se já existe uma área memorizada similar
          const existingAreaIndex = memorizedAreas.findIndex(area => 
            Math.abs(area.x - visibleArea.x) < 10 && 
            Math.abs(area.y - visibleArea.y) < 10 && 
            Math.abs(area.radius - visibleArea.radius) < 10
          );
          
          if (existingAreaIndex >= 0) {
            // Atualizar área existente
            const updatedArea = {
              ...memorizedAreas[existingAreaIndex],
              last_seen_at: now,
              visibility_level: 1.0 // Totalmente visível quando acabou de ser vista
            };
            
            newMemorizedAreas.push(updatedArea);
            
            // Atualizar no Supabase
            await supabase
              .from('player_memory')
              .update({
                last_seen_at: now,
                visibility_level: 1.0
              })
              .eq('id', updatedArea.id);
          } else {
            // Criar nova área memorizada
            const newArea: MemorizedArea = {
              ...visibleArea,
              last_seen_at: now,
              visibility_level: 1.0,
              player_id: playerId
            };
            
            newMemorizedAreas.push(newArea);
            
            // Inserir no Supabase
            const { data, error } = await supabase
              .from('player_memory')
              .insert({
                map_id: mapId,
                player_id: playerId,
                x: newArea.x,
                y: newArea.y,
                radius: newArea.radius,
                shape: newArea.shape,
                points: newArea.points,
                color: newArea.color,
                last_seen_at: now,
                visibility_level: 1.0
              })
              .select();
              
            if (error) throw error;
            
            if (data && data.length > 0) {
              // Atualizar com o ID gerado pelo banco
              newArea.id = data[0].id;
            }
          }
        }
        
        // Manter áreas que não foram atualizadas
        const areasToKeep = memorizedAreas.filter(area => 
          !newMemorizedAreas.some(newArea => newArea.id === area.id)
        );
        
        // Combinar áreas novas/atualizadas com áreas existentes
        const combinedAreas = [...newMemorizedAreas, ...areasToKeep];
        setMemorizedAreas(combinedAreas);
        
        if (onMemoryChange) {
          onMemoryChange(combinedAreas);
        }
      } catch (error) {
        console.error('Erro ao atualizar áreas memorizadas:', error);
      }
    };
    
    updateMemorizedAreas();
  }, [currentVisibleAreas, memorizedAreas, supabase, mapId, playerId, onMemoryChange]);

  // Efeito para desvanecer gradualmente a memória com o tempo
  useEffect(() => {
    if (!memoryDuration && !memoryFadeTime) return; // Sem desvanecimento se ambos forem null
    
    const fadeInterval = setInterval(() => {
      const now = new Date();
      
      // Atualizar níveis de visibilidade com base no tempo desde a última visualização
      const updatedAreas = memorizedAreas.map(area => {
        const lastSeen = new Date(area.last_seen_at);
        const timeSinceLastSeen = now.getTime() - lastSeen.getTime();
        
        // Calcular novo nível de visibilidade
        let newVisibilityLevel = area.visibility_level;
        
        if (memoryDuration && timeSinceLastSeen > memoryDuration) {
          // Se exceder a duração máxima, tornar invisível
          newVisibilityLevel = 0;
        } else if (memoryFadeTime && timeSinceLastSeen > 0) {
          // Desvanecer gradualmente com base no tempo
          const fadeProgress = Math.min(timeSinceLastSeen / memoryFadeTime, 1);
          newVisibilityLevel = Math.max(0, 1 - fadeProgress);
        }
        
        // Se o nível de visibilidade mudou, atualizar
        if (newVisibilityLevel !== area.visibility_level) {
          // Atualizar no Supabase (com throttling para evitar muitas requisições)
          if (Math.abs(newVisibilityLevel - area.visibility_level) > 0.1) {
            supabase
              .from('player_memory')
              .update({ visibility_level: newVisibilityLevel })
              .eq('id', area.id)
              .then();
          }
          
          return {
            ...area,
            visibility_level: newVisibilityLevel,
            opacity: newVisibilityLevel // Atualizar opacidade para renderização
          };
        }
        
        return area;
      });
      
      // Filtrar áreas que se tornaram completamente invisíveis
      const visibleAreas = updatedAreas.filter(area => area.visibility_level > 0);
      
      setMemorizedAreas(visibleAreas);
      
      if (onMemoryChange) {
        onMemoryChange(visibleAreas);
      }
    }, 10000); // Verificar a cada 10 segundos
    
    return () => clearInterval(fadeInterval);
  }, [memorizedAreas, memoryDuration, memoryFadeTime, supabase, onMemoryChange]);

  // Função para limpar toda a memória de um jogador
  const clearPlayerMemory = useCallback(async (targetPlayerId: string) => {
    if (!isDungeonMaster && targetPlayerId !== playerId) {
      // Apenas o mestre pode limpar a memória de outros jogadores
      return false;
    }
    
    try {
      // Remover do Supabase
      const { error } = await supabase
        .from('player_memory')
        .delete()
        .eq('player_id', targetPlayerId)
        .eq('map_id', mapId);
        
      if (error) throw error;
      
      // Atualizar estado local
      if (targetPlayerId === playerId) {
        setMemorizedAreas([]);
        
        if (onMemoryChange) {
          onMemoryChange([]);
        }
      } else {
        // Se for o mestre limpando a memória de outro jogador
        const updatedAreas = memorizedAreas.filter(area => area.player_id !== targetPlayerId);
        setMemorizedAreas(updatedAreas);
        
        if (onMemoryChange) {
          onMemoryChange(updatedAreas);
        }
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao limpar memória do jogador:', error);
      return false;
    }
  }, [isDungeonMaster, playerId, supabase, mapId, memorizedAreas, onMemoryChange]);

  // Configurar assinatura em tempo real para atualizações de memória
  useEffect(() => {
    const memorySubscription = supabase
      .channel(`player-memory-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'player_memory', filter: `map_id=eq.${mapId}` },
        async (payload) => {
          // Recarregar memória quando houver mudanças no banco de dados
          try {
            const query = supabase
              .from('player_memory')
              .select('*')
              .eq('map_id', mapId);
              
            if (!isDungeonMaster) {
              query.eq('player_id', playerId);
            }
            
            const { data, error } = await query;
              
            if (error) throw error;
            
            if (data) {
              const formattedAreas: MemorizedArea[] = data.map(item => ({
                id: item.id,
                x: item.x,
                y: item.y,
                radius: item.radius,
                shape: item.shape,
                points: item.points,
                color: item.color,
                opacity: item.visibility_level,
                last_seen_at: item.last_seen_at,
                visibility_level: item.visibility_level,
                player_id: item.player_id
              }));
              
              setMemorizedAreas(formattedAreas);
              
              if (onMemoryChange) {
                onMemoryChange(formattedAreas);
              }
            }
          } catch (error) {
            console.error('Erro ao atualizar memória:', error);
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(memorySubscription);
    };
  }, [supabase, mapId, playerId, isDungeonMaster, onMemoryChange]);

  // Expor função para o componente pai
  React.useImperativeHandle(
    React.useRef<{
      clearPlayerMemory: typeof clearPlayerMemory;
    }>(),
    () => ({
      clearPlayerMemory
    })
  );

  // O componente não renderiza nada visualmente, apenas gerencia a lógica
  return null;
};

export default RevealedAreaMemorySystem;