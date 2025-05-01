import React, { useState, useEffect } from 'react';
import { Bell, BellRing, X, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useRouter } from 'next/router';

interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: string;
  reference_id?: string;
  reference_type?: string;
  created_at: string;
  read: boolean;
}

interface NotificationPreferences {
  enableSounds: boolean;
  soundVolume: number;
  enableToasts: boolean;
  notificationTypes: {
    message: boolean;
    combat: boolean;
    quest: boolean;
    fog_update: boolean;
    system: boolean;
  };
}

const defaultPreferences: NotificationPreferences = {
  enableSounds: true,
  soundVolume: 0.5,
  enableToasts: true,
  notificationTypes: {
    message: true,
    combat: true,
    quest: true,
    fog_update: true,
    system: true,
  },
};

interface RealTimeNotificationsProps {
  userId: string;
  sessionId?: string;
  gameId?: string;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({
  userId,
  sessionId,
  gameId
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(defaultPreferences);
  const { sendNotification } = useNotificationContext();
  const { user } = useAuth();
  const router = useRouter();

  // Carregar notificações existentes e preferências do usuário
  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    
    const fetchData = async () => {
      try {
        // Carregar notificações
        const { data: notificationsData, error: notificationsError } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50);

        if (notificationsError) throw notificationsError;

        if (notificationsData && isMounted) {
          // Filtrar notificações inválidas
          const validNotifications = notificationsData.filter(n => 
            n && typeof n === 'object' && n.id && n.title && n.type
          );
          
          setNotifications(validNotifications);
          setUnreadCount(validNotifications.filter(n => !n.read).length);
        }
        
        // Carregar preferências de notificação
        const { data: preferencesData, error: preferencesError } = await supabase
          .from('user_preferences')
          .select('notification_preferences')
          .eq('user_id', userId)
          .single();
        
        if (preferencesError && preferencesError.code !== 'PGRST116') { // PGRST116 é o código para "não encontrado"
          throw preferencesError;
        }
        
        if (preferencesData?.notification_preferences && isMounted) {
          try {
            const userPrefs = preferencesData.notification_preferences as NotificationPreferences;
            
            // Garantir que todas as propriedades necessárias existam
            const validatedPrefs: NotificationPreferences = {
              enableSounds: userPrefs.enableSounds ?? defaultPreferences.enableSounds,
              soundVolume: userPrefs.soundVolume ?? defaultPreferences.soundVolume,
              enableToasts: userPrefs.enableToasts ?? defaultPreferences.enableToasts,
              notificationTypes: {
                message: userPrefs.notificationTypes?.message ?? defaultPreferences.notificationTypes.message,
                combat: userPrefs.notificationTypes?.combat ?? defaultPreferences.notificationTypes.combat,
                quest: userPrefs.notificationTypes?.quest ?? defaultPreferences.notificationTypes.quest,
                fog_update: userPrefs.notificationTypes?.fog_update ?? defaultPreferences.notificationTypes.fog_update,
                system: userPrefs.notificationTypes?.system ?? defaultPreferences.notificationTypes.system,
              }
            };
            
            setPreferences(validatedPrefs);
          } catch (prefError) {
            console.error('Erro ao processar preferências:', prefError);
            // Usar preferências padrão em caso de erro
            setPreferences(defaultPreferences);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Não foi possível carregar suas notificações');
      }
    };

    fetchData();
    
    // Configurar um intervalo para atualizar as notificações periodicamente
    const refreshInterval = setInterval(() => {
      if (isMounted) fetchData();
    }, 5 * 60 * 1000); // Atualizar a cada 5 minutos
    
    return () => {
      isMounted = false;
      clearInterval(refreshInterval);
    };
  }, [userId]);

  // Configurar canal de tempo real para notificações
  useEffect(() => {
    if (!userId) return;

    // Canal para notificações pessoais
    const personalChannel = supabase
      .channel(`notifications-${userId}`)
      .on('broadcast', { event: 'notification' }, (payload) => {
        try {
          const newNotification = payload.payload as Notification;
          handleNewNotification(newNotification);
        } catch (error) {
          console.error('Erro ao processar notificação pessoal:', error);
        }
      })
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') {
          console.warn(`Status do canal de notificações pessoais: ${status}`);
        }
      });

