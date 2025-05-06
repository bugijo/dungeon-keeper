// Serviço para geração de NPCs por IA usando OpenAI e salvamento no Supabase
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Interface para o tipo NPC
export interface NPC {
  id: string;
  name: string;
  description?: string;
  personality?: string;
  appearance?: string;
  background?: string;
  goals?: string;
  secrets?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export class NPCService {
  // Gera um NPC usando IA e salva no Supabase
  static async generateNpcWithAI(prompt: string, user_id: string): Promise<NPC> {
    // Chamada à API da OpenAI
    const openaiApiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!openaiApiKey) throw new Error('Chave da OpenAI não configurada');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'Você é um gerador de NPCs para RPG. Responda sempre em JSON com os campos: name, description, personality, appearance, background, goals, secrets.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 400
      })
    });

    if (!response.ok) throw new Error('Falha ao gerar NPC com IA');
    const data = await response.json();
    let npc;
    try {
      npc = JSON.parse(data.choices[0].message.content);
    } catch (e) {
      throw new Error('Resposta da IA não está em JSON válido');
    }

    // Salva o NPC no Supabase
    const id = uuidv4();
    const created_at = new Date().toISOString();
    const { error } = await supabase.from('npcs').insert({
      id,
      ...npc,
      user_id,
      created_at,
      updated_at: created_at
    });
    if (error) throw error;
    return { id, ...npc, user_id, created_at, updated_at: created_at } as NPC;
  }

  // Busca todos os NPCs de um usuário
  static async getUserNPCs(user_id: string): Promise<NPC[]> {
    const { data, error } = await supabase
      .from('npcs')
      .select('*')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data as NPC[] || [];
  }

  // Busca um NPC específico pelo ID
  static async getNPCById(id: string): Promise<NPC | null> {
    const { data, error } = await supabase
      .from('npcs')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null; // Não encontrado
      throw error;
    }
    return data as NPC;
  }

  // Atualiza um NPC existente
  static async updateNPC(id: string, npcData: Partial<NPC>): Promise<NPC> {
    const updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('npcs')
      .update({ ...npcData, updated_at })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as NPC;
  }

  // Exclui um NPC
  static async deleteNPC(id: string): Promise<void> {
    const { error } = await supabase
      .from('npcs')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  // Assina atualizações em tempo real para NPCs de um usuário
  static subscribeToUserNPCs(user_id: string, callback: (npc: NPC) => void) {
    return supabase
      .channel('npcs_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'npcs', filter: `user_id=eq.${user_id}` }, (payload) => {
        callback(payload.new as NPC);
      })
      .subscribe();
  }
}