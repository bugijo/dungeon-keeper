export interface GamePlayer {
  id: string;
  name: string;
  characterId: string | null;
  characterName: string | null;
  characterClass: string | null;
  characterRace: string | null;
  characterLevel: number | null;
  online: boolean;
}

export interface MapToken {
  id: string;
  name: string;
  token_type: string;
  x: number;
  y: number;
  size: number;
  color: string;
  image_url?: string;
  label?: string;
  character_id?: string;
  user_id?: string;
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

export interface ProfileData {
  id: string;
  display_name: string;
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

export interface TurnTimer {
  id: string;
  session_id: string;
  current_turn_user_id: string | null;
  turn_started_at: string | null;
  turn_ends_at: string | null;
  is_active: boolean;
  round_number: number;
}
