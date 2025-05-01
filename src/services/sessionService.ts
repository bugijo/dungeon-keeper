// Serviço para gerenciar sessões e agendamentos

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Tipo para sessão agendada
export interface ScheduledSession {
  id: string;
  tableId: string;
  tableName: string;
  scheduledDate: string; // ISO string
  weekday: string;
  time: string; // formato HH:MM
  duration: number; // duração em minutos
  isRecurring: boolean; // sessão recorrente (semanal)
  notes: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  participants: string[]; // IDs dos participantes confirmados
}

// Função auxiliar para converter dados do Supabase para o formato ScheduledSession
const mapDbSessionToScheduledSession = (dbSession: any): ScheduledSession => ({
  id: dbSession.id,
  tableId: dbSession.table_id,
  tableName: dbSession.tables?.name || 'Mesa sem nome',
  scheduledDate: dbSession.scheduled_date,
  weekday: dbSession.weekday || '',
  time: dbSession.time || '',
  duration: dbSession.duration || 180, // padrão de 3 horas
  isRecurring: dbSession.is_recurring || false,
  notes: dbSession.notes || '',
  createdAt: dbSession.created_at || new Date().toISOString(),
  updatedAt: dbSession.updated_at || new Date().toISOString(),
  createdBy: dbSession.created_by,
  status: dbSession.status || 'scheduled',
  participants: dbSession.participants || []
});

// Classe de serviço para gerenciar sessões
export class SessionService {
  // Obter todas as sessões agendadas para uma mesa
  static async getTableSessions(tableId: string): Promise<ScheduledSession[]> {
    try {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*, tables(name)')
        .eq('table_id', tableId)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(session => mapDbSessionToScheduledSession(session));
    } catch (error) {
      console.error('Erro ao buscar sessões da mesa:', error);
      throw error;
    }
  }

