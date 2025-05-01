
import { User } from "@supabase/supabase-js";

export type TokenPosition = {
  id: string;
  x: number;
  y: number;
  name: string;
  color: string;
  token_type: 'character' | 'monster' | 'npc' | 'object' | string;
  size: number;
  is_visible_to_players: boolean;
  user_id?: string;
  character_id?: string;
  session_id: string;
};

export type SessionTurn = {
  id: string;
  session_id: string;
  current_turn_user_id: string | null;
  turn_started_at: string | null;
  turn_ends_at: string | null;
  turn_duration: number;
  is_paused: boolean;
  round_number: number;
  turn_order: string[]; // Array of user_ids
};

export type SessionMessage = {
  id: string;
  session_id: string;
  user_id: string;
  content: string;
  type: 'text' | 'dice' | 'system' | 'whisper';
  metadata?: any;
  created_at: string;
};

export type SessionParticipant = {
  id: string;
  user_id: string;
  role: 'gm' | 'player';
  display_name?: string;
  character_id?: string;
  character_name?: string;
};
