-- Migração para criar as tabelas necessárias para o sistema de chat avançado

-- Tabela de canais de chat
CREATE TABLE IF NOT EXISTS chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'table', 'master', 'character', 'whisper', 'announcement'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de mensagens de chat
CREATE TABLE IF NOT EXISTS session_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  avatar_url TEXT,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'roll', 'system', 'emote', 'whisper'
  roll_result JSONB,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  character_name TEXT,
  is_gm BOOLEAN DEFAULT false,
  is_bookmarked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de participantes do chat
CREATE TABLE IF NOT EXISTS chat_participants (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'owner', 'participant', 'readonly'
  last_read TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);

-- Políticas RLS para as tabelas de chat
-- Políticas para chat_channels
ALTER TABLE chat_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver canais de suas mesas" 
  ON chat_channels FOR SELECT 
  USING (table_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid()
  ));

CREATE POLICY "Mestres podem criar canais" 
  ON chat_channels FOR INSERT 
  WITH CHECK (table_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
  ));

CREATE POLICY "Mestres podem atualizar canais" 
  ON chat_channels FOR UPDATE 
  USING (table_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
  ));

CREATE POLICY "Mestres podem excluir canais" 
  ON chat_channels FOR DELETE 
  USING (table_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
  ));

-- Políticas para session_messages
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver mensagens de suas sessões" 
  ON session_messages FOR SELECT 
  USING (session_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid()
  ) OR (type = 'whisper' AND target_user_id = auth.uid()));

CREATE POLICY "Usuários podem enviar mensagens em suas sessões" 
  ON session_messages FOR INSERT 
  WITH CHECK (session_id IN (
    SELECT table_id FROM table_participants WHERE user_id = auth.uid()
  ) AND user_id = auth.uid());

CREATE POLICY "Usuários podem atualizar suas próprias mensagens" 
  ON session_messages FOR UPDATE 
  USING (user_id = auth.uid());

CREATE POLICY "Usuários podem excluir suas próprias mensagens" 
  ON session_messages FOR DELETE 
  USING (user_id = auth.uid());

-- Políticas para chat_participants
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem ver participantes de seus canais" 
  ON chat_participants FOR SELECT 
  USING (channel_id IN (
    SELECT id FROM chat_channels WHERE table_id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "Mestres podem adicionar participantes" 
  ON chat_participants FOR INSERT 
  WITH CHECK (channel_id IN (
    SELECT id FROM chat_channels WHERE table_id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
    )
  ));

CREATE POLICY "Mestres podem atualizar participantes" 
  ON chat_participants FOR UPDATE 
  USING (channel_id IN (
    SELECT id FROM chat_channels WHERE table_id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
    )
  ));

CREATE POLICY "Mestres podem remover participantes" 
  ON chat_participants FOR DELETE 
  USING (channel_id IN (
    SELECT id FROM chat_channels WHERE table_id IN (
      SELECT table_id FROM table_participants WHERE user_id = auth.uid() AND role = 'gm'
    )
  ));

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS idx_session_messages_session_id ON session_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_user_id ON session_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_session_messages_type ON session_messages(type);
CREATE INDEX IF NOT EXISTS idx_chat_channels_table_id ON chat_channels(table_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_channel_id ON chat_participants(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);