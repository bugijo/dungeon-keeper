-- Migração para criar tabelas relacionadas ao sistema de mapas táticos

-- Tabela para armazenar os mapas táticos
CREATE TABLE IF NOT EXISTS tactical_maps (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT NOT NULL,
  grid_size INTEGER NOT NULL DEFAULT 50,
  unit_size INTEGER NOT NULL DEFAULT 5,
  unit_name TEXT NOT NULL DEFAULT 'pés',
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar os tokens nos mapas
CREATE TABLE IF NOT EXISTS map_tokens (
  id UUID PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES tactical_maps(id) ON DELETE CASCADE,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  size FLOAT NOT NULL DEFAULT 40,
  color TEXT NOT NULL DEFAULT '#ff5500',
  label TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar as áreas reveladas nos mapas (fog of war)
CREATE TABLE IF NOT EXISTS revealed_areas (
  id UUID PRIMARY KEY,
  map_id UUID NOT NULL REFERENCES tactical_maps(id) ON DELETE CASCADE,
  x FLOAT NOT NULL,
  y FLOAT NOT NULL,
  radius FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para armazenar o progresso dos tutoriais por usuário
CREATE TABLE IF NOT EXISTS tutorial_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tutorial_id TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, tutorial_id)
);

-- Políticas de segurança RLS (Row Level Security)

-- Políticas para tactical_maps
ALTER TABLE tactical_maps ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver mapas públicos
CREATE POLICY "Mapas públicos visíveis para todos" 
  ON tactical_maps FOR SELECT 
  USING (is_public = true);

-- Usuários podem ver seus próprios mapas
CREATE POLICY "Usuários podem ver seus próprios mapas" 
  ON tactical_maps FOR SELECT 
  USING (auth.uid() = created_by);

-- Usuários podem criar seus próprios mapas
CREATE POLICY "Usuários podem criar seus próprios mapas" 
  ON tactical_maps FOR INSERT 
  WITH CHECK (auth.uid() = created_by);

-- Usuários podem atualizar seus próprios mapas
CREATE POLICY "Usuários podem atualizar seus próprios mapas" 
  ON tactical_maps FOR UPDATE 
  USING (auth.uid() = created_by);

-- Usuários podem excluir seus próprios mapas
CREATE POLICY "Usuários podem excluir seus próprios mapas" 
  ON tactical_maps FOR DELETE 
  USING (auth.uid() = created_by);

-- Políticas para map_tokens
ALTER TABLE map_tokens ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver tokens em mapas públicos
CREATE POLICY "Tokens em mapas públicos visíveis para todos" 
  ON map_tokens FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = map_tokens.map_id AND tactical_maps.is_public = true
    )
  );

-- Usuários podem ver tokens em seus próprios mapas
CREATE POLICY "Usuários podem ver tokens em seus próprios mapas" 
  ON map_tokens FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = map_tokens.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Usuários podem criar tokens em seus próprios mapas
CREATE POLICY "Usuários podem criar tokens em seus próprios mapas" 
  ON map_tokens FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = map_tokens.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Usuários podem atualizar seus próprios tokens
CREATE POLICY "Usuários podem atualizar seus próprios tokens" 
  ON map_tokens FOR UPDATE 
  USING (owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = map_tokens.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Usuários podem excluir seus próprios tokens
CREATE POLICY "Usuários podem excluir seus próprios tokens" 
  ON map_tokens FOR DELETE 
  USING (owner_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = map_tokens.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Políticas para revealed_areas
ALTER TABLE revealed_areas ENABLE ROW LEVEL SECURITY;

-- Qualquer pessoa pode ver áreas reveladas em mapas públicos
CREATE POLICY "Áreas reveladas em mapas públicos visíveis para todos" 
  ON revealed_areas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = revealed_areas.map_id AND tactical_maps.is_public = true
    )
  );

-- Usuários podem ver áreas reveladas em seus próprios mapas
CREATE POLICY "Usuários podem ver áreas reveladas em seus próprios mapas" 
  ON revealed_areas FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = revealed_areas.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Usuários podem criar áreas reveladas em seus próprios mapas
CREATE POLICY "Usuários podem criar áreas reveladas em seus próprios mapas" 
  ON revealed_areas FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = revealed_areas.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Usuários podem excluir áreas reveladas em seus próprios mapas
CREATE POLICY "Usuários podem excluir áreas reveladas em seus próprios mapas" 
  ON revealed_areas FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM tactical_maps 
      WHERE tactical_maps.id = revealed_areas.map_id AND tactical_maps.created_by = auth.uid()
    )
  );

-- Políticas para tutorial_progress
ALTER TABLE tutorial_progress ENABLE ROW LEVEL SECURITY;

-- Usuários podem ver seu próprio progresso de tutorial
CREATE POLICY "Usuários podem ver seu próprio progresso de tutorial" 
  ON tutorial_progress FOR SELECT 
  USING (auth.uid() = user_id);

-- Usuários podem criar registros de progresso para si mesmos
CREATE POLICY "Usuários podem criar registros de progresso para si mesmos" 
  ON tutorial_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Usuários podem atualizar seu próprio progresso de tutorial
CREATE POLICY "Usuários podem atualizar seu próprio progresso de tutorial" 
  ON tutorial_progress FOR UPDATE 
  USING (auth.uid() = user_id);

-- Índices para melhorar o desempenho
CREATE INDEX idx_tactical_maps_created_by ON tactical_maps(created_by);
CREATE INDEX idx_tactical_maps_is_public ON tactical_maps(is_public);
CREATE INDEX idx_map_tokens_map_id ON map_tokens(map_id);
CREATE INDEX idx_map_tokens_owner_id ON map_tokens(owner_id);
CREATE INDEX idx_revealed_areas_map_id ON revealed_areas(map_id);
CREATE INDEX idx_tutorial_progress_user_id ON tutorial_progress(user_id);
CREATE INDEX idx_tutorial_progress_tutorial_id ON tutorial_progress(tutorial_id);