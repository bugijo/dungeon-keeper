import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { RevealedArea } from '../../types/game';
import { LightSource } from '../../types/lightSource';
import { Obstacle } from '../../types/obstacle';
import { Point } from '../../types/point';
import useEnvironmentControl from '../../hooks/useEnvironmentControl';

interface NarrativeToolsProps {
  mapId: string;
  onRevealArea?: (area: RevealedArea) => void;
  onAddLightSource?: (lightSource: LightSource) => void;
  onAddObstacle?: (obstacle: Obstacle) => void;
  onEffectApplied?: (effectType: string, target: string) => void;
}

const NarrativeTools: React.FC<NarrativeToolsProps> = ({
  mapId,
  onRevealArea,
  onAddLightSource,
  onAddObstacle,
  onEffectApplied
}) => {
  const supabase = useSupabaseClient();
  const [activeTab, setActiveTab] = useState<'reveal' | 'lighting' | 'weather' | 'effects'>('reveal');
  const [presetName, setPresetName] = useState('');
  const [savedPresets, setSavedPresets] = useState<any[]>([]);
  
  // Configurações para revelação de área
  const [revealShape, setRevealShape] = useState<'circle' | 'square' | 'polygon'>('circle');
  const [revealRadius, setRevealRadius] = useState<number>(100);
  const [revealColor, setRevealColor] = useState<string>('rgba(0, 0, 0, 0)');
  const [revealOpacity, setRevealOpacity] = useState<number>(1);
  const [revealTransition, setRevealTransition] = useState<number>(500);
  
  // Configurações para efeitos de iluminação
  const [lightIntensity, setLightIntensity] = useState<number>(0.8);
  const [lightColor, setLightColor] = useState<string>('rgba(255, 200, 100, 0.7)');
  const [lightRadius, setLightRadius] = useState<number>(80);
  const [lightFlicker, setLightFlicker] = useState<boolean>(false);
  
  // Configurações para efeitos climáticos
  const [weatherType, setWeatherType] = useState<'clear' | 'rain' | 'snow' | 'fog' | 'storm'>('clear');
  const [weatherIntensity, setWeatherIntensity] = useState<number>(0.5);
  const [weatherSound, setWeatherSound] = useState<boolean>(true);
  
  // Configurações para efeitos narrativos
  const [effectType, setEffectType] = useState<'tremor' | 'flash' | 'darkness' | 'pulse' | 'fade'>('tremor');
  const [effectDuration, setEffectDuration] = useState<number>(3);
  const [effectTarget, setEffectTarget] = useState<'all' | 'selected'>('all');
  
  // Hook personalizado para controle de ambiente
  const { 
    applyEnvironmentEffect, 
    saveEnvironmentPreset, 
    loadEnvironmentPreset 
  } = useEnvironmentControl(mapId, supabase);

  // Carregar presets salvos
  useEffect(() => {
    fetchSavedPresets();
  }, [mapId]);

  // Buscar presets salvos do Supabase
  const fetchSavedPresets = async () => {
    try {
      const { data, error } = await supabase
        .from('environment_presets')
        .select('*')
        .eq('map_id', mapId);
      
      if (error) throw error;
      
      if (data) {
        setSavedPresets(data);
      }
    } catch (error) {
      console.error('Erro ao buscar presets salvos:', error);
    }
  };

  // Aplicar efeito de revelação de área
  const handleRevealArea = (position?: Point) => {
    const newArea: RevealedArea = {
      id: `reveal-${Date.now()}`,
      x: position?.x || 1000, // Posição padrão ou posição fornecida
      y: position?.y || 1000,
      radius: revealRadius,
      shape: revealShape,
      color: revealColor,
      opacity: revealOpacity,
      created_by: 'master',
      created_at: new Date().toISOString()
    };
    
    if (onRevealArea) {
      onRevealArea(newArea);
    }
    
    // Aplicar efeito de ambiente
    applyEnvironmentEffect('reveal', {
      area: newArea,
      transition: revealTransition
    });
    
    if (onEffectApplied) {
      onEffectApplied('reveal', 'area');
    }
  };

  // Aplicar efeito de iluminação
  const handleAddLight = (position?: Point) => {
    const newLight: LightSource = {
      id: `light-${Date.now()}`,
      position: position || { x: 1000, y: 1000 }, // Posição padrão ou posição fornecida
      radius: lightRadius,
      intensity: lightIntensity,
      color: lightColor,
      name: 'Efeito Narrativo',
      icon: '✨',
      is_dynamic: lightFlicker
    };
    
    if (onAddLightSource) {
      onAddLightSource(newLight);
    }
    
    // Aplicar efeito de ambiente
    applyEnvironmentEffect('lighting', {
      light: newLight,
      flicker: lightFlicker
    });
    
    if (onEffectApplied) {
      onEffectApplied('lighting', 'map');
    }
  };

  // Aplicar efeito climático
  const handleApplyWeather = () => {
    // Aplicar efeito de ambiente
    applyEnvironmentEffect('weather', {
      type: weatherType,
      intensity: weatherIntensity,
      sound: weatherSound
    });
    
    if (onEffectApplied) {
      onEffectApplied('weather', weatherType);
    }
  };

  // Aplicar efeito narrativo
  const handleApplyEffect = () => {
    // Aplicar efeito de ambiente
    applyEnvironmentEffect('effect', {
      type: effectType,
      duration: effectDuration,
      target: effectTarget
    });
    
    if (onEffectApplied) {
      onEffectApplied('effect', effectType);
    }
  };

  // Salvar preset atual
  const handleSavePreset = async () => {
    if (!presetName) {
      alert('Por favor, dê um nome ao preset');
      return;
    }
    
    const preset = {
      name: presetName,
      reveal: {
        shape: revealShape,
        radius: revealRadius,
        color: revealColor,
        opacity: revealOpacity,
        transition: revealTransition
      },
      lighting: {
        intensity: lightIntensity,
        color: lightColor,
        radius: lightRadius,
        flicker: lightFlicker
      },
      weather: {
        type: weatherType,
        intensity: weatherIntensity,
        sound: weatherSound
      },
      effect: {
        type: effectType,
        duration: effectDuration,
        target: effectTarget
      }
    };
    
    try {
      await saveEnvironmentPreset(presetName, preset);
      setPresetName('');
      fetchSavedPresets();
    } catch (error) {
      console.error('Erro ao salvar preset:', error);
    }
  };

  // Carregar preset salvo
  const handleLoadPreset = async (presetId: string) => {
    try {
      const preset = await loadEnvironmentPreset(presetId);
      
      if (preset) {
        // Atualizar configurações de revelação
        if (preset.reveal) {
          setRevealShape(preset.reveal.shape);
          setRevealRadius(preset.reveal.radius);
          setRevealColor(preset.reveal.color);
          setRevealOpacity(preset.reveal.opacity);
          setRevealTransition(preset.reveal.transition);
        }
        
        // Atualizar configurações de iluminação
        if (preset.lighting) {
          setLightIntensity(preset.lighting.intensity);
          setLightColor(preset.lighting.color);
          setLightRadius(preset.lighting.radius);
          setLightFlicker(preset.lighting.flicker);
        }
        
        // Atualizar configurações climáticas
        if (preset.weather) {
          setWeatherType(preset.weather.type);
          setWeatherIntensity(preset.weather.intensity);
          setWeatherSound(preset.weather.sound);
        }
        
        // Atualizar configurações de efeitos
        if (preset.effect) {
          setEffectType(preset.effect.type);
          setEffectDuration(preset.effect.duration);
          setEffectTarget(preset.effect.target);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar preset:', error);
    }
  };

  // Renderizar aba de revelação de área
  const renderRevealTab = () => (
    <div className="narrative-tab">
      <h3>Revelação de Área</h3>
      
      <div className="form-group">
        <label>Forma:</label>
        <select 
          value={revealShape} 
          onChange={(e) => setRevealShape(e.target.value as 'circle' | 'square' | 'polygon')}
        >
          <option value="circle">Círculo</option>
          <option value="square">Quadrado</option>
          <option value="polygon">Polígono</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Raio: {revealRadius}px</label>
        <input 
          type="range" 
          min="20" 
          max="300" 
          value={revealRadius} 
          onChange={(e) => setRevealRadius(parseInt(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Opacidade: {revealOpacity}</label>
        <input 
          type="range" 
          min="0" 
          max="1" 
          step="0.1" 
          value={revealOpacity} 
          onChange={(e) => setRevealOpacity(parseFloat(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Transição: {revealTransition}ms</label>
        <input 
          type="range" 
          min="0" 
          max="2000" 
          step="100" 
          value={revealTransition} 
          onChange={(e) => setRevealTransition(parseInt(e.target.value))}
        />
      </div>
      
      <button 
        className="apply-button"
        onClick={() => handleRevealArea()}
      >
        Aplicar Revelação
      </button>
    </div>
  );

  // Renderizar aba de efeitos de iluminação
  const renderLightingTab = () => (
    <div className="narrative-tab">
      <h3>Efeitos de Iluminação</h3>
      
      <div className="form-group">
        <label>Cor:</label>
        <input 
          type="color" 
          value={lightColor.replace(/[^#\w]/g, '')} 
          onChange={(e) => {
            const colorValue = e.target.value;
            setLightColor(`rgba(${parseInt(colorValue.slice(1, 3), 16)}, ${parseInt(colorValue.slice(3, 5), 16)}, ${parseInt(colorValue.slice(5, 7), 16)}, 0.7)`);
          }}
        />
      </div>
      
      <div className="form-group">
        <label>Intensidade: {lightIntensity}</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1" 
          value={lightIntensity} 
          onChange={(e) => setLightIntensity(parseFloat(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Raio: {lightRadius}px</label>
        <input 
          type="range" 
          min="20" 
          max="200" 
          value={lightRadius} 
          onChange={(e) => setLightRadius(parseInt(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Efeito de Tremulação:</label>
        <input 
          type="checkbox" 
          checked={lightFlicker} 
          onChange={(e) => setLightFlicker(e.target.checked)}
        />
      </div>
      
      <button 
        className="apply-button"
        onClick={() => handleAddLight()}
      >
        Aplicar Iluminação
      </button>
    </div>
  );

  // Renderizar aba de efeitos climáticos
  const renderWeatherTab = () => (
    <div className="narrative-tab">
      <h3>Efeitos Climáticos</h3>
      
      <div className="form-group">
        <label>Tipo:</label>
        <select 
          value={weatherType} 
          onChange={(e) => setWeatherType(e.target.value as 'clear' | 'rain' | 'snow' | 'fog' | 'storm')}
        >
          <option value="clear">Limpo</option>
          <option value="rain">Chuva</option>
          <option value="snow">Neve</option>
          <option value="fog">Névoa</option>
          <option value="storm">Tempestade</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Intensidade: {weatherIntensity}</label>
        <input 
          type="range" 
          min="0.1" 
          max="1" 
          step="0.1" 
          value={weatherIntensity} 
          onChange={(e) => setWeatherIntensity(parseFloat(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Som:</label>
        <input 
          type="checkbox" 
          checked={weatherSound} 
          onChange={(e) => setWeatherSound(e.target.checked)}
        />
      </div>
      
      <button 
        className="apply-button"
        onClick={handleApplyWeather}
      >
        Aplicar Clima
      </button>
    </div>
  );

  // Renderizar aba de efeitos narrativos
  const renderEffectsTab = () => (
    <div className="narrative-tab">
      <h3>Efeitos Narrativos</h3>
      
      <div className="form-group">
        <label>Tipo:</label>
        <select 
          value={effectType} 
          onChange={(e) => setEffectType(e.target.value as 'tremor' | 'flash' | 'darkness' | 'pulse' | 'fade')}
        >
          <option value="tremor">Tremor</option>
          <option value="flash">Flash</option>
          <option value="darkness">Escuridão</option>
          <option value="pulse">Pulso</option>
          <option value="fade">Fade</option>
        </select>
      </div>
      
      <div className="form-group">
        <label>Duração: {effectDuration}s</label>
        <input 
          type="range" 
          min="1" 
          max="10" 
          value={effectDuration} 
          onChange={(e) => setEffectDuration(parseInt(e.target.value))}
        />
      </div>
      
      <div className="form-group">
        <label>Alvo:</label>
        <select 
          value={effectTarget} 
          onChange={(e) => setEffectTarget(e.target.value as 'all' | 'selected')}
        >
          <option value="all">Todos os Jogadores</option>
          <option value="selected">Jogadores Selecionados</option>
        </select>
      </div>
      
      <button 
        className="apply-button"
        onClick={handleApplyEffect}
      >
        Aplicar Efeito
      </button>
    </div>
  );

  // Renderizar seção de presets
  const renderPresets = () => (
    <div className="presets-section">
      <h3>Presets</h3>
      
      <div className="save-preset">
        <input 
          type="text" 
          placeholder="Nome do Preset" 
          value={presetName} 
          onChange={(e) => setPresetName(e.target.value)}
        />
        <button onClick={handleSavePreset}>Salvar</button>
      </div>
      
      <div className="preset-list">
        {savedPresets.map(preset => (
          <div key={preset.id} className="preset-item">
            <span>{preset.name}</span>
            <button onClick={() => handleLoadPreset(preset.id)}>Carregar</button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div 
      className="narrative-tools"
      style={{
        backgroundColor: '#2d3748',
        borderRadius: '8px',
        padding: '16px',
        color: 'white',
        width: '300px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}
    >
      <h2 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Ferramentas Narrativas</h2>
      
      <div 
        className="tabs"
        style={{
          display: 'flex',
          marginBottom: '16px',
          borderBottom: '1px solid #4a5568'
        }}
      >
        <button 
          className={`tab ${activeTab === 'reveal' ? 'active' : ''}`}
          onClick={() => setActiveTab('reveal')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: activeTab === 'reveal' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderBottom: activeTab === 'reveal' ? '2px solid #63b3ed' : 'none'
          }}
        >
          Revelação
        </button>
        
        <button 
          className={`tab ${activeTab === 'lighting' ? 'active' : ''}`}
          onClick={() => setActiveTab('lighting')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: activeTab === 'lighting' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderBottom: activeTab === 'lighting' ? '2px solid #63b3ed' : 'none'
          }}
        >
          Iluminação
        </button>
        
        <button 
          className={`tab ${activeTab === 'weather' ? 'active' : ''}`}
          onClick={() => setActiveTab('weather')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: activeTab === 'weather' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderBottom: activeTab === 'weather' ? '2px solid #63b3ed' : 'none'
          }}
        >
          Clima
        </button>
        
        <button 
          className={`tab ${activeTab === 'effects' ? 'active' : ''}`}
          onClick={() => setActiveTab('effects')}
          style={{
            flex: 1,
            padding: '8px',
            backgroundColor: activeTab === 'effects' ? '#4a5568' : 'transparent',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            borderBottom: activeTab === 'effects' ? '2px solid #63b3ed' : 'none'
          }}
        >
          Efeitos
        </button>
      </div>
      
      <div className="tab-content" style={{ marginBottom: '16px' }}>
        {activeTab === 'reveal' && renderRevealTab()}
        {activeTab === 'lighting' && renderLightingTab()}
        {activeTab === 'weather' && renderWeatherTab()}
        {activeTab === 'effects' && renderEffectsTab()}
      </div>
      
      {renderPresets()}
    </div>
  );
};

export default NarrativeTools;