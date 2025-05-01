
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

export interface AudioTrack {
  id: string;
  name: string;
  src: string;
  type: 'ambience' | 'sfx' | 'music';
  category?: string;
  thumbnail?: string;
}

interface PlaylistType {
  id: string;
  name: string;
  tracks: AudioTrack[];
  category: string;
}

export function useAudioSystem() {
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [playlists, setPlaylists] = useState<PlaylistType[]>([]);
  const [currentTrack, setCurrentTrack] = useState<AudioTrack | null>(null);
  const [volume, setVolume] = useState(() => {
    // Load volume from localStorage
    const savedVolume = localStorage.getItem('rpg-audio-volume');
    return savedVolume ? parseFloat(savedVolume) : 0.5;
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(() => {
    // Load mute state from localStorage
    const savedMute = localStorage.getItem('rpg-audio-mute');
    return savedMute ? savedMute === 'true' : false;
  });
  const [isLoading, setIsLoading] = useState(false);
  const [loop, setLoop] = useState(true);
  const [fadeTime, setFadeTime] = useState(2); // In seconds
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = isMuted ? 0 : volume;
    audioRef.current.loop = loop;
    
    // Save volume to localStorage when changed
    localStorage.setItem('rpg-audio-volume', volume.toString());
    localStorage.setItem('rpg-audio-mute', isMuted.toString());
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      if (fadeTimerRef.current) {
        clearInterval(fadeTimerRef.current);
      }
    };
  }, []);
  
  // Update audio element when track changes
  useEffect(() => {
    if (!audioRef.current) return;
    
    if (currentTrack) {
      audioRef.current.src = currentTrack.src;
      audioRef.current.loop = loop;
      audioRef.current.volume = isMuted ? 0 : volume;
      
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        
        // Handle promise to avoid DOMException
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Erro ao reproduzir áudio. Tente novamente.');
            setIsPlaying(false);
          });
        }
      }
    } else {
      audioRef.current.pause();
    }
  }, [currentTrack, isPlaying]);
  
  // Update volume and mute state
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.volume = isMuted ? 0 : volume;
    
    // Save to localStorage
    localStorage.setItem('rpg-audio-volume', volume.toString());
    localStorage.setItem('rpg-audio-mute', isMuted.toString());
  }, [volume, isMuted]);
  
  // Update loop setting
  useEffect(() => {
    if (!audioRef.current) return;
    
    audioRef.current.loop = loop;
  }, [loop]);
  
  // Play a track
  const playTrack = (track: AudioTrack, fadeIn = true) => {
    // If fading, cancel existing fade
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    
    // Set the new track
    setCurrentTrack(track);
    
    // If audio element exists
    if (audioRef.current) {
      // If fading in
      if (fadeIn && fadeTime > 0) {
        // Start with volume 0
        audioRef.current.volume = 0;
        
        // Start playing
        const playPromise = audioRef.current.play();
        setIsPlaying(true);
        
        // Handle promise to avoid DOMException
        if (playPromise !== undefined) {
          playPromise.then(() => {
            // Fade in
            let currentVol = 0;
            const targetVol = isMuted ? 0 : volume;
            const steps = 20; // Number of steps in fade
            const intervalTime = (fadeTime * 1000) / steps;
            const increment = targetVol / steps;
            
            fadeTimerRef.current = window.setInterval(() => {
              currentVol += increment;
              
              if (currentVol >= targetVol) {
                // Reached target volume
                audioRef.current!.volume = targetVol;
                clearInterval(fadeTimerRef.current!);
                fadeTimerRef.current = null;
              } else {
                audioRef.current!.volume = currentVol;
              }
            }, intervalTime);
          }).catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Erro ao reproduzir áudio. Tente novamente.');
            setIsPlaying(false);
          });
        }
      } else {
        // No fade, just play
        audioRef.current.volume = isMuted ? 0 : volume;
        const playPromise = audioRef.current.play();
        setIsPlaying(true);
        
        // Handle promise to avoid DOMException
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.error('Error playing audio:', error);
            toast.error('Erro ao reproduzir áudio. Tente novamente.');
            setIsPlaying(false);
          });
        }
      }
    }
  };
  
  // Stop playing
  const stopTrack = (fadeOut = true) => {
    // If no audio or not playing, just return
    if (!audioRef.current || !isPlaying) return;
    
    // If fading, cancel existing fade
    if (fadeTimerRef.current) {
      clearInterval(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
    
    // If fading out
    if (fadeOut && fadeTime > 0) {
      // Get current volume
      const startVol = audioRef.current.volume;
      const steps = 20; // Number of steps in fade
      const intervalTime = (fadeTime * 1000) / steps;
      const decrement = startVol / steps;
      
      fadeTimerRef.current = window.setInterval(() => {
        const newVol = audioRef.current!.volume - decrement;
        
        if (newVol <= 0) {
          // Reached zero volume, stop playback
          audioRef.current!.pause();
          audioRef.current!.currentTime = 0;
          setIsPlaying(false);
          clearInterval(fadeTimerRef.current!);
          fadeTimerRef.current = null;
        } else {
          audioRef.current!.volume = newVol;
        }
      }, intervalTime);
    } else {
      // No fade, just stop
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };
  
  // Toggle play/pause
  const togglePlayPause = () => {
    if (isPlaying) {
      stopTrack();
    } else if (currentTrack) {
      playTrack(currentTrack);
    }
  };
  
  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  // Set volume
  const setVolumeLevel = (newVolume: number) => {
    // Ensure volume is between 0 and 1
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
  };
  
  // Load tracks from remote source
  const loadTracks = async () => {
    try {
      setIsLoading(true);
      
      // Simulated API call - replace with actual API call
      const response = await fetch('/api/audio-tracks');
      const data = await response.json();
      
      setTracks(data.tracks);
      setPlaylists(data.playlists);
      
      setIsLoading(false);
      return true;
    } catch (error) {
      console.error('Error loading audio tracks:', error);
      toast.error('Erro ao carregar faixas de áudio. Tente novamente.');
      setIsLoading(false);
      return false;
    }
  };
  
  // Play playlist
  const playPlaylist = (playlistId: string, shuffle = false) => {
    const playlist = playlists.find(p => p.id === playlistId);
    
    if (!playlist || playlist.tracks.length === 0) {
      toast.error('Playlist vazia ou não encontrada.');
      return;
    }
    
    let tracks = [...playlist.tracks];
    
    // Shuffle if requested
    if (shuffle) {
      for (let i = tracks.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [tracks[i], tracks[j]] = [tracks[j], tracks[i]];
      }
    }
    
    // Play first track
    playTrack(tracks[0]);
    
    // Set up event listener for track ended to play next track
    if (audioRef.current) {
      let currentIndex = 0;
      
      const handleTrackEnded = () => {
        currentIndex = (currentIndex + 1) % tracks.length;
        playTrack(tracks[currentIndex], false); // Don't fade in when switching tracks in playlist
      };
      
      // Remove existing listener
      audioRef.current.removeEventListener('ended', handleTrackEnded);
      
      // Only add listener if not looping individual tracks
      if (!loop) {
        audioRef.current.addEventListener('ended', handleTrackEnded);
      }
    }
  };
  
  // Handle event binding
  const bindToGameEvent = (eventName: string, track: AudioTrack) => {
    // This would be implemented based on game event system
    console.log(`Bound track ${track.name} to event ${eventName}`);
    toast.success(`Áudio vinculado ao evento: ${eventName}`);
  };
  
  return {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    isMuted,
    volume,
    loop,
    isLoading,
    fadeTime,
    playTrack,
    stopTrack,
    togglePlayPause,
    toggleMute,
    setVolumeLevel,
    setLoop,
    setFadeTime,
    loadTracks,
    playPlaylist,
    bindToGameEvent
  };
}

export default useAudioSystem;
