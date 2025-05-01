import React, { useState, useEffect } from 'react';
import { Bell, X, Check, AlertCircle, MessageSquare, Calendar, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error' | 'message' | 'event' | 'request';
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationSystemProps {
  className?: string;
  onNotificationClick?: (notification: Notification) => void;
  onMarkAllAsRead?: () => void;
  maxNotifications?: number;
}

/**
 * Sistema de Notificações em Tempo Real
 * Exibe notificações para eventos importantes como mensagens, solicitações de mesa e eventos
 */
export function NotificationSystem({
  className,
  onNotificationClick,
  onMarkAllAsRead,
  maxNotifications = 5,
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Simulação de notificações para demonstração
  useEffect(() => {
    // Em um ambiente real, isso seria substituído por uma conexão com o Supabase Realtime
    const demoNotifications: Notification[] = [
      {
        id: '1',
        title: 'Nova solicitação de mesa',
        message: 'João Silva deseja participar da sua mesa "Caverna do Dragão"',
        type: 'request',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutos atrás
        read: false,
        sender: {
          id: 'user-1',
          name: 'João Silva',
          avatar: '/avatars/user1.jpg'
        }
      },
      {
        id: '2',
        title: 'Sessão agendada',
        message: 'Sua próxima sessão de "Caverna do Dragão" começa em 1 hora',
        type: 'event',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutos atrás
        read: false
      },
      {
        id: '3',
        title: 'Nova mensagem',
        message: 'Maria enviou uma mensagem: "Vou me atrasar 10 minutos para a sessão"',
        type: 'message',
        timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hora atrás
        read: true,
        sender: {
          id: 'user-2',
          name: 'Maria Oliveira',
          avatar: '/avatars/user2.jpg'
        }
      }
    ];

    setNotifications(demoNotifications);
    setUnreadCount(demoNotifications.filter(n => !n.read).length);
  }, []);

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    const updatedNotifications = notifications.map(n => 
      n.id === notification.id ? { ...n, read: true } : n
    );
    
    setNotifications(updatedNotifications);
    setUnreadCount(updatedNotifications.filter(n => !n.read).length);
    
    if (onNotificationClick) {
      onNotificationClick(notification);
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = () => {
    const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updatedNotifications);
    setUnreadCount(0);
    
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    }
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <AlertCircle className="h-5 w-5 text-blue-400" />;
      case 'success':
        return <Check className="h-5 w-5 text-green-400" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-purple-400" />;
      case 'event':
        return <Calendar className="h-5 w-5 text-indigo-400" />;
      case 'request':
        return <Users className="h-5 w-5 text-amber-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return `${diffDays} dias atrás`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={cn('relative', className)}>
      {/* Botão de notificações */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-amber-950/80 border-amber-800 hover:bg-amber-900 text-amber-200 rounded-full w-10 h-10"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
            {unreadCount}
          </span>
        )}
      </Button>

      {/* Painel de notificações */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 rounded-lg border-2 border-amber-800/70 bg-amber-950/90 backdrop-blur-sm shadow-lg overflow-hidden z-50">
          <div className="flex items-center justify-between p-3 border-b border-amber-800/50">
            <h3 className="font-medievalsharp text-amber-200 text-lg">Notificações</h3>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-amber-800 scrollbar-track-amber-950/20">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-amber-200/70">
                <p>Nenhuma notificação</p>
              </div>
            ) : (
              <div className="divide-y divide-amber-800/30">
                {notifications.slice(0, maxNotifications).map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'p-3 hover:bg-amber-900/30 cursor-pointer transition-colors',
                      !notification.read && 'bg-amber-900/20'
                    )}
                  >
                    <div className="flex gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medievalsharp text-amber-200 truncate">
                          {notification.title}
                        </p>
                        <p className="text-xs text-amber-200/70 mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-amber-500/70 mt-1">
                          {formatTimestamp(notification.timestamp)}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className="flex-shrink-0">
                          <div className="h-2 w-2 rounded-full bg-amber-500"></div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {notifications.length > maxNotifications && (
              <div className="p-2 text-center border-t border-amber-800/30">
                <button className="text-xs text-amber-400 hover:text-amber-300 transition-colors">
                  Ver todas ({notifications.length})
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}