import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

interface PlayerSceneViewerProps {
  sceneImage?: string;
  sceneName?: string;
  sceneDescription?: string;
  audioTrackId?: string;
  choices?: string[];
  onChoiceSelect?: (choice: string) => void;
}

const PlayerSceneViewer: React.FC<PlayerSceneViewerProps> = ({
  sceneImage,
  sceneName,
  sceneDescription,
  audioTrackId,
  choices = [],
  onChoiceSelect
}) => {
  const [volume, setVolume] = useState(() => {
    const savedVolume = localStorage.getItem('player-audio-volume');
    return savedVolume ? parseInt(savedVolume) : 70;
  });
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem('player-audio-mute');
    return savedMute ? savedMute === 'true' : false;
  });

  // Salvar configurações de áudio no localStorage
  useEffect(() => {
    localStorage.setItem('player-audio-volume', volume.toString());
    localStorage.setItem('player-audio-mute', isMuted.toString());
  }, [volume, isMuted]);

  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleChoiceClick = (choice: string) => {
    if (onChoiceSelect) {
      onChoiceSelect(choice);
    }
  };

  return (
    <div className="w-full">
      {/* Visualizador de cena */}
      <div className="relative rounded-lg overflow-hidden bg-fantasy-dark/30 mb-4">
        <div className="aspect-video relative">
          {sceneImage ? (
            <img 
              src={sceneImage} 
              alt={sceneName || 'Cena atual'} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <p className="text-fantasy-stone">Aguardando o mestre iniciar uma cena...</p>
            </div>
          )}
        </div>
        
        {/* Informações da cena */}
        {(sceneName || sceneDescription) && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-white">
            {sceneName && <h3 className="font-medievalsharp text-lg">{sceneName}</h3>}
            {sceneDescription && <p className="text-sm text-fantasy-stone">{sceneDescription}</p>}
          </div>
        )}
        
        {/* Controles de áudio */}
        <div className="absolute top-2 right-2 flex items-center gap-2 bg-black/50 backdrop-blur-sm p-1.5 rounded-full">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={toggleMute}
            className="h-7 w-7 rounded-full text-white"
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <div className="w-20 px-1">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
              className="h-1"
            />
          </div>
        </div>
      </div>
      
      {/* Opções de escolha */}
      {choices && choices.length > 0 && (
        <Card className="mt-4 border-fantasy-purple/30">
          <CardContent className="p-4">
            <h3 className="font-medievalsharp text-lg mb-3 text-fantasy-purple">O que você deseja fazer?</h3>
            <div className="space-y-2">
              {choices.map((choice, index) => (
                <Button 
                  key={index} 
                  variant="outline" 
                  className="w-full justify-start text-left hover:bg-fantasy-dark/20 hover:text-fantasy-purple transition-colors"
                  onClick={() => handleChoiceClick(choice)}
                >
                  {choice}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PlayerSceneViewer;