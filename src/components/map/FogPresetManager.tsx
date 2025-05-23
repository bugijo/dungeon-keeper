import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Trash2, Download, Upload } from 'lucide-react';

interface FogPreset {
  id: string;
  name: string;
  areas: { x: number; y: number; radius: number; timestamp: number }[];
  created_at?: string;
}

interface FogPresetManagerProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  currentAreas: { x: number; y: number; radius: number; timestamp: number }[];
  onPresetLoad: (areas: { x: number; y: number; radius: number; timestamp: number }[]) => void;
}

const FogPresetManager: React.FC<FogPresetManagerProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  currentAreas,
  onPresetLoad
}) => {
  const [presets, setPresets] = useState<FogPreset[]>([]);
  const [newPresetName, setNewPresetName] = useState('');
  const [showNameInput, setShowNameInput] = useState(false);
  const [loading, setLoading] = useState(false);

  // Carregar presets salvos
  useEffect(() => {
    if (!isGameMaster || !mapId) return;
    
    fetchPresets();
  }, [mapId, isGameMaster]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fog_presets')
        .select('*')
        .eq('map_id', mapId);

      if (error) throw error;

      if (data) {
        const formattedPresets = data.map(preset => ({
          id: preset.id,
          name: preset.name,
          areas: preset.areas ? JSON.parse(preset.areas) : [],
          created_at: preset.created_at
        }));

        setPresets(formattedPresets);
      }
    } catch (error) {
      console.error('Erro ao carregar presets de névoa:', error);
      toast.error('Não foi possível carregar os presets de névoa');
    } finally {
      setLoading(false);
    }
  };

  const savePreset = async () => {
    if (!isGameMaster || !mapId || !newPresetName.trim()) {
      toast.error('Nome do preset não pode estar vazio');
      return;
    }
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fog_presets')
        .insert({
          map_id: mapId,
          game_id: gameId,
          name: newPresetName,
          areas: JSON.stringify(currentAreas),
          created_by: userId
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newPreset = {
          id: data.id,
          name: newPresetName,
          areas: currentAreas,
          created_at: data.created_at
        };
        
        setPresets([...presets, newPreset]);
        setNewPresetName('');
        setShowNameInput(false);
        
        toast.success(`Preset "${newPresetName}" salvo com sucesso!`);
      }
    } catch (error) {
      console.error('Erro ao salvar preset:', error);
      toast.error('Não foi possível salvar o preset');
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset: FogPreset) => {
    if (!preset) return;
    
    onPresetLoad(preset.areas);
    toast.success(`Preset "${preset.name}" carregado!`);
  };

  const deletePreset = async (presetId: string) => {
    if (!isGameMaster) return;
    
    if (!confirm('Tem certeza que deseja excluir este preset?')) return;
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('fog_presets')
        .delete()
        .eq('id', presetId);
        
      if (error) throw error;
      
      setPresets(presets.filter(p => p.id !== presetId));
      toast.success('Preset excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir preset:', error);
      toast.error('Não foi possível excluir o preset');
    } finally {
      setLoading(false);
    }
  };

  const exportPreset = (preset: FogPreset) => {
    const dataStr = JSON.stringify(preset);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `fog-preset-${preset.name.replace(/\s+/g, '-')}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const importPreset = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files?.length) return;
      
      const file = target.files[0];
      const reader = new FileReader();
      
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const preset = JSON.parse(content) as FogPreset;
          
          // Verificar se o formato é válido
          if (!preset.name || !Array.isArray(preset.areas)) {
            throw new Error('Formato de arquivo inválido');
          }
          
          // Salvar o preset importado
          const { data, error } = await supabase
            .from('fog_presets')
            .insert({
              map_id: mapId,
              game_id: gameId,
              name: `${preset.name} (Importado)`,
              areas: JSON.stringify(preset.areas),
              created_by: userId
            })
            .select()
            .single();
            
          if (error) throw error;
          
          if (data) {
            const importedPreset = {
              id: data.id,
              name: `${preset.name} (Importado)`,
              areas: preset.areas,
              created_at: data.created_at
            };
            
            setPresets([...presets, importedPreset]);
            toast.success(`Preset "${preset.name}" importado com sucesso!`);
          }
        } catch (error) {
          console.error('Erro ao importar preset:', error);
          toast.error('Não foi possível importar o preset. Verifique o formato do arquivo.');
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  };

  if (!isGameMaster) return null;

  return (
    <div className="bg-fantasy-dark/80 p-2 rounded-md flex flex-col gap-2 w-full max-w-xs">
      <h3 className="text-fantasy-gold text-sm font-bold">Presets de Névoa</h3>
      
      <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto">
        {presets.map(preset => (
          <div key={preset.id} className="flex items-center gap-1 bg-fantasy-dark/50 p-1 rounded">
            <button
              className="text-fantasy-stone text-xs hover:text-fantasy-gold"
              onClick={() => loadPreset(preset)}
              title={`Carregar preset: ${preset.name}`}
            >
              {preset.name}
            </button>
            <button
              className="text-fantasy-stone/70 hover:text-fantasy-gold p-1"
              onClick={() => exportPreset(preset)}
              title="Exportar preset"
            >
              <Download size={12} />
            </button>
            <button
              className="text-fantasy-red/70 hover:text-fantasy-red p-1"
              onClick={() => deletePreset(preset.id)}
              title="Excluir preset"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
      
      {showNameInput ? (
        <div className="flex gap-1 items-center">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Nome do preset"
            className="bg-fantasy-dark text-fantasy-stone text-xs p-1 rounded flex-1"
            disabled={loading}
          />
          <button
            className="bg-fantasy-gold/70 text-fantasy-dark p-1 rounded text-xs disabled:opacity-50"
            onClick={savePreset}
            disabled={loading || !newPresetName.trim()}
          >
            <Save size={12} />
          </button>
          <button
            className="bg-fantasy-red/70 text-white p-1 rounded text-xs disabled:opacity-50"
            onClick={() => setShowNameInput(false)}
            disabled={loading}
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex gap-1">
          <button
            className="bg-fantasy-gold/70 text-fantasy-dark p-1 rounded text-xs flex-1 flex items-center justify-center gap-1"
            onClick={() => setShowNameInput(true)}
            disabled={loading}
          >
            <Save size={12} />
            Salvar Preset
          </button>
          <button
            className="bg-fantasy-stone/30 text-fantasy-stone p-1 rounded text-xs flex items-center justify-center"
            onClick={importPreset}
            disabled={loading}
            title="Importar preset"
          >
            <Upload size={12} />
          </button>
        </div>
      )}
    </div>
  );
};

export default FogPresetManager;