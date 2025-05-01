
# Implementação de Notificações em Tempo Real

## Visão Geral

Este documento detalha o plano de implementação de notificações em tempo real para o Keeper of Realms, utilizando o Supabase Realtime. O objetivo é melhorar a comunicação e a experiência geral dos usuários, fornecendo atualizações instantâneas sobre eventos relevantes.

## Casos de Uso

1. **Solicitações de Mesa**
   - Notificar mestres quando um novo jogador solicita entrada em sua mesa
   - Notificar jogadores quando sua solicitação é aprovada ou rejeitada

2. **Mensagens e Chat**
   - Notificar sobre mensagens recebidas
   - Atualizar feed de chat em tempo real

3. **Alterações de Sessão**
   - Notificar sobre alterações de horário/data de sessões
   - Alertar sobre sessões prestes a começar (lembretes)

4. **Atualizações de Campanha**
   - Notificar sobre novas notas, mapas ou NPCs adicionados
   - Atualizar status de missões ou objetivos

## Implementação Técnica

### 1. Configuração do Supabase Realtime

```typescript
// Exemplo de configuração do canal de realtime
const setupRealtimeSubscriptions = (userId: string) => {
  // Canal para solicitações de mesa
  const tableRequestsChannel = supabase
    .channel('table_requests')
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'table_join_requests',
        filter: `user_id=eq.${userId}` 
      },
      (payload) => {
        handleNewTableRequest(payload.new);
      }
    )
    .subscribe();

  // Canal para atualizações de mesa
  const tableUpdatesChannel = supabase
    .channel('table_updates')
    .on('postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'tables',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        handleTableUpdate(payload);
      }
    )
    .subscribe();

  // Retornar as inscrições para limpeza
  return [tableRequestsChannel, tableUpdatesChannel];
};
```

### 2. Componentes de UI para Notificações

1. **Componente de Centro de Notificações**
   - Dropdown acessível do cabeçalho
   - Lista de notificações com status (lida/não lida)
   - Agrupamento por tipo e tempo

2. **Toast de Notificação**
   - Alerta visual temporário para notificações importantes
   - Ações rápidas (ex: aceitar/rejeitar solicitação)

3. **Badge de Contagem**
   - Indicador visual de notificações não lidas
   - Atualização em tempo real do contador

### 3. Banco de Dados

Nova tabela `notifications` para armazenamento:

```sql
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  type TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  action_url TEXT
);
```

### 4. Gerenciamento de Estado

Implementação de um hook useNotifications:

```typescript
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  // Carregar notificações iniciais
  // Configurar inscrições de tempo real
  // Funções para marcar como lido/não lido
  // Função para remover notificação

  return {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
};
```

## Plano de Implementação

1. **Fase 1: Infraestrutura**
   - [x] Criar tabela de notificações
   - [ ] Implementar canais Supabase Realtime
   - [ ] Criar componentes base de UI

2. **Fase 2: Tipos de Notificação**
   - [ ] Implementar notificações para solicitações de mesa
   - [ ] Implementar notificações para atualizações de sessão
   - [ ] Implementar notificações de sistema

3. **Fase 3: Refinamento**
   - [ ] Adicionar configurações de preferência de notificação
   - [ ] Implementar filtros e pesquisa
   - [ ] Testes e otimização de desempenho

## Considerações Técnicas

- **Segurança**: Garantir que os usuários só possam ver suas próprias notificações
- **Escalabilidade**: Considerar volume potencial de notificações e desempenho
- **Offline**: Como lidar com notificações quando os usuários estão offline
- **Agrupamento**: Como agrupar notificações relacionadas para reduzir ruído

## Conclusão

A implementação de notificações em tempo real melhorará significativamente a experiência do usuário, permitindo que mestres e jogadores se mantenham atualizados sobre eventos importantes sem precisar verificar manualmente as diferentes seções do aplicativo. Esta funcionalidade é especialmente importante para uma ferramenta de colaboração como o Keeper of Realms.
