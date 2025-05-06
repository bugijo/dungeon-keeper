-- Criação da tabela de NPCs gerados por IA
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  appearance TEXT,
  background TEXT,
  goals TEXT,
  secrets TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Comentários da tabela
COMMENT ON TABLE public.npcs IS 'Tabela para armazenar NPCs gerados por IA';

-- Índices para melhorar a performance
CREATE INDEX IF NOT EXISTS npcs_user_id_idx ON public.npcs (user_id);
CREATE INDEX IF NOT EXISTS npcs_created_at_idx ON public.npcs (created_at DESC);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança RLS
-- Política para inserção: apenas usuários autenticados podem inserir seus próprios NPCs
CREATE POLICY "Usuários podem inserir seus próprios NPCs" 
  ON public.npcs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para seleção: usuários podem ver apenas seus próprios NPCs
CREATE POLICY "Usuários podem ver seus próprios NPCs" 
  ON public.npcs FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para atualização: usuários podem atualizar apenas seus próprios NPCs
CREATE POLICY "Usuários podem atualizar seus próprios NPCs" 
  ON public.npcs FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para exclusão: usuários podem excluir apenas seus próprios NPCs
CREATE POLICY "Usuários podem excluir seus próprios NPCs" 
  ON public.npcs FOR DELETE 
  USING (auth.uid() = user_id);