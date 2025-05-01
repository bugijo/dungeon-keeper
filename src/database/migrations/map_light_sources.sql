-- Migração para criar tabela de fontes de luz dinâmicas
CREATE TABLE IF NOT EXISTS map_light_sources (
  id TEXT PRIMARY KEY,
  map_id TEXT NOT NULL REFERENCES tactical_maps(id) ON DELETE CASCADE,
  position_x FLOAT NOT NULL,
  position_y FLOAT NOT NULL,
  radius FLOAT NOT NULL,
  color TEXT,
  intensity FLOAT DEFAULT 1.0,
  flickering BOOLEAN DEFAULT FALSE,
  flicker_intensity FLOAT DEFAULT 0.2,
  cast_shadows BOOLEAN DEFAULT TRUE,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índice para consultas por mapa
CREATE INDEX IF NOT EXISTS idx_map_light_sources_map_id ON map_light_sources(map_id);

-- Tabela para presets de iluminação
CREATE TABLE IF NOT EXISTS lighting_presets (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  map_id TEXT NOT NULL REFERENCES tactical_maps(id) ON DELETE CASCADE,
  light_sources JSONB NOT NULL,
  ambient_light FLOAT DEFAULT 0.1,
  created_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para consultas de presets
CREATE INDEX IF NOT EXISTS idx_lighting_presets_game_id ON lighting_presets(game_id);
CREATE INDEX IF NOT EXISTS idx_lighting_presets_map_id ON lighting_presets(map_id);