  // Obter sessões futuras para uma mesa
  static async getUpcomingSessions(tableId: string): Promise<ScheduledSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*, tables(name)')
        .eq('table_id', tableId)
        .gte('scheduled_date', today)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(session => mapDbSessionToScheduledSession(session));
    } catch (error) {
      console.error('Erro ao buscar próximas sessões:', error);
      throw error;
    }
  }

  // Obter sessões agendadas para um usuário (todas as mesas)
  static async getUserSessions(userId: string): Promise<ScheduledSession[]> {
    try {
      // Primeiro, obter todas as mesas do usuário
      const { data: userTables, error: tablesError } = await supabase
        .from('table_participants')
        .select('table_id')
        .eq('user_id', userId);

      if (tablesError) throw tablesError;

      if (!userTables || userTables.length === 0) {
        return [];
      }

      // Extrair IDs das mesas
      const tableIds = userTables.map(t => t.table_id);

      // Buscar sessões para essas mesas
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*, tables(name)')
        .in('table_id', tableIds)
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(session => mapDbSessionToScheduledSession(session));
    } catch (error) {
      console.error('Erro ao buscar sessões do usuário:', error);
      throw error;
    }
  }

  // Obter próximas sessões agendadas para um usuário
  static async getUserUpcomingSessions(userId: string): Promise<ScheduledSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Primeiro, obter todas as mesas do usuário
      const { data: userTables, error: tablesError } = await supabase
        .from('table_participants')
        .select('table_id')
        .eq('user_id', userId);

      if (tablesError) throw tablesError;

      if (!userTables || userTables.length === 0) {
        return [];
      }

      // Extrair IDs das mesas
      const tableIds = userTables.map(t => t.table_id);

      // Buscar sessões futuras para essas mesas
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*, tables(name)')
        .in('table_id', tableIds)
        .gte('scheduled_date', today)
        .eq('status', 'scheduled')
        .order('scheduled_date', { ascending: true });

      if (error) throw error;

      return (data || []).map(session => mapDbSessionToScheduledSession(session));
    } catch (error) {
      console.error('Erro ao buscar próximas sessões do usuário:', error);
      throw error;
    }
  }

  // Obter uma sessão específica por ID
  static async getSessionById(sessionId: string): Promise<ScheduledSession | null> {
    try {
      const { data, error } = await supabase
        .from('scheduled_sessions')
        .select('*, tables(name)')
        .eq('id', sessionId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return mapDbSessionToScheduledSession(data);
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
      throw error;
    }
  }

  // Agendar uma nova sessão
  static async scheduleSession(session: Partial<ScheduledSession>): Promise<ScheduledSession> {
    try {
      const sessionId = session.id || uuidv4();
      
      // Preparar dados para o Supabase
      const sessionData = {
        id: sessionId,
        table_id: session.tableId,
        scheduled_date: session.scheduledDate,
        weekday: session.weekday,
        time: session.time,
        duration: session.duration || 180,
        is_recurring: session.isRecurring || false,
        notes: session.notes || '',
        created_by: session.createdBy,
        status: session.status || 'scheduled',
        participants: session.participants || [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('scheduled_sessions')
        .insert(sessionData)
        .select('*, tables(name)')
        .single();

      if (error) throw error;

      // Enviar notificações para os participantes da mesa
      await this.notifySessionParticipants(sessionId, session.tableId || '');

      return mapDbSessionToScheduledSession(data);
    } catch (error) {
      console.error('Erro ao agendar sessão:', error);
      throw error;
    }
  }

  // Atualizar uma sessão existente
  static async updateSession(sessionId: string, updates: Partial<ScheduledSession>): Promise<ScheduledSession> {
    try {
      // Preparar dados para o Supabase
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (updates.scheduledDate) updateData.scheduled_date = updates.scheduledDate;
      if (updates.weekday) updateData.weekday = updates.weekday;
      if (updates.time) updateData.time = updates.time;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.isRecurring !== undefined) updateData.is_recurring = updates.isRecurring;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.status) updateData.status = updates.status;
      if (updates.participants) updateData.participants = updates.participants;

      const { data, error } = await supabase
        .from('scheduled_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .select('*, tables(name)')
        .single();

      if (error) throw error;

      // Notificar participantes sobre a atualização
      await this.notifySessionUpdate(sessionId, data.table_id);

      return mapDbSessionToScheduledSession(data);
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      throw error;
    }
  }

  // Cancelar uma sessão
  static async cancelSession(sessionId: string): Promise<boolean> {
    try {
      // Primeiro, obter a sessão para ter o ID da mesa
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      // Notificar participantes sobre o cancelamento
      await this.notifySessionCancellation(sessionId, session.tableId);

      return true;
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      throw error;
    }
  }

  // Marcar uma sessão como concluída
  static async completeSession(sessionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ 
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao marcar sessão como concluída:', error);
      throw error;
    }
  }

  // Confirmar participação em uma sessão
  static async confirmParticipation(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Primeiro, obter a sessão atual
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Adicionar usuário à lista de participantes se ainda não estiver
      if (!session.participants.includes(userId)) {
        const updatedParticipants = [...session.participants, userId];
        
        const { error } = await supabase
          .from('scheduled_sessions')
          .update({ 
            participants: updatedParticipants,
            updated_at: new Date().toISOString()
          })
          .eq('id', sessionId);

        if (error) throw error;
      }

      return true;
    } catch (error) {
      console.error('Erro ao confirmar participação:', error);
      throw error;
    }
  }

  // Cancelar participação em uma sessão
  static async cancelParticipation(sessionId: string, userId: string): Promise<boolean> {
    try {
      // Primeiro, obter a sessão atual
      const session = await this.getSessionById(sessionId);
      if (!session) {
        throw new Error('Sessão não encontrada');
      }

      // Remover usuário da lista de participantes
      const updatedParticipants = session.participants.filter(id => id !== userId);
      
      const { error } = await supabase
        .from('scheduled_sessions')
        .update({ 
          participants: updatedParticipants,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Erro ao cancelar participação:', error);
      throw error;
    }
  }

  // Métodos auxiliares para notificações
  private static async notifySessionParticipants(sessionId: string, tableId: string): Promise<void> {
    try {
      // Obter participantes da mesa
      const { data: participants, error } = await supabase
        .from('table_participants')
        .select('user_id')
        .eq('table_id', tableId);

      if (error) throw error;

      // Obter detalhes da sessão
      const session = await this.getSessionById(sessionId);
      if (!session) return;

      // Criar notificações para cada participante
      for (const participant of participants) {
        await supabase
          .from('notifications')
          .insert({
            user_id: participant.user_id,
            title: 'Nova sessão agendada',
            content: `Uma nova sessão foi agendada para a mesa ${session.tableName}`,
            type: 'session_update',
            reference_type: 'session',
            reference_id: sessionId,
            created_at: new Date().toISOString(),
            is_read: false
          });
      }
    } catch (error) {
      console.error('Erro ao notificar participantes sobre nova sessão:', error);
    }
  }

  private static async notifySessionUpdate(sessionId: string, tableId: string): Promise<void> {
    try {
      // Obter participantes da mesa
      const { data: participants, error } = await supabase
        .from('table_participants')
        .select('user_id')
        .eq('table_id', tableId);

      if (error) throw error;

      // Obter detalhes da sessão
      const session = await this.getSessionById(sessionId);
      if (!session) return;

      // Criar notificações para cada participante
      for (const participant of participants) {
        await supabase
          .from('notifications')
          .insert({
            user_id: participant.user_id,
            title: 'Sessão atualizada',
            content: `Os detalhes da sessão de ${session.tableName} foram atualizados`,
            type: 'session_update',
            reference_type: 'session',
            reference_id: sessionId,
            created_at: new Date().toISOString(),
            is_read: false
          });
      }
    } catch (error) {
      console.error('Erro ao notificar participantes sobre atualização de sessão:', error);
    }
  }

  private static async notifySessionCancellation(sessionId: string, tableId: string): Promise<void> {
    try {
      // Obter participantes da mesa
      const { data: participants, error } = await supabase
        .from('table_participants')
        .select('user_id')
        .eq('table_id', tableId);

      if (error) throw error;

      // Obter detalhes da sessão
      const session = await this.getSessionById(sessionId);
      if (!session) return;

      // Criar notificações para cada participante
      for (const participant of participants) {
        await supabase
          .from('notifications')
          .insert({
            user_id: participant.user_id,
            title: 'Sessão cancelada',
            content: `A sessão de ${session.tableName} foi cancelada`,
            type: 'session_update',
            reference_type: 'session',
            reference_id: sessionId,
            created_at: new Date().toISOString(),
            is_read: false
          });
      }
    } catch (error) {
      console.error('Erro ao notificar participantes sobre cancelamento de sessão:', error);
    }
  }
}