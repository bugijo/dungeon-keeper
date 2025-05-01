
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface Notification {
  id: string;
  title: string;
  content: string | null;
  type: 'table_request' | 'session_update' | 'message' | 'system';
  reference_id: string | null;
  reference_type: string | null;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Ensure that the data is properly typed as Notification[]
        const typedData = data.map(item => ({
          ...item,
          type: item.type as 'table_request' | 'session_update' | 'message' | 'system'
        }));

        setNotifications(typedData);
        setUnreadCount(typedData.filter(n => !n.read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
        toast.error('Erro ao carregar notificações');
      } finally {
        setLoading(false);
      }
    };

    // Carregar notificações iniciais
    fetchNotifications();

    // Inscrever-se para atualizações em tempo real
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const newNotification = {
          ...payload.new,
          type: payload.new.type as 'table_request' | 'session_update' | 'message' | 'system'
        } as Notification;
        
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Tocar som de notificação
        const audio = new Audio('/notification-sound.mp3');
        audio.play().catch(e => console.error('Error playing notification sound:', e));
        
        // Mostrar toast para nova notificação
        toast.info(newNotification.title, {
          description: newNotification.content
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Erro ao marcar notificação como lida');
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Erro ao marcar todas notificações como lidas');
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => 
        notifications.find(n => n.id === notificationId)?.read ? prev : prev - 1
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
      toast.error('Erro ao excluir notificação');
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };
}
