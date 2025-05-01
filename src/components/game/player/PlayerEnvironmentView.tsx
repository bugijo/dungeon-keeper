import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { ImageLoader } from '@/components/ImageLoader';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PlayerEnvironmentViewProps {
  sessionId: string;
  tableId: string;
}

interface SceneData {
  id: string;
  name: string;
  description?: string;
  imageUrl: string;
  audioTrackId: string;
  narrativeText?: string;
}

const PlayerEnvironmentView: React.FC<PlayerEnvironmentViewProps> = ({
  sessionId,
  tableId
}) => {
  const [currentScene, setCurrentScene] = useState<SceneData | null>(null);
  const [narrativeText, setNarrativeText] = useState<string>('');
  const audioSystem = useAudioSystem();
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.5);
  
  // Simula a recepção de dados do mestre (em produção, isso seria via WebSocket ou similar)
  useEffect(() => {
    // Função para receber atualizações de cena do mestre
    const receiveSceneUpdate = (sceneData: SceneData) => {
      setCurrentScene(sceneData);
      
      // Se houver texto narrativo, atualize-o
      if (sceneData.narrativeText) {
        setNarrativeText(sceneData.narrativeText);
      }
      
      // Reproduzir o áudio associado à cena
      if (sceneData.audioTrackId && audioSystem) {
        // Aqui você implementaria a lógica para reproduzir o áudio
        // baseado no audioTrackId recebido
        console.log(`Reproduzindo áudio: ${sceneData.audioTrackId}`);
      }
    };
    
    // Simula recebimento de dados (em produção, seria um listener de WebSocket)
    const simulateDataReceived = () => {
      // Dados de exemplo para desenvolvimento
      const sampleScene: SceneData = {
        id: '1',
        name: 'Floresta Misteriosa',
        description: 'Uma floresta densa e nebulosa, com árvores antigas e sons misteriosos.',
        imageUrl: '/assets/images/scenes/forest.jpg',
        audioTrackId: '3',
        narrativeText: 'Vocês adentram uma floresta antiga. O ar está pesado com umidade e o cheiro de musgo. ' +
                      'Galhos estalando e sons distantes de criaturas ecoam entre as árvores centenárias.'
      };
      
      receiveSceneUpdate(sampleScene);
    };
    
    // Simula recebimento inicial de dados
    simulateDataReceived();
    
    // Configura um listener para atualizações (em produção, seria WebSocket)
    const setupRealTimeListener = () => {
      // Aqui você implementaria a lógica para ouvir atualizações em tempo real
      console.log(`Configurando listener para sessão ${sessionId} na mesa ${tableId}`);
      
      // Retorna uma função de limpeza
      return () => {
        console.log('Removendo listener de tempo real');
      };
    };
    
    const cleanup = setupRealTimeListener();
    return cleanup;
  }, [sessionId, tableId, audioSystem]);
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implementar lógica para mutar/desmutar o áudio
  };
  
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    // Implementar lógica para ajustar o volume
  };
  
  return (
    <div className="w-full space-y-4">
      {/* Visualização da imagem da cena */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="relative">
            <div className="aspect-video w-full overflow-hidden bg-muted">
              {currentScene?.imageUrl ? (
                <ImageLoader
                  src={currentScene.imageUrl}
                  alt={currentScene.name}
                  className="w-full h-full object-cover"
                  fallbackText="Cena"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-muted-foreground">Aguardando o mestre iniciar uma cena...</p>
                </div>
              )}
            </div>
            
            {/* Overlay com informações da cena */}
            {currentScene && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-white">
                <h3 className="font-bold text-lg">{currentScene.name}</h3>
                {currentScene.description && (
                  <p className="text-sm opacity-90">{currentScene.description}</p>
                )}
                
                {/* Controles de áudio para o jogador */}
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:text-white hover:bg-white/20"
                    onClick={toggleMute}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </Button>
                  <div className="w-24">
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Área de narrativa */}
      {narrativeText && (
        <Card>
          <CardContent className="p-4">
            <div className="prose prose-invert max-w-none">
              <p className="text-lg font-medievalsharp italic">{narrativeText}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerEnvironmentView;