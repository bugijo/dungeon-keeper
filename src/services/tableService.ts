// Serviço para gerenciar mesas de RPG

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Tipo para mesa de RPG
export interface GameTable {
  id: string;
  name: string;
  description: string;
  system: string; // D&D 5e, Pathfinder, etc.
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  imageUrl?: string;
  isPublic: boolean;
  maxPlayers: number;
  tags: string[];
  ownerId: string;
  ownerName: string;
  createdAt: string;
  updatedAt: string;
  weekday?: string; // Dia da semana para sessões recorrentes
  time?: string; // Horário para sessões recorrentes (formato HH:MM)
  nextSessionDate?: string; // Data da próxima sessão
  status: 'active' | 'inactive' | 'completed';
  customRules?: any;
}

// Tipo para participante de mesa
export interface TableParticipant {
  id: string;
  tableId: string;
  userId: string;
  userName: string;
  characterId?: string;
  characterName?: string;
  role: 'player' | 'game_master' | 'spectator';
  joinedAt: string;
  status: 'active' | 'inactive' | 'pending';
}

// Função auxiliar para converter dados do Supabase para o formato GameTable
const mapDbTableToGameTable = (dbTable: any): GameTable => ({
  id: dbTable.id,
  name: dbTable.name || 'Mesa sem nome',
  description: dbTable.description || '',
  system: dbTable.system || 'D&D 5e',
  difficulty: dbTable.difficulty || 'intermediate',
  imageUrl: dbTable.image_url,
  isPublic: dbTable.is_public || false,
  maxPlayers: dbTable.max_players || 5,
  tags: dbTable.tags || [],
  ownerId: dbTable.owner_id,
  ownerName: dbTable.profiles?.username || 'Usuário Desconhecido',
  createdAt: dbTable.created_at || new Date().toISOString(),
  updatedAt: dbTable.updated_at || new Date().toISOString(),
  weekday: dbTable.weekday,
  time: dbTable.time,
  nextSessionDate: dbTable.next_session_date,
  status: dbTable.status || 'active',
  customRules: dbTable.custom_rules || {}
});

// Função auxiliar para converter dados do Supabase para o formato TableParticipant
const mapDbParticipantToTableParticipant = (dbParticipant: any): TableParticipant => ({
  id: dbParticipant.id,
  tableId: dbParticipant.table_id,
  userId: dbParticipant.user_id,
  userName: dbParticipant.profiles?.username || 'Usuário Desconhecido',
  characterId: dbParticipant.character_id,
  characterName: dbParticipant.characters?.name,
  role: dbParticipant.role || 'player',
  joinedAt: dbParticipant.joined_at || new Date().toISOString(),
  status: dbParticipant.status || 'active'
});

// Classe de serviço para gerenciar mesas
export class TableService {
  // Obter todas as mesas públicas
  static async getPublicTables(): Promise<GameTable[]> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*, profiles(username)')
        .eq('is_public', true)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(table => mapDbTableToGameTable(table));
    } catch (error) {
      console.error('Erro ao buscar mesas públicas:', error);
      throw error;
    }
  }

  // Obter mesas do usuário (como mestre ou jogador)
  static async getUserTables(userId: string): Promise<GameTable[]> {
    try {
      // Primeiro, obter IDs das mesas em que o usuário participa
      const { data: participations, error: participationsError } = await supabase
        .from('table_participants')
        .select('table_id')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (participationsError) throw participationsError;

      if (!participations || participations.length === 0) {
        return [];
      }

      // Extrair IDs das mesas
      const tableIds = participations.map(p => p.table_id);

      // Buscar detalhes das mesas
      const { data, error } = await supabase
        .from('tables')
        .select('*, profiles(username)')
        .in('id', tableIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(table => mapDbTableToGameTable(table));
    } catch (error) {
      console.error('Erro ao buscar mesas do usuário:', error);
      throw error;
    }
  }

  // Obter mesas mestradas pelo usuário
  static async getUserMasteredTables(userId: string): Promise<GameTable[]> {
    try {
      // Primeiro, obter IDs das mesas em que o usuário é mestre
      const { data: masteredTables, error: masteredError } = await supabase
        .from('table_participants')
        .select('table_id')
        .eq('user_id', userId)
        .eq('role', 'game_master')
        .eq('status', 'active');

      if (masteredError) throw masteredError;

      if (!masteredTables || masteredTables.length === 0) {
        return [];
      }

      // Extrair IDs das mesas
      const tableIds = masteredTables.map(p => p.table_id);

      // Buscar detalhes das mesas
      const { data, error } = await supabase
        .from('tables')
        .select('*, profiles(username)')
        .in('id', tableIds)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      return (data || []).map(table => mapDbTableToGameTable(table));
    } catch (error) {
      console.error('Erro ao buscar mesas mestradas pelo usuário:', error);
      throw error;
    }
  }

  // Obter uma mesa específica por ID
  static async getTableById(tableId: string): Promise<GameTable | null> {
    try {
      const { data, error } = await supabase
        .from('tables')
        .select('*, profiles(username)')
        .eq('id', tableId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return mapDbTableToGameTable(data);
    } catch (error) {
      console.error('Erro ao buscar mesa:', error);
      throw error;
    }
  }

  // Criar uma nova mesa
  static async createTable(table: Partial<GameTable>, userId: string): Promise<GameTable> {
    try {
      const tableId = uuidv4();
      
      // Preparar dados para o Supabase
      const tableData = {
        id: tableId,
        name: table.name,
        description: table.description || '',
        system: table.system || 'D&D 5e',
        difficulty: table.difficulty || 'intermediate',
        image_url: table.imageUrl,
        is_public: table.isPublic !== undefined ? table.isPublic : true,
        max_players: table.maxPlayers || 5,
        tags: table.tags || [],
        owner_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        weekday: table.weekday,
        time: table.time,
        next_session_date: table.nextSessionDate,
        status: 'active',
        custom_rules: table.customRules || {}
      };

      // Inserir a mesa
      const { data, error } = await supabase
        .from('tables')
        .insert(tableData)
        .select('*, profiles(username)')
        .single();

      if (error) throw error;

      // Adicionar o criador como mestre da mesa
      await supabase
        .from('table_participants')
        .insert({
          table_id: tableId,
          user_id: userId,
          role: 'game_master',
          joined_at: new Date().toISOString(),
          status: 'active'
        });

      return mapDbTableToGameTable(data);
    } catch (error) {
      console.error('Erro ao criar mesa:', error);
      throw error;
    }
  }

  // Atualizar uma mesa existente
  static async updateTable(tableId: string, updates: Partial<GameTable>): Promise<GameTable> {
    try {
      // Preparar dados para o Supabase
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.system) updateData.system = updates.system;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;
      if (updates.imageUrl !== undefined) updateData.image_url = updates.imageUrl;
      if (updates.isPublic !== undefined) updateData.is_public = updates.isPublic;
      if (updates.maxPlayers) updateData.max_players = updates.maxPlayers;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.weekday !== undefined) updateData.weekday = updates.weekday;
      if (updates.time !== undefined) updateData.time = updates.time;
      if (updates.nextSessionDate !== undefined) updateData.next_session_date = updates.nextSessionDate;
      if (updates.status) updateData.status = updates.status;
      if (updates.customRules) updateData.custom_rules = updates.customRules;

      const { data, error } = await supabase
        .from('tables')
        .update(updateData)
        .eq('id', tableId)
        .select('*, profiles(username)')
        .single();

      if (error) throw error;

      return mapDbTableToGameTable(data);
    } catch (error) {
      console.error('Erro ao atualizar mesa:', error);
      throw error;
    }
  }

  // Excluir uma mesa
  static async deleteTable(tableId: string): Promise<boolean> {
    try {
      // Primeiro, verificar se existem sessões agendadas
      const { data: sessions, error: sessionsError } = await supabase
        .from('scheduled_sessions')
        .select('id')
        .eq('table_id', tableId)
        .eq('status', 'scheduled');

      if (sessionsError) throw sessionsError;

      // Se houver sessões agendadas, cancelá-las
      if (sessions && sessions.length > 0) {
        await supabase
          .from('scheduled_sessions')
          .update({ status: 'cancelled' })
          .in('id', sessions.map(s => s.id));
      }

      // Remover participantes da mesa
      await supabase
        .from('table_participants')
        .update({ status: 'inactive' })
        .eq('table_id', tableId);

      // Marcar a mesa como inativa (soft delete)
      const { error } = await supabase
        .from('tables')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao excluir mesa:', error);
      throw error;
    }
  }

  // Adicionar participante à mesa
  static async addParticipant(tableId: string, userId: string, role: 'player' | 'game_master' | 'spectator' = 'player', characterId?: string): Promise<TableParticipant> {
    try {
      // Verificar se o usuário já é participante
      const { data: existingParticipant, error: checkError } = await supabase
        .from('table_participants')
        .select('*')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = not found
        throw checkError;
      }

      let result;

      if (existingParticipant) {
        // Atualizar participante existente
        result = await supabase
          .from('table_participants')
          .update({
            role,
            character_id: characterId,
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('table_id', tableId)
          .eq('user_id', userId)
          .select('*, profiles(username), characters(name)')
          .single();
      } else {
        // Adicionar novo participante
        result = await supabase
          .from('table_participants')
          .insert({
            table_id: tableId,
            user_id: userId,
            role,
            character_id: characterId,
            joined_at: new Date().toISOString(),
            status: 'active'
          })
          .select('*, profiles(username), characters(name)')
          .single();
      }

      if (result.error) throw result.error;

      // Atualizar contagem de jogadores na mesa
      await this.updatePlayerCount(tableId);

      return mapDbParticipantToTableParticipant(result.data);
    } catch (error) {
      console.error('Erro ao adicionar participante à mesa:', error);
      throw error;
    }
  }

  // Remover participante da mesa
  static async removeParticipant(tableId: string, userId: string): Promise<boolean> {
    try {
      // Verificar se o usuário é o dono da mesa
      const table = await this.getTableById(tableId);
      if (!table) {
        throw new Error('Mesa não encontrada');
      }

      // Se for o dono, não permitir remoção
      if (table.ownerId === userId) {
        throw new Error('O dono da mesa não pode ser removido');
      }

      // Atualizar status do participante para inativo
      const { error } = await supabase
        .from('table_participants')
        .update({ 
          status: 'inactive',
          updated_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .eq('user_id', userId);

      if (error) throw error;

      // Atualizar contagem de jogadores na mesa
      await this.updatePlayerCount(tableId);

      return true;
    } catch (error) {
      console.error('Erro ao remover participante da mesa:', error);
      throw error;
    }
  }

  // Obter participantes de uma mesa
  static async getTableParticipants(tableId: string): Promise<TableParticipant[]> {
    try {
      const { data, error } = await supabase
        .from('table_participants')
        .select('*, profiles(username), characters(name)')
        .eq('table_id', tableId)
        .eq('status', 'active');

      if (error) throw error;

      return (data || []).map(participant => mapDbParticipantToTableParticipant(participant));
    } catch (error) {
      console.error('Erro ao buscar participantes da mesa:', error);
      throw error;
    }
  }

  // Verificar se um usuário é mestre de uma mesa
  static async isGameMaster(tableId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('table_participants')
        .select('role')
        .eq('table_id', tableId)
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (error) return false;

      return data?.role === 'game_master';
    } catch (error) {
      console.error('Erro ao verificar se usuário é mestre:', error);
      return false;
    }
  }

  // Atualizar o personagem de um participante
  static async updateParticipantCharacter(tableId: string, userId: string, characterId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('table_participants')
        .update({ 
          character_id: characterId,
          updated_at: new Date().toISOString()
        })
        .eq('table_id', tableId)
        .eq('user_id', userId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao atualizar personagem do participante:', error);
      throw error;
    }
  }

  // Método auxiliar para atualizar contagem de jogadores
  private static async updatePlayerCount(tableId: string): Promise<void> {
    try {
      // Contar participantes ativos
      const { count, error } = await supabase
        .from('table_participants')
        .select('*', { count: 'exact', head: true })
        .eq('table_id', tableId)
        .eq('status', 'active');

      if (error) throw error;

      // Atualizar próxima sessão com base nas sessões agendadas
      const { data: nextSession, error: sessionError } = await supabase
        .from('scheduled_sessions')
        .select('scheduled_date')
        .eq('table_id', tableId)
        .eq('status', 'scheduled')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .limit(1);

      if (sessionError) throw sessionError;

      // Atualizar mesa com contagem e próxima sessão
      await supabase
        .from('tables')
        .update({ 
          current_players: count || 0,
          next_session_date: nextSession && nextSession.length > 0 ? nextSession[0].scheduled_date : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tableId);
    } catch (error) {
      console.error('Erro ao atualizar contagem de jogadores:', error);
    }
  }
}