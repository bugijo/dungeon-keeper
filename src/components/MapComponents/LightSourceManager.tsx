import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LightSource } from '../../types/lightSource';
import { Obstacle } from '../../types/obstacle';
import { Point } from '../../types/point';
import { calculateCombinedLighting } from '../../utils/lightingUtils';
import { saveLightSourcesLocally } from '../../utils/saveLightSourcesLocally';

interface LightSourceManagerProps {
  mapId: string;
  lightSources: LightSource[];
  obstacles: Obstacle[];
  isGameMaster: boolean;
  onLightSourcesChange: (lightSources: LightSource[]) => void;
}

const LightSourceManager: React.FC<LightSourceManagerProps> = ({
  mapId,
  lightSources,
  obstacles,
  isGameMaster,
  onLightSourcesChange
}) => {
  const supabase = useSupabaseClient();
  const [selectedLightSource, setSelectedLightSource] = useState<LightSource | null>(null);
  const [showLightControls, setShowLightControls] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  
  // Tipos de fontes de luz predefinidos
  const lightPresets = [
    { name: 'Tocha', radius: 60, intensity: 0.7, color: 'rgba(255, 165, 0, 0.6)', icon: '🔥' },
    { name: 'Lanterna', radius: 100, intensity: 0.9, color: 'rgba(255, 255, 200, 0.7)', icon: '🔦' },
    { name: 'Vela', radius: 30, intensity: 0.5, color: 'rgba(255, 200, 150, 0.5)', icon: '🕯️' },
    { name: 'Fogueira', radius: 120, intensity: 1.0, color: 'rgba(255, 100, 0, 0.8)', icon: '🔥' },
    { name: 'Luz Mágica', radius: 80, intensity: 0.8, color: 'rgba(100, 200, 255, 0.7)', icon: '✨' }
  ];

  // Sincronizar fontes de luz com o Supabase
  useEffect(() => {
    if (!mapId) return;
    
    const channel = supabase
      .channel(`light-sources-${mapId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'light_sources',
        filter: `map_id=eq.${mapId}`
      }, (payload) => {
        // Atualizar fontes de luz quando houver mudanças no banco de dados
        fetchLightSources();
      })
      .subscribe();
    
    // Buscar fontes de luz iniciais
    fetchLightSources();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, supabase]);

  // Buscar fontes de luz do Supabase
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
          name: item.name,
          icon: item.icon,
          is_dynamic: item.is_dynamic || false
        }));
        
        onLightSourcesChange(formattedLightSources);
        
        // Salvar localmente para modo offline
        saveLightSourcesLocally(mapId, formattedLightSources);
      }
    } catch (error) {
      console.error('Erro ao buscar fontes de luz:', error);
      
      // Tentar carregar do armazenamento local em caso de falha
      loadLightSourcesLocally();
    }
  };

  // Carregar fontes de luz do armazenamento local
  const loadLightSourcesLocally = () => {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      const lightSourcesData = localStorage.getItem('dungeon_kreeper_light_sources');
      if (!lightSourcesData) return;
      
      const mapLightSources: Record<string, LightSource[]> = JSON.parse(lightSourcesData);
      
      if (mapLightSources[mapId]) {
        onLightSourcesChange(mapLightSources[mapId]);
      }
    } catch (error) {
      console.error('Erro ao carregar fontes de luz localmente:', error);
    }
  };

  // Adicionar nova fonte de luz
  const addLightSource = async (preset: typeof lightPresets[0], position: Point) => {
    if (!isGameMaster) return;
    
    const newLightSource: LightSource = {
      id: `light-${Date.now()}`,
      position,
      radius: preset.radius,
      intensity: preset.intensity,
      color: preset.color,
      name: preset.name,
      icon: preset.icon,
      is_dynamic: false
    };
    
    try {
      // Adicionar ao Supabase
      const { data, error } = await supabase
        .from('light_sources')
        .insert([
          {
            id: newLightSource.id,
            map_id: mapId,
            x: position.x,
            y: position.y,
            radius: newLightSource.radius,
            intensity: newLightSource.intensity,
            color: newLightSource.color,
            name: newLightSource.name,
            icon: newLightSource.icon,
            is_dynamic: newLightSource.is_dynamic
          }
        ])
        .select();
      
      if (error) throw error;
      
      // Atualizar estado local
      onLightSourcesChange([...lightSources, newLightSource]);
      
      // Salvar localmente
      saveLightSourcesLocally(mapId, [...lightSources, newLightSource]);
    } catch (error) {
      console.error('Erro ao adicionar fonte de luz:', error);
      
      // Adicionar apenas localmente em caso de falha
      onLightSourcesChange([...lightSources, newLightSource]);
      saveLightSourcesLocally(mapId, [...lightSources, newLightSource]);
    }
  };

  // Remover fonte de luz
  const removeLightSource = async (id: string) => {
    if (!isGameMaster) return;
    
    try {
      // Remover do Supabase
      const { error } = await supabase
        .from('light_sources')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      // Atualizar estado local
      const updatedLightSources = lightSources.filter(light => light.id !== id);
      onLightSourcesChange(updatedLightSources);
      
      // Salvar localmente
      saveLightSourcesLocally(mapId, updatedLightSources);
      
      // Limpar seleção se necessário
      if (selectedLightSource?.id === id) {
        setSelectedLightSource(null);
        setShowLightControls(false);
      }
    } catch (error) {
      console.error('Erro ao remover fonte de luz:', error);
      
      // Remover apenas localmente em caso de falha
      const updatedLightSources = lightSources.filter(light => light.id !== id);
      onLightSourcesChange(updatedLightSources);
      saveLightSourcesLocally(mapId, updatedLightSources);
    }
  };

  // Atualizar fonte de luz
  const updateLightSource = async (updatedLight: LightSource) => {
    if (!isGameMaster) return;
    
    try {
      // Atualizar no Supabase
      const { error } = await supabase
        .from('light_sources')
        .update({
          x: updatedLight.position.x,
          y: updatedLight.position.y,
          radius: updatedLight.radius,
          intensity: updatedLight.intensity,
          color: updatedLight.color,
          name: updatedLight.name,
          icon: updatedLight.icon,
          is_dynamic: updatedLight.is_dynamic
        })
        .eq('id', updatedLight.id);
      
      if (error) throw error;
      
      // Atualizar estado local
      const updatedLightSources = lightSources.map(light => 
        light.id === updatedLight.id ? updatedLight : light
      );
      
      onLightSourcesChange(updatedLightSources);
      
      // Salvar localmente
      saveLightSourcesLocally(mapId, updatedLightSources);
    } catch (error) {
      console.error('Erro ao atualizar fonte de luz:', error);
      
      // Atualizar apenas localmente em caso de falha
      const updatedLightSources = lightSources.map(light => 
        light.id === updatedLight.id ? updatedLight : light
      );
      
      onLightSourcesChange(updatedLightSources);
      saveLightSourcesLocally(mapId, updatedLightSources);
    }
  };

  // Renderizar visualização de fontes de luz no mapa
  const renderLightSources = () => {
    return lightSources.map(light => (
      <div
        key={light.id}
        className="light-source-marker"
        style={{
          position: 'absolute',
          left: light.position.x - 15,
          top: light.position.y - 15,
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: light.color,
          boxShadow: `0 0 ${light.radius / 2}px ${light.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: isGameMaster ? 'pointer' : 'default',
          zIndex: 100,
          fontSize: '18px'
        }}
        onClick={() => {
          if (isGameMaster) {
            setSelectedLightSource(light);
            setShowLightControls(true);
          }
        }}
      >
        {light.icon || '💡'}
      </div>
    ));
  };

  // Renderizar controles para o mestre
  const renderGameMasterControls = () => {
    if (!isGameMaster) return null;
    
    return (
      <div className="light-source-controls" style={{ position: 'absolute', top: 10, right: 10, zIndex: 1000 }}>
        <button 
          onClick={() => setShowLightControls(!showLightControls)}
          style={{
            padding: '8px 12px',
            backgroundColor: '#4a5568',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '8px'
          }}
        >
          {showLightControls ? 'Esconder Controles' : 'Fontes de Luz'}
        </button>
        
        {showLightControls && (
          <div 
            style={{
              backgroundColor: '#2d3748',
              padding: '12px',
              borderRadius: '8px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              width: '250px'
            }}
          >
            <h3 style={{ color: 'white', marginTop: 0 }}>Fontes de Luz</h3>
            
            <div style={{ marginBottom: '12px' }}>
              <button 
                onClick={() => setPreviewMode(!previewMode)}
                style={{
                  padding: '6px 10px',
                  backgroundColor: previewMode ? '#48bb78' : '#4a5568',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                {previewMode ? 'Modo Visualização Ativo' : 'Ativar Visualização'}
              </button>
            </div>
            
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ color: 'white', marginBottom: '8px' }}>Adicionar Luz:</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {lightPresets.map((preset, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      // Adicionar no centro do mapa por padrão
                      // Em uma implementação real, você pode querer usar a posição do clique
                      addLightSource(preset, { x: 1000, y: 1000 });
                    }}
                    style={{
                      padding: '6px',
                      backgroundColor: preset.color,
                      color: 'black',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px'
                    }}
                    title={preset.name}
                  >
                    {preset.icon}
                  </button>
                ))}
              </div>
            </div>
            
            {selectedLightSource && (
              <div style={{ marginTop: '16px' }}>
                <h4 style={{ color: 'white', marginBottom: '8px' }}>Editar {selectedLightSource.name}:</h4>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ color: 'white', display: 'block', marginBottom: '4px' }}>
                    Raio: {selectedLightSource.radius}px
                  </label>
                  <input 
                    type="range" 
                    min="10" 
                    max="200" 
                    value={selectedLightSource.radius} 
                    onChange={(e) => {
                      const updatedLight = {
                        ...selectedLightSource,
                        radius: parseInt(e.target.value)
                      };
                      setSelectedLightSource(updatedLight);
                      updateLightSource(updatedLight);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ color: 'white', display: 'block', marginBottom: '4px' }}>
                    Intensidade: {selectedLightSource.intensity}
                  </label>
                  <input 
                    type="range" 
                    min="0.1" 
                    max="1" 
                    step="0.1" 
                    value={selectedLightSource.intensity} 
                    onChange={(e) => {
                      const updatedLight = {
                        ...selectedLightSource,
                        intensity: parseFloat(e.target.value)
                      };
                      setSelectedLightSource(updatedLight);
                      updateLightSource(updatedLight);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginBottom: '8px' }}>
                  <label style={{ color: 'white', display: 'block', marginBottom: '4px' }}>
                    Cor:
                  </label>
                  <input 
                    type="color" 
                    value={selectedLightSource.color.replace(/[^#\w]/g, '')} 
                    onChange={(e) => {
                      const colorValue = e.target.value;
                      const updatedLight = {
                        ...selectedLightSource,
                        color: `rgba(${parseInt(colorValue.slice(1, 3), 16)}, ${parseInt(colorValue.slice(3, 5), 16)}, ${parseInt(colorValue.slice(5, 7), 16)}, 0.7)`
                      };
                      setSelectedLightSource(updatedLight);
                      updateLightSource(updatedLight);
                    }}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                  <button
                    onClick={() => {
                      if (selectedLightSource) {
                        removeLightSource(selectedLightSource.id);
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#e53e3e',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Remover
                  </button>
                  
                  <button
                    onClick={() => {
                      setSelectedLightSource(null);
                      setShowLightControls(false);
                    }}
                    style={{
                      padding: '6px 10px',
                      backgroundColor: '#4a5568',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Renderizar visualização de iluminação (modo preview)
  const renderLightPreview = () => {
    if (!previewMode || !isGameMaster) return null;
    
    // Criar uma grade para visualizar a iluminação
    const gridSize = 40;
    const gridCells = [];
    
    for (let x = 0; x < 2000; x += gridSize) {
      for (let y = 0; y < 2000; y += gridSize) {
        const point = { x: x + gridSize/2, y: y + gridSize/2 };
        const lighting = calculateCombinedLighting(lightSources, point, obstacles);
        
        if (lighting.isLit) {
          gridCells.push(
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x,
                top: y,
                width: gridSize,
                height: gridSize,
                backgroundColor: lighting.color,
                opacity: lighting.intensity * 0.7,
                pointerEvents: 'none',
                zIndex: 50
              }}
            />
          );
        }
      }
    }
    
    return gridCells;
  };

  return (
    <div className="light-source-manager">
      {renderLightSources()}
      {renderGameMasterControls()}
      {renderLightPreview()}
    </div>
  );
};

export default LightSourceManager;