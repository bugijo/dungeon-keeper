-- Políticas RLS para tabela sessions

-- Verificar se a tabela sessions existe, se não, criar
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  map_data JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active'
);

-- Habilitar RLS na tabela sessions
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Política para permitir que criadores possam ler/escrever suas próprias sessões
CREATE POLICY "Criadores podem ler/escrever suas próprias sessões"
  ON public.sessions
  USING (auth.uid() = created_by);

-- Política para permitir que participantes possam ler/escrever sessões em que participam
CREATE POLICY "Participantes podem ler/escrever sessões em que participam"
  ON public.sessions
  USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_participants.session_id = sessions.id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Verificar se a tabela session_participants existe, se não, criar
CREATE TABLE IF NOT EXISTS public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'player',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(session_id, user_id)
);

-- Habilitar RLS na tabela session_participants
ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

-- Política para permitir que usuários vejam suas próprias participações
CREATE POLICY "Usuários podem ver suas próprias participações"
  ON public.session_participants
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política para permitir que mestres vejam participantes de suas sessões
CREATE POLICY "Mestres podem ver participantes de suas sessões"
  ON public.session_participants
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.sessions
      WHERE sessions.id = session_participants.session_id
      AND sessions.created_by = auth.uid()
    )
  );

-- Políticas RLS para tabela characters

-- Verificar se a tabela characters existe, se não, criar
CREATE TABLE IF NOT EXISTS public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class TEXT,
  race TEXT,
  level INTEGER DEFAULT 1,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  data JSONB DEFAULT '{}'::jsonb
);

-- Habilitar RLS na tabela characters
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

-- Política para permitir que proprietários possam ler/escrever seus próprios personagens
CREATE POLICY "Proprietários podem ler/escrever seus próprios personagens"
  ON public.characters
  USING (auth.uid() = owner_id);

-- Políticas RLS para tabela dice_rolls

-- Verificar se a tabela dice_rolls existe, se não, criar
CREATE TABLE IF NOT EXISTS public.dice_rolls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  roll_formula TEXT NOT NULL,
  roll_result INTEGER NOT NULL,
  roll_details JSONB,
  visible_to_all BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela dice_rolls
ALTER TABLE public.dice_rolls ENABLE ROW LEVEL SECURITY;

-- Política: Apenas participantes da sessão podem ler os dados de dice_rolls
CREATE POLICY "Participantes podem ler rolagens da sessão"
  ON public.dice_rolls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.session_participants
      WHERE session_participants.session_id = dice_rolls.session_id
      AND session_participants.user_id = auth.uid()
    )
  );

-- Política: Usuário pode inserir suas próprias rolagens
CREATE POLICY "Usuário pode inserir suas próprias rolagens"
  ON public.dice_rolls
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Adicionar tabelas ao realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.characters;