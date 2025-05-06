-- Criação da tabela de NPCs
CREATE TABLE IF NOT EXISTS public.npcs (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  personality TEXT,
  appearance TEXT,
  background TEXT,
  goals TEXT,
  secrets TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela
ALTER TABLE public.npcs ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
-- Política de leitura: usuários só podem ler seus próprios NPCs
CREATE POLICY "Usuários podem ler seus próprios NPCs" 
  ON public.npcs 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política de inserção: usuários só podem inserir NPCs com seu próprio user_id
CREATE POLICY "Usuários podem inserir seus próprios NPCs" 
  ON public.npcs 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política de atualização: usuários só podem atualizar seus próprios NPCs
CREATE POLICY "Usuários podem atualizar seus próprios NPCs" 
  ON public.npcs 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política de exclusão: usuários só podem excluir seus próprios NPCs
CREATE POLICY "Usuários podem excluir seus próprios NPCs" 
  ON public.npcs 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índice para melhorar a performance de consultas por user_id
CREATE INDEX npcs_user_id_idx ON public.npcs (user_id);

-- Adicionar função de trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_npcs_updated_at
BEFORE UPDATE ON public.npcs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();