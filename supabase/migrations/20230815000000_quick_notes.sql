-- Criação da tabela de notas rápidas para o mestre
CREATE TABLE IF NOT EXISTS public.quick_notes (
  id BIGSERIAL PRIMARY KEY,
  note_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'default',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Adicionar índices para melhorar a performance das consultas
CREATE INDEX IF NOT EXISTS quick_notes_session_id_idx ON public.quick_notes (session_id);
CREATE INDEX IF NOT EXISTS quick_notes_user_id_idx ON public.quick_notes (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS quick_notes_note_id_session_id_user_id_idx ON public.quick_notes (note_id, session_id, user_id);

-- Configurar permissões RLS (Row Level Security)
ALTER TABLE public.quick_notes ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam apenas suas próprias notas ou notas compartilhadas com eles
CREATE POLICY "Usuários podem ver suas próprias notas" 
  ON public.quick_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários criem suas próprias notas
CREATE POLICY "Usuários podem criar suas próprias notas" 
  ON public.quick_notes 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Política para permitir que usuários atualizem suas próprias notas
CREATE POLICY "Usuários podem atualizar suas próprias notas" 
  ON public.quick_notes 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Política para permitir que usuários excluam suas próprias notas
CREATE POLICY "Usuários podem excluir suas próprias notas" 
  ON public.quick_notes 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Comentários da tabela
COMMENT ON TABLE public.quick_notes IS 'Tabela para armazenar notas rápidas do mestre de jogo';
COMMENT ON COLUMN public.quick_notes.note_id IS 'ID único da nota gerado pelo cliente';
COMMENT ON COLUMN public.quick_notes.session_id IS 'ID da sessão de jogo';
COMMENT ON COLUMN public.quick_notes.user_id IS 'ID do usuário que criou a nota';
COMMENT ON COLUMN public.quick_notes.title IS 'Título da nota';
COMMENT ON COLUMN public.quick_notes.content IS 'Conteúdo da nota';
COMMENT ON COLUMN public.quick_notes.color IS 'Cor da nota (default, red, green, blue, purple, yellow)';
COMMENT ON COLUMN public.quick_notes.is_pinned IS 'Indica se a nota está fixada';
COMMENT ON COLUMN public.quick_notes.created_at IS 'Data de criação da nota';
COMMENT ON COLUMN public.quick_notes.last_updated IS 'Data da última atualização da nota';