// Serviço para rolagem de dados compartilhada
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';
import { DiceRoll } from '@/types/game';

export class DiceRollService {
  // Salva uma rolagem de dados vinculada à sessão
  static async saveDiceRoll({ user_id, session_id, dice_type, result, user_name, character_name }: Partial<DiceRoll>) {
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const { error } = await supabase.from('dice_rolls').insert({
      id,
      user_id,
      session_id,
      dice_type,
      result,
      created_at,
      user_name,
      character_name
    });
    if (error) throw error;
    return { id, user_id, session_id, dice_type, result, created_at, user_name, character_name };
  }

  // Busca histórico de rolagens de uma sessão
  static async getSessionDiceRolls(session_id: string): Promise<DiceRoll[]> {
    const { data, error } = await supabase
      .from('dice_rolls')
      .select('*')
      .eq('session_id', session_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  // Assina atualizações em tempo real para rolagens de uma sessão
  static subscribeToSessionDiceRolls(session_id: string, callback: (roll: DiceRoll) => void) {
    return supabase
      .channel('dice_rolls_changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dice_rolls', filter: `session_id=eq.${session_id}` }, (payload) => {
        callback(payload.new as DiceRoll);
      })
      .subscribe();
  }
}