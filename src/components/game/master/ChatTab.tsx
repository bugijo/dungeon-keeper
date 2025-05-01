
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface ChatTabProps {
  sessionId?: string;
  userId?: string;
  messages?: { sender: string; text: string; }[];
  newMessage?: string;
  setNewMessage?: React.Dispatch<React.SetStateAction<string>>;
  sendMessage?: (e: React.FormEvent) => void;
}

interface ChatMessage {
  id: string;
  content: string;
  user_id: string;
  type: string;
  created_at: string;
  sender_name?: string;
}

const ChatTab: React.FC<ChatTabProps> = ({ 
  sessionId,
  userId
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  
  useEffect(() => {
    const fetchMessages = async () => {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        
        // Fetch chat messages
        const { data: messagesData, error: messagesError } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('table_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(50);
          
        if (messagesError) throw messagesError;
        
        // Fetch profiles for user_ids
        if (messagesData && messagesData.length > 0) {
          const userIds = [...new Set(messagesData.map(msg => msg.user_id))];
          
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, display_name')
            .in('id', userIds);
            
          if (profilesError) throw profilesError;
          
          const profilesMap: Record<string, string> = {};
          if (profilesData) {
            profilesData.forEach(profile => {
              profilesMap[profile.id] = profile.display_name || 'Usuário';
            });
          }
          
          setProfiles(profilesMap);
          
          // Add sender names to messages
          const enrichedMessages = messagesData.map(msg => ({
            ...msg,
            sender_name: profilesMap[msg.user_id] || 'Usuário'
          }));
          
          setMessages(enrichedMessages);
        } else {
          setMessages([]);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
        toast.error('Erro ao carregar mensagens do chat');
      } finally {
        setLoading(false);
      }
    };
    
    fetchMessages();
    
    // Listen for new messages
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
        async (payload) => {
          const msg = payload.new as ChatMessage;
          
          // Fetch sender name if not in profiles
          if (!profiles[msg.user_id]) {
            try {
              const { data, error } = await supabase
                .from('profiles')
                .select('display_name')
                .eq('id', msg.user_id)
                .single();
                
              if (!error && data) {
                setProfiles(prev => ({
                  ...prev,
                  [msg.user_id]: data.display_name || 'Usuário'
                }));
                
                msg.sender_name = data.display_name || 'Usuário';
              }
            } catch (e) {
              console.error('Erro ao buscar nome do usuário:', e);
              msg.sender_name = 'Usuário';
            }
          } else {
            msg.sender_name = profiles[msg.user_id];
          }
          
          setMessages(prev => [...prev, msg]);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  const sendMessage = async (isPrivate = false) => {
    if (!newMessage.trim() || !sessionId || !userId) return;
    
    try {
      const messageType = isPrivate ? 'private' : 'text';
      
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          table_id: sessionId,
          user_id: userId,
          content: newMessage,
          type: messageType,
          metadata: isPrivate ? { dm: true } : {}
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      toast.error('Erro ao enviar mensagem');
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    return formatDistance(new Date(timestamp), new Date(), {
      addSuffix: true,
      locale: ptBR
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">Chat do Mestre</h3>
      <p className="text-fantasy-stone text-sm mb-4">
        Canal de comunicação com os jogadores. Mensagens privadas são vistas apenas pelo destinatário.
      </p>
      
      <ScrollArea className="flex-1 border border-fantasy-purple/30 rounded-md mb-4 p-2 bg-fantasy-dark/30">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse text-fantasy-stone">Carregando mensagens...</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-fantasy-stone/70 py-8">
            Nenhuma mensagem ainda. Envie a primeira!
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className={`rounded-lg p-2 ${
                  msg.user_id === userId
                    ? 'bg-fantasy-purple/30 ml-4'
                    : 'bg-fantasy-dark/50 mr-4'
                }`}
              >
                <div className="flex justify-between items-baseline mb-1">
                  <span className={`font-medium text-sm ${msg.type === 'private' ? 'text-yellow-400' : 'text-fantasy-gold'}`}>
                    {msg.sender_name || 'Usuário'} 
                    {msg.type === 'private' && " (Privado)"}
                    {msg.type === 'dice' && " (Dado)"}
                  </span>
                  <span className="text-xs text-fantasy-stone/70">
                    {formatMessageTime(msg.created_at)}
                  </span>
                </div>
                <p className="text-fantasy-stone whitespace-pre-wrap break-words">
                  {msg.content}
                </p>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <div className="mt-auto">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem aqui..."
          className="w-full p-3 rounded-md bg-fantasy-dark border border-fantasy-purple/30 text-white resize-none h-20 focus:outline-none focus:ring-1 focus:ring-fantasy-purple"
        />
        
        <div className="flex justify-between mt-2 gap-2">
          <Button
            variant="outline"
            onClick={() => sendMessage(true)}
            className="flex-1"
            disabled={!newMessage.trim()}
          >
            Mensagem Privada
          </Button>
          <Button
            onClick={() => sendMessage(false)}
            className="flex-1 fantasy-button primary"
            disabled={!newMessage.trim()}
          >
            Enviar para Todos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatTab;
