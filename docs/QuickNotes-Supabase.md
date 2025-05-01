# Integração do QuickNotes com Supabase

## Visão Geral

Este documento descreve a implementação da sincronização em tempo real do componente `QuickNotes` com o Supabase, permitindo que as notas rápidas do mestre sejam sincronizadas entre dispositivos e persistidas no banco de dados.

## Funcionalidades Implementadas

- **Sincronização em tempo real**: As notas são automaticamente sincronizadas entre dispositivos usando o Supabase Realtime
- **Persistência de dados**: As notas são salvas no banco de dados Supabase, além do localStorage
- **Experiência offline-first**: As notas funcionam mesmo sem conexão, sincronizando quando a conexão é restabelecida
- **Indicadores visuais**: Ícones e mensagens informam o status da sincronização
- **Sincronização manual**: Botão para forçar a sincronização quando necessário

## Estrutura da Tabela no Supabase

A tabela `quick_notes` foi criada no Supabase com a seguinte estrutura:

```sql
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
```

## Segurança (RLS)

Foram implementadas políticas de segurança (Row Level Security) para garantir que os usuários só possam acessar suas próprias notas:

```sql
-- Política para permitir que usuários vejam apenas suas próprias notas
CREATE POLICY "Usuários podem ver suas próprias notas" 
  ON public.quick_notes 
  FOR SELECT 
  USING (auth.uid() = user_id);
```

## Como Usar o Componente

Para utilizar o componente QuickNotes com sincronização Supabase:

```tsx
<QuickNotes 
  syncWithSupabase={true}
  sessionId={session?.id}
  userId={user?.id}
  onNoteAdd={handleNoteAdd}
  onNoteUpdate={handleNoteUpdate}
  onNoteDelete={handleNoteDelete}
/>
```

## Melhorias para Experiência Mobile

O componente foi otimizado para dispositivos móveis com as seguintes melhorias:

- Layout responsivo que se adapta a diferentes tamanhos de tela
- Botões com tamanho adequado para interação por toque
- Indicadores visuais claros do estado de sincronização
- Feedback visual através de notificações toast
- Debounce na sincronização para evitar chamadas excessivas à API

## Fluxo de Sincronização

1. **Inicialização**:
   - Carrega notas do Supabase se `syncWithSupabase` estiver habilitado
   - Configura canal de tempo real para receber atualizações

2. **Criação/Edição/Exclusão de Notas**:
   - Atualiza o estado local imediatamente
   - Envia alterações para o Supabase
   - Exibe feedback visual do status da operação

3. **Recebimento de Atualizações**:
   - Escuta eventos do Supabase Realtime
   - Atualiza o estado local quando novas alterações são recebidas

## Próximos Passos

- Implementar resolução de conflitos mais robusta
- Adicionar suporte para anexos e imagens nas notas
- Melhorar a performance com paginação para grandes conjuntos de notas
- Implementar funcionalidade de compartilhamento de notas entre mestres