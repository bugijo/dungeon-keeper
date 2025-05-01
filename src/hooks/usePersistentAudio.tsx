
import { useState, useEffect } from 'react';

interface AudioSettings {
  volume: number;
  isMuted: boolean;
  playlists: {
    [key: string]: {
      name: string;
      tracks: string[];
      currentTrackIndex: number;
      isPlaying: boolean;
      volume: number;
    }
  };
}

// Default audio settings
const defaultSettings: AudioSettings = {
  volume: 0.5,
  isMuted: false,
  playlists: {
    'ambient': {
      name: 'Ambiente',
      tracks: [
        '/audio/ambient/forest.mp3',
        '/audio/ambient/tavern.mp3',
        '/audio/ambient/cave.mp3',
      ],
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.3,
    },
    'combat': {
      name: 'Combate',
      tracks: [
        '/audio/combat/battle1.mp3',
        '/audio/combat/battle2.mp3',
        '/audio/combat/boss.mp3',
      ],
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.6,
    },
    'exploration': {
      name: 'Exploração',
      tracks: [
        '/audio/exploration/mystery.mp3',
        '/audio/exploration/wonder.mp3',
      ],
      currentTrackIndex: 0,
      isPlaying: false,
      volume: 0.4,
    }
  }
};

export function usePersistentAudio() {
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(() => {
    // Try to load from localStorage
    const savedSettings = localStorage.getItem('rpg-audio-settings');
    if (savedSettings) {
      try {
        return JSON.parse(savedSettings);
      } catch (e) {
        console.error('Failed to parse saved audio settings', e);
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  // Local audio elements for each playlist
  const [audioElements, setAudioElements] = useState<{[key: string]: HTMLAudioElement | null}>({});

  // Initialize audio elements
  useEffect(() => {
    const elements: {[key: string]: HTMLAudioElement} = {};
    
    Object.keys(audioSettings.playlists).forEach(playlistId => {
      const playlist = audioSettings.playlists[playlistId];
      if (playlist.tracks.length > 0) {
        const audio = new Audio();
        audio.src = playlist.tracks[playlist.currentTrackIndex];
        audio.volume = audioSettings.isMuted ? 0 : playlist.volume * audioSettings.volume;
        audio.loop = true; // Default to loop
        elements[playlistId] = audio;
        
        // Set up event listeners
        audio.addEventListener('ended', () => {
          // Go to next track when current one ends
          nextTrack(playlistId);
        });
      }
    });
    
    setAudioElements(elements);
    
    // Clean up audio elements on unmount
    return () => {
      Object.values(elements).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('rpg-audio-settings', JSON.stringify(audioSettings));
  }, [audioSettings]);

  // Update audio elements when settings change
  useEffect(() => {
    Object.keys(audioElements).forEach(playlistId => {
      const audio = audioElements[playlistId];
      const playlist = audioSettings.playlists[playlistId];
      
      if (audio && playlist) {
        // Update volume
        audio.volume = audioSettings.isMuted ? 0 : playlist.volume * audioSettings.volume;
        
        // Update play state
        if (playlist.isPlaying && audio.paused) {
          audio.play().catch(e => console.error(`Failed to play audio: ${e}`));
        } else if (!playlist.isPlaying && !audio.paused) {
          audio.pause();
        }
        
        // Update current track
        const currentSrc = playlist.tracks[playlist.currentTrackIndex];
        if (audio.src !== currentSrc) {
          audio.src = currentSrc;
          if (playlist.isPlaying) {
            audio.play().catch(e => console.error(`Failed to play audio: ${e}`));
          }
        }
      }
    });
  }, [audioSettings, audioElements]);

  // Set main volume
  const setVolume = (volume: number) => {
    setAudioSettings(prev => ({
      ...prev,
      volume: Math.max(0, Math.min(1, volume)),
    }));
  };

  // Toggle mute
  const toggleMute = () => {
    setAudioSettings(prev => ({
      ...prev,
      isMuted: !prev.isMuted,
    }));
  };

  // Set playlist volume
  const setPlaylistVolume = (playlistId: string, volume: number) => {
    setAudioSettings(prev => {
      if (!prev.playlists[playlistId]) return prev;
      
      return {
        ...prev,
        playlists: {
          ...prev.playlists,
          [playlistId]: {
            ...prev.playlists[playlistId],
            volume: Math.max(0, Math.min(1, volume)),
          }
        }
      };
    });
  };

  // Play/pause playlist
  const togglePlaylist = (playlistId: string) => {
    setAudioSettings(prev => {
      if (!prev.playlists[playlistId]) return prev;
      
      // Stop all other playlists if this is "combat" type
      let otherPlaylists = {...prev.playlists};
      if (playlistId === 'combat' && !prev.playlists[playlistId].isPlaying) {
        // When starting combat, pause other playlists
        Object.keys(otherPlaylists).forEach(id => {
          if (id !== playlistId) {
            otherPlaylists[id] = {
              ...otherPlaylists[id],
              isPlaying: false,
            };
          }
        });
      }
      
      return {
        ...prev,
        playlists: {
          ...otherPlaylists,
          [playlistId]: {
            ...prev.playlists[playlistId],
            isPlaying: !prev.playlists[playlistId].isPlaying,
          }
        }
      };
    });
  };

  // Skip to next track
  const nextTrack = (playlistId: string) => {
    setAudioSettings(prev => {
      if (!prev.playlists[playlistId]) return prev;
      
      const playlist = prev.playlists[playlistId];
      const nextIndex = (playlist.currentTrackIndex + 1) % playlist.tracks.length;
      
      return {
        ...prev,
        playlists: {
          ...prev.playlists,
          [playlistId]: {
            ...playlist,
            currentTrackIndex: nextIndex,
          }
        }
      };
    });
  };

  // Skip to previous track
  const prevTrack = (playlistId: string) => {
    setAudioSettings(prev => {
      if (!prev.playlists[playlistId]) return prev;
      
      const playlist = prev.playlists[playlistId];
      const prevIndex = (playlist.currentTrackIndex - 1 + playlist.tracks.length) % playlist.tracks.length;
      
      return {
        ...prev,
        playlists: {
          ...prev.playlists,
          [playlistId]: {
            ...playlist,
            currentTrackIndex: prevIndex,
          }
        }
      };
    });
  };

  // Sync with game events
  const syncWithGameEvent = (eventType: 'combat-start' | 'combat-end' | 'enter-location' | 'encounter' | 'rest') => {
    switch (eventType) {
      case 'combat-start':
        // Start combat music, pause ambient
        togglePlaylist('combat');
        break;
      case 'combat-end':
        // Stop combat music, resume ambient
        setAudioSettings(prev => ({
          ...prev,
          playlists: {
            ...prev.playlists,
            'combat': {
              ...prev.playlists['combat'],
              isPlaying: false,
            },
            'ambient': {
              ...prev.playlists['ambient'],
              isPlaying: true,
            }
          }
        }));
        break;
      case 'enter-location':
        // Change to new ambient track
        nextTrack('ambient');
        setAudioSettings(prev => ({
          ...prev,
          playlists: {
            ...prev.playlists,
            'ambient': {
              ...prev.playlists['ambient'],
              isPlaying: true,
            }
          }
        }));
        break;
      case 'rest':
        // Change to peaceful ambient
        setAudioSettings(prev => ({
          ...prev,
          playlists: {
            ...prev.playlists,
            'ambient': {
              ...prev.playlists['ambient'],
              isPlaying: true,
              currentTrackIndex: 1, // Tavern music
            },
            'combat': {
              ...prev.playlists['combat'],
              isPlaying: false,
            }
          }
        }));
        break;
      default:
        break;
    }
  };

  return {
    audioSettings,
    setVolume,
    toggleMute,
    setPlaylistVolume,
    togglePlaylist,
    nextTrack,
    prevTrack,
    syncWithGameEvent,
  };
}
