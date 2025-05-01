
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Notification, useNotifications } from '@/hooks/useNotifications';
import { Spinner } from '@/components/ui/spinner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const NotificationsDropdown = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const getTimeAgo = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ptBR
      });
    } catch (error) {
      return 'data desconhecida';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'table_request':
        return <div className="w-2 h-2 rounded-full bg-blue-500"></div>;
      case 'session_update':
        return <div className="w-2 h-2 rounded-full bg-green-500"></div>;
      case 'message':
        return <div className="w-2 h-2 rounded-full bg-amber-500"></div>;
      default:
        return <div className="w-2 h-2 rounded-full bg-purple-500"></div>;
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    await markAsRead(notification.id);
    
    // Navegar para o destino relevante com base no tipo de referência
    if (notification.reference_type === 'table' && notification.reference_id) {
      window.location.href = `/table/${notification.reference_id}`;
    } else if (notification.reference_type === 'session' && notification.reference_id) {
      window.location.href = `/session/${notification.reference_id}`;
    }
    
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell size={20} />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 bg-fantasy-dark border-fantasy-purple/30" 
        align="end"
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="font-medievalsharp text-fantasy-gold">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={markAllAsRead}
              className="text-xs text-fantasy-stone hover:text-white"
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <ScrollArea className="h-80">
          {loading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-2 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-2 w-1/3" />
                </div>
              ))}
            </div>
          ) : notifications.length > 0 ? (
            <div className="space-y-2">
              {notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`p-2 rounded-md cursor-pointer hover:bg-fantasy-purple/10 transition-colors ${!notification.read ? 'bg-fantasy-purple/5' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1.5">
                      {getTypeIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm ${!notification.read ? 'font-semibold text-white' : 'text-fantasy-stone'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-fantasy-stone/80 mt-0.5">
                        {notification.content}
                      </p>
                      <p className="text-xxs text-fantasy-stone/60 mt-1">
                        {getTimeAgo(notification.created_at)}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-fantasy-stone/60">
              <p>Nenhuma notificação</p>
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;
