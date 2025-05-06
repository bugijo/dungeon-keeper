-- Criação da tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL, -- message, combat, quest, fog_update, system, etc.
  read BOOLEAN DEFAULT FALSE,
  reference_type TEXT, -- table, session, map, combat, etc.
  reference_id TEXT, -- ID da referência (pode ser UUID ou caminho)
  action_url TEXT, -- URL opcional para ação
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS
-- Política de leitura: usuários só podem ler suas próprias notificações
CREATE POLICY "Usuários podem ler suas próprias notificações" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política de inserção: usuários só podem inserir notificações para si mesmos
CREATE POLICY "Usuários podem inserir suas próprias notificações" 
  ON public.notifications 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política de atualização: usuários só podem atualizar suas próprias notificações
CREATE POLICY "Usuários podem atualizar suas próprias notificações" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política de exclusão: usuários só podem excluir suas próprias notificações
CREATE POLICY "Usuários podem excluir suas próprias notificações" 
  ON public.notifications 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Criar índice para melhorar a performance de consultas por user_id
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id);

-- Criar índice para melhorar a performance de consultas por read status
CREATE INDEX notifications_read_idx ON public.notifications (user_id, read);

-- Adicionar função de trigger para atualizar o campo updated_at automaticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para atualizar o campo updated_at automaticamente
CREATE TRIGGER update_notifications_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Criar função para limpar notificações antigas
CREATE OR REPLACE FUNCTION public.clean_old_notifications()
RETURNS void AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Criar um job para limpar notificações antigas automaticamente (executa diariamente)
SELECT cron.schedule(
  'clean-old-notifications',
  '0 0 * * *',
  $$SELECT public.clean_old_notifications()$$
);