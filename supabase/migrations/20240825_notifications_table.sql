-- Criação da tabela de notificações para o sistema de notificações em tempo real

-- Tabela para armazenar notificações de usuários
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  action_url TEXT,
  sender_id UUID,
  sender_name TEXT,
  sender_avatar TEXT
);

-- Índices para melhorar a performance de consultas
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications (read);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications (created_at);

-- Função para enviar notificação
CREATE OR REPLACE FUNCTION public.send_notification(
  p_user_id UUID,
  p_title TEXT,
  p_content TEXT,
  p_type TEXT,
  p_reference_id UUID DEFAULT NULL,
  p_reference_type TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_sender_id UUID DEFAULT NULL,
  p_sender_name TEXT DEFAULT NULL,
  p_sender_avatar TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO public.notifications (
    user_id,
    title,
    content,
    type,
    reference_id,
    reference_type,
    action_url,
    sender_id,
    sender_name,
    sender_avatar
  ) VALUES (
    p_user_id,
    p_title,
    p_content,
    p_type,
    p_reference_id,
    p_reference_type,
    p_action_url,
    p_sender_id,
    p_sender_name,
    p_sender_avatar
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Políticas RLS para controle de acesso
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias notificações
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que usuários atualizem apenas suas próprias notificações
CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam apenas suas próprias notificações
CREATE POLICY "Users can delete their own notifications"
  ON public.notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Política para permitir que o sistema insira notificações para qualquer usuário
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Trigger para limpar notificações antigas (mais de 30 dias)
CREATE OR REPLACE FUNCTION public.clean_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE created_at < NOW() - INTERVAL '30 days';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clean_old_notifications_trigger
  AFTER INSERT ON public.notifications
  EXECUTE PROCEDURE public.clean_old_notifications();

-- Habilitar realtime para a tabela de notificações
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;