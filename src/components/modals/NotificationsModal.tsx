import React from 'react';

interface Notification {
  id: string;
  title: string;
  description: string;
  type: 'mission' | 'table' | 'friend' | 'system'; // Tipos de exemplo
  timestamp: string;
  read: boolean;
  link?: string; // Link opcional para a origem da notificação
}

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-stone-800 text-amber-50 p-6 rounded-xl shadow-2xl w-full max-w-lg border-2 border-amber-700 transform transition-all duration-300 ease-out scale-100 flex flex-col font-serif" style={{ backgroundImage: "url('/textures/wood-pattern-dark.png')", maxHeight: '85vh' }}
        style={{ maxHeight: '80vh' }} // Limitar altura máxima
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-amber-300 tracking-wider">Notificações ({unreadCount})</h2>
          <button 
            onClick={onClose} 
            className="text-amber-200 hover:text-amber-50 transition-colors duration-150 p-1 rounded-full hover:bg-white hover:bg-opacity-10"
            aria-label="Fechar modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {notifications.length === 0 ? (
          <p className="text-amber-100 text-center py-6 italic">Nenhuma notificação nova para exibir, bravo aventureiro!</p>
        ) : (
          <div className="overflow-y-auto flex-grow pr-2 space-y-3">
            {notifications.map((notification) => (
              <div 
                key={notification.id}
                className={`p-4 rounded-lg ${notification.read ? 'bg-stone-700 opacity-60' : 'bg-stone-600 hover:bg-stone-500 border border-amber-800 shadow-md hover:shadow-lg'} transition-all duration-200 cursor-pointer`}
                onClick={() => !notification.read && onMarkAsRead(notification.id)}
              >
                <div className="flex justify-between items-start">
                  <h3 className={`font-semibold text-lg ${notification.read ? 'text-amber-200 opacity-70' : 'text-amber-100'}`}>{notification.title}</h3>
                  {!notification.read && (
                    <span className="text-xs bg-red-600 text-white px-2 py-1 rounded-full font-bold shadow-sm">NOVA</span>
                  )}
                </div>
                <p className={`text-sm mt-1 ${notification.read ? 'text-stone-400 opacity-80' : 'text-stone-200'}`}>{notification.description}</p>
                <div className="text-xs text-stone-400 mt-2 flex justify-between items-center">
                  <span>{notification.timestamp} - {notification.type}</span>
                  {notification.link && (
                    <a href={notification.link} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 hover:underline font-semibold" onClick={(e) => e.stopPropagation()}>
                      Ver Detalhes
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {notifications.length > 0 && (
          <div className="mt-6 pt-4 border-t border-amber-700">
            <button 
              onClick={onMarkAllAsRead}
              disabled={unreadCount === 0}
              className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-700 text-stone-900 rounded-lg transition-all duration-200 font-semibold text-lg shadow-md border border-amber-800 hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-stone-600 disabled:text-stone-400"
            >
              Marcar todas como lidas
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsModal;