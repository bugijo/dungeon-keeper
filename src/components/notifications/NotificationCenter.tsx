import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { format, formatDistance } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface NotificationCenterProps {
  userId: string;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ userId }) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification,
    refreshNotifications
  } = useNotificationContext();
  
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'todas' | 'não-lidas'>('todas');
  
  // Atualizar notificações quando o popover for aberto
  useEffect(() => {
    if (open) {
      refreshNotifications();
    }
  }, [open, refreshNotifications]);
  
  // Filtrar notificações com base na aba ativa
  const filteredNotifications = activeTab === 'todas' 
    ? notifications 
    : notifications.filter(notification => !notification.read);
  
  // Agrupar notificações por tipo
  const groupedNotifications = filteredNotifications.reduce((groups, notification) => {
    const type = notification.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(notification);
    return groups;
  }, {} as Record<string, typeof notifications>);
  
  // Tradução dos tipos de notificação
  const typeTranslations: Record<string, string> = {
    'table_request': 'Solicitações de Mesa',
    'session_update': 'Atualizações de Sessão',
    'message': 'Mensagens',
    'system': 'Sistema',
    'fog_update': 'Atualizações de Mapa',
    'audio_update': 'Atualizações de Áudio'
  };
  
  // Ícones para cada tipo de notificação
  const typeIcons: Record<string, React.ReactNode> = {
    'table_request': <div className="w-2 h-2 rounded-full bg-blue-500"></div>,
    'session_update': <div className="w-2 h-2 rounded-full bg-green-500"></div>,
    'message': <div className="w-2 h-2 rounded-full bg-yellow-500"></div>,
    'system': <div className="w-2 h-2 rounded-full bg-purple-500"></div>,
    'fog_update': <div className="w-2 h-2 rounded-full bg-indigo-500"></div>,
    'audio_update': <div className="w-2 h-2 rounded-full bg-pink-500"></div>
  };
  
  // Formatar data da notificação
  const formatNotificationTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
    
    if (diffInHours < 24) {
      return formatDistance(date, now, { addSuffix: true, locale: ptBR });
    } else {
      return format(date, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR });
    }
  };
  
  // Renderizar conteúdo da notificação com base no tipo
  const renderNotificationContent = (notification: typeof notifications[0]) => {
    switch (notification.type) {
      case 'message':
        return (
          <div>
            <div className="font-medium">{notification.title}</div>
            <p className="text-sm text-fantasy-stone/80">
              {notification.sender_name && (
                <span className="font-medium">{notification.sender_name}: </span>
              )}
              {notification.content}
            </p>
          </div>
        );
      case 'table_request':
        return (
          <div>
            <div className="font-medium">{notification.title}</div>
            <p className="text-sm text-fantasy-stone/80">{notification.content}</p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-green-500/20 hover:bg-green-500/30 border-green-500/50"
                onClick={() => {
                  // Implementar ação de aceitar solicitação
                  markAsRead(notification.id);
                }}
              >
                <Check size={12} className="mr-1" /> Aceitar
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-7 px-2 text-xs bg-red-500/20 hover:bg-red-500/30 border-red-500/50"
                onClick={() => {
                  // Implementar ação de recusar solicitação
                  markAsRead(notification.id);
                }}
              >
                <X size={12} className="mr-1" /> Recusar
              </Button>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <div className="font-medium">{notification.title}</div>
            <p className="text-sm text-fantasy-stone/80">{notification.content}</p>
          </div>
        );
    }
  };
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="relative text-fantasy-stone hover:text-fantasy-gold"
        >
          {unreadCount > 0 ? <Bell size={20} /> : <BellOff size={20} />}
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 px-1 min-w-[18px] h-[18px] text-[10px] bg-fantasy-gold text-fantasy-dark"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-fantasy-dark border-fantasy-purple/30" 
        align="end"
      >
        <div className="flex items-center justify-between p-4 border-b border-fantasy-purple/20">
          <h3 className="font-medievalsharp text-fantasy-gold">Notificações</h3>
          {unreadCount > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs text-fantasy-stone hover:text-fantasy-gold"
              onClick={markAllAsRead}
            >
              Marcar todas como lidas
            </Button>
          )}
        </div>
        
        <Tabs defaultValue="todas" value={activeTab} onValueChange={(v) => setActiveTab(v as 'todas' | 'não-lidas')}>
          <div className="px-4 pt-2">
            <TabsList className="w-full">
              <TabsTrigger value="todas" className="flex-1">Todas</TabsTrigger>
              <TabsTrigger value="não-lidas" className="flex-1">
                Não lidas {unreadCount > 0 && `(${unreadCount})`}
              </TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="todas" className="mt-0">
            <ScrollArea className="h-[300px] px-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-pulse text-fantasy-stone">Carregando notificações...</div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center text-fantasy-stone/70 py-8">
                  Nenhuma notificação encontrada.
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <div key={type}>
                      <h4 className="text-xs font-medium text-fantasy-stone/70 mb-2 flex items-center gap-2">
                        {typeIcons[type]}
                        {typeTranslations[type] || type}
                      </h4>
                      <div className="space-y-2">
                        {typeNotifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className={`relative p-3 rounded-md ${notification.read ? 'bg-fantasy-dark/30' : 'bg-fantasy-purple/10 border-l-2 border-fantasy-gold'}`}
                          >
                            <div className="flex justify-between items-start">
                              {renderNotificationContent(notification)}
                              
                              <div className="flex flex-col items-end ml-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-fantasy-stone/50 hover:text-fantasy-stone"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                                
                                <span className="text-[10px] text-fantasy-stone/50 mt-1">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                              </div>
                            </div>
                            
                            {!notification.read && (
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="absolute bottom-1 right-1 h-6 text-[10px] text-fantasy-stone/50 hover:text-fantasy-stone"
                                onClick={() => markAsRead(notification.id)}
                              >
                                Marcar como lida
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="não-lidas" className="mt-0">
            <ScrollArea className="h-[300px] px-4">
              {loading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-pulse text-fantasy-stone">Carregando notificações...</div>
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center text-fantasy-stone/70 py-8">
                  Nenhuma notificação não lida.
                </div>
              ) : (
                <div className="space-y-4 py-2">
                  {Object.entries(groupedNotifications).map(([type, typeNotifications]) => (
                    <div key={type}>
                      <h4 className="text-xs font-medium text-fantasy-stone/70 mb-2 flex items-center gap-2">
                        {typeIcons[type]}
                        {typeTranslations[type] || type}
                      </h4>
                      <div className="space-y-2">
                        {typeNotifications.map(notification => (
                          <div 
                            key={notification.id} 
                            className="relative p-3 rounded-md bg-fantasy-purple/10 border-l-2 border-fantasy-gold"
                          >
                            <div className="flex justify-between items-start">
                              {renderNotificationContent(notification)}
                              
                              <div className="flex flex-col items-end ml-2">
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-fantasy-stone/50 hover:text-fantasy-stone"
                                  onClick={() => deleteNotification(notification.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                                
                                <span className="text-[10px] text-fantasy-stone/50 mt-1">
                                  {formatNotificationTime(notification.created_at)}
                                </span>
                              </div>
                            </div>
                            
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="absolute bottom-1 right-1 h-6 text-[10px] text-fantasy-stone/50 hover:text-fantasy-stone"
                              onClick={() => markAsRead(notification.id)}
                            >
                              Marcar como lida
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationCenter;