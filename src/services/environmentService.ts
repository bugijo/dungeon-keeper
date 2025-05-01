import { supabase } from '@/integrations/supabase/client';

export interface AudioScene {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  audioTrackId: string;
  type: 'ambiente' | 'personagem' | 'evento';
  tags: string[];
  narrativeText?: string;
}

export interface EnvironmentUpdate {
  sceneId?: string;
  imageUrl?: string;
  audioTrackId?: string;
  narrativeText?: string;
  volume?: number;
}

/**
 * Serviço para gerenciar a sincronização de ambiente (áudio e visual) entre mestre e jogadores
 */
export const environmentService = {
  /**
   * Envia uma atualização de ambiente para todos os jogadores na mesa
   */
  async sendEnvironmentUpdate(tableId: string, update: EnvironmentUpdate): Promise<boolean> {
    try {
      // Em produção, isso enviaria os dados via Supabase Realtime ou outra solução de tempo real
      console.log(`Enviando atualização de ambiente para mesa ${tableId}:`, update);
      
      // Simula o envio de dados (em produção, usaria canais do Supabase ou similar)
      const { data, error } = await supabase
        .from('session_environment')
        .upsert({
          table_id: tableId,
          scene_id: update.sceneId,
          image_url: update.imageUrl,
          audio_track_id: update.audioTrackId,
          narrative_text: update.narrativeText,
          updated_at: new Date().toISOString()
        });
      
      if (error) {
        console.error('Erro ao enviar atualização de ambiente:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao enviar atualização de ambiente:', error);
      return false;
    }
  },
  
  /**
   * Obtém a configuração atual de ambiente para uma mesa
   */
  async getCurrentEnvironment(tableId: string): Promise<EnvironmentUpdate | null> {
    try {
      const { data, error } = await supabase
        .from('session_environment')
        .select('*')
        .eq('table_id', tableId)
        .single();
      
      if (error) {
        console.error('Erro ao obter ambiente atual:', error);
        return null;
      }
      
      return {
        sceneId: data.scene_id,
        imageUrl: data.image_url,
        audioTrackId: data.audio_track_id,
        narrativeText: data.narrative_text
      };
    } catch (error) {
      console.error('Erro ao obter ambiente atual:', error);
      return null;
    }
  },
  
  /**
   * Configura um listener para mudanças de ambiente em tempo real
   */
  subscribeToEnvironmentChanges(tableId: string, callback: (update: EnvironmentUpdate) => void) {
    // Em produção, isso usaria Supabase Realtime ou outra solução de tempo real
    console.log(`Configurando listener para atualizações de ambiente na mesa ${tableId}`);
    
    // Simula a configuração de um listener (em produção, usaria canais do Supabase)
    const channel = supabase
      .channel(`environment-${tableId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'session_environment',
        filter: `table_id=eq.${tableId}`
      }, (payload) => {
        const update: EnvironmentUpdate = {
          sceneId: payload.new.scene_id,
          imageUrl: payload.new.image_url,
          audioTrackId: payload.new.audio_track_id,
          narrativeText: payload.new.narrative_text
        };
        
        callback(update);
      })
      .subscribe();
    
    // Retorna uma função para cancelar a inscrição
    return () => {
      supabase.removeChannel(channel);
    };
  },
  
  /**
   * Obtém uma lista de cenas de áudio disponíveis
   */
  async getAvailableScenes(tableId: string): Promise<AudioScene[]> {
    try {
      // Em produção, isso buscaria do banco de dados
      // Por enquanto, retorna dados de exemplo
      return [
        { 
          id: '1', 
          name: 'Taverna Animada', 
          description: 'Sons de uma taverna movimentada com música, conversas e risos', 
          imageUrl: '/assets/images/scenes/tavern.jpg', 
          audioTrackId: '2', 
          type: 'ambiente',
          tags: ['taverna', 'cidade', 'social']
        },
        { 
          id: '2', 
          name: 'Cidade Movimentada', 
          description: 'Barulho de uma cidade medieval com mercadores e transeuntes', 
          imageUrl: '/assets/images/scenes/city.jpg', 
          audioTrackId: '5', 
          type: 'ambiente',
          tags: ['cidade', 'mercado', 'urbano']
        },
        { 
          id: '3', 
          name: 'Floresta Misteriosa', 
          description: 'Sons da floresta com pássaros, vento nas folhas e galhos estalando', 
          imageUrl: '/assets/images/scenes/forest.jpg', 
          audioTrackId: '3', 
          type: 'ambiente',
          tags: ['floresta', 'natureza', 'mistério']
        },
        { 
          id: '4', 
          name: 'Calabouço Sombrio', 
          description: 'Ecos distantes, goteiras e sons inquietantes de um calabouço', 
          imageUrl: '/assets/images/scenes/dungeon.jpg', 
          audioTrackId: '4', 
          type: 'ambiente',
          tags: ['dungeon', 'subterrâneo', 'terror']
        },
        { 
          id: '5', 
          name: 'Batalha Épica', 
          description: 'Sons intensos de batalha com espadas, gritos e música épica', 
          imageUrl: '/assets/images/scenes/battle.jpg', 
          audioTrackId: '1', 
          type: 'evento',
          tags: ['batalha', 'combate', 'épico']
        },
        { 
          id: '6', 
          name: 'Chuva Forte', 
          description: 'Som de chuva forte com trovões e vento', 
          imageUrl: '/assets/images/scenes/rain.jpg', 
          audioTrackId: '3', 
          type: 'ambiente',
          tags: ['clima', 'chuva', 'tempestade']
        },
      ];
    } catch (error) {
      console.error('Erro ao obter cenas disponíveis:', error);
      return [];
    }
  }
};