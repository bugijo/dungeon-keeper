import { useState, useEffect, useRef } from 'react';

export interface AudioTrack {
  id: string;
  title: string;
  url: string;
  category?: string;
  duration?: number;
  tags?: string[];
}

export interface AudioPlaylist {
  id: string;
  name: string;
  tracks: string[]; // IDs das faixas
  category: string;
  createdBy: string;
  isDefault?: boolean;
}

interface AudioSystemState {
  currentTrack: AudioTrack | null;
  isPlaying: boolean;
  isMuted: boolean;
  volume: number;
  loop: boolean;
  tracks: AudioTrack[];
  playlists: AudioPlaylist[];
  currentPlaylist: AudioPlaylist | null;
  gameEvents: Record<string, string>; // Mapeamento de eventos do jogo para IDs de faixas/playlists
}

export function useAudioSystem() {
  const [state, setState] = useState<AudioSystemState>({
    currentTrack: null,
    isPlaying: false,
    isMuted: false,
    volume: 70,
    loop: false,
    tracks: [],
    playlists: [],
    currentPlaylist: null,
    gameEvents: {},
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playlistIndexRef = useRef<number>(0);
  
  // Inicializar o elemento de áudio
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = state.volume / 100;
      audioRef.current.muted = state.isMuted;
      audioRef.current.loop = state.loop;
      
      // Adicionar event listeners
      audioRef.current.addEventListener('ended', handleTrackEnd);
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeEventListener('ended', handleTrackEnd);
        audioRef.current = null;
      }
    };
  }, []);
  
  // Atualizar o volume quando o estado mudar
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.volume / 100;
      audioRef.current.muted = state.isMuted;
      audioRef.current.loop = state.loop;
    }
  }, [state.volume, state.isMuted, state.loop]);
  
  // Carregar faixas e playlists do armazenamento local ou API
  useEffect(() => {
    // Aqui você pode implementar a lógica para carregar faixas e playlists
    // de uma API ou do armazenamento local
    const loadTracks = async () => {
      try {
        // Exemplo: carregar de uma API
        // const response = await fetch('/api/audio/tracks');
        // const data = await response.json();
        // setState(prev => ({ ...prev, tracks: data }));
        
        // Por enquanto, usamos dados de exemplo
        const sampleTracks: AudioTrack[] = [
          { id: '1', title: 'Batalha Épica', url: '/assets/audio/battle-epic.mp3', category: 'batalha', tags: ['combate', 'épico'] },
          { id: '2', title: 'Taverna Animada', url: '/assets/audio/tavern-cheerful.mp3', category: 'taverna', tags: ['social'] },
          { id: '3', title: 'Floresta Misteriosa', url: '/assets/audio/forest-mystery.mp3', category: 'floresta', tags: ['natureza', 'mistério'] },
          { id: '4', title: 'Calabouço Sombrio', url: '/assets/audio/dungeon-dark.mp3', category: 'dungeon', tags: ['subterrâneo', 'terror'] },
          { id: '5', title: 'Cidade Movimentada', url: '/assets/audio/city-busy.mp3', category: 'cidade', tags: ['urbano', 'multidão'] },
        ];
        
        const samplePlaylists: AudioPlaylist[] = [
          { id: '1', name: 'Combates Épicos', tracks: ['1'], category: 'batalha', createdBy: 'Mestre', isDefault: true },
          { id: '2', name: 'Ambientes de Taverna', tracks: ['2'], category: 'taverna', createdBy: 'Mestre' },
          { id: '3', name: 'Explorando a Floresta', tracks: ['3'], category: 'floresta', createdBy: 'Mestre' },
        ];
        
        setState(prev => ({ 
          ...prev, 
          tracks: sampleTracks,
          playlists: samplePlaylists
        }));
      } catch (error) {
        console.error('Erro ao carregar faixas de áudio:', error);
      }
    };
    
    loadTracks();
  }, []);
  
  // Manipulador para o fim da faixa
  const handleTrackEnd = () => {
    if (state.currentPlaylist && !state.loop) {
      playNextTrackInPlaylist();
    } else if (!state.loop) {
      setState(prev => ({ ...prev, isPlaying: false }));
    }
  };
  
  // Reproduzir a próxima faixa na playlist
  const playNextTrackInPlaylist = () => {
    if (!state.currentPlaylist) return;
    
    const playlistTracks = state.currentPlaylist.tracks;
    if (playlistTracks.length === 0) return;
    
    playlistIndexRef.current = (playlistIndexRef.current + 1) % playlistTracks.length;
    const nextTrackId = playlistTracks[playlistIndexRef.current];
    const nextTrack = state.tracks.find(track => track.id === nextTrackId);
    
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };
  
  // Reproduzir a faixa anterior na playlist
  const playPreviousTrackInPlaylist = () => {
    if (!state.currentPlaylist) return;
    
    const playlistTracks = state.currentPlaylist.tracks;
    if (playlistTracks.length === 0) return;
    
    playlistIndexRef.current = (playlistIndexRef.current - 1 + playlistTracks.length) % playlistTracks.length;
    const prevTrackId = playlistTracks[playlistIndexRef.current];
    const prevTrack = state.tracks.find(track => track.id === prevTrackId);
    
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };
  
  // Reproduzir uma faixa específica
  const playTrack = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.src = track.url;
      audioRef.current.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
      });
      
      setState(prev => ({ 
        ...prev, 
        currentTrack: track, 
        isPlaying: true,
        currentPlaylist: null // Limpar a playlist atual quando reproduzir uma faixa individual
      }));
    }
  };
  
  // Parar a reprodução
  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setState(prev => ({ 
      ...prev, 
      isPlaying: false 
    }));
  };
  
  // Alternar entre reproduzir e pausar
  const togglePlayPause = () => {
    if (!state.currentTrack) return;
    
    if (state.isPlaying) {
      audioRef.current?.pause();
    } else {
      audioRef.current?.play().catch(error => {
        console.error('Erro ao reproduzir áudio:', error);
      });
    }
    
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
  };
  
  // Alternar mudo
  const toggleMute = () => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };
  
  // Definir o nível de volume
  const setVolumeLevel = (level: number) => {
    setState(prev => ({ ...prev, volume: level }));
  };
  
  // Definir o modo de loop
  const setLoop = (loop: boolean) => {
    setState(prev => ({ ...prev, loop }));
  };
  
  // Reproduzir uma playlist
  const playPlaylist = (playlistId: string) => {
    const playlist = state.playlists.find(p => p.id === playlistId);
    if (!playlist || playlist.tracks.length === 0) return;
    
    playlistIndexRef.current = 0;
    const firstTrackId = playlist.tracks[0];
    const firstTrack = state.tracks.find(track => track.id === firstTrackId);
    
    if (firstTrack) {
      if (audioRef.current) {
        audioRef.current.src = firstTrack.url;
        audioRef.current.play().catch(error => {
          console.error('Erro ao reproduzir áudio:', error);
        });
      }
      
      setState(prev => ({ 
        ...prev, 
        currentTrack: firstTrack, 
        isPlaying: true,
        currentPlaylist: playlist
      }));
    }
  };
  
  // Vincular um evento do jogo a uma faixa ou playlist
  const bindToGameEvent = (eventName: string, audioId: string, isPlaylist: boolean = false) => {
    setState(prev => ({
      ...prev,
      gameEvents: {
        ...prev.gameEvents,
        [eventName]: audioId
      }
    }));
  };
  
  // Disparar um evento do jogo
  const triggerGameEvent = (eventName: string) => {
    const audioId = state.gameEvents[eventName];
    if (!audioId) return;
    
    // Verificar se é uma playlist ou uma faixa
    const playlist = state.playlists.find(p => p.id === audioId);
    if (playlist) {
      playPlaylist(audioId);
      return;
    }
    
    const track = state.tracks.find(t => t.id === audioId);
    if (track) {
      playTrack(track);
    }
  };
  
  // Adicionar uma nova faixa
  const addTrack = (track: Omit<AudioTrack, 'id'>) => {
    const newTrack: AudioTrack = {
      ...track,
      id: Date.now().toString()
    };
    
    setState(prev => ({
      ...prev,
      tracks: [...prev.tracks, newTrack]
    }));
    
    return newTrack.id;
  };
  
  // Adicionar uma nova playlist
  const addPlaylist = (playlist: Omit<AudioPlaylist, 'id'>) => {
    const newPlaylist: AudioPlaylist = {
      ...playlist,
      id: Date.now().toString()
    };
    
    setState(prev => ({
      ...prev,
      playlists: [...prev.playlists, newPlaylist]
    }));
    
    return newPlaylist.id;
  };
  
  // Remover uma faixa
  const removeTrack = (trackId: string) => {
    // Verificar se a faixa está sendo reproduzida
    if (state.currentTrack?.id === trackId) {
      stopTrack();
    }
    
    // Remover a faixa de todas as playlists
    const updatedPlaylists = state.playlists.map(playlist => ({
      ...playlist,
      tracks: playlist.tracks.filter(id => id !== trackId)
    }));
    
    setState(prev => ({
      ...prev,
      tracks: prev.tracks.filter(track => track.id !== trackId),
      playlists: updatedPlaylists
    }));
  };
  
  // Remover uma playlist
  const removePlaylist = (playlistId: string) => {
    // Verificar se a playlist está sendo reproduzida
    if (state.currentPlaylist?.id === playlistId) {
      stopTrack();
      setState(prev => ({ ...prev, currentPlaylist: null }));
    }
    
    setState(prev => ({
      ...prev,
      playlists: prev.playlists.filter(playlist => playlist.id !== playlistId)
    }));
  };
  
  return {
    currentTrack: state.currentTrack,
    isPlaying: state.isPlaying,
    isMuted: state.isMuted,
    volume: state.volume,
    loop: state.loop,
    tracks: state.tracks,
    playlists: state.playlists,
    currentPlaylist: state.currentPlaylist,
    playTrack,
    stopTrack,
    togglePlayPause,
    toggleMute,
    setVolumeLevel,
    setLoop,
    playPlaylist,
    playNextTrackInPlaylist,
    playPreviousTrackInPlaylist,
    bindToGameEvent,
    triggerGameEvent,
    addTrack,
    addPlaylist,
    removeTrack,
    removePlaylist
  };
}