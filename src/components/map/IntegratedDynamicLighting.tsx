import React, { useState, useEffect, useRef } from 'react';
import { LightSource, renderDynamicLighting, applyLightFlickering, createLightSource } from '@/utils/lightingUtils';
import { Obstacle, RevealedArea, updateDynamicLightSources } from '@/utils/fogOfWarUtils';
import DynamicLightingController from './DynamicLightingController';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Flame } from 'lucide-react';

interface IntegratedDynamicLightingProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  obstacles: Obstacle[];
  revealedAreas: RevealedArea[];
  onRevealedAreasUpdate: (areas: RevealedArea[]) => void;
  width: number;
  height: number;
  gridSize: number;
}

const IntegratedDynamicLighting: React.FC<IntegratedDynamicLightingProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  obstacles,
  revealedAreas,
  onRevealedAreasUpdate,
  width,
  height,
  gridSize
}) => {
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [ambientLight, setAmbientLight] = useState<number>(0.1);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  
  // Carregar fontes de luz do banco de dados
  useEffect(() => {
    if (!mapId) return;

    const loadLightSources = async () => {
      try {
        const { data, error } = await supabase
          .from('map_light_sources')
          .select('*')
          .eq('map_id', mapId);

        if (error) throw error;

        if (data && data.length > 0) {
          // Converter dados do banco para objetos LightSource
          const loadedSources: LightSource[] = data.map(item => ({
            id: item.id,
            position: { x: item.position_x, y: item.position_y },
            radius: item.radius,
            color: item.color,
            intensity: item.intensity,
            flickering: item.flickering,
            flickerIntensity: item.flicker_intensity,
            castShadows: item.cast_shadows
          }));

          setLightSources(loadedSources);
          console.log(`Carregadas ${loadedSources.length} fontes de luz para o mapa ${mapId}`);
          
          // Atualizar áreas reveladas com base nas fontes de luz carregadas
          updateRevealedAreasFromLights(loadedSources);
        } else if (isGameMaster) {
          // Se não houver fontes de luz e for o mestre, criar uma fonte padrão
          createDefaultLightSource();
        }
      } catch (error) {
        console.error('Erro ao carregar fontes de luz:', error);
        toast.error('Erro ao carregar fontes de luz');
      }
    };
    
    // Criar fonte de luz padrão para o mestre
    const createDefaultLightSource = async () => {
      try {
        // Criar uma fonte de luz no centro do mapa
        const defaultLight = createLightSource({
          id: `light-default-${Date.now()}`,
          x: width / 2,
          y: height / 2,
          radius: gridSize * 5,
          color: 'rgba(255, 200, 100, 0.8)',
          intensity: 0.8,
          flickering: true,
          flickerIntensity: 0.2,
          castShadows: true
        });
        
        // Salvar no banco de dados
        const { data, error } = await supabase
          .from('map_light_sources')
          .insert({
            id: defaultLight.id,
            map_id: mapId,
            position_x: defaultLight.position.x,
            position_y: defaultLight.position.y,
            radius: defaultLight.radius,
            color: defaultLight.color,
            intensity: defaultLight.intensity,
            flickering: defaultLight.flickering,
            flicker_intensity: defaultLight.flickerIntensity,
            cast_shadows: defaultLight.castShadows,
            created_by: userId
          })
          .select();

        if (error) throw error;
        
        setLightSources([defaultLight]);
        toast.success('Fonte de luz padrão criada', {
          icon: <Flame className="h-4 w-4 text-amber-500" />
        });
        
        // Notificar outros jogadores
        await supabase
          .channel(`lighting-updates-${mapId}`)
          .send({
            type: 'broadcast',
            event: 'lighting-update',
            payload: { lightSources: [defaultLight] }
          });
      } catch (error) {
        console.error('Erro ao criar fonte de luz padrão:', error);
      }
    };

    loadLightSources();

    // Configurar canal de tempo real para atualizações de iluminação
    const channel = supabase
      .channel(`lighting-updates-${mapId}`)
      .on('broadcast', { event: 'lighting-update' }, (payload) => {
        if (payload.payload && Array.isArray(payload.payload.lightSources)) {
          const updatedLights = payload.payload.lightSources;
          setLightSources(updatedLights);
          updateRevealedAreasFromLights(updatedLights);
        }
      })
      .on('broadcast', { event: 'ambient-light-update' }, (payload) => {
        if (payload.payload && typeof payload.payload.ambientLight === 'number') {
          setAmbientLight(payload.payload.ambientLight);
        }
      })
      .on('broadcast', { event: 'light-source-moved' }, (payload) => {
        if (payload.payload && payload.payload.lightSource) {
          const movedLight = payload.payload.lightSource;
          setLightSources(prev => prev.map(light => 
            light.id === movedLight.id ? movedLight : light
          ));
          // Atualizar áreas reveladas quando uma luz é movida
          updateRevealedAreasFromLights(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [mapId, userId, isGameMaster, width, height, gridSize]);

  // Função para atualizar áreas reveladas com base nas fontes de luz
  const updateRevealedAreasFromLights = (sources: LightSource[] | null) => {
    const lightsToUse = sources || lightSources;
    if (lightsToUse.length === 0) return;

    // Converter LightSource para o formato esperado por updateDynamicLightSources
    const lightSourcesForFog = lightsToUse.map(source => ({
      id: source.id,
      position: source.position,
      radius: source.radius,
      color: source.color,
      is_dynamic: true
    }));

    // Atualizar áreas reveladas pela luz
    const dynamicAreas = revealedAreas.filter(area => area.is_dynamic);
    const staticAreas = revealedAreas.filter(area => !area.is_dynamic);
    
    const updatedDynamicAreas = updateDynamicLightSources(
      dynamicAreas,
      lightSourcesForFog,
      obstacles
    );

    // Combinar áreas estáticas com áreas dinâmicas atualizadas
    const combinedAreas = [...staticAreas, ...updatedDynamicAreas];
    onRevealedAreasUpdate(combinedAreas);
  };
  
  // Atualizar áreas reveladas quando as fontes de luz ou obstáculos mudarem
  useEffect(() => {
    updateRevealedAreasFromLights(null);
  }, [lightSources, obstacles]);

  // Renderizar efeito de iluminação dinâmica
  useEffect(() => {
    const canvas = lightingCanvasRef.current;
    if (!canvas) return;

    // Configurar tamanho do canvas
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Função para renderizar o frame
    const renderFrame = () => {
      // Limpar o canvas
      ctx.clearRect(0, 0, width, height);
      
      // Aplicar efeito de oscilação nas fontes de luz
      const flickeringLights = applyLightFlickering(lightSources, 16);
      
      // Renderizar iluminação dinâmica
      renderDynamicLighting(ctx, flickeringLights, obstacles, width, height, ambientLight);
      
      // Agendar próximo frame
      animationFrameRef.current = requestAnimationFrame(renderFrame);
    };

    // Iniciar loop de renderização
    renderFrame();

    // Limpar ao desmontar
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [lightSources, obstacles, width, height, ambientLight]);
  
  // Sincronizar alterações na luz ambiente com outros jogadores
  const updateAmbientLight = async (value: number) => {
    setAmbientLight(value);
    
    try {
      // Atualizar no banco de dados
      const { error } = await supabase
        .from('map_settings')
        .upsert({
          map_id: mapId,
          ambient_light: value,
          updated_by: userId,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      
      // Notificar outros jogadores
      await supabase
        .channel(`lighting-updates-${mapId}`)
        .send({
          type: 'broadcast',
          event: 'ambient-light-update',
          payload: { ambientLight: value }
        });
    } catch (error) {
      console.error('Erro ao atualizar luz ambiente:', error);
    }
  };

  return (
    <div className="relative">
      {/* Canvas para renderização da iluminação dinâmica */}
      <canvas
        ref={lightingCanvasRef}
        className="absolute top-0 left-0 w-full h-full pointer-events-none z-10"
        style={{ mixBlendMode: 'multiply' }}
      />
      
      {/* Controlador de iluminação (apenas para o mestre) */}
      {isGameMaster && (
        <div className="absolute top-2 right-2 z-20">
          <DynamicLightingController
            mapId={mapId}
            gameId={gameId}
            userId={userId}
            isGameMaster={isGameMaster}
            lightSources={lightSources}
            onLightSourcesUpdate={setLightSources}
            gridSize={gridSize}
            width={width}
            height={height}
            ambientLight={ambientLight}
            onAmbientLightUpdate={updateAmbientLight}
          />
        </div>
      )}
    </div>
  );
};

export default IntegratedDynamicLighting;