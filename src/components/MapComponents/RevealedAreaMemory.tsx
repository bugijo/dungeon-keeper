import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { RevealedArea } from '../../types/game';
import { Point } from '../../types/point';
import { saveGameLocally } from '../../utils/saveGameLocally';
import { loadGameLocally } from '../../utils/loadGameLocally';

interface RevealedAreaMemoryProps {
  mapId: string;
  playerId: string;
  revealedAreas: RevealedArea[];
  isGameMaster: boolean;
  memoryOpacity?: number;
  memoryColor?: string;
  enableMemorySystem: boolean;
  onMemoryAreasChange?: (memoryAreas: RevealedArea[]) => void;
}

const RevealedAreaMemory: React.FC<RevealedAreaMemoryProps> = ({
  mapId,
  playerId,
  revealedAreas,
  isGameMaster,
  memoryOpacity = 0.5,
  memoryColor = 'rgba(100, 100, 100, 0.5)',
  enableMemorySystem,
  onMemoryAreasChange
}) => {
  const supabase = useSupabaseClient();
  const [memoryAreas, setMemoryAreas] = useState<RevealedArea[]>([]);
  const [memoryPoints, setMemoryPoints] = useState<Point[]>([]);
  
  // Efeito para inicializar a memória do jogador
  useEffect(() => {
    if (!enableMemorySystem) return;
    
    // Carregar memória do jogador
    fetchPlayerMemory();
    
    // Tentar carregar do armazenamento local em caso de falha
    const localData = loadGameLocally(mapId);
    if (localData && localData.memoryPoints && localData.memoryPoints.length > 0) {
      setMemoryPoints(localData.memoryPoints);
      
      // Converter pontos de memória em áreas reveladas
      const convertedAreas = localData.memoryPoints.map((point, index) => ({
        id: `memory-${index}`,
        x: point.x,
        y: point.y,
        radius: 50, // Raio padrão para áreas de memória
        shape: 'circle' as const,
        opacity: memoryOpacity,
        color: memoryColor,
        created_by: playerId,
        created_at: new Date().toISOString()
      }));
      
      setMemoryAreas(convertedAreas);
      
      if (onMemoryAreasChange) {
        onMemoryAreasChange(convertedAreas);
      }
    }
  }, [mapId, playerId, enableMemorySystem]);

  // Efeito para atualizar a memória quando novas áreas são reveladas
  useEffect(() => {
    if (!enableMemorySystem) return;
    
    // Adicionar novas áreas reveladas à memória
    const newMemoryAreas: RevealedArea[] = [];
    const newMemoryPoints: Point[] = [];
    
    revealedAreas.forEach(area => {
      // Verificar se a área já está na memória
      const isAlreadyInMemory = memoryPoints.some(point => 
        Math.abs(point.x - area.x) < 10 && Math.abs(point.y - area.y) < 10
      );
      
      if (!isAlreadyInMemory) {
        // Adicionar à memória com opacidade reduzida
        newMemoryAreas.push({
          id: `memory-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: area.x,
          y: area.y,
          radius: area.radius,
          shape: area.shape,
          opacity: memoryOpacity,
          color: memoryColor,
          created_by: playerId,
          created_at: new Date().toISOString()
        });
        
        newMemoryPoints.push({ x: area.x, y: area.y });
      }
    });
    
    if (newMemoryAreas.length > 0) {
      // Atualizar estado local
      setMemoryAreas(prev => [...prev, ...newMemoryAreas]);
      setMemoryPoints(prev => [...prev, ...newMemoryPoints]);
      
      // Salvar no Supabase
      savePlayerMemory([...memoryPoints, ...newMemoryPoints]);
      
      // Notificar componente pai
      if (onMemoryAreasChange) {
        onMemoryAreasChange([...memoryAreas, ...newMemoryAreas]);
      }
      
      // Salvar localmente para modo offline
      saveMemoryLocally([...memoryPoints, ...newMemoryPoints]);
    }
  }, [revealedAreas, enableMemorySystem]);

  // Buscar memória do jogador do Supabase
  const fetchPlayerMemory = async () => {
    try {
      const { data, error } = await supabase
        .from('player_memory')
        .select('*')
        .eq('map_id', mapId)
        .eq('player_id', playerId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Extrair pontos de memória
        const points: Point[] = data.map(item => ({
          x: item.x,
          y: item.y
        }));
        
        setMemoryPoints(points);
        
        // Converter pontos em áreas reveladas
        const convertedAreas = points.map((point, index) => ({
          id: `memory-${index}`,
          x: point.x,
          y: point.y,
          radius: 50, // Raio padrão para áreas de memória
          shape: 'circle' as const,
          opacity: memoryOpacity,
          color: memoryColor,
          created_by: playerId,
          created_at: new Date().toISOString()
        }));
        
        setMemoryAreas(convertedAreas);
        
        if (onMemoryAreasChange) {
          onMemoryAreasChange(convertedAreas);
        }
        
        // Salvar localmente para modo offline
        saveMemoryLocally(points);
      }
    } catch (error) {
      console.error('Erro ao buscar memória do jogador:', error);
    }
  };

  // Salvar memória do jogador no Supabase
  const savePlayerMemory = async (points: Point[]) => {
    try {
      // Primeiro, excluir registros existentes
      await supabase
        .from('player_memory')
        .delete()
        .eq('map_id', mapId)
        .eq('player_id', playerId);
      
      // Inserir novos pontos de memória
      const memoryRecords = points.map(point => ({
        map_id: mapId,
        player_id: playerId,
        x: point.x,
        y: point.y,
        created_at: new Date().toISOString()
      }));
      
      const { error } = await supabase
        .from('player_memory')
        .insert(memoryRecords);
      
      if (error) throw error;
    } catch (error) {
      console.error('Erro ao salvar memória do jogador:', error);
    }
  };

  // Salvar memória localmente
  const saveMemoryLocally = (points: Point[]) => {
    try {
      const gameData = {
        id: mapId,
        name: `Map ${mapId}`,
        lastUpdated: new Date().toISOString(),
        mapId,
        memoryPoints: points
      };
      
      saveGameLocally(gameData);
    } catch (error) {
      console.error('Erro ao salvar memória localmente:', error);
    }
  };

  // Limpar memória do jogador
  const clearPlayerMemory = async () => {
    if (!isGameMaster) return;
    
    try {
      // Limpar no Supabase
      const { error } = await supabase
        .from('player_memory')
        .delete()
        .eq('map_id', mapId)
        .eq('player_id', playerId);
      
      if (error) throw error;
      
      // Limpar estado local
      setMemoryAreas([]);
      setMemoryPoints([]);
      
      // Notificar componente pai
      if (onMemoryAreasChange) {
        onMemoryAreasChange([]);
      }
      
      // Atualizar armazenamento local
      saveMemoryLocally([]);
    } catch (error) {
      console.error('Erro ao limpar memória do jogador:', error);
    }
  };

  // Renderizar controles para o mestre
  const renderGameMasterControls = () => {
    if (!isGameMaster || !enableMemorySystem) return null;
    
    return (
      <div 
        style={{
          position: 'absolute',
          bottom: 10,
          right: 10,
          zIndex: 1000,
          backgroundColor: '#2d3748',
          padding: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h4 style={{ color: 'white', margin: '0 0 8px 0' }}>Memória do Jogador</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={clearPlayerMemory}
            style={{
              padding: '6px 10px',
              backgroundColor: '#e53e3e',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Limpar Memória
          </button>
          
          <button
            onClick={fetchPlayerMemory}
            style={{
              padding: '6px 10px',
              backgroundColor: '#4a5568',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Atualizar
          </button>
        </div>
      </div>
    );
  };

  // Se o sistema de memória estiver desativado, não renderizar nada
  if (!enableMemorySystem) return null;

  return (
    <div className="revealed-area-memory">
      {renderGameMasterControls()}
    </div>
  );
};

export default RevealedAreaMemory;