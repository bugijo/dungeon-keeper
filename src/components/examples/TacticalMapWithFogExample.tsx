import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import IntegratedFogOfWar from '../map/IntegratedFogOfWar';

interface TacticalMapWithFogExampleProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
}

const TacticalMapWithFogExample: React.FC<TacticalMapWithFogExampleProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster
}) => {
  const [mapDetails, setMapDetails] = useState<{
    width: number;
    height: number;
    gridSize: number;
    imageUrl: string;
  }>({ width: 1000, height: 800, gridSize: 50, imageUrl: '' });
  const [loading, setLoading] = useState(true);

  // Carregar detalhes do mapa
  useEffect(() => {
    const fetchMapDetails = async () => {
      if (!mapId) return;
      
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('tactical_maps')
          .select('width, height, grid_size, image_url')
          .eq('id', mapId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setMapDetails({
            width: data.width || 1000,
            height: data.height || 800,
            gridSize: data.grid_size || 50,
            imageUrl: data.image_url || ''
          });
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes do mapa:', error);
        toast.error('Não foi possível carregar os detalhes do mapa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMapDetails();
  }, [mapId]);

  if (loading) {
    return <div className="flex justify-center items-center h-64">Carregando mapa...</div>;
  }

  return (
    <div className="relative w-full overflow-auto">
      {/* Imagem do mapa */}
      <div className="relative">
        <img 
          src={mapDetails.imageUrl || '/placeholder-map.jpg'} 
          alt="Mapa Tático" 
          className="w-full h-auto"
          style={{ width: mapDetails.width, height: mapDetails.height }}
        />
        
        {/* Integração do Fog of War */}
        <div className="absolute top-0 left-0 w-full h-full">
          <IntegratedFogOfWar
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            width={mapDetails.width}
            height={mapDetails.height}
            gridSize={mapDetails.gridSize}
          />
        </div>
      </div>
      
      {/* Informações do mapa */}
      <div className="mt-4 p-3 bg-fantasy-dark/80 rounded-md">
        <h3 className="text-fantasy-gold font-medievalsharp text-lg mb-2">Informações do Mapa</h3>
        <div className="grid grid-cols-2 gap-2 text-sm text-fantasy-stone">
          <div>Dimensões: {mapDetails.width}x{mapDetails.height}px</div>
          <div>Tamanho da Grade: {mapDetails.gridSize}px</div>
        </div>
        <div className="mt-2 text-xs text-fantasy-stone/70">
          <p>Dica: O mestre pode usar as ferramentas de névoa para revelar áreas do mapa aos jogadores.</p>
          <p>Jogadores só podem ver áreas que o mestre revelou.</p>
        </div>
      </div>
    </div>
  );
};

export default TacticalMapWithFogExample;