
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { SendHorizonal, User } from 'lucide-react';
import { SessionParticipant, SessionMessage } from '@/types/session';
import { toast } from 'sonner';

interface ChatPanelProps {
  sessionId: string;
  userId: string;
  participants: SessionParticipant[];
  isPaused: boolean;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ 
  sessionId, 
  userId, 
  participants,
  isPaused
}) => {
  const [messages, setMessages] = useState<SessionMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data, error } = await supabase
          .from('chat_messages')
          .select('*')
          .eq('table_id', sessionId)
          .order('created_at', { ascending: true })
          .limit(50);
        
        if (error) throw error;
        
        if (data) {
          // Convert chat_messages to SessionMessage format
          const formattedMessages: SessionMessage[] = data.map(msg => ({
            id: msg.id,
            session_id: msg.table_id,
            user_id: msg.user_id,
            content: msg.content,
            type: msg.type as 'text' | 'dice' | 'system' | 'whisper',
            metadata: msg.metadata,
            created_at: msg.created_at
          }));
          
          setMessages(formattedMessages);
          setTimeout(() => scrollToBottom(), 100);
        }
      } catch (error) {
        console.error('Error loading chat messages:', error);
      }
    };
    
    if (sessionId) {
      loadMessages();
    }
    
    // Subscribe to new messages
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
          const newMessage = payload.new as any;
          
          // Convert to SessionMessage format
          const sessionMessage: SessionMessage = {
            id: newMessage.id,
            session_id: newMessage.table_id,
            user_id: newMessage.user_id,
            content: newMessage.content,
            type: newMessage.type as 'text' | 'dice' | 'system' | 'whisper',
            metadata: newMessage.metadata,
            created_at: newMessage.created_at
          };
          
          setMessages(prev => [...prev, sessionMessage]);
          setTimeout(() => scrollToBottom(), 100);
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId]);
  
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    if (isPaused) {
      toast.error('Session is paused. Messages cannot be sent.');
      return;
    }
    
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
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    }
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const getParticipantName = (id: string) => {
    const participant = participants.find(p => p.user_id === id);
    return participant?.display_name || participant?.character_name || 'Unknown';
  };
  
  const getParticipantColor = (id: string) => {
    const participant = participants.find(p => p.user_id === id);
    return participant?.role === 'gm' ? 'text-fantasy-gold' : 'text-fantasy-stone';
  };
  
  return (
    <div className="w-64 bg-fantasy-dark border-l border-fantasy-purple/30 flex flex-col">
      <div className="p-3 border-b border-fantasy-purple/30">
        <h2 className="text-fantasy-gold font-medievalsharp">Session Chat</h2>
      </div>
      
      <ScrollArea className="flex-1 p-3">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-fantasy-stone text-sm py-4">
              No messages yet. Start the conversation!
            </div>
          )}
          
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`${message.user_id === userId ? 'ml-4' : 'mr-4'}`}
            >
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-fantasy-purple/30 flex items-center justify-center flex-shrink-0 mt-1">
                  <User size={12} className="text-fantasy-stone" />
                </div>
                
                <div>
                  <div className={`text-xs mb-1 font-medium ${getParticipantColor(message.user_id)}`}>
                    {getParticipantName(message.user_id)}
                  </div>
                  
                  <div className={`text-sm p-2 rounded-lg ${
                    message.user_id === userId 
                      ? 'bg-fantasy-purple/20 text-white' 
                      : 'bg-fantasy-dark-light/40 text-fantasy-stone'
                  }`}>
                    {message.content}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      <form 
        onSubmit={sendMessage}
        className="p-3 border-t border-fantasy-purple/30 flex gap-2"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isPaused ? "Session is paused..." : "Type a message..."}
          disabled={isPaused}
          className="flex-1 bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white text-sm"
        />
        
        <Button 
          type="submit" 
          size="icon"
          disabled={isPaused}
        >
          <SendHorizonal size={18} />
        </Button>
      </form>
    </div>
  );
};

export default ChatPanel;
