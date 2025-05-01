
import React, { useState } from 'react';
import { usePersistentAudio } from '@/hooks/usePersistentAudio';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, SkipForward, SkipBack, Volume2, VolumeX,
  Music, Sword, Map
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PlaylistProps {
  id: string;
  name: string;
  icon: React.ReactNode;
}

const PersistentAudioPlayer: React.FC = () => {
  const {
    audioSettings,
    setVolume,
    toggleMute,
    setPlaylistVolume,
    togglePlaylist,
    nextTrack,
    prevTrack,
  } = usePersistentAudio();
  
  const [expanded, setExpanded] = useState(false);
  
  const playlists: PlaylistProps[] = [
    { id: 'ambient', name: 'Ambiente', icon: <Music size={16} /> },
    { id: 'combat', name: 'Combate', icon: <Sword size={16} /> },
    { id: 'exploration', name: 'Exploração', icon: <Map size={16} /> },
  ];

  return (
    <div className="audio-player fantasy-card">
      <Collapsible open={expanded} onOpenChange={setExpanded}>
        <div className="flex items-center justify-between p-2">
          <div className="flex items-center gap-2">
            {audioSettings.isMuted ? (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
                className="text-red-500"
              >
                <VolumeX size={18} />
              </Button>
            ) : (
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleMute}
              >
                <Volume2 size={18} />
              </Button>
            )}
            
            <Slider
              className="w-24"
              value={[audioSettings.volume * 100]}
              max={100}
              step={1}
              onValueChange={(value) => setVolume(value[0] / 100)}
            />
          </div>
          
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="text-xs">
              {expanded ? 'Esconder' : 'Mostrar'} Playlists
            </Button>
          </CollapsibleTrigger>
        </div>
        
        <CollapsibleContent>
          <ScrollArea className="h-56 p-2">
            <div className="space-y-3">
              {playlists.map((playlist) => {
                const playlistData = audioSettings.playlists[playlist.id];
                if (!playlistData) return null;
                
                const currentTrack = playlistData.tracks[playlistData.currentTrackIndex];
                const trackName = currentTrack ? currentTrack.split('/').pop()?.replace('.mp3', '') : 'N/A';
                
                return (
                  <div key={playlist.id} className="playlist-item p-2 border border-fantasy-purple/20 rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {playlist.icon}
                        <span className="text-sm font-medium">{playlist.name}</span>
                      </div>
                      
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => prevTrack(playlist.id)}
                          className="h-7 w-7"
                        >
                          <SkipBack size={14} />
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="outline"
                          onClick={() => togglePlaylist(playlist.id)}
                          className={`h-7 w-7 mx-1 ${playlistData.isPlaying ? 'bg-fantasy-purple/20' : ''}`}
                        >
                          {playlistData.isPlaying ? <Pause size={14} /> : <Play size={14} />}
                        </Button>
                        
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => nextTrack(playlist.id)}
                          className="h-7 w-7"
                        >
                          <SkipForward size={14} />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-fantasy-stone truncate w-28">
                        {trackName}
                      </span>
                      
                      <Slider
                        className="flex-1"
                        value={[playlistData.volume * 100]}
                        max={100}
                        step={1}
                        onValueChange={(value) => setPlaylistVolume(playlist.id, value[0] / 100)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default PersistentAudioPlayer;
