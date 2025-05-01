
# Sistema de Chat e Comunicação Avançado

## Visão Geral

Este documento detalha o plano de implementação de um sistema de chat e comunicação avançado para o Keeper of Realms. O objetivo é fornecer ferramentas robustas para comunicação síncrona e assíncrona entre jogadores e mestres, enriquecendo a experiência de jogo e facilitando a coordenação antes, durante e após as sessões.

## Objetivos

- Fornecer comunicação em tempo real entre participantes de uma mesa
- Integrar funcionalidades específicas de RPG no sistema de chat
- Criar canais organizados para diferentes tipos de comunicação
- Suportar elementos multimídia e compartilhamento de recursos
- Implementar potencialmente comunicação por voz para sessões online

## Componentes do Sistema

### 1. Arquitetura de Chats

#### Canais de Chat
- **Chat da Mesa**: Canal principal para todos os participantes
- **Chat do Mestre**: Comunicação privada apenas entre mestres
- **Chat de Personagem**: Canais temáticos para comunicação em personagem
- **Sussurros**: Mensagens privadas entre usuários específicos
- **Anúncios**: Canal somente-leitura para informações importantes do mestre

#### Estrutura de Dados
```sql
CREATE TABLE chat_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID REFERENCES tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'table', 'master', 'character', 'whisper', 'announcement'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  type TEXT DEFAULT 'text', -- 'text', 'roll', 'system', 'image'
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE chat_participants (
  channel_id UUID REFERENCES chat_channels(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'owner', 'participant', 'readonly'
  last_read TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (channel_id, user_id)
);
```

### 2. Funcionalidades Específicas para RPG

#### Sistema de Rolagem de Dados
- Comandos de rolagem integrados (ex: `/roll 2d6+3`)
- Visualização rica de resultados
- Histórico de rolagens por sessão e personagem
- Rolagens secretas para o mestre

```typescript
// Exemplo de componente de rolagem em chat
const DiceRollMessage = ({ roll }) => {
  const { formula, results, total, character } = roll;
  
  return (
    <div className="dice-roll-message">
      <div className="character-info">
        {character.name} rolou {formula}
      </div>
      <div className="dice-results">
        {results.map((die, i) => (
          <Die key={i} value={die.value} size={die.size} />
        ))}
      </div>
      <div className="total-result">
        Total: <span className="highlight">{total}</span>
      </div>
    </div>
  );
};
```

#### Sistema de Emotes e Ações
- Comandos para ações em personagem (ex: `/emote examina a porta cuidadosamente`)
- Visualização estilizada de ações de personagem
- Templates rápidos para ações comuns

#### Cards de Referência
- Compartilhamento de fichas de NPC
- Cards de itens com descrição e estatísticas
- Mapas em miniatura com marcadores

### 3. Interface do Usuário

#### Componentes Principais
- **ChatSidebar**: Painel lateral para acesso aos canais
- **MessageList**: Visualização de mensagens com rolagem infinita
- **MessageInput**: Entrada com suporte a comandos e formatação
- **ChatToolbar**: Ferramentas para envio de mídia, rolagem de dados, etc.

#### Recursos Avançados
- Menções a usuários e personagens (@nome)
- Formatação rica (markdown ou similar)
- Busca e filtro de mensagens
- Indicador de digitação
- Reações a mensagens (emojis)

### 4. Comunicação em Tempo Real

#### Tecnologias
- Supabase Realtime para atualizações de mensagens
- WebRTC para potencial comunicação de voz/vídeo
- Sistema de notificações para menções e mensagens importantes

#### Exemplo de Implementação
```typescript
// Hook para chat em tempo real
const useChatMessages = (channelId: string) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const { user } = useAuth();
  
  useEffect(() => {
    // Carregar mensagens iniciais
    const fetchInitialMessages = async () => {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('channel_id', channelId)
        .order('created_at', { ascending: true })
        .limit(50);
        
      if (data && !error) {
        setMessages(data);
      }
    };
    
    fetchInitialMessages();
    
    // Configurar inscrição em tempo real
    const subscription = supabase
      .channel(`chat:${channelId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel_id=eq.${channelId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();
      
    // Marcar canal como lido
    if (user) {
      supabase
        .from('chat_participants')
        .update({ last_read: new Date().toISOString() })
        .eq('channel_id', channelId)
        .eq('user_id', user.id);
    }
    
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [channelId, user]);
  
  const sendMessage = async (content: string, type = 'text', metadata = {}) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('chat_messages')
      .insert({
        channel_id: channelId,
        user_id: user.id,
        content,
        type,
        metadata
      });
      
    return !error;
  };
  
  return {
    messages,
    sendMessage
  };
};
```

### 5. Integrações Multimídia

#### Suporte para Conteúdo
- Upload e compartilhamento de imagens
- Suporte a links (visualização prévia)
- Compartilhamento de arquivos (PDFs, fichas, etc)
- Incorporação de mapas interativos

#### Gerenciamento de Mídia
- Biblioteca de recursos compartilhados
- Organização por tipo e sessão
- Gerenciamento de permissões para arquivos

### 6. Comunicação por Voz (Fase Avançada)

#### Funcionalidades Planejadas
- Canais de voz para sessões online
- Controles de áudio (volume, mudo)
- Efeitos de ambientação (música de fundo, sons)
- Transmissão seletiva (sussurrar para jogadores específicos)

## Plano de Implementação

### Fase 1: Chat Básico
- Sistema de canais e mensagens de texto
- Comandos de rolagem de dados básicos
- UI principal para desktop e mobile

### Fase 2: Recursos Avançados
- Formatação rica e comandos avançados
- Suporte a imagens e arquivos
- Sistema de menções e notificações

### Fase 3: Integração com Gameplay
- Vinculação de chat com eventos de jogo
- Cards interativos para elementos de jogo
- Histórico de rolagens com análise

### Fase 4: Comunicação por Voz
- Implementação de canais de voz
- Controles de áudio e permissões
- Efeitos sonoros e música ambiente

## Considerações Técnicas

### Segurança
- Garantir que mensagens privadas permaneçam privadas
- Implementar políticas RLS robustas no Supabase
- Validar conteúdo de mensagens para evitar XSS

### Performance
- Implementar paginação e carregamento lazy para históricos longos
- Otimizar transmissão de dados para dispositivos móveis
- Usar compressão para conteúdo multimídia

### Experiência Offline
- Cache local de mensagens recentes
- Fila de envio para mensagens offline
- Indicadores claros de status de conexão

## Conclusão

Um sistema de chat robusto e específico para RPG é crucial para a experiência do Keeper of Realms. A implementação faseada permitirá entregas incrementais de valor, começando com funcionalidades essenciais e avançando para recursos mais sofisticados. O objetivo final é criar uma experiência de comunicação que seja não apenas funcional, mas que também enriqueça a narrativa e a jogabilidade.
