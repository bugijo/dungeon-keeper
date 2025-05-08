/**
 * Painel de Controle de Iluminação
 * Permite que o mestre do jogo ajuste as configurações de iluminação e sombras
 * Controla o sistema integrado de iluminação dinâmica e projeção de sombras
 */

import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { LightSource } from '../../utils/lightingUtils';

interface LightingControlPanelProps {
  mapId: string;
  isGameMaster: boolean;
  onSettingsChange?: (settings: LightingSettings) => void;
  initialSettings?: Partial<LightingSettings>;
}

export interface LightingSettings {
  ambientLight: number;
  timeOfDay: 'dawn' | 'day' | 'dusk' | 'night';
  weatherCondition: 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy';
  shadowQuality: 'low' | 'medium' | 'high';
  enableSoftShadows: boolean;
  enableFlickering: boolean;
}

const LightingControlPanel: React.FC<LightingControlPanelProps> = ({
  mapId,
  isGameMaster,
  onSettingsChange,
  initialSettings
}) => {
  // Estado para armazenar configurações de iluminação
  const [settings, setSettings] = useState<LightingSettings>({
    ambientLight: initialSettings?.ambientLight ?? 0.3,
    timeOfDay: initialSettings?.timeOfDay ?? 'day',
    weatherCondition: initialSettings?.weatherCondition ?? 'clear',
    shadowQuality: initialSettings?.shadowQuality ?? 'medium',
    enableSoftShadows: initialSettings?.enableSoftShadows ?? true,
    enableFlickering: initialSettings?.enableFlickering ?? true
  });
  
  // Cliente Supabase para sincronização em tempo real
  const supabase = useSupabaseClient();

  // Efeito para buscar configurações iniciais do Supabase
  useEffect(() => {
    if (!mapId) return;
    
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase
          .from('map_settings')
          .select('*')
          .eq('map_id', mapId)
          .single();
          
        if (error && error.code !== 'PGRST116') throw error; // PGRST116 = não encontrado
        
        if (data) {
          setSettings({
            ambientLight: data.ambient_light ?? settings.ambientLight,
            timeOfDay: data.time_of_day ?? settings.timeOfDay,
            weatherCondition: data.weather_condition ?? settings.weatherCondition,
            shadowQuality: data.shadow_quality ?? settings.shadowQuality,
            enableSoftShadows: data.enable_soft_shadows ?? settings.enableSoftShadows,
            enableFlickering: data.enable_flickering ?? settings.enableFlickering
          });
        }
      } catch (error) {
        console.error('Erro ao buscar configurações de iluminação:', error);
      }
    };
    
    fetchSettings();
    
    // Configurar assinatura em tempo real para atualizações
    const settingsSubscription = supabase
      .channel(`map-settings-${mapId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'map_settings', filter: `map_id=eq.${mapId}` },
        (payload) => {
          fetchSettings();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(settingsSubscription);
    };
  }, [mapId, supabase]);

  // Efeito para notificar o componente pai sobre mudanças nas configurações
  useEffect(() => {
    if (onSettingsChange) {
      onSettingsChange(settings);
    }
    
    // Sincronizar com o Supabase para outros jogadores
    syncSettingsWithSupabase();
  }, [settings]);

  // Função para sincronizar configurações com o Supabase
  const syncSettingsWithSupabase = async () => {
    if (!isGameMaster) return; // Apenas o mestre pode alterar configurações
    
    try {
      await supabase
        .from('map_settings')
        .upsert({
          map_id: mapId,
          ambient_light: settings.ambientLight,
          time_of_day: settings.timeOfDay,
          weather_condition: settings.weatherCondition,
          shadow_quality: settings.shadowQuality,
          enable_soft_shadows: settings.enableSoftShadows,
          enable_flickering: settings.enableFlickering,
          updated_at: new Date().toISOString()
        }, { onConflict: 'map_id' });
    } catch (error) {
      console.error('Erro ao sincronizar configurações de iluminação:', error);
    }
  };

  // Manipuladores para mudanças nas configurações
  const handleAmbientLightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, ambientLight: parseFloat(e.target.value) }));
  };

  const handleTimeOfDayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ 
      ...prev, 
      timeOfDay: e.target.value as 'dawn' | 'day' | 'dusk' | 'night' 
    }));
  };

  const handleWeatherConditionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ 
      ...prev, 
      weatherCondition: e.target.value as 'clear' | 'cloudy' | 'foggy' | 'rainy' | 'stormy' 
    }));
  };

  const handleShadowQualityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSettings(prev => ({ 
      ...prev, 
      shadowQuality: e.target.value as 'low' | 'medium' | 'high' 
    }));
  };

  const handleSoftShadowsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, enableSoftShadows: e.target.checked }));
  };

  const handleFlickeringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSettings(prev => ({ ...prev, enableFlickering: e.target.checked }));
  };

  // Não renderizar nada se não for o mestre do jogo
  if (!isGameMaster) return null;

  return (
    <div className="lighting-control-panel">
      <h3>Controles de Iluminação</h3>
      
      <div className="control-group">
        <label>
          Luz Ambiente: {Math.round(settings.ambientLight * 100)}%
          <input 
            type="range" 
            min="0" 
            max="1" 
            step="0.05"
            value={settings.ambientLight}
            onChange={handleAmbientLightChange}
          />
        </label>
      </div>
      
      <div className="control-group">
        <label>
          Período do Dia:
          <select value={settings.timeOfDay} onChange={handleTimeOfDayChange}>
            <option value="dawn">Amanhecer</option>
            <option value="day">Dia</option>
            <option value="dusk">Entardecer</option>
            <option value="night">Noite</option>
          </select>
        </label>
      </div>
      
      <div className="control-group">
        <label>
          Condição Climática:
          <select value={settings.weatherCondition} onChange={handleWeatherConditionChange}>
            <option value="clear">Limpo</option>
            <option value="cloudy">Nublado</option>
            <option value="foggy">Neblina</option>
            <option value="rainy">Chuva</option>
            <option value="stormy">Tempestade</option>
          </select>
        </label>
      </div>
      
      <div className="control-group">
        <label>
          Qualidade das Sombras:
          <select value={settings.shadowQuality} onChange={handleShadowQualityChange}>
            <option value="low">Baixa</option>
            <option value="medium">Média</option>
            <option value="high">Alta</option>
          </select>
        </label>
      </div>
      
      <div className="control-group">
        <label>
          <input 
            type="checkbox" 
            checked={settings.enableSoftShadows}
            onChange={handleSoftShadowsChange}
          />
          Sombras Suaves
        </label>
      </div>
      
      <div className="control-group">
        <label>
          <input 
            type="checkbox" 
            checked={settings.enableFlickering}
            onChange={handleFlickeringChange}
          />
          Efeito de Cintilação
        </label>
      </div>
      
      <div className="preset-buttons">
        <button onClick={() => setSettings(prev => ({ 
          ...prev, 
          timeOfDay: 'day',
          weatherCondition: 'clear',
          ambientLight: 0.8
        }))}>Dia Ensolarado</button>
        
        <button onClick={() => setSettings(prev => ({ 
          ...prev, 
          timeOfDay: 'night',
          weatherCondition: 'clear',
          ambientLight: 0.1
        }))}>Noite Estrelada</button>
        
        <button onClick={() => setSettings(prev => ({ 
          ...prev, 
          timeOfDay: 'dusk',
          weatherCondition: 'foggy',
          ambientLight: 0.3
        }))}>Névoa Crepuscular</button>
        
        <button onClick={() => setSettings(prev => ({ 
          ...prev, 
          timeOfDay: 'night',
          weatherCondition: 'stormy',
          ambientLight: 0.05
        }))}>Tempestade Noturna</button>
      </div>
    </div>
  );
};

export default LightingControlPanel;