    // Canal para notificações da sessão (se estiver em uma sessão)
    let sessionChannel;
    if (sessionId) {
      sessionChannel = supabase
        .channel(`session-${sessionId}`)
        .on('broadcast', { event: 'session_notification' }, (payload) => {
          try {
            const newNotification = payload.payload as Notification;
            // Garantir que a notificação seja relevante para o usuário atual
            if (!newNotification.user_id || newNotification.user_id === userId) {
              handleNewNotification(newNotification);
            }
          } catch (error) {
            console.error('Erro ao processar notificação de sessão:', error);
          }
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn(`Status do canal de notificações da sessão: ${status}`);
          }
        });
    }

    // Canal para notificações do jogo (se estiver em um jogo)
    let gameChannel;
    if (gameId) {
      gameChannel = supabase
        .channel(`game-${gameId}`)
        .on('broadcast', { event: 'game_notification' }, (payload) => {
          try {
            const newNotification = payload.payload as Notification;
            // Garantir que a notificação seja relevante para o usuário atual
            if (!newNotification.user_id || newNotification.user_id === userId) {
              handleNewNotification(newNotification);
            }
          } catch (error) {
            console.error('Erro ao processar notificação do jogo:', error);
          }
        })
        .subscribe((status) => {
          if (status !== 'SUBSCRIBED') {
            console.warn(`Status do canal de notificações do jogo: ${status}`);
          }
        });
    }

    return () => {
      try {
        supabase.removeChannel(personalChannel);
        if (sessionChannel) {
          supabase.removeChannel(sessionChannel);
        }
        if (gameChannel) {
          supabase.removeChannel(gameChannel);
        }
      } catch (error) {
        console.error('Erro ao remover canais de notificação:', error);
      }
    };
  }, [userId, sessionId]);

  const handleNewNotification = (notification: Notification) => {
    try {
      // Verificar se a notificação já existe na lista (evitar duplicatas)
      const notificationExists = notifications.some(n => n.id === notification.id);
      if (notificationExists) return;
      
      // Verificar se o tipo de notificação está habilitado nas preferências
      const notificationType = notification.type as keyof typeof preferences.notificationTypes;
      const isTypeEnabled = preferences.notificationTypes[notificationType] ?? true;
      
      if (!isTypeEnabled) return;
      
      // Adicionar à lista de notificações
      setNotifications(prev => {
        // Limitar o número de notificações para evitar problemas de desempenho
        const updatedList = [notification, ...prev];
        return updatedList.slice(0, 50); // Manter apenas as 50 notificações mais recentes
      });
      setUnreadCount(prev => prev + 1);

      // Mostrar toast para notificação se habilitado
      if (preferences.enableToasts) {
        toast(notification.title, {
          description: notification.content,
          action: {
            label: 'Ver',
            onClick: () => handleNotificationClick(notification)
          },
          duration: 5000 // 5 segundos
        });
      }

      // Reproduzir som de notificação se habilitado
      if (preferences.enableSounds) {
        playNotificationSound(notification.type);
      }
      
      // Se a notificação for crítica, forçar a exibição do painel de notificações
      if (notification.type === 'combat' || notification.type === 'system') {
        setShowNotifications(true);
      }
    } catch (error) {
      console.error('Erro ao processar nova notificação:', error);
    }
  };

  const playNotificationSound = (type: string) => {
    let soundUrl = '/sounds/notification-general.mp3';

    // Selecionar som com base no tipo de notificação
    switch (type) {
      case 'combat':
        soundUrl = '/sounds/notification-combat.mp3';
        break;
      case 'message':
        soundUrl = '/sounds/notification-message.mp3';
        break;
      case 'quest':
        soundUrl = '/sounds/notification-quest.mp3';
        break;
      case 'fog_update':
        soundUrl = '/sounds/notification-map.mp3';
        break;
      case 'system':
        soundUrl = '/sounds/notification-system.mp3';
        break;
      default:
        soundUrl = '/sounds/notification-general.mp3';
        break;
    }

    try {
      const audio = new Audio(soundUrl);
      audio.volume = preferences.soundVolume;
      
      // Verificar se o áudio está pronto para reprodução
      audio.addEventListener('canplaythrough', () => {
        audio.play().catch(e => {
          console.error('Erro ao reproduzir som:', e);
        });
      });
      
      // Tratar erro de carregamento do áudio
      audio.addEventListener('error', (e) => {
        console.error('Erro ao carregar áudio:', e);
        // Tentar reproduzir o som padrão em caso de erro
        const fallbackAudio = new Audio('/sounds/notification-general.mp3');
        fallbackAudio.volume = preferences.soundVolume;
        fallbackAudio.play().catch(err => console.error('Erro ao reproduzir som de fallback:', err));
      });
    } catch (error) {
      console.error('Erro ao inicializar áudio:', error);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Atualizar localmente
      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);

      // Atualizar no banco de dados
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao marcar todas notificações como lidas:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Marcar como lida
    markAsRead(notification.id);

    // Navegar para a referência, se houver
    if (notification.reference_id && notification.reference_type) {
      // Verificar se estamos em um contexto de jogo válido
      const currentGameId = gameId || router.query.gameId as string;
      
      if (!currentGameId) {
        console.error('ID do jogo não disponível para navegação');
        toast.error('Não foi possível navegar para o conteúdo da notificação');
        return;
      }
      
      // Implementar navegação com base no tipo de referência
      try {
        switch (notification.reference_type) {
          case 'tactical_map':
          case 'fog_update':
            // Navegar para o mapa tático
            router.push(`/game/${currentGameId}/maps/${notification.reference_id}`);
            break;
          case 'combat':
            // Navegar para o combate
            router.push(`/game/${currentGameId}/combat/${notification.reference_id}`);
            break;
          case 'message':
            // Navegar para a mensagem
            router.push(`/game/${currentGameId}/messages?message=${notification.reference_id}`);
            break;
          case 'quest':
            // Navegar para a missão
            router.push(`/game/${currentGameId}/quests/${notification.reference_id}`);
            break;
          case 'audio_update':
            // Navegar para a página de áudio
            router.push(`/game/${currentGameId}/audio/${notification.reference_id}`);
            break;
          default:
            console.log(`Tipo de referência desconhecido: ${notification.reference_type}`);
            // Tentar navegar usando o URL de ação, se disponível
            if (notification.reference_id.startsWith('/')) {
              router.push(notification.reference_id);
            }
        }
      } catch (error) {
        console.error('Erro ao navegar:', error);
        toast.error('Ocorreu um erro ao navegar para o conteúdo da notificação');
      }
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Remover localmente
      const notificationToDelete = notifications.find(n => n.id === notificationId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      
      if (notificationToDelete && !notificationToDelete.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }

      // Remover do banco de dados
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao excluir notificação:', error);
    }
  };

  return (
    <div className="relative">
      {/* Ícone de notificação com contador */}
      <Button
        variant="ghost"
        size="sm"
        className="relative p-2"
        onClick={() => setShowNotifications(!showNotifications)}
      >
        {unreadCount > 0 ? (
          <>
            <BellRing size={20} className="text-fantasy-gold" />
            <span className="absolute -top-1 -right-1 bg-fantasy-red text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          </>
        ) : (
          <Bell size={20} />
        )}
      </Button>

      {/* Painel de notificações */}
      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-fantasy-dark border border-fantasy-purple/30 rounded-lg shadow-lg z-50">
          <div className="p-3 border-b border-fantasy-purple/20">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medievalsharp text-fantasy-gold">Notificações</h3>
              <div className="flex space-x-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7"
                    onClick={markAllAsRead}
                  >
                    Marcar todas como lidas
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => router.push('/settings/notifications')}
                  title="Configurações de notificação"
                >
                  <Settings size={14} />
                </Button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-fantasy-stone/70 text-sm">
                Nenhuma notificação
              </div>
            ) : (
              <div className="divide-y divide-fantasy-purple/10">
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`p-3 hover:bg-fantasy-purple/5 cursor-pointer ${!notification.read ? 'bg-fantasy-purple/10' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-sm font-medium text-fantasy-gold">{notification.title}</h4>
                        <p className="text-xs text-fantasy-stone mt-1">{notification.content}</p>
                        <p className="text-xs text-fantasy-stone/50 mt-1">
                          {new Date(notification.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                      >
                        <X size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;