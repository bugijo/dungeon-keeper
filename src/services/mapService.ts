import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export interface TacticalMap {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  grid_size: number;
  unit_size: number;
  unit_name: string;
  width: number;
  height: number;
  created_by: string;
  is_public: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface MapToken {
  id: string;
  map_id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  owner_id: string;
}

export interface RevealedArea {
  id: string;
  map_id: string;
  x: number;
  y: number;
  radius: number;
}

// Função auxiliar para converter dados do Supabase para o formato TacticalMap
const mapDbMapToTacticalMap = (dbMap: any): TacticalMap => ({
  id: dbMap.id,
  name: dbMap.name,
  description: dbMap.description,
  image_url: dbMap.image_url,
  grid_size: dbMap.grid_size,
  unit_size: dbMap.unit_size,
  unit_name: dbMap.unit_name,
  width: dbMap.width,
  height: dbMap.height,
  created_by: dbMap.created_by,
  is_public: dbMap.is_public,
  created_at: dbMap.created_at,
  updated_at: dbMap.updated_at
});

// Função auxiliar para converter dados do Supabase para o formato MapToken
const mapDbTokenToMapToken = (dbToken: any): MapToken => ({
  id: dbToken.id,
  map_id: dbToken.map_id,
  x: dbToken.x,
  y: dbToken.y,
  size: dbToken.size,
  color: dbToken.color,
  label: dbToken.label,
  owner_id: dbToken.owner_id
});

// Função auxiliar para converter dados do Supabase para o formato RevealedArea
const mapDbAreaToRevealedArea = (dbArea: any): RevealedArea => ({
  id: dbArea.id,
  map_id: dbArea.map_id,
  x: dbArea.x,
  y: dbArea.y,
  radius: dbArea.radius
});

/**
 * Serviço para gerenciar mapas táticos
 */
export const mapService = {
  /**
   * Compartilhar um mapa por e-mail
   */
  async shareMapByEmail(mapId: string, email: string): Promise<void> {
    // Verificar se o mapa existe
    const map = await this.getMapById(mapId);
    
    // Criar um registro de compartilhamento no Supabase
    const { error } = await supabase
      .from('map_shares')
      .insert([
        {
          map_id: mapId,
          shared_with_email: email,
          shared_by: map.created_by,
          access_level: 'view' // Pode ser 'view' ou 'edit'
        }
      ]);

    if (error) throw new Error(`Erro ao compartilhar mapa: ${error.message}`);
    
    // Aqui poderia integrar com um serviço de e-mail para enviar o convite
    // Por enquanto, apenas registramos o compartilhamento no banco
  },
  /**
   * Obter todos os mapas públicos
   */
  async getPublicMaps(): Promise<TacticalMap[]> {
    const { data, error } = await supabase
      .from('tactical_maps')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar mapas públicos: ${error.message}`);
    
    return (data || []).map(map => mapDbMapToTacticalMap(map));
  },

  /**
   * Obter mapas criados pelo usuário
   */
  async getUserMaps(userId: string): Promise<TacticalMap[]> {
    const { data, error } = await supabase
      .from('tactical_maps')
      .select('*')
      .eq('created_by', userId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro ao buscar mapas do usuário: ${error.message}`);
    
    return (data || []).map(map => mapDbMapToTacticalMap(map));
  },

  /**
   * Obter um mapa específico por ID
   */
  async getMapById(mapId: string): Promise<TacticalMap> {
    const { data, error } = await supabase
      .from('tactical_maps')
      .select('*')
      .eq('id', mapId)
      .single();

    if (error) throw new Error(`Erro ao buscar mapa: ${error.message}`);
    if (!data) throw new Error(`Mapa não encontrado: ${mapId}`);
    
    return mapDbMapToTacticalMap(data);
  },

  /**
   * Criar um novo mapa tático
   */
  async createMap(map: Omit<TacticalMap, 'id' | 'created_at' | 'updated_at'>): Promise<TacticalMap> {
    const newMap = {
      ...map,
      id: uuidv4(),
    };

    const { data, error } = await supabase
      .from('tactical_maps')
      .insert([newMap])
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar mapa: ${error.message}`);
    
    return mapDbMapToTacticalMap(data);
  },

  /**
   * Atualizar um mapa existente
   */
  async updateMap(mapId: string, updates: Partial<TacticalMap>): Promise<TacticalMap> {
    const { data, error } = await supabase
      .from('tactical_maps')
      .update(updates)
      .eq('id', mapId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar mapa: ${error.message}`);
    
    return mapDbMapToTacticalMap(data);
  },

  /**
   * Excluir um mapa
   */
  async deleteMap(mapId: string): Promise<void> {
    // Primeiro excluir tokens e áreas reveladas associadas
    await supabase.from('map_tokens').delete().eq('map_id', mapId);
    await supabase.from('revealed_areas').delete().eq('map_id', mapId);
    await supabase.from('map_shares').delete().eq('map_id', mapId);
    
    // Depois excluir o mapa
    const { error } = await supabase
      .from('tactical_maps')
      .delete()
      .eq('id', mapId);

    if (error) throw new Error(`Erro ao excluir mapa: ${error.message}`);
  },

  /**
   * Obter tokens de um mapa
   */
  async getMapTokens(mapId: string): Promise<MapToken[]> {
    const { data, error } = await supabase
      .from('map_tokens')
      .select('*')
      .eq('map_id', mapId);

    if (error) throw new Error(`Erro ao buscar tokens do mapa: ${error.message}`);
    
    return (data || []).map(token => mapDbTokenToMapToken(token));
  },

  /**
   * Adicionar um token ao mapa
   */
  async addToken(token: Omit<MapToken, 'id'>): Promise<MapToken> {
    const newToken = {
      ...token,
      id: uuidv4(),
    };

    const { data, error } = await supabase
      .from('map_tokens')
      .insert([newToken])
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar token: ${error.message}`);
    
    return mapDbTokenToMapToken(data);
  },

  /**
   * Atualizar a posição de um token
   */
  async updateTokenPosition(tokenId: string, x: number, y: number): Promise<MapToken> {
    const { data, error } = await supabase
      .from('map_tokens')
      .update({ x, y })
      .eq('id', tokenId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar posição do token: ${error.message}`);
    
    return mapDbTokenToMapToken(data);
  },

  /**
   * Excluir um token
   */
  async deleteToken(tokenId: string): Promise<void> {
    const { error } = await supabase
      .from('map_tokens')
      .delete()
      .eq('id', tokenId);

    if (error) throw new Error(`Erro ao excluir token: ${error.message}`);
  },

  /**
   * Obter áreas reveladas de um mapa
   */
  async getRevealedAreas(mapId: string): Promise<RevealedArea[]> {
    const { data, error } = await supabase
      .from('revealed_areas')
      .select('*')
      .eq('map_id', mapId);

    if (error) throw new Error(`Erro ao buscar áreas reveladas: ${error.message}`);
    
    return (data || []).map(area => mapDbAreaToRevealedArea(area));
  },

  /**
   * Adicionar uma área revelada ao mapa
   */
  async addRevealedArea(area: Omit<RevealedArea, 'id'>): Promise<RevealedArea> {
    const newArea = {
      ...area,
      id: uuidv4(),
    };

    const { data, error } = await supabase
      .from('revealed_areas')
      .insert([newArea])
      .select()
      .single();

    if (error) throw new Error(`Erro ao adicionar área revelada: ${error.message}`);
    
    return mapDbAreaToRevealedArea(data);
  },

  /**
   * Excluir uma área revelada
   */
  async deleteRevealedArea(areaId: string): Promise<void> {
    const { error } = await supabase
      .from('revealed_areas')
      .delete()
      .eq('id', areaId);

    if (error) throw new Error(`Erro ao excluir área revelada: ${error.message}`);
  },
  
  /**
   * Excluir todos os tokens de um mapa
   */
  async deleteMapTokens(mapId: string): Promise<void> {
    const { error } = await supabase
      .from('map_tokens')
      .delete()
      .eq('map_id', mapId);

    if (error) throw new Error(`Erro ao excluir tokens do mapa: ${error.message}`);
  },
  
  /**
   * Excluir todas as áreas reveladas de um mapa
   */
  async deleteRevealedAreas(mapId: string): Promise<void> {
    const { error } = await supabase
      .from('revealed_areas')
      .delete()
      .eq('map_id', mapId);

    if (error) throw new Error(`Erro ao excluir áreas reveladas do mapa: ${error.message}`);
  },
  
  /**
   * Obter mapas compartilhados com um usuário por e-mail
   */
  async getSharedMaps(email: string): Promise<TacticalMap[]> {
    const { data, error } = await supabase
      .from('map_shares')
      .select('map_id')
      .eq('shared_with_email', email);

    if (error) throw new Error(`Erro ao buscar mapas compartilhados: ${error.message}`);
    
    if (!data || data.length === 0) return [];
    
    // Obter os mapas compartilhados
    const mapIds = data.map(share => share.map_id);
    const { data: maps, error: mapsError } = await supabase
      .from('tactical_maps')
      .select('*')
      .in('id', mapIds);

    if (mapsError) throw new Error(`Erro ao buscar mapas compartilhados: ${mapsError.message}`);
    
    return (maps || []).map(map => mapDbMapToTacticalMap(map));
  },

  /**
   * Configurar um canal de tempo real para atualizações de mapa
   */
  subscribeToMapUpdates(mapId: string, callback: (payload: any) => void) {
    const channel = supabase
      .channel(`map:${mapId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'tactical_maps',
        filter: `id=eq.${mapId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'map_tokens',
        filter: `map_id=eq.${mapId}`
      }, callback)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'revealed_areas',
        filter: `map_id=eq.${mapId}`
      }, callback)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }
};