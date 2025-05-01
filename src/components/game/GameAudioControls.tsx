import React, { useState } from 'react';
import { Music, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { AudioPlaylistManager } from '@/components/audio/AudioPlaylistManager';

interface GameAudioControlsProps {
  isGameMaster?: boolean;
}

const GameAudioControls: React.FC<GameAudioControlsProps> = ({ isGameMaster = false }) => {
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handlePlaylistSelect = (playlistId: string) => {
    setCurrentPlaylist(playlistId);
    setIsPlaying(true);
    // Aqui você pode implementar a lógica para iniciar a reprodução da playlist
  };
  
  const handleTrackPlay = (trackId: string) => {
    setCurrentTrack(trackId);
    setIsPlaying(true);
    // Aqui você pode implementar a lógica para iniciar a reprodução da faixa
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-40">
      <div className="flex items-center gap-2 bg-background/90 backdrop-blur-sm p-2 rounded-full shadow-lg border">
        {isPlaying && (
          <div className="px-3 flex items-center">
            <Music size={16} className="mr-2 text-primary animate-pulse" />
            <span className="text-sm font-medium truncate max-w-[120px]">
              {currentPlaylist ? 'Playlist Ativa' : currentTrack ? 'Faixa Ativa' : 'Reproduzindo'}
            </span>
          </div>
        )}
        
        <Button 
          size="icon" 
          variant="ghost"
          onClick={toggleMute}
          className="rounded-full"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </Button>
        
        <div className="w-24 px-1">
          <Slider
            value={[isMuted ? 0 : volume]}
            min={0}
            max={100}
            step={1}
            onValueChange={handleVolumeChange}
          />
        </div>
        
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="rounded-full">
              <Settings size={18} />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[400px] sm:w-[540px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Controle de Áudio</SheetTitle>
              <SheetDescription>
                {isGameMaster 
                  ? 'Configure a ambientação sonora para sua sessão de jogo.'
                  : 'Ajuste as configurações de áudio da sessão.'}
              </SheetDescription>
            </SheetHeader>
            
            <div className="mt-6">
              <AudioPlaylistManager 
                isGameMaster={isGameMaster}
                onPlaylistSelect={handlePlaylistSelect}
                onTrackPlay={handleTrackPlay}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default GameAudioControls;