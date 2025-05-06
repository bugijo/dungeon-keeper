-- Migração para adicionar suporte a áreas de memória de jogadores e linha de visão

-- Tabela para armazenar áreas de memória dos jogadores
CREATE TABLE IF NOT EXISTS player_memory_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  map_id UUID NOT NULL REFERENCES tactical_maps(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  game_id UUID REFERENCES game_sessions(id) ON DELETE SET NULL,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  radius FLOAT NOT NULL,
  shape VARCHAR(20) NOT NULL DEFAULT 'circle',
  points JSONB,
  color VARCHAR(50),
  opacity FLOAT DEFAULT 0.4,
  is_memory BOOLEAN DEFAULT TRUE,
  is_dynamic BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS idx_player_memory_map_id ON player_memory_areas(map_id);
CREATE INDEX IF NOT EXISTS idx_player_memory_player_id ON player_memory_areas(player_id);
CREATE INDEX IF NOT EXISTS idx_player_memory_game_id ON player_memory_areas(game_id);

-- Adicionar campos adicionais à tabela de áreas reveladas existente
ALTER TABLE revealed_areas ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT FALSE;
ALTER TABLE revealed_areas ADD COLUMN IF NOT EXISTS update_interval INTEGER DEFAULT 0;
ALTER TABLE revealed_areas ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE revealed_areas ADD COLUMN IF NOT EXISTS blocks_vision BOOLEAN DEFAULT FALSE;

-- Adicionar campos adicionais à tabela de obstáculos
ALTER TABLE map_obstacles ADD COLUMN IF NOT EXISTS blocks_vision BOOLEAN DEFAULT TRUE;
ALTER TABLE map_obstacles ADD COLUMN IF NOT EXISTS blocks_movement BOOLEAN DEFAULT TRUE;
ALTER TABLE map_obstacles ADD COLUMN IF NOT EXISTS opacity FLOAT DEFAULT 1.0;
ALTER TABLE map_obstacles ADD COLUMN IF NOT EXISTS is_dynamic BOOLEAN DEFAULT FALSE;

-- Função para atualizar o timestamp last_updated
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar o timestamp last_updated
CREATE TRIGGER update_player_memory_areas_last_updated
    BEFORE UPDATE ON player_memory_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

CREATE TRIGGER update_revealed_areas_last_updated
    BEFORE UPDATE ON revealed_areas
    FOR EACH ROW
    EXECUTE FUNCTION update_last_updated_column();

-- Permissões RLS (Row Level Security)
ALTER TABLE player_memory_areas ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para player_memory_areas
CREATE POLICY "Jogadores podem ver suas próprias áreas de memória"
    ON player_memory_areas
    FOR SELECT
    USING (auth.uid() = player_id);

CREATE POLICY "Mestres do jogo podem ver todas as áreas de memória"
    ON player_memory_areas
    FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM game_sessions gs
        WHERE gs.id = player_memory_areas.game_id
        AND gs.game_master_id = auth.uid()
    ));

CREATE POLICY "Jogadores podem inserir suas próprias áreas de memória"
    ON player_memory_areas
    FOR INSERT
    WITH CHECK (auth.uid() = player_id);

CREATE POLICY "Jogadores podem atualizar suas próprias áreas de memória"
    ON player_memory_areas
    FOR UPDATE
    USING (auth.uid() = player_id);

CREATE POLICY "Jogadores podem excluir suas próprias áreas de memória"
    ON player_memory_areas
    FOR DELETE
    USING (auth.uid() = player_id);

CREATE POLICY "Mestres do jogo podem gerenciar todas as áreas de memória"
    ON player_memory_areas
    FOR ALL
    USING (EXISTS (
        SELECT 1 FROM game_sessions gs
        WHERE gs.id = player_memory_areas.game_id
        AND gs.game_master_id = auth.uid()
    ));