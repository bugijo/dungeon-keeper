// Serviço para gerenciar personagens

import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// Tipo para personagem
export interface Character {
  id: string;
  name: string;
  class: string;
  level: number;
  race: string;
  background: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  ownerId: string;
  ownerName: string;
  thumbnail?: string;
  attributes?: any;
  equipment?: any[];
  spells?: any[];
}

// Função auxiliar para converter dados do Supabase para o formato Character
const mapDbCharacterToCharacter = (dbChar: any, ownerName?: string): Character => ({
  id: dbChar.id,
  name: dbChar.name || 'Sem Nome',
  class: dbChar.class || 'Desconhecido',
  level: dbChar.level || 1,
  race: dbChar.race || 'Desconhecido',
  background: dbChar.background || 'Desconhecido',
  createdAt: dbChar.created_at || new Date().toISOString(),
  updatedAt: dbChar.updated_at || new Date().toISOString(),
  isPublic: dbChar.is_public || false,
  ownerId: dbChar.user_id,
  ownerName: ownerName || dbChar.profiles?.username || 'Usuário Desconhecido',
  thumbnail: dbChar.attributes?.imageUrl || '/lovable-uploads/6be414ac-e1d0-4348-8246-9fe914618c47.png',
  attributes: dbChar.attributes || {},
  equipment: dbChar.equipment || [],
  spells: dbChar.spells || []
});

// Classe de serviço para gerenciar personagens
export class CharacterService {
  // Obter todos os personagens do usuário atual
  static async getUserCharacters(userId: string): Promise<Character[]> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*, profiles(username)')
        .eq('user_id', userId);

      if (error) throw error;

      return (data || []).map(char => mapDbCharacterToCharacter(char, char.profiles?.username));
    } catch (error) {
      console.error('Erro ao buscar personagens do usuário:', error);
      throw error;
    }
  }

  // Obter personagens públicos
  static async getPublicCharacters(): Promise<Character[]> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*, profiles(username)')
        .eq('is_public', true);

      if (error) throw error;

      return (data || []).map(char => mapDbCharacterToCharacter(char, char.profiles?.username));
    } catch (error) {
      console.error('Erro ao buscar personagens públicos:', error);
      throw error;
    }
  }

  // Obter personagens compartilhados com o usuário
  static async getSharedCharacters(userId: string): Promise<Character[]> {
    try {
      const { data, error } = await supabase
        .from('character_shares')
        .select('character_id, characters(*, profiles(username))')
        .eq('shared_with', userId);

      if (error) throw error;

      return (data || [])
        .filter(share => share.characters) // Filtrar apenas compartilhamentos válidos
        .map(share => mapDbCharacterToCharacter(
          share.characters, 
          share.characters.profiles?.username
        ));
    } catch (error) {
      console.error('Erro ao buscar personagens compartilhados:', error);
      throw error;
    }
  }

  // Obter um personagem específico por ID
  static async getCharacterById(characterId: string): Promise<Character | null> {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*, profiles(username)')
        .eq('id', characterId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return mapDbCharacterToCharacter(data, data.profiles?.username);
    } catch (error) {
      console.error('Erro ao buscar personagem:', error);
      throw error;
    }
  }

  // Salvar um personagem (criar ou atualizar)
  static async saveCharacter(character: Partial<Character>): Promise<Character> {
    try {
      const isNew = !character.id;
      const characterId = character.id || uuidv4();
      const userId = character.ownerId;
      
      // Preparar dados para o Supabase
      const characterData = {
        id: characterId,
        user_id: userId,
        name: character.name,
        race: character.race,
        class: character.class,
        level: character.level,
        background: character.background,
        is_public: character.isPublic,
        updated_at: new Date().toISOString(),
        attributes: {
          ...character.attributes,
          imageUrl: character.thumbnail
        },
        equipment: character.equipment || [],
        spells: character.spells || []
      };

      let result;
      if (isNew) {
        // Inserir novo personagem
        result = await supabase
          .from('characters')
          .insert({
            ...characterData,
            created_at: new Date().toISOString()
          })
          .select('*, profiles(username)')
          .single();
      } else {
        // Atualizar personagem existente
        result = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', characterId)
          .eq('user_id', userId) // Garantir que apenas o dono possa atualizar
          .select('*, profiles(username)')
          .single();
      }

      if (result.error) throw result.error;

      return mapDbCharacterToCharacter(result.data, result.data.profiles?.username);
    } catch (error) {
      console.error('Erro ao salvar personagem:', error);
      throw error;
    }
  }

  // Alterar a visibilidade de um personagem (público/privado)
  static async toggleCharacterVisibility(characterId: string): Promise<Character> {
    try {
      // Primeiro, obter o personagem atual
      const character = await this.getCharacterById(characterId);
      if (!character) {
        throw new Error('Personagem não encontrado');
      }

      // Inverter o status de visibilidade
      const newVisibility = !character.isPublic;

      // Atualizar no banco de dados
      const { data, error } = await supabase
        .from('characters')
        .update({ is_public: newVisibility, updated_at: new Date().toISOString() })
        .eq('id', characterId)
        .eq('user_id', character.ownerId) // Garantir que apenas o dono possa alterar
        .select('*, profiles(username)')
        .single();

      if (error) throw error;

      // Retornar o personagem atualizado
      return mapDbCharacterToCharacter(data, data.profiles?.username);
    } catch (error) {
      console.error('Erro ao alterar visibilidade do personagem:', error);
      throw error;
    }
  }

  // Compartilhar personagem com outro usuário por email
  static async shareCharacterByEmail(characterId: string, email: string): Promise<boolean> {
    try {
      // Verificar se o usuário com este email existe
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (userError && userError.code !== 'PGRST116') { // PGRST116 = not found
        throw userError;
      }

      // Se o usuário não existir, criar um registro de convite pendente
      if (!userData) {
        // Implementação para convites pendentes pode ser adicionada aqui
        // Por enquanto, apenas lançamos um erro
        throw new Error('Usuário não encontrado com este email');
      }

      // Registrar o compartilhamento
      const { error } = await supabase
        .from('character_shares')
        .upsert({
          character_id: characterId,
          shared_with: userData.id,
          shared_at: new Date().toISOString()
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erro ao compartilhar personagem por email:', error);
      throw error;
    }
  }

  // Gerar link de compartilhamento para um personagem
  static getShareLink(characterId: string): string {
    return `${window.location.origin}/character/shared/${characterId}`;
  }
}