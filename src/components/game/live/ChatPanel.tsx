
import React, { useState, useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, Send } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ChatPanelProps {
  sessionId: string;
  userId: string;
  participants: any[];
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  type: string;
  created_at: string;
  metadata?: any;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ sessionId, userId, participants }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userProfiles, setUserProfiles] = useState<Record<string, string>>({});

  // Carregar mensagens anteriores
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('table_id', sessionId)
          .order('created_at', { ascending: true });
          
        if (error) throw error;
        setMessages(data || []);
        
        // Criar mapa de IDs de usuário para nomes de exibição
        const profiles: Record<string, string> = {};
        participants.forEach(participant => {
          if (participant.profiles?.display_name) {
            profiles[participant.user_id] = participant.profiles.display_name;
          }
        });
        setUserProfiles(profiles);
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        toast.error('Erro ao carregar mensagens do chat');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Configurar assinatura em tempo real
    const channel = supabase
      .channel('chat_messages_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `table_id=eq.${sessionId}`
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, participants]);
  
  // Rolagem automática para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          table_id: sessionId,
          user_id: userId,
          content: newMessage,
          type: 'text'
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };
  
  const getDisplayName = (userId: string) => {
    return userProfiles[userId] || "Jogador";
  };
  
  const formatMessageTime = (timestamp: string) => {
    return formatDistance(new Date(timestamp), new Date(), {
      addSuffix: true,
      locale: ptBR
    });
  };
  
  return (
    <div className="w-80 flex flex-col h-full border-l border-fantasy-purple/30 bg-fantasy-dark/50">
      <div className="p-3 border-b border-fantasy-purple/30 bg-fantasy-dark flex items-center">
        <MessageSquare size={18} className="text-fantasy-gold mr-2" />
        <h3 className="text-white font-medievalsharp">Chat da Sessão</h3>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-pulse text-fantasy-stone">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-fantasy-stone p-4">
            Nenhuma mensagem ainda. Seja o primeiro a enviar!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(message => (
              <div 
                key={message.id}
                className={`rounded-lg p-2 ${
                  message.user_id === userId
                    ? 'bg-fantasy-purple/30 ml-4'
                    : 'bg-fantasy-dark/50 mr-4'
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`font-medium text-sm ${message.type === 'dice' ? 'text-fantasy-gold' : 'text-fantasy-gold'}`}>
                    {getDisplayName(message.user_id)}
                    {message.type === 'dice' && " (Dado)"}
                  </span>
                  <span className="text-xs text-fantasy-stone/70">
                    {formatMessageTime(message.created_at)}
                  </span>
                </div>
                
                <p className="text-fantasy-stone whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                
                {message.type === 'dice' && message.metadata && (
                  <div className="mt-1 p-1 bg-fantasy-dark/30 rounded text-center">
                    <span className="font-bold text-fantasy-gold">
                      {message.metadata.result}
                    </span>
                    <span className="text-xs text-fantasy-stone ml-1">
                      ({message.metadata.dice_type})
                    </span>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
      
      <div className="p-3 border-t border-fantasy-purple/30">
        <div className="flex gap-2">
          <textarea
            className="flex-1 bg-fantasy-dark/60 rounded p-2 text-white resize-none h-20 focus:outline-none focus:ring-1 focus:ring-fantasy-purple"
            placeholder="Digite sua mensagem..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          
          <Button
            className="self-end fantasy-button primary p-2"
            onClick={sendMessage}
            disabled={!newMessage.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
