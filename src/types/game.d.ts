
export interface GamePlayer {
  id: string;
  name: string;
  characterId: string | null;
  characterName: string | null;
  characterClass: string | null;
  characterRace: string | null;
  characterLevel: string | null;
  online: boolean;
}

export interface ProfileData {
  id: string;
  display_name: string;
}

export interface CombatCharacter {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  conditions: string[];
  type: 'player' | 'monster' | 'npc';
}

export interface MapToken {
  id: string;
  session_id?: string;
  x: number;
  y: number;
  token_type: string;
  name: string;
  color: string;
  size: number;
  label?: string; // Mantendo label como opcional
}

export interface DiceRoll {
  id: string;
  user_id: string;
  session_id: string;
  dice_type: string;
  result: number;
  created_at: string;
  user_name?: string;
  character_name?: string;
}
