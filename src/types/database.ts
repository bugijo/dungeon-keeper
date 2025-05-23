// Tipos para representar as estruturas do banco de dados Supabase

// Tipo para representar um personagem no banco de dados
export interface DbCharacter {
  id: string;
  user_id: string;
  name?: string;
  class?: string;
  level?: number;
  race?: string;
  background?: string;
  created_at?: string;
  updated_at?: string;
  is_public?: boolean;
  profiles?: {
    username?: string;
  };
  attributes?: {
    imageUrl?: string;
    [key: string]: any; // Para outros atributos dinâmicos
  };
  equipment?: any[]; // Será substituído por um tipo mais específico no futuro
  spells?: any[]; // Será substituído por um tipo mais específico no futuro
}

// Tipo para representar uma mesa de RPG no banco de dados
export interface DbTable {
  id: string;
  name?: string;
  description?: string;
  system?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  image_url?: string;
  is_public?: boolean;
  max_players?: number;
  tags?: string[];
  owner_id: string;
  created_at?: string;
  updated_at?: string;
  weekday?: string;
  time?: string;
  next_session_date?: string;
  status?: 'active' | 'inactive' | 'completed';
  custom_rules?: Record<string, unknown>;
  profiles?: {
    username?: string;
  };
}

// Tipo para representar um participante de mesa no banco de dados
export interface DbTableParticipant {
  id: string;
  table_id: string;
  user_id: string;
  character_id?: string;
  role?: 'player' | 'game_master' | 'spectator';
  joined_at?: string;
  status?: 'active' | 'inactive' | 'pending';
  profiles?: {
    username?: string;
  };
  characters?: {
    name?: string;
  };
}

// Tipo para representar uma sessão agendada no banco de dados
export interface DbScheduledSession {
  id: string;
  table_id: string;
  name?: string;
  description?: string;
  scheduled_date: string;
  duration_minutes?: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  created_at?: string;
  updated_at?: string;
  created_by: string;
  session_notes?: string;
  session_started_at?: string;
  session_ended_at?: string;
  session_paused?: boolean;
  metadata?: Record<string, unknown>;
}

// Tipo para representar um item no banco de dados
export interface DbItem {
  id: string;
  name: string;
  description?: string;
  type?: string;
  rarity?: 'common' | 'uncommon' | 'rare' | 'very_rare' | 'legendary' | 'artifact';
  attunement_required?: boolean;
  weight?: number;
  value?: number;
  properties?: string[];
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  is_public?: boolean;
  metadata?: Record<string, unknown>;
}

// Tipo para representar um mapa tático no banco de dados
export interface DbTacticalMap {
  id: string;
  name: string;
  description?: string;
  image_url: string;
  grid_size?: number;
  width?: number;
  height?: number;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  is_public?: boolean;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Tipo para representar um token de mapa no banco de dados
export interface DbMapToken {
  id: string;
  map_id: string;
  name?: string;
  image_url?: string;
  x_position: number;
  y_position: number;
  size: number;
  rotation?: number;
  is_player?: boolean;
  character_id?: string;
  created_at?: string;
  updated_at?: string;
  created_by: string;
  metadata?: Record<string, unknown>;
}

// Tipo para representar uma área revelada no banco de dados
export interface DbRevealedArea {
  id: string;
  map_id: string;
  points: string; // Formato: "x1,y1 x2,y2 x3,y3..."
  created_at?: string;
  updated_at?: string;
  created_by: string;
}