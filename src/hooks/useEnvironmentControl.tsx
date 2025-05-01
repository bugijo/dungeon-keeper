import { useState, useEffect, useCallback } from 'react';
import { useAudioSystem } from './useAudioSystem';
import { environmentService, AudioScene, EnvironmentUpdate } from '@/services/environmentService';
import { toast } from 'sonner';

interface EnvironmentControlOptions {
  tableId: string;
  sessionId?: string;
  isMaster?: boolean;
}

/**
 * Hook para controlar o ambiente audiovisual da sessão de RPG
 * Permite ao mestre controlar áudio e imagens que os jogadores veem
 */
export function useEnvironmentControl({
  tableId,
  sessionId,
  isMaster = false
}: EnvironmentControlOptions) {
  const [availableScenes, setAvailableScenes] = useState<AudioScene[]>([]);
  const [currentScene, setCurrentScene] = useState<AudioScene | null>(null);
  const [narrativeText, setNarrativeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  
  const audioSystem = useAudioSystem();
  
  // Carregar cenas disponíveis
  useEffect(() => {
    const loadScenes = async () => {
      setIsLoading(true);
      try {
        const scenes = await environmentService.getAvailableScenes(tableId);
        setAvailableScenes(scenes);
      } catch (error) {
        console.error('Erro ao carregar cenas:', error);
        toast.error('Não foi possível carregar as cenas disponíveis');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadScenes();
  }, [tableId]);
  
  // Carregar ambiente atual
  useEffect(() => {
    const loadCurrentEnvironment = async () => {
      try {
        const environment = await environmentService.getCurrentEnvironment(tableId);
        if (environment) {
          // Encontrar a cena correspondente
          if (environment.sceneId) {
            const scene = availableScenes.find(s => s.id === environment.sceneId);
            if (scene) {
              setCurrentScene(scene);
              
              // Reproduzir áudio se for um jogador
              if (!isMaster && audioSystem && scene.audioTrackId) {
                // Implementar lógica para reproduzir o áudio
                const track = audioSystem.tracks.find(t => t.id === scene.audioTrackId);
                if (track) {
                  audioSystem.playTrack(track);
                }
              }
            }
          }
          
          // Atualizar imagem
          if (environment.imageUrl) {
            setActiveImage(environment.imageUrl);
          }
          
          // Atualizar narrativa
          if (environment.narrativeText) {
            setNarrativeText(environment.narrativeText);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar ambiente atual:', error);
      }
    };
    
    if (availableScenes.length > 0) {
      loadCurrentEnvironment();
    }
  }, [tableId, availableScenes, audioSystem, isMaster]);
  
  // Configurar listener para mudanças de ambiente (apenas para jogadores)
  useEffect(() => {
    if (isMaster) return;
    
    const unsubscribe = environmentService.subscribeToEnvironmentChanges(
      tableId,
      (update) => {
        // Atualizar cena
        if (update.sceneId) {
          const scene = availableScenes.find(s => s.id === update.sceneId);
          if (scene) {
            setCurrentScene(scene);
            
            // Reproduzir áudio
            if (audioSystem && scene.audioTrackId) {
              const track = audioSystem.tracks.find(t => t.id === scene.audioTrackId);
              if (track) {
                audioSystem.playTrack(track);
              }
            }
          }
        }
        
        // Atualizar imagem
        if (update.imageUrl) {
          setActiveImage(update.imageUrl);
        }
        
        // Atualizar narrativa
        if (update.narrativeText) {
          setNarrativeText(update.narrativeText);
        }
      }
    );
    
    return unsubscribe;
  }, [tableId, isMaster, availableScenes, audioSystem]);
  
  // Função para ativar uma cena (apenas para o mestre)
  const activateScene = useCallback(async (scene: AudioScene) => {
    if (!isMaster) return;
    
    setIsLoading(true);
    try {
      setCurrentScene(scene);
      
      if (scene.imageUrl) {
        setActiveImage(scene.imageUrl);
      }
      
      // Reproduzir áudio localmente para o mestre
      if (audioSystem && scene.audioTrackId) {
        const track = audioSystem.tracks.find(t => t.id === scene.audioTrackId);
        if (track) {
          audioSystem.playTrack(track);
        }
      }
      
      // Enviar atualização para os jogadores
      const success = await environmentService.sendEnvironmentUpdate(tableId, {
        sceneId: scene.id,
        imageUrl: scene.imageUrl,
        audioTrackId: scene.audioTrackId
      });
      
      if (success) {
        toast.success(`Cena "${scene.name}" ativada para todos os jogadores`);
      } else {
        toast.error('Erro ao ativar cena para os jogadores');
      }
    } catch (error) {
      console.error('Erro ao ativar cena:', error);
      toast.error('Não foi possível ativar a cena');
    } finally {
      setIsLoading(false);
    }
  }, [tableId, isMaster, audioSystem]);
  
  // Função para enviar narrativa (apenas para o mestre)
  const sendNarrative = useCallback(async (text: string) => {
    if (!isMaster || !text.trim()) return;
    
    setIsLoading(true);
    try {
      setNarrativeText(text);
      
      // Enviar atualização para os jogadores
      const success = await environmentService.sendEnvironmentUpdate(tableId, {
        narrativeText: text
      });
      
      if (success) {
        toast.success('Narrativa enviada aos jogadores');
      } else {
        toast.error('Erro ao enviar narrativa aos jogadores');
      }
    } catch (error) {
      console.error('Erro ao enviar narrativa:', error);
      toast.error('Não foi possível enviar a narrativa');
    } finally {
      setIsLoading(false);
    }
  }, [tableId, isMaster]);
  
  // Função para alterar apenas a imagem (apenas para o mestre)
  const changeImage = useCallback(async (imageUrl: string) => {
    if (!isMaster) return;
    
    setIsLoading(true);
    try {
      setActiveImage(imageUrl);
      
      // Enviar atualização para os jogadores
      const success = await environmentService.sendEnvironmentUpdate(tableId, {
        imageUrl
      });
      
      if (success) {
        toast.success('Imagem atualizada para todos os jogadores');
      } else {
        toast.error('Erro ao atualizar imagem para os jogadores');
      }
    } catch (error) {
      console.error('Erro ao alterar imagem:', error);
      toast.error('Não foi possível alterar a imagem');
    } finally {
      setIsLoading(false);
    }
  }, [tableId, isMaster]);
  
  return {
    availableScenes,
    currentScene,
    narrativeText,
    activeImage,
    isLoading,
    activateScene,
    sendNarrative,
    changeImage,
    // Expor funções do sistema de áudio
    audioControls: audioSystem
  };
}