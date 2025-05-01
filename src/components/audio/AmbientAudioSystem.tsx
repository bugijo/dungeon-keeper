import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, SkipBack, Plus, Trash2, Save, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AudioTrack {
  id: string;
  name: string;
  url: string;
  category: 'ambiente' | 'batalha' | 'taverna' | 'masmorra' | 'cidade' | 'floresta' | 'personalizado';
  volume: number;
  loop: boolean;
  duration?: number;
  created_by: string;
  is_public: boolean;
}

interface Playlist {
  id: string;
  name: string;
  tracks: string[];
  created_by: string;
  is_public: boolean;
}

interface AmbientAudioSystemProps {
  sessionId: string;
  userId: string;
  isGameMaster: boolean;
}

const AmbientAudioSystem: React.FC<AmbientAudioSystemProps> = ({
  sessionId,
  userId,
  isGameMaster
}) => {
  // Estado para controle de áudio
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.5);
  const [isMuted, setIsMuted] = useState(false);
  const [showAddTrackDialog, setShowAddTrackDialog] = useState(false);
  const [newTrackName, setNewTrackName] = useState('');
  const [newTrackUrl, setNewTrackUrl] = useState('');
  const [newTrackCategory, setNewTrackCategory] = useState<AudioTrack['category']>('ambiente');
  const [activeTab, setActiveTab] = useState('biblioteca');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPlaylist, setCurrentPlaylist] = useState<Playlist | null>(null);
  const [currentPlaylistIndex, setCurrentPlaylistIndex] = useState(0);
  
  // Referência para o elemento de áudio
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Efeito para carregar faixas de áudio
  useEffect(() => {
    const fetchAudioTracks = async () => {
      try {
        const { data, error } = await supabase
          .from('audio_tracks')
          .select('*')
          .or(`created_by.eq.${userId},is_public.eq.true`);
          
        if (error) throw error;
        
        setTracks(data as AudioTrack[]);
      } catch (error) {
        console.error('Erro ao carregar faixas de áudio:', error);
        toast.error('Erro ao carregar biblioteca de áudio');
      }
    };
    
    const fetchPlaylists = async () => {
      try {
        const { data, error } = await supabase
          .from('audio_playlists')
          .select('*')
          .or(`created_by.eq.${userId},is_public.eq.true`);
          
        if (error) throw error;
        
        setPlaylists(data as Playlist[]);
      } catch (error) {
        console.error('Erro ao carregar playlists:', error);
        toast.error('Erro ao carregar playlists');
      }
    };
    
    fetchAudioTracks();
    fetchPlaylists();
    
    // Configurar canal de tempo real para atualizações de áudio
    const channel = supabase
      .channel(`audio-${sessionId}`)
      .on('broadcast', { event: 'audio_update' }, (payload) => {
        const { action, data } = payload.payload as { 
          action: 'play' | 'pause' | 'stop' | 'volume' | 'track', 
          data: any 
        };
        
        if (!isGameMaster) {
          // Jogadores recebem comandos do mestre
          switch (action) {
            case 'play':
              if (audioRef.current) {
                audioRef.current.play();
                setIsPlaying(true);
              }
              break;
            case 'pause':
              if (audioRef.current) {
                audioRef.current.pause();
                setIsPlaying(false);
              }
              break;
            case 'stop':
              if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.currentTime = 0;
                setIsPlaying(false);
              }
              break;
            case 'volume':
              if (audioRef.current) {
                const newVolume = data.volume;
                audioRef.current.volume = newVolume;
                setVolume(newVolume);
              }
              break;
            case 'track':
              const trackData = data.track as AudioTrack;
              setCurrentTrack(trackData);
              break;
          }
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, isGameMaster]);
  
  // Efeito para atualizar o áudio quando a faixa atual muda
  useEffect(() => {
    if (currentTrack && audioRef.current) {
      audioRef.current.src = currentTrack.url;
      audioRef.current.volume = volume;
      audioRef.current.loop = currentTrack.loop;
      
      if (isPlaying) {
        audioRef.current.play().catch(e => {
          console.error('Erro ao reproduzir áudio:', e);
          toast.error('Erro ao reproduzir áudio. Verifique a URL da faixa.');
          setIsPlaying(false);
        });
      }
    }
  }, [currentTrack]);
  
  // Função para reproduzir/pausar áudio
  const togglePlayPause = () => {
    if (!currentTrack) return;
    
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      
      if (isGameMaster) {
        // Enviar comando para jogadores
        supabase.channel(`audio-${sessionId}`).send({
          type: 'broadcast',
          event: 'audio_update',
          payload: { action: 'pause' }
        });
      }
    } else {
      audioRef.current?.play();
      setIsPlaying(true);
      
      if (isGameMaster) {
        // Enviar comando para jogadores
        supabase.channel(`audio-${sessionId}`).send({
          type: 'broadcast',
          event: 'audio_update',
          payload: { action: 'play' }
        });
      }
    }
  };
  
  // Função para alternar mudo
  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  // Função para ajustar volume
  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    
    if (isGameMaster) {
      // Enviar comando de volume para jogadores
      supabase.channel(`audio-${sessionId}`).send({
        type: 'broadcast',
        event: 'audio_update',
        payload: { 
          action: 'volume',
          data: { volume: newVolume }
        }
      });
    }
  };
  
  // Função para reproduzir uma faixa
  const playTrack = (track: AudioTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    
    if (isGameMaster) {
      // Enviar faixa para jogadores
      supabase.channel(`audio-${sessionId}`).send({
        type: 'broadcast',
        event: 'audio_update',
        payload: { 
          action: 'track',
          data: { track }
        }
      });
      
      // Enviar comando de reprodução
      supabase.channel(`audio-${sessionId}`).send({
        type: 'broadcast',
        event: 'audio_update',
        payload: { action: 'play' }
      });
    }
  };
  
  // Função para parar a reprodução
  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      
      if (isGameMaster) {
        // Enviar comando para jogadores
        supabase.channel(`audio-${sessionId}`).send({
          type: 'broadcast',
          event: 'audio_update',
          payload: { action: 'stop' }
        });
      }
    }
  };
  
  // Função para adicionar nova faixa
  const addNewTrack = async () => {
    if (!newTrackName || !newTrackUrl) {
      toast.error('Nome e URL são obrigatórios');
      return;
    }
    
    try {
      const newTrack: Omit<AudioTrack, 'id'> = {
        name: newTrackName,
        url: newTrackUrl,
        category: newTrackCategory,
        volume: 0.7,
        loop: true,
        created_by: userId,
        is_public: true
      };
      
      const { data, error } = await supabase
        .from('audio_tracks')
        .insert(newTrack)
        .select()
        .single();
        
      if (error) throw error;
      
      setTracks(prev => [...prev, data as AudioTrack]);
      setNewTrackName('');
      setNewTrackUrl('');
      setShowAddTrackDialog(false);
      toast.success('Faixa adicionada com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar faixa:', error);
      toast.error('Erro ao adicionar faixa de áudio');
    }
  };
  
  // Função para reproduzir próxima faixa da playlist
  const playNextTrack = () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return;
    
    const nextIndex = (currentPlaylistIndex + 1) % currentPlaylist.tracks.length;
    const nextTrackId = currentPlaylist.tracks[nextIndex];
    const nextTrack = tracks.find(t => t.id === nextTrackId);
    
    if (nextTrack) {
      setCurrentPlaylistIndex(nextIndex);
      playTrack(nextTrack);
    }
  };
  
  // Função para reproduzir faixa anterior da playlist
  const playPreviousTrack = () => {
    if (!currentPlaylist || currentPlaylist.tracks.length === 0) return;
    
    const prevIndex = currentPlaylistIndex === 0 
      ? currentPlaylist.tracks.length - 1 
      : currentPlaylistIndex - 1;
    const prevTrackId = currentPlaylist.tracks[prevIndex];
    const prevTrack = tracks.find(t => t.id === prevTrackId);
    
    if (prevTrack) {
      setCurrentPlaylistIndex(prevIndex);
      playTrack(prevTrack);
    }
  };
  
  // Filtrar faixas com base na pesquisa
  const filteredTracks = tracks.filter(track => 
    track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    track.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Agrupar faixas por categoria
  const tracksByCategory = filteredTracks.reduce((acc, track) => {
    if (!acc[track.category]) {
      acc[track.category] = [];
    }
    acc[track.category].push(track);
    return acc;
  }, {} as Record<string, AudioTrack[]>);
  
  // Tradução de categorias para português
  const categoryTranslations: Record<string, string> = {
    'ambiente': 'Ambiente',
    'batalha': 'Batalha',
    'taverna': 'Taverna',
    'masmorra': 'Masmorra',
    'cidade': 'Cidade',
    'floresta': 'Floresta',
    'personalizado': 'Personalizado'
  };
  
  return (
    <div className="bg-fantasy-dark border border-fantasy-purple/30 rounded-lg p-4 flex flex-col h-full">
      <h3 className="text-fantasy-gold font-medievalsharp text-xl mb-4 flex items-center">
        <Music className="mr-2" /> Sistema de Áudio Ambiente
      </h3>
      
      {/* Player de áudio */}
      <div className="bg-fantasy-dark/70 border border-fantasy-purple/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="truncate flex-1">
            <h4 className="text-fantasy-stone font-medium truncate">
              {currentTrack ? currentTrack.name : 'Nenhuma faixa selecionada'}
            </h4>
            {currentTrack && (
              <p className="text-fantasy-stone/70 text-xs">
                {categoryTranslations[currentTrack.category]}
              </p>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleMute}
              className="text-fantasy-stone hover:text-fantasy-gold"
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </Button>
            
            <div className="w-24">
              <Slider 
                value={[volume]} 
                min={0} 
                max={1} 
                step={0.01} 
                onValueChange={handleVolumeChange} 
              />
            </div>
          </div>
        </div>
        
        <div className="flex items-center justify-center gap-2 mt-3">
          {currentPlaylist && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={playPreviousTrack}
              disabled={!currentTrack}
              className="text-fantasy-stone hover:text-fantasy-gold"
            >
              <SkipBack size={18} />
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={togglePlayPause}
            disabled={!currentTrack}
            className="text-fantasy-gold border-fantasy-gold/50 hover:bg-fantasy-gold/10"
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </Button>
          
          {currentPlaylist && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={playNextTrack}
              disabled={!currentTrack}
              className="text-fantasy-stone hover:text-fantasy-gold"
            >
              <SkipForward size={18} />
            </Button>
          )}
        </div>
      </div>
      
      {/* Biblioteca de áudio e playlists */}
      <Tabs 
        defaultValue="biblioteca" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="biblioteca">Biblioteca</TabsTrigger>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
        </TabsList>
        
        <TabsContent value="biblioteca" className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-4">
            <Input 
              placeholder="Pesquisar faixas..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-fantasy-dark/50"
            />
            
            {isGameMaster && (
              <Dialog open={showAddTrackDialog} onOpenChange={setShowAddTrackDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Plus size={16} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-fantasy-dark border-fantasy-purple/30">
                  <DialogHeader>
                    <DialogTitle className="text-fantasy-gold">Adicionar Nova Faixa</DialogTitle>
                  </DialogHeader>
                  
                  <div className="space-y-4 mt-4">
                    <div>
                      <label className="text-fantasy-stone text-sm mb-1 block">Nome da Faixa</label>
                      <Input 
                        value={newTrackName}
                        onChange={(e) => setNewTrackName(e.target.value)}
                        placeholder="Nome descritivo"
                        className="bg-fantasy-dark/50"
                      />
                    </div>
                    
                    <div>
                      <label className="text-fantasy-stone text-sm mb-1 block">URL do Áudio</label>
                      <Input 
                        value={newTrackUrl}
                        onChange={(e) => setNewTrackUrl(e.target.value)}
                        placeholder="https://exemplo.com/audio.mp3"
                        className="bg-fantasy-dark/50"
                      />
                    </div>
                    
                    <div>
                      <label className="text-fantasy-stone text-sm mb-1 block">Categoria</label>
                      <select
                        value={newTrackCategory}
                        onChange={(e) => setNewTrackCategory(e.target.value as AudioTrack['category'])}
                        className="w-full p-2 rounded-md bg-fantasy-dark/70 border border-fantasy-purple/30 text-fantasy-stone"
                      >
                        {Object.entries(categoryTranslations).map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={addNewTrack}
                        className="bg-fantasy-gold hover:bg-fantasy-gold/80 text-fantasy-dark"
                      >
                        <Save size={16} className="mr-2" /> Salvar Faixa
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {Object.keys(tracksByCategory).length === 0 ? (
              <div className="text-center text-fantasy-stone/70 py-8">
                Nenhuma faixa encontrada. {isGameMaster && 'Adicione uma nova faixa com o botão "+".'}
              </div>
            ) : (
              <div className="space-y-6">
                {Object.entries(tracksByCategory).map(([category, categoryTracks]) => (
                  <div key={category}>
                    <h4 className="text-fantasy-gold font-medievalsharp mb-2">
                      {categoryTranslations[category] || category}
                    </h4>
                    <div className="space-y-1">
                      {categoryTracks.map(track => (
                        <div 
                          key={track.id}
                          className={`flex items-center justify-between p-2 rounded-md hover:bg-fantasy-dark/50 cursor-pointer ${currentTrack?.id === track.id ? 'bg-fantasy-purple/20 border-l-2 border-fantasy-gold pl-2' : ''}`}
                          onClick={() => playTrack(track)}
                        >
                          <div className="truncate flex-1">
                            <span className="text-fantasy-stone">{track.name}</span>
                          </div>
                          
                          {isGameMaster && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={(e) => {
                                e.stopPropagation();
                                // Implementar remoção de faixa
                              }}
                              className="opacity-0 group-hover:opacity-100 text-fantasy-stone/70 hover:text-fantasy-stone"
                            >
                              <Trash2 size={14} />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="playlists" className="flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-fantasy-gold font-medievalsharp">Playlists</h4>
            
            {isGameMaster && (
              <Button variant="outline" size="sm">
                <Plus size={14} className="mr-1" /> Nova Playlist
              </Button>
            )}
          </div>
          
          <ScrollArea className="flex-1">
            {playlists.length === 0 ? (
              <div className="text-center text-fantasy-stone/70 py-8">
                Nenhuma playlist encontrada. {isGameMaster && 'Crie uma nova playlist para organizar suas faixas.'}
              </div>
            ) : (
              <div className="space-y-2">
                {playlists.map(playlist => (
                  <div 
                    key={playlist.id}
                    className={`p-3 rounded-md border border-fantasy-purple/20 hover:bg-fantasy-dark/50 cursor-pointer ${currentPlaylist?.id === playlist.id ? 'bg-fantasy-purple/20' : 'bg-fantasy-dark/30'}`}
                    onClick={() => {
                      setCurrentPlaylist(playlist);
                      // Reproduzir primeira faixa da playlist
                      if (playlist.tracks.length > 0) {
                        const firstTrackId = playlist.tracks[0];
                        const firstTrack = tracks.find(t => t.id === firstTrackId);
                        if (firstTrack) {
                          setCurrentPlaylistIndex(0);
                          playTrack(firstTrack);
                        }
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <h5 className="text-fantasy-stone font-medium">{playlist.name}</h5>
                      <span className="text-xs text-fantasy-stone/70">{playlist.tracks.length} faixas</span>
                    </div>
                    
                    <div className="mt-2 text-xs text-fantasy-stone/70">
                      {playlist.tracks.slice(0, 3).map(trackId => {
                        const track = tracks.find(t => t.id === trackId);
                        return track ? (
                          <div key={trackId} className="truncate">{track.name}</div>
                        ) : null;
                      })}
                      {playlist.tracks.length > 3 && (
                        <div>+ {playlist.tracks.length - 3} mais...</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
      
      {/* Elemento de áudio oculto */}
      <audio ref={audioRef} />
    </div>
  );
};

export default AmbientAudioSystem;