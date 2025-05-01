
import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, 
  Music, Repeat, RefreshCw, ListMusic, Trash2 
} from 'lucide-react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useAudioSystem, AudioTrack } from '@/hooks/useAudioSystem';

interface AudioPlayerProps {
  compact?: boolean;
  showPlaylist?: boolean;
  gameEvent?: string;
}

export function AudioPlayer({ compact = false, showPlaylist = true, gameEvent }: AudioPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    loop,
    tracks,
    playlists,
    playTrack,
    stopTrack,
    togglePlayPause,
    toggleMute,
    setVolumeLevel,
    setLoop,
    playPlaylist,
    bindToGameEvent
  } = useAudioSystem();
  
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedPlaylist, setSelectedPlaylist] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [shuffle, setShuffle] = useState(false);

  // Get all unique categories from tracks and playlists
  const categories = ['all', ...new Set([
    ...tracks.map(track => track.category || 'uncategorized'),
    ...playlists.map(playlist => playlist.category)
  ])];

  // Filter tracks and playlists by category
  const filteredTracks = selectedCategory === 'all' 
    ? tracks 
    : tracks.filter(track => (track.category || 'uncategorized') === selectedCategory);
  
  const filteredPlaylists = selectedCategory === 'all' 
    ? playlists 
    : playlists.filter(playlist => playlist.category === selectedCategory);

  // Listen for audio time updates
  useEffect(() => {
    const audioElement = document.querySelector('audio');
    
    if (!audioElement) return;
    
    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
      setDuration(audioElement.duration || 0);
    };
    
    audioElement.addEventListener('timeupdate', handleTimeUpdate);
    
    return () => {
      audioElement.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [currentTrack]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle track click
  const handleTrackClick = (track: AudioTrack) => {
    playTrack(track);
  };

  // Handle binding to game event
  const handleBindToEvent = (track: AudioTrack) => {
    if (gameEvent) {
      bindToGameEvent(gameEvent, track);
    }
  };

  // Render compact player
  if (compact) {
    return (
      <div className="bg-fantasy-dark/80 border border-fantasy-purple/30 rounded-full p-1 flex items-center space-x-2">
        <button
          onClick={togglePlayPause}
          className="h-8 w-8 rounded-full bg-fantasy-purple/20 flex items-center justify-center text-fantasy-gold"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <div className="text-xs text-fantasy-stone truncate max-w-[120px]">
          {currentTrack ? currentTrack.name : 'Nenhuma faixa'}
        </div>
        
        <button
          onClick={toggleMute}
          className="h-6 w-6 rounded-full bg-transparent flex items-center justify-center text-fantasy-stone/70"
        >
          {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
        </button>
      </div>
    );
  }

  // Render full player
  return (
    <div className="fantasy-card p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-medievalsharp text-fantasy-gold">Sistema de Áudio</h2>
        
        {gameEvent && (
          <div className="text-sm text-fantasy-stone bg-fantasy-purple/20 px-3 py-1 rounded-full">
            Evento: {gameEvent}
          </div>
        )}
      </div>
      
      {/* Current track info and controls */}
      <div className="bg-fantasy-dark/30 rounded-lg p-3 mb-4">
        <div className="flex items-center mb-2">
          <div className="h-12 w-12 bg-fantasy-purple/20 rounded-md flex items-center justify-center mr-3">
            <Music size={24} className="text-fantasy-purple" />
          </div>
          
          <div className="flex-1">
            <div className="font-medium text-fantasy-gold">
              {currentTrack?.name || 'Nenhuma faixa selecionada'}
            </div>
            <div className="text-xs text-fantasy-stone">
              {currentTrack?.type === 'ambience' ? 'Ambiente' : 
               currentTrack?.type === 'sfx' ? 'Efeito Sonoro' : 'Música'}
            </div>
          </div>
        </div>
        
        {/* Playback progress */}
        <div className="flex items-center text-xs text-fantasy-stone mb-2">
          <span>{formatTime(currentTime)}</span>
          <div className="flex-1 mx-2 h-1 bg-fantasy-dark rounded-full overflow-hidden">
            <div 
              className="h-full bg-fantasy-purple"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <span>{formatTime(duration)}</span>
        </div>
        
        {/* Controls */}
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => setLoop(!loop)}
                  >
                    <Repeat size={16} className={loop ? "text-fantasy-gold" : "text-fantasy-stone/70"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Repetir faixa</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full"
                    onClick={() => setShuffle(!shuffle)}
                  >
                    <RefreshCw size={16} className={shuffle ? "text-fantasy-gold" : "text-fantasy-stone/70"} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reprodução aleatória</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full"
              disabled={!currentTrack}
            >
              <SkipBack size={20} />
            </Button>
            
            <Button 
              variant="default" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-fantasy-purple hover:bg-fantasy-purple/80"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause size={24} /> : <Play size={24} />}
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-full"
              disabled={!currentTrack}
            >
              <SkipForward size={20} />
            </Button>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 rounded-full"
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </Button>
              
              {showVolumeSlider && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-32 bg-fantasy-dark p-3 rounded-lg shadow-md">
                  <Slider
                    value={[isMuted ? 0 : volume * 100]}
                    max={100}
                    step={1}
                    onValueChange={(value) => setVolumeLevel(value[0] / 100)}
                    className="mt-2"
                  />
                </div>
              )}
            </div>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 rounded-full text-fantasy-stone/70"
                    onClick={toggleMute}
                  >
                    {isMuted ? 
                      <VolumeX size={16} className="text-red-400" /> : 
                      <Volume2 size={16} />
                    }
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isMuted ? 'Ativar som' : 'Silenciar'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
      
      {/* Playlists and tracks */}
      {showPlaylist && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medievalsharp text-fantasy-gold">Biblioteca de Áudio</h3>
            
            <div className="flex space-x-2">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-fantasy-dark/50 border border-fantasy-purple/30 rounded text-xs p-1"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7">
                    <ListMusic size={14} className="mr-1" />
                    Playlists
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-fantasy-dark border-fantasy-purple/30">
                  <DialogHeader>
                    <DialogTitle className="text-fantasy-gold font-medievalsharp">Playlists</DialogTitle>
                    <DialogDescription>
                      Selecione uma playlist para reproduzir
                    </DialogDescription>
                  </DialogHeader>
                  
                  <ScrollArea className="h-[300px] pr-4">
                    {filteredPlaylists.length > 0 ? (
                      <div className="space-y-2">
                        {filteredPlaylists.map(playlist => (
                          <div 
                            key={playlist.id}
                            className={`p-2 rounded-md cursor-pointer transition-colors ${
                              selectedPlaylist === playlist.id 
                                ? 'bg-fantasy-purple/30 border border-fantasy-purple/50' 
                                : 'bg-fantasy-dark/50 border border-fantasy-purple/20 hover:bg-fantasy-purple/20'
                            }`}
                            onClick={() => {
                              setSelectedPlaylist(playlist.id);
                              playPlaylist(playlist.id, shuffle);
                            }}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="font-medium text-fantasy-gold">{playlist.name}</div>
                                <div className="text-xs text-fantasy-stone">
                                  {playlist.tracks.length} faixas • {playlist.category}
                                </div>
                              </div>
                              
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playPlaylist(playlist.id, shuffle);
                                }}
                              >
                                <Play size={16} />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center p-8 text-fantasy-stone/70">
                        Nenhuma playlist encontrada nesta categoria
                      </div>
                    )}
                  </ScrollArea>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          
          <ScrollArea className="h-[200px] pr-4">
            {filteredTracks.length > 0 ? (
              <div className="space-y-2">
                {filteredTracks.map(track => (
                  <div 
                    key={track.id}
                    className={`p-2 rounded-md cursor-pointer transition-colors ${
                      currentTrack?.id === track.id 
                        ? 'bg-fantasy-purple/30 border border-fantasy-purple/50' 
                        : 'bg-fantasy-dark/50 border border-fantasy-purple/20 hover:bg-fantasy-purple/20'
                    }`}
                    onClick={() => handleTrackClick(track)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <div className="h-8 w-8 bg-fantasy-purple/20 rounded-md flex items-center justify-center mr-2">
                          <Music size={14} className="text-fantasy-purple" />
                        </div>
                        
                        <div>
                          <div className="font-medium text-sm">{track.name}</div>
                          <div className="text-xs text-fantasy-stone">
                            {track.type === 'ambience' ? 'Ambiente' : 
                             track.type === 'sfx' ? 'Efeito Sonoro' : 'Música'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        {gameEvent && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleBindToEvent(track);
                            }}
                          >
                            <RefreshCw size={12} />
                          </Button>
                        )}
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTrackClick(track);
                          }}
                        >
                          {currentTrack?.id === track.id && isPlaying ? 
                            <Pause size={12} /> : 
                            <Play size={12} />
                          }
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-fantasy-stone/70">
                Nenhuma faixa encontrada nesta categoria
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

export default AudioPlayer;
