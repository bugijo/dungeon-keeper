import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MemoryArea {
  id?: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  lastSeen: Date;
  seenBy: string;
  mapId: string;
}

interface FogMemorySystemProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  width: number;
  height: number;
  gridSize: number;
  currentVisibleAreas: { x: number; y: number; radius: number }[];
  onMemoryUpdate?: (memoryAreas: MemoryArea[]) => void;
}

const FogMemorySystem: React.FC<FogMemorySystemProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  width,
  height,
  gridSize,
  currentVisibleAreas,
  onMemoryUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [memoryAreas, setMemoryAreas] = useState<MemoryArea[]>([]);
  const [memoryFadeRate, setMemoryFadeRate] = useState<number>(0.05); // Taxa de desvanecimento da memória
  const [memoryEnabled, setMemoryEnabled] = useState<boolean>(true); // Ativar/desativar sistema de memória
  const [memoryOpacity, setMemoryOpacity] = useState<number>(0.3); // Opacidade das áreas de memória
  const [memoryColor, setMemoryColor] = useState<string>('#6495ED'); // Cor das áreas de memória (azul claro)
  
  // Carregar áreas de memória do banco de dados
  useEffect(() => {
    const fetchMemoryAreas = async () => {
      if (!mapId) return;
      
      try {
        const { data, error } = await supabase
          .from('map_fog_memory')
          .select('*')
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        if (data) {
          const formattedAreas = data.map(area => ({
            id: area.id,
            x: area.x,
            y: area.y,
            radius: area.radius,
            intensity: area.intensity || 0.3,
            lastSeen: new Date(area.last_seen),
            seenBy: area.seen_by,
            mapId: area.map_id
          }));
          
          setMemoryAreas(formattedAreas);
          
          if (onMemoryUpdate) {
            onMemoryUpdate(formattedAreas);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar áreas de memória:', error);
        toast.error('Não foi possível carregar as áreas de memória');
      }
    };
    
    fetchMemoryAreas();
    
    // Inscrever-se para atualizações em tempo real
    const memoryChannel = supabase
      .channel(`memory-updates-${mapId}`)
      .on('broadcast', { event: 'memory_update' }, payload => {
        if (payload.sender !== userId) {
          fetchMemoryAreas();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(memoryChannel);
    };
  }, [mapId, userId, onMemoryUpdate]);
  
  // Atualizar áreas de memória com base nas áreas visíveis atuais
  useEffect(() => {
    if (!memoryEnabled || !currentVisibleAreas.length) return;
    
    const updateMemoryAreas = async () => {
      const now = new Date();
      const newMemoryAreas = [...memoryAreas];
      const areasToAdd: MemoryArea[] = [];
      
      // Processar áreas visíveis atuais
      currentVisibleAreas.forEach(visibleArea => {
        // Verificar se esta área já está na memória
        const existingIndex = newMemoryAreas.findIndex(
          memory => Math.abs(memory.x - visibleArea.x) < gridSize / 2 && 
                   Math.abs(memory.y - visibleArea.y) < gridSize / 2
        );
        
        if (existingIndex >= 0) {
          // Atualizar área existente
          newMemoryAreas[existingIndex] = {
            ...newMemoryAreas[existingIndex],
            intensity: 1.0, // Área recém-vista tem intensidade máxima
            lastSeen: now,
            seenBy: userId
          };
        } else {
          // Adicionar nova área à memória
          areasToAdd.push({
            x: visibleArea.x,
            y: visibleArea.y,
            radius: visibleArea.radius || gridSize / 2,
            intensity: 1.0,
            lastSeen: now,
            seenBy: userId,
            mapId: mapId
          });
        }
      });
      
      // Adicionar novas áreas à memória
      if (areasToAdd.length > 0) {
        try {
          // Adicionar ao banco de dados
          const { data, error } = await supabase
            .from('map_fog_memory')
            .insert(
              areasToAdd.map(area => ({
                map_id: mapId,
                game_id: gameId,
                x: area.x,
                y: area.y,
                radius: area.radius,
                intensity: area.intensity,
                last_seen: area.lastSeen.toISOString(),
                seen_by: area.seenBy
              }))
            )
            .select();
            
          if (error) throw error;
          
          if (data) {
            // Formatar dados retornados
            const formattedNewAreas = data.map(area => ({
              id: area.id,
              x: area.x,
              y: area.y,
              radius: area.radius,
              intensity: area.intensity,
              lastSeen: new Date(area.last_seen),
              seenBy: area.seen_by,
              mapId: area.map_id
            }));
            
            // Atualizar estado local
            setMemoryAreas([...newMemoryAreas, ...formattedNewAreas]);
            
            // Notificar outros usuários
            await supabase
              .channel(`memory-updates-${mapId}`)
              .send({
                type: 'broadcast',
                event: 'memory_update',
                payload: { map_id: mapId, sender: userId }
              });
              
            if (onMemoryUpdate) {
              onMemoryUpdate([...newMemoryAreas, ...formattedNewAreas]);
            }
          }
        } catch (error) {
          console.error('Erro ao adicionar áreas de memória:', error);
          toast.error('Não foi possível atualizar as áreas de memória');
        }
      }
    };
    
    updateMemoryAreas();
  }, [currentVisibleAreas, memoryEnabled, mapId, gameId, userId, gridSize, memoryAreas, onMemoryUpdate]);
  
  // Efeito para desvanecer gradualmente as áreas de memória com o tempo
  useEffect(() => {
    if (!memoryEnabled || memoryFadeRate <= 0) return;
    
    const fadeInterval = setInterval(() => {
      setMemoryAreas(prevAreas => {
        // Reduzir a intensidade de todas as áreas de memória
        return prevAreas.map(area => ({
          ...area,
          intensity: Math.max(0.1, area.intensity - memoryFadeRate) // Nunca menor que 0.1
        }));
      });
    }, 60000); // Verificar a cada minuto
    
    return () => clearInterval(fadeInterval);
  }, [memoryEnabled, memoryFadeRate]);
  
  // Renderizar áreas de memória
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !memoryEnabled) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Limpar o canvas
    ctx.clearRect(0, 0, width, height);
    
    // Desenhar áreas de memória
    memoryAreas.forEach(area => {
      // Converter cor hex para RGB
      const hexToRgb = (hex: string) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16)
        } : { r: 100, g: 149, b: 237 }; // Azul claro padrão
      };
      
      const rgb = hexToRgb(memoryColor);
      const opacity = memoryOpacity * area.intensity;
      
      ctx.fillStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;
      ctx.beginPath();
      ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [memoryAreas, width, height, memoryEnabled, memoryOpacity, memoryColor]);
  
  // Limpar todas as áreas de memória
  const clearAllMemory = async () => {
    if (!isGameMaster) return;
    
    if (window.confirm('Tem certeza que deseja limpar todas as áreas de memória?')) {
      try {
        // Remover todas as áreas de memória do banco de dados
        const { error } = await supabase
          .from('map_fog_memory')
          .delete()
          .eq('map_id', mapId);
          
        if (error) throw error;
        
        // Atualizar estado local
        setMemoryAreas([]);
        
        // Notificar outros usuários
        await supabase
          .channel(`memory-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'memory_update',
            payload: { map_id: mapId, sender: userId }
          });
          
        if (onMemoryUpdate) {
          onMemoryUpdate([]);
        }
        
        toast.success('Áreas de memória limpas com sucesso!');
      } catch (error) {
        console.error('Erro ao limpar áreas de memória:', error);
        toast.error('Não foi possível limpar as áreas de memória');
      }
    }
  };
  
  // Configurações do sistema de memória
  const updateMemorySettings = (settings: {
    enabled?: boolean;
    fadeRate?: number;
    opacity?: number;
    color?: string;
  }) => {
    if (settings.enabled !== undefined) setMemoryEnabled(settings.enabled);
    if (settings.fadeRate !== undefined) setMemoryFadeRate(settings.fadeRate);
    if (settings.opacity !== undefined) setMemoryOpacity(settings.opacity);
    if (settings.color !== undefined) setMemoryColor(settings.color);
  };
  
  return {
    canvasElement: (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
      />
    ),
    memoryAreas,
    memoryEnabled,
    memoryFadeRate,
    memoryOpacity,
    memoryColor,
    clearAllMemory,
    updateMemorySettings
  };
};

export default FogMemorySystem;