
import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { useNotificationContext, Notification } from '@/contexts/NotificationContext';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const NotificationBell = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, deleteNotification } = useNotificationContext();
  const [open, setOpen] = useState(false);

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navegar para referência se necessário
    if (notification.reference_id && notification.reference_type) {
      // Implementação futura para navegação baseada no tipo de referência
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <Bell className="h-5 w-5 text-fantasy-stone" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 bg-red-500 text-white rounded-full text-xs w-4 h-4 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="bg-fantasy-dark border-b border-fantasy-purple/30 p-3 flex justify-between items-center">
          <h3 className="font-medievalsharp text-fantasy-gold">Notificações</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-fantasy-stone">
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <ScrollArea className="h-[300px] p-0">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-fantasy-stone">Carregando...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex justify-center items-center h-full">
              <p className="text-fantasy-stone">Nenhuma notificação</p>
            </div>
          ) : (
            <ul className="divide-y divide-fantasy-purple/20">
              {notifications.map((notification) => (
                <li 
                  key={notification.id}
                  className={`p-3 cursor-pointer hover:bg-fantasy-dark/50 transition-colors ${
                    !notification.read ? 'bg-fantasy-purple/10' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start">
                    <h4 className={`text-sm font-semibold ${!notification.read ? 'text-white' : 'text-fantasy-stone'}`}>
                      {notification.title}
                    </h4>
                    <div className="flex items-center">
                      <span className="text-xs text-fantasy-stone/70">
                        {format(new Date(notification.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 h-6 w-6 p-0 text-fantasy-stone/70 hover:text-red-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        &times;
                      </Button>
                    </div>
                  </div>
                  {notification.content && (
                    <p className="text-xs text-fantasy-stone mt-1">{notification.content}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
