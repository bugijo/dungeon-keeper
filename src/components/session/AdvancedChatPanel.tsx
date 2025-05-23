import React, { useState, useEffect, useRef } from 'react';
import { Send, Dices, Image, Smile, Settings, Volume2, VolumeX, MessageSquare, Bookmark, BookmarkCheck, History, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  username: string;
  avatar_url?: string;
  content: string;
  type: 'text' | 'roll' | 'system' | 'emote' | 'whisper';
  roll_result?: {
    dice: string;
    results: number[];
    total: number;
    success?: boolean;
    critical?: boolean;
  };
  target_user_id?: string;
  created_at: string;
  character_name?: string;
  is_gm: boolean;
  is_bookmarked?: boolean;
}

interface AdvancedChatPanelProps {
  sessionId: string;
  userId: string;
  username: string;
  isGameMaster: boolean;
  avatarUrl?: string;
  characterName?: string;
  onlineUsers?: {
    id: string;
    username: string;
    character_name?: string;
    is_online: boolean;
    is_gm: boolean;
  }[];
}

const AdvancedChatPanel: React.FC<AdvancedChatPanelProps> = ({
  sessionId,
  userId,
  username,
  isGameMaster,
  avatarUrl,
  characterName,
  onlineUsers = []
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showDicePanel, setShowDicePanel] = useState(false);
  const [selectedDice, setSelectedDice] = useState('d20');
  const [diceQuantity, setDiceQuantity] = useState(1);
  const [diceModifier, setDiceModifier] = useState(0);
  const [targetUser, setTargetUser] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'text' | 'emote' | 'whisper'>('text');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [bookmarkedMessages, setBookmarkedMessages] = useState<ChatMessage[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyDate, setHistoryDate] = useState<Date | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { sendNotification } = useNotificationContext();

  // Rolagem de dados
  const diceTypes = ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'];
  
  // Emojis temáticos de RPG organizados por categorias
  const rpgEmojiCategories = [
    {
      name: 'Expressões',
      emojis: ['😀', '😂', '😍', '🤔', '😎', '😢', '😡', '😱', '🤩', '😴']
    },
    {
      name: 'Combate',
      emojis: ['⚔️', '🛡️', '🏹', '🗡️', '🪓', '🔪', '🧨', '💣', '🔫', '🏆']
    },
    {
      name: 'Magia',
      emojis: ['🔮', '✨', '💫', '🪄', '🧙‍♂️', '🧙‍♀️', '🧝‍♀️', '🧝‍♂️', '🧌', '🧚']
    },
    {
      name: 'Elementos',
      emojis: ['🔥', '❄️', '⚡', '🌊', '🌪️', '🌿', '🪨', '☀️', '🌙', '⭐']
    },
    {
      name: 'Criaturas',
      emojis: ['🐉', '🧟', '👻', '💀', '🦄', '🐺', '🦇', '🦂', '🕷️', '🐲']
    },
    {
      name: 'Itens',
      emojis: ['🎲', '📜', '📚', '🧪', '🧬', '👑', '💰', '🍺', '🗝️', '📿']
    },
    {
      name: 'Cenário',
      emojis: ['🏰', '⛰️', '🌋', '🏕️', '🌲', '🌳', '🏞️', '⛪', '🏚️', '🌉']
    }
  ];
  
  // Todos os emojis em uma única lista para compatibilidade
  const rpgEmojis = rpgEmojiCategories.flatMap(category => category.emojis);
  
  // Regex para detectar comandos de rolagem no texto
  const diceRollRegex = /\/roll\s+(\d+)d(\d+)(?:([+-])(\d+))?/;

  // Efeito para carregar mensagens iniciais
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('session_messages')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        if (error) throw error;
        setMessages(data as ChatMessage[]);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
      }
    };

    fetchMessages();

    // Configurar canal de tempo real para novas mensagens
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'session_messages',
        filter: `session_id=eq.${sessionId}`
      }, (payload) => {
        const newMessage = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMessage]);
        
        // Tocar som de notificação se estiver habilitado
        if (soundEnabled && newMessage.user_id !== userId) {
          const audio = new Audio('/assets/sounds/message.mp3');
          audio.volume = 0.3;
          audio.play().catch(e => console.error('Erro ao tocar som de mensagem:', e));
        }
        
        // Enviar notificação se for uma mensagem direcionada ao usuário
        if (newMessage.target_user_id === userId || 
            (newMessage.type === 'whisper' && newMessage.target_user_id === userId)) {
          sendNotification({
            user_id: userId,
            title: 'Nova mensagem',
            content: `${newMessage.username}: ${newMessage.content.substring(0, 50)}${newMessage.content.length > 50 ? '...' : ''}`,
            type: 'message',
            reference_id: sessionId,
            reference_type: 'session',
            sender_id: newMessage.user_id,
            sender_name: newMessage.username
          }).catch(console.error);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId, soundEnabled]);

  // Rolar para o final quando novas mensagens chegarem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim()) return;

    try {
      // Verificar se é um comando de rolagem de dados
      const rollMatch = messageInput.match(diceRollRegex);
      
      if (rollMatch) {
        // Extrair parâmetros da rolagem
        const diceCount = parseInt(rollMatch[1]);
        const diceSides = parseInt(rollMatch[2]);
        const modifierSign = rollMatch[3] || '';
        const modifierValue = rollMatch[4] ? parseInt(rollMatch[4]) : 0;
        const modifier = modifierSign === '-' ? -modifierValue : modifierValue;
        
        // Executar rolagem de dados
        await executeRollCommand(diceCount, diceSides, modifier);
        return;
      }
      
      const newMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        session_id: sessionId,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content: messageInput,
        type: messageType,
        character_name: characterName,
        is_gm: isGameMaster
      };

      // Adicionar destinatário se for sussurro
      if (messageType === 'whisper' && targetUser) {
        newMessage.target_user_id = targetUser;
      }

      const { error } = await supabase
        .from('session_messages')
        .insert(newMessage);

      if (error) throw error;

      setMessageInput('');
      setIsTyping(false);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
    }
  };
  
  // Função para executar comando de rolagem a partir do texto
  const executeRollCommand = async (diceCount: number, diceSides: number, modifier: number = 0) => {
    try {
      const results: number[] = [];
      let total = 0;

      // Rolar os dados
      for (let i = 0; i < diceCount; i++) {
        const result = Math.floor(Math.random() * diceSides) + 1;
        results.push(result);
        total += result;
      }

      // Adicionar modificador
      total += modifier;

      // Verificar crítico (apenas para d20)
      const critical = diceSides === 20 && results.includes(20);
      const criticalFail = diceSides === 20 && results.includes(1);

      // Criar mensagem de rolagem
      const rollContent = `rolou ${diceCount}d${diceSides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`;
      
      const newMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        session_id: sessionId,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content: rollContent,
        type: 'roll',
        roll_result: {
          dice: `${diceCount}d${diceSides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : modifier) : ''}`,
          results,
          total,
          critical: critical || undefined,
          success: critical || undefined
        },
        character_name: characterName,
        is_gm: isGameMaster
      };

      // Adicionar destinatário se for rolagem privada
      if (targetUser) {
        newMessage.target_user_id = targetUser;
      }

      const { error } = await supabase
        .from('session_messages')
        .insert(newMessage);

      if (error) throw error;

      // Tocar som de dados
      const audio = new Audio('/assets/sounds/dice-roll.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error('Erro ao tocar som de dados:', e));
      
      setMessageInput('');
    } catch (error) {
      console.error('Erro ao executar comando de rolagem:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const rollDice = async () => {
    try {
      // Extrair o número do tipo de dado (d20 -> 20)
      const diceSize = parseInt(selectedDice.substring(1));
      const results: number[] = [];
      let total = 0;

      // Rolar os dados
      for (let i = 0; i < diceQuantity; i++) {
        const result = Math.floor(Math.random() * diceSize) + 1;
        results.push(result);
        total += result;
      }

      // Adicionar modificador
      total += diceModifier;

      // Verificar crítico (apenas para d20)
      const critical = selectedDice === 'd20' && results.includes(20);
      const criticalFail = selectedDice === 'd20' && results.includes(1);

      // Criar mensagem de rolagem
      const rollContent = `rolou ${diceQuantity}${selectedDice}${diceModifier !== 0 ? (diceModifier > 0 ? `+${diceModifier}` : diceModifier) : ''}`;
      
      const newMessage: Omit<ChatMessage, 'id' | 'created_at'> = {
        session_id: sessionId,
        user_id: userId,
        username,
        avatar_url: avatarUrl,
        content: rollContent,
        type: 'roll',
        roll_result: {
          dice: `${diceQuantity}${selectedDice}${diceModifier !== 0 ? (diceModifier > 0 ? `+${diceModifier}` : diceModifier) : ''}`,
          results,
          total,
          critical: critical || undefined,
          success: critical || undefined
        },
        character_name: characterName,
        is_gm: isGameMaster
      };

      // Adicionar destinatário se for rolagem privada
      if (targetUser) {
        newMessage.target_user_id = targetUser;
      }

      const { error } = await supabase
        .from('session_messages')
        .insert(newMessage);

      if (error) throw error;

      // Tocar som de dados
      const audio = new Audio('/assets/sounds/dice-roll.mp3');
      audio.volume = 0.5;
      audio.play().catch(e => console.error('Erro ao tocar som de dados:', e));

      // Fechar painel de dados
      setShowDicePanel(false);
    } catch (error) {
      console.error('Erro ao rolar dados:', error);
    }
  };

  // Função para alternar o status de favorito de uma mensagem
  const toggleBookmark = async (messageId: string) => {
    try {
      const updatedMessages = messages.map(msg => {
        if (msg.id === messageId) {
          return { ...msg, is_bookmarked: !msg.is_bookmarked };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      
      // Atualizar lista de favoritos
      const bookmarked = updatedMessages.filter(msg => msg.is_bookmarked);
      setBookmarkedMessages(bookmarked);
      
      // Persistir status de favorito no localStorage
      const bookmarkedIds = bookmarked.map(msg => msg.id);
      localStorage.setItem(`bookmarked-${sessionId}-${userId}`, JSON.stringify(bookmarkedIds));
      
    } catch (error) {
      console.error('Erro ao marcar mensagem como favorita:', error);
    }
  };
  
  // Carregar mensagens favoritas do localStorage
  useEffect(() => {
    const loadBookmarks = () => {
      try {
        const savedBookmarks = localStorage.getItem(`bookmarked-${sessionId}-${userId}`);
        if (savedBookmarks) {
          const bookmarkedIds = JSON.parse(savedBookmarks) as string[];
          const updatedMessages = messages.map(msg => ({
            ...msg,
            is_bookmarked: bookmarkedIds.includes(msg.id)
          }));
          
          setMessages(updatedMessages);
          setBookmarkedMessages(updatedMessages.filter(msg => msg.is_bookmarked));
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens favoritas:', error);
      }
    };
    
    if (messages.length > 0) {
      loadBookmarks();
    }
  }, [messages.length, sessionId, userId]);
  
  // Filtrar mensagens com base na pesquisa e data
  const filteredMessages = messages.filter(msg => {
    // Filtro de pesquisa
    const matchesSearch = !searchTerm || 
      msg.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (msg.character_name && msg.character_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      msg.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro de data
    const matchesDate = !historyDate || 
      new Date(msg.created_at).toDateString() === historyDate.toDateString();
    
    return matchesSearch && matchesDate;
  });
  
  // Mensagens a serem exibidas (todas, favoritas ou filtradas por data)
  const displayMessages = showBookmarks 
    ? bookmarkedMessages 
    : (showHistory && historyDate 
      ? filteredMessages.filter(msg => new Date(msg.created_at).toDateString() === historyDate.toDateString())
      : filteredMessages);
      
  // Agrupar mensagens por data para melhor visualização no histórico
  const groupMessagesByDate = (messages: ChatMessage[]) => {
    const groups: {[key: string]: ChatMessage[]} = {};
    
    messages.forEach(message => {
      const date = new Date(message.created_at).toLocaleDateString('pt-BR');
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    
    return groups;
  };
  
  // Mensagens agrupadas por data
  const groupedMessages = showHistory ? groupMessagesByDate(displayMessages) : null;
      
  // Mensagem informativa quando não há resultados no histórico
  const noHistoryResults = showHistory && historyDate && displayMessages.length === 0;
  
  // Estatísticas de mensagens para o histórico
  const messageStats = React.useMemo(() => {
    if (!showHistory || !displayMessages.length) return null;
    
    const stats = {
      total: displayMessages.length,
      byType: {
        text: displayMessages.filter(m => m.type === 'text').length,
        roll: displayMessages.filter(m => m.type === 'roll').length,
        emote: displayMessages.filter(m => m.type === 'emote').length,
        whisper: displayMessages.filter(m => m.type === 'whisper').length,
        system: displayMessages.filter(m => m.type === 'system').length,
      },
      byUser: {} as Record<string, {count: number, name: string, isGM: boolean}>,
      mostActive: [] as {name: string, count: number, isGM: boolean}[],
      timeRange: {
        start: new Date(displayMessages[0]?.created_at || new Date()),
        end: new Date(displayMessages[displayMessages.length - 1]?.created_at || new Date())
      }
    };
    
    // Contagem por usuário
    displayMessages.forEach(msg => {
      const name = msg.character_name || msg.username;
      const userId = msg.user_id;
      
      if (!stats.byUser[userId]) {
        stats.byUser[userId] = {
          count: 0,
          name,
          isGM: msg.is_gm
        };
      }
      
      stats.byUser[userId].count++;
    });
    
    // Ordenar usuários mais ativos
    stats.mostActive = Object.values(stats.byUser)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return stats;
  }, [showHistory, displayMessages]);
  
  
  const formatMessage = (message: ChatMessage) => {
    const isCurrentUserMessage = message.user_id === userId;
    const isWhisper = message.type === 'whisper';
    const isEmote = message.type === 'emote';
    const isRoll = message.type === 'roll';
    const isSystem = message.type === 'system';
    const isBookmarked = message.is_bookmarked;
    
    // Determinar classes de estilo com base no tipo de mensagem
    let messageClasses = 'p-3 rounded-lg mb-2 relative group ';
    
    if (isSystem) {
      messageClasses += 'bg-fantasy-purple/20 text-fantasy-gold italic text-center';
    } else if (isWhisper) {
      messageClasses += 'bg-fantasy-purple/30 text-fantasy-stone/90';
    } else if (isEmote) {
      messageClasses += 'bg-transparent text-fantasy-gold italic text-center';
    } else if (isRoll) {
      messageClasses += 'bg-fantasy-dark/80 border border-fantasy-gold/30';
    } else {
      messageClasses += isCurrentUserMessage 
        ? 'bg-fantasy-dark/80 ml-2 sm:ml-8' 
        : 'bg-fantasy-dark/50 mr-2 sm:mr-8';
    }
    
    // Adicionar borda especial para mensagens favoritas
    if (isBookmarked) {
      messageClasses += ' border-l-4 border-fantasy-gold pl-2';
    }

    return (
      <div key={message.id} className={messageClasses}>
        {/* Botão de favorito */}
        <button 
          onClick={() => toggleBookmark(message.id)}
          className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity"
          title={isBookmarked ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        >
          {isBookmarked ? (
            <BookmarkCheck size={16} className="text-fantasy-gold" />
          ) : (
            <Bookmark size={16} className="text-fantasy-stone/50 hover:text-fantasy-gold" />
          )}
        </button>
        
        {!isSystem && !isEmote && (
          <div className="flex items-center gap-2 mb-1">
            {message.avatar_url ? (
              <img 
                src={message.avatar_url} 
                alt={message.username} 
                className="w-6 h-6 rounded-full"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-fantasy-purple/50 flex items-center justify-center text-xs">
                {message.username.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-semibold text-sm">
              {message.is_gm ? '🎲 ' : ''}
              {message.character_name || message.username}
              {isWhisper && ' (sussurro)'}
            </span>
            <span className="text-xs text-fantasy-stone/70 ml-auto">
              {format(new Date(message.created_at), 'HH:mm', { locale: ptBR })}
            </span>
          </div>
        )}
        
        {isEmote ? (
          <div className="text-center">
            <span className="font-semibold">{message.character_name || message.username}</span>
            {' '}{message.content}
          </div>
        ) : isRoll && message.roll_result ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm">
                <span className="font-semibold">{message.character_name || message.username}</span> {message.content}
              </span>
            </div>
            <div className="mt-2 p-2 bg-fantasy-dark rounded border border-fantasy-gold/20">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medievalsharp">{message.roll_result.dice}</span>
                <span className={`text-lg font-bold font-medievalsharp ${message.roll_result.critical ? 'text-green-500' : message.roll_result.success === false ? 'text-red-500' : 'text-fantasy-gold'}`}>
                  {message.roll_result.total}
                </span>
              </div>
              <div className="flex flex-wrap gap-1 mt-1">
                {message.roll_result.results.map((result, index) => (
                  <span 
                    key={index} 
                    className={`inline-block w-6 h-6 text-center leading-6 text-xs rounded-full 
                      ${result === 20 && message.roll_result?.dice.includes('d20') ? 'bg-green-500 text-white' : 
                        result === 1 && message.roll_result?.dice.includes('d20') ? 'bg-red-500 text-white' : 
                        'bg-fantasy-dark/80 border border-fantasy-stone/30'}`}
                  >
                    {result}
                  </span>
                ))}
                {message.roll_result.dice.includes('+') && (
                  <span className="inline-block px-1 text-center leading-6 text-xs">
                    + {message.roll_result.total - message.roll_result.results.reduce((a, b) => a + b, 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full border border-fantasy-purple/30 rounded-md bg-fantasy-dark/30 overflow-hidden">
      <div className="p-2 bg-fantasy-dark border-b border-fantasy-purple/30 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <MessageSquare size={18} className="text-fantasy-gold" />
          <h3 className="font-medievalsharp text-fantasy-gold">Chat da Sessão</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSearch(!showSearch)}
            title="Pesquisar mensagens"
          >
            <Search size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${showBookmarks ? 'bg-fantasy-purple/30' : ''}`}
            onClick={() => setShowBookmarks(!showBookmarks)}
            title={showBookmarks ? "Mostrar todas as mensagens" : "Mostrar favoritos"}
          >
            <BookmarkCheck size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 ${showHistory ? 'bg-fantasy-purple/30' : ''}`}
            onClick={() => setShowHistory(!showHistory)}
            title="Histórico de mensagens"
          >
            <History size={16} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? "Desativar sons" : "Ativar sons"}
          >
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {/* Implementar configurações */}}
            title="Configurações"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>
      
      {showSearch && (
        <div className="p-2 border-b border-fantasy-purple/30 bg-fantasy-dark/80">
          <Input
            placeholder="Pesquisar mensagens..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-fantasy-dark/70"
          />
        </div>
      )}
      
      {showHistory && (
        <div className="p-2 border-b border-fantasy-purple/30 bg-fantasy-dark/80">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1">
              <label className="text-xs text-fantasy-stone mb-1 block">Filtrar por data</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type="date"
                    value={historyDate ? historyDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setHistoryDate(e.target.value ? new Date(e.target.value) : null)}
                    className="bg-fantasy-dark/70 w-full pr-8"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <History size={14} className="text-fantasy-stone/50" />
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Selecionar o dia anterior
                    if (historyDate) {
                      const prevDay = new Date(historyDate);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setHistoryDate(prevDay);
                    } else {
                      const today = new Date();
                      today.setDate(today.getDate() - 1);
                      setHistoryDate(today);
                    }
                  }}
                  className="h-9 px-2 bg-fantasy-dark/50"
                  title="Dia anterior"
                >
                  ←
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    // Selecionar o próximo dia
                    if (historyDate) {
                      const nextDay = new Date(historyDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      // Não permitir selecionar datas futuras
                      if (nextDay <= new Date()) {
                        setHistoryDate(nextDay);
                      }
                    } else {
                      setHistoryDate(new Date());
                    }
                  }}
                  className="h-9 px-2 bg-fantasy-dark/50"
                  title="Próximo dia"
                >
                  →
                </Button>
              </div>
            </div>
            <div className="flex items-end gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setHistoryDate(new Date())}
                className="h-9 bg-fantasy-dark/50"
              >
                Hoje
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setHistoryDate(yesterday);
                }}
                className="h-9 bg-fantasy-dark/50"
              >
                Ontem
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setHistoryDate(null);
                  setShowHistory(false);
                }}
                className="h-9 bg-fantasy-purple/20"
              >
                Fechar
              </Button>
            </div>
          </div>
          
          {historyDate && (
            <div className="mt-2 text-center">
              <p className="text-sm text-fantasy-gold font-medievalsharp">
                {format(historyDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
          )}
        </div>
      )}
      
      {showBookmarks && bookmarkedMessages.length === 0 && (
        <div className="p-6 text-center text-fantasy-stone/70 italic flex flex-col items-center justify-center gap-2">
          <BookmarkCheck size={32} className="text-fantasy-purple/50" />
          <p>Nenhuma mensagem favorita.</p>
          <p className="text-xs">Clique no ícone <Bookmark size={12} className="inline mx-1" /> em uma mensagem para salvá-la.</p>
        </div>
      )}
      
      {noHistoryResults && (
        <div className="p-6 text-center text-fantasy-stone/70 italic flex flex-col items-center justify-center gap-2">
          <History size={32} className="text-fantasy-purple/50" />
          <p>Nenhuma mensagem encontrada nesta data.</p>
          <p className="text-xs">Tente selecionar outra data ou limpe os filtros.</p>
        </div>
      )}
      
      {showHistory && historyDate && displayMessages.length > 0 && (
        <div className="p-2 border-b border-fantasy-purple/30 bg-fantasy-dark/80">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medievalsharp text-fantasy-gold">
              Histórico de {format(historyDate, 'dd/MM/yyyy', { locale: ptBR })}
            </h3>
            {messageStats && (
              <span className="text-xs text-fantasy-stone/70">
                {format(messageStats.timeRange.start, 'HH:mm', { locale: ptBR })} - {format(messageStats.timeRange.end, 'HH:mm', { locale: ptBR })}
              </span>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 text-xs text-fantasy-stone">
            <div className="bg-fantasy-dark/50 rounded-full px-3 py-1">
              <span className="font-semibold">{displayMessages.length}</span> mensagens
            </div>
            
            {messageStats && messageStats.byType.text > 0 && (
              <div className="bg-fantasy-dark/50 rounded-full px-3 py-1">
                <span className="font-semibold">{messageStats.byType.text}</span> textos
              </div>
            )}
            
            {messageStats && messageStats.byType.roll > 0 && (
              <div className="bg-fantasy-dark/50 rounded-full px-3 py-1">
                <span className="font-semibold">{messageStats.byType.roll}</span> rolagens
              </div>
            )}
            
            {messageStats && messageStats.byType.emote > 0 && (
              <div className="bg-fantasy-dark/50 rounded-full px-3 py-1">
                <span className="font-semibold">{messageStats.byType.emote}</span> emotes
              </div>
            )}
            
            {messageStats && messageStats.byType.whisper > 0 && (
              <div className="bg-fantasy-dark/50 rounded-full px-3 py-1">
                <span className="font-semibold">{messageStats.byType.whisper}</span> sussurros
              </div>
            )}
          </div>
          
          {messageStats && (
            <div className="mt-2 flex flex-wrap gap-2 text-xs text-fantasy-stone">
              {messageStats.mostActive.map(user => (
                <div key={user.name} className="bg-fantasy-dark/50 rounded-full px-3 py-1 flex items-center">
                  {user.isGM && <span className="mr-1">🎲</span>}
                  <span className="font-semibold">{user.count}</span> de {user.name}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 pb-2">
          {showHistory && groupedMessages ? (
            // Exibir mensagens agrupadas por data quando estiver no modo histórico
            Object.entries(groupedMessages).map(([date, messages]) => (
              <div key={date} className="mb-4">
                <div className="sticky top-0 z-10 bg-fantasy-dark/90 py-1 px-2 rounded-md mb-2 text-center">
                  <span className="text-xs font-semibold text-fantasy-gold">{date}</span>
                  <span className="text-xs text-fantasy-stone/70 ml-2">{messages.length} mensagens</span>
                </div>
                <div className="space-y-2">
                  {messages.map(formatMessage)}
                </div>
              </div>
            ))
          ) : (
            // Exibir mensagens normalmente
            displayMessages.map(formatMessage)
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {showDicePanel && (
        <div className="p-3 border-t border-fantasy-purple/30 bg-fantasy-dark/80">
          <div className="flex flex-wrap gap-2 mb-2">
            {diceTypes.map(dice => (
              <Button
                key={dice}
                variant={selectedDice === dice ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDice(dice)}
                className="h-8 w-12 p-0 font-medievalsharp"
              >
                {dice}
              </Button>
            ))}
          </div>
          
          <div className="flex gap-2 mb-2">
            <div className="flex-1">
              <label className="text-xs text-fantasy-stone mb-1 block">Quantidade</label>
              <Input
                type="number"
                min="1"
                max="20"
                value={diceQuantity}
                onChange={(e) => setDiceQuantity(parseInt(e.target.value) || 1)}
                className="h-8"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs text-fantasy-stone mb-1 block">Modificador</label>
              <Input
                type="number"
                value={diceModifier}
                onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                className="h-8"
              />
            </div>
            {onlineUsers.length > 0 && (
              <div className="flex-1">
                <label className="text-xs text-fantasy-stone mb-1 block">Privado para</label>
                <select
                  value={targetUser || ''}
                  onChange={(e) => setTargetUser(e.target.value || null)}
                  className="w-full h-8 rounded-md bg-fantasy-dark border border-fantasy-purple/30 text-sm"
                >
                  <option value="">Todos</option>
                  {onlineUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.is_gm ? '🎲 ' : ''}{user.character_name || user.username}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
          
          <div className="flex justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDicePanel(false)}
            >
              Cancelar
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={rollDice}
              className="bg-fantasy-gold hover:bg-fantasy-gold/80 text-black"
            >
              Rolar {diceQuantity}{selectedDice}{diceModifier !== 0 ? (diceModifier > 0 ? `+${diceModifier}` : diceModifier) : ''}
            </Button>
          </div>
        </div>
      )}
      
      <div className="p-2 border-t border-fantasy-purple/30 bg-fantasy-dark/50">
        <div className="flex flex-wrap gap-1 mb-1">
          <Button
            variant={messageType === 'text' ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType('text')}
            className="h-7 px-2 text-xs flex-grow sm:flex-grow-0"
          >
            Falar
          </Button>
          <Button
            variant={messageType === 'emote' ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType('emote')}
            className="h-7 px-2 text-xs flex-grow sm:flex-grow-0"
          >
            Emote
          </Button>
          <Button
            variant={messageType === 'whisper' ? "default" : "outline"}
            size="sm"
            onClick={() => setMessageType('whisper')}
            className="h-7 px-2 text-xs flex-grow sm:flex-grow-0"
          >
            Sussurrar
          </Button>
          
          {messageType === 'whisper' && (
            <select
              value={targetUser || ''}
              onChange={(e) => setTargetUser(e.target.value || null)}
              className="h-7 rounded-md bg-fantasy-dark border border-fantasy-purple/30 text-xs ml-1 flex-grow"
            >
              <option value="" disabled>Selecione</option>
              {onlineUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.is_gm ? '🎲 ' : ''}{user.character_name || user.username}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="flex gap-2">
          <Textarea
            placeholder={messageType === 'emote' ? "* ajusta sua armadura *" : 
                       messageType === 'whisper' ? "Sussurrar para..." : 
                       "Digite sua mensagem..."}
            value={messageInput}
            onChange={(e) => {
              setMessageInput(e.target.value);
              setIsTyping(e.target.value.length > 0);
            }}
            onKeyDown={handleKeyPress}
            className="min-h-[60px] max-h-[120px] resize-none bg-fantasy-dark/70"
          />
          <div className="flex flex-col gap-1 sm:w-auto">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowDicePanel(!showDicePanel)}
              className="h-8 w-8 bg-fantasy-dark/50 hover:bg-fantasy-dark"
              title="Rolar dados"
            >
              <Dice size={16} />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 bg-fantasy-dark/50 hover:bg-fantasy-dark"
                  title="Emojis"
                >
                  <Smile size={16} />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[90vw] max-w-[320px] sm:w-80 p-2" align="end">
                <Tabs defaultValue={rpgEmojiCategories[0].name} className="w-full">
                  <TabsList className="grid grid-cols-7 mb-2">
                    {rpgEmojiCategories.map(category => (
                      <TabsTrigger 
                        key={category.name} 
                        value={category.name}
                        className="text-xs py-1 px-2"
                      >
                        {category.name}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  
                  {rpgEmojiCategories.map(category => (
                    <TabsContent key={category.name} value={category.name}>
                      <div className="grid grid-cols-5 gap-1 sm:grid-cols-8">
                        {category.emojis.map(emoji => (
                          <button
                            key={emoji}
                            onClick={() => setMessageInput(prev => prev + emoji)}
                            className="h-8 w-8 flex items-center justify-center hover:bg-fantasy-dark/50 rounded text-xl"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
                
                <div className="mt-2 pt-2 border-t border-fantasy-purple/30">
                  <p className="text-xs text-fantasy-stone mb-1">Comandos de rolagem:</p>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      onClick={() => setMessageInput('/roll 1d20')}
                      className="text-xs p-1 hover:bg-fantasy-dark/50 rounded text-left"
                    >
                      /roll 1d20
                    </button>
                    <button
                      onClick={() => setMessageInput('/roll 2d6')}
                      className="text-xs p-1 hover:bg-fantasy-dark/50 rounded text-left"
                    >
                      /roll 2d6
                    </button>
                    <button
                      onClick={() => setMessageInput('/roll 1d20+5')}
                      className="text-xs p-1 hover:bg-fantasy-dark/50 rounded text-left"
                    >
                      /roll 1d20+5
                    </button>
                    <button
                      onClick={() => setMessageInput('/roll 3d8-2')}
                      className="text-xs p-1 hover:bg-fantasy-dark/50 rounded text-left"
                    >
                      /roll 3d8-2
                    </button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            <Button
              variant="default"
              size="icon"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
              className="h-8 w-8 bg-fantasy-gold hover:bg-fantasy-gold/80 text-black"
            >
              <Send size={16} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedChatPanel;