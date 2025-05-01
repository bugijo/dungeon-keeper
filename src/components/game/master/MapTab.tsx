import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import TacticalMapWithFog from '@/components/game/TacticalMapWithFog';
import { MapToken } from '@/types/game';

export interface MapTabProps {
  sessionId?: string;
  mapImageUrl?: string;
  fogOfWar?: { x: number, y: number }[];
  handleMapClick?: (x: number, y: number) => void;
  mapTokens?: MapToken[];
  handleTokenMove?: (tokenId: string, x: number, y: number) => void;
  maps?: any[];
  activeMap?: string | null;
  handleMapChange?: (mapId: string) => void;
  combatCharacters?: any[];
}

interface FogPoint {
  x: number;
  y: number;
}

const MapTab: React.FC<MapTabProps> = ({ 
  sessionId,
  mapImageUrl = '/placeholder.svg',
  mapTokens = [],
  handleTokenMove,
  maps = [],
  activeMap,
  handleMapChange
}) => {
  const [fogPoints, setFogPoints] = useState<FogPoint[]>([]);
  const [showFog, setShowFog] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [availableMaps, setAvailableMaps] = useState<any[]>([]);
  
  useEffect(() => {
    const fetchMapData = async () => {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        
        // Fetch available maps
        const { data: mapsData, error: mapsError } = await supabase
          .from('maps')
          .select('id, name, image_url, description');
          
        if (mapsError) throw mapsError;
        
        setAvailableMaps(mapsData || []);
        
        // Fetch fog of war data
        const { data: fogData, error: fogError } = await supabase
          .from('fog_of_war')
          .select('grid_positions')
          .eq('session_id', sessionId)
          .single();
          
        if (fogError && fogError.code !== 'PGRST116') {
          throw fogError;
        }
        
        if (fogData && fogData.grid_positions) {
          // Convertendo explicitamente o tipo
          const gridPoints = fogData.grid_positions as {x: number, y: number}[];
          setFogPoints(gridPoints);
        }
      } catch (error) {
        console.error('Erro ao carregar dados do mapa:', error);
        toast.error('Erro ao carregar dados do mapa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMapData();
  }, [sessionId]);
  
  const handleFogToggle = (show: boolean) => {
    setShowFog(show);
  };
  
  const handleMapClick = async (x: number, y: number) => {
    // Toggle fog of war at clicked position
    const existingPointIndex = fogPoints.findIndex(
      point => point.x === x && point.y === y
    );
    
    let updatedFogPoints;
    if (existingPointIndex !== -1) {
      // Remove fog at this point
      updatedFogPoints = fogPoints.filter((_, index) => index !== existingPointIndex);
    } else {
      // Add fog at this point
      updatedFogPoints = [...fogPoints, { x, y }];
    }
    
    setFogPoints(updatedFogPoints);
    
    // Update fog data in Supabase
    if (sessionId) {
      try {
        const { data, error: checkError } = await supabase
          .from('fog_of_war')
          .select('id')
          .eq('session_id', sessionId)
          .single();
          
        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }
        
        if (data) {
          // Update existing record
          const { error } = await supabase
            .from('fog_of_war')
            .update({
              grid_positions: updatedFogPoints
            })
            .eq('id', data.id);
            
          if (error) throw error;
        } else {
          // Create new record
          const { error } = await supabase
            .from('fog_of_war')
            .insert({
              session_id: sessionId,
              grid_positions: updatedFogPoints
            });
            
          if (error) throw error;
        }
      } catch (error) {
        console.error('Erro ao atualizar névoa de guerra:', error);
        toast.error('Erro ao atualizar névoa de guerra');
      }
    }
  };
  
  const clearFog = async () => {
    setFogPoints([]);
    
    if (sessionId) {
      try {
        const { error } = await supabase
          .from('fog_of_war')
          .update({ grid_positions: [] })
          .eq('session_id', sessionId);
          
        if (error) throw error;
        
        toast.success('Névoa de guerra removida');
      } catch (error) {
        console.error('Erro ao limpar névoa de guerra:', error);
        toast.error('Erro ao limpar névoa de guerra');
      }
    }
  };
  
  const selectMap = (mapId: string) => {
    if (handleMapChange) {
      handleMapChange(mapId);
    }
  };
  
  const tokenData = mapTokens.map(token => ({
    id: token.id,
    x: token.x,
    y: token.y,
    color: token.color,
    name: token.name,
    label: token.label || token.name, // Use o nome como label se não houver label definido
    size: token.size
  }));
  
  return (
    <div>
      <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-4">Controle do Mapa</h3>
      
      <div className="mb-4">
        <div className="mb-2">
          <p className="text-fantasy-stone mb-2">Mapas Disponíveis:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-32 overflow-y-auto mb-4">
            {availableMaps.length > 0 ? (
              availableMaps.map(map => (
                <Button
                  key={map.id}
                  variant={activeMap === map.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => selectMap(map.id)}
                  className="text-left text-xs truncate"
                >
                  {map.name}
                </Button>
              ))
            ) : (
              <p className="text-fantasy-stone/70 text-sm col-span-3">Nenhum mapa disponível</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 mb-4">
          <Checkbox 
            id="show-fog" 
            checked={showFog}
            onCheckedChange={(checked) => handleFogToggle(!!checked)} 
          />
          <Label htmlFor="show-fog" className="text-fantasy-stone cursor-pointer">
            {showFog ? (
              <span className="flex items-center"><Eye className="h-4 w-4 mr-1" /> Mostrar névoa de guerra</span>
            ) : (
              <span className="flex items-center"><EyeOff className="h-4 w-4 mr-1" /> Ocultar névoa de guerra</span>
            )}
          </Label>
        </div>
        
        <Button 
          onClick={clearFog} 
          variant="destructive" 
          size="sm"
          className="mb-4"
        >
          Limpar Toda a Névoa
        </Button>
      </div>
      
      <div className="border border-fantasy-purple/30 p-4 rounded-lg bg-fantasy-dark/30">
        <TacticalMapWithFog
          mapImageUrl={mapImageUrl}
          fogPoints={fogPoints}
          onMapClick={handleMapClick}
          isGameMaster={true}
          tokens={tokenData}
          onTokenMove={handleTokenMove}
        />
      </div>
      
      <div className="mt-4 text-sm text-fantasy-stone">
        <p>Instruções:</p>
        <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
          <li>Clique em uma célula do mapa para adicionar/remover névoa</li>
          <li>A névoa só é visível para os jogadores, não para o mestre</li>
          <li>Arraste tokens para movê-los pelo mapa</li>
        </ul>
      </div>
    </div>
  );
};

export default MapTab;
