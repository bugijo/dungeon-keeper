import React, { useState } from 'react';
import ProfileModal from '../modals/ProfileModal'; // Importando o ProfileModal
import NotificationsModal from '../modals/NotificationsModal'; // Importando o NotificationsModal
import SettingsModal from '../modals/SettingsModal'; // Importando o SettingsModal

const Header: React.FC = () => {
  // Simulação de dados do usuário - idealmente viria de um contexto ou API
  const userData = {
    name: "Jogador Aventura",
    level: 5,
    currentXp: 750,
    xpToNextLevel: 1500,
    profilePic: "/placeholders/profile-placeholder-medieval.png", // Placeholder temático
    title: "Explorador de Masmorras",
    gems: 1250,
    diamonds: 75,
    gold: 15200,
  };
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Dados de exemplo para notificações
  const [notifications, setNotifications] = useState([
    { id: '1', title: 'Nova Missão Disponível!', description: 'Ajude o ferreiro local e ganhe recompensas.', type: 'mission' as const, timestamp: 'Há 2 minutos', read: false, link: '#' },
    { id: '2', title: 'Convite para Mesa', description: 'Você foi convidado para a mesa "A Saga do Dragão Vermelho".', type: 'table' as const, timestamp: 'Há 1 hora', read: false, link: '#' },
    { id: '3', title: 'Amigo Online', description: 'Seu amigo Elara está online.', type: 'friend' as const, timestamp: 'Há 3 horas', read: true, link: '#' },
  ]);

  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  const handleProfileClick = () => {
    setIsProfileModalOpen(true);
  };

  const handleNotificationsClick = () => {
    setIsNotificationsModalOpen(true);
  };

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleSettingsClick = () => {
    setIsSettingsModalOpen(true);
  };
  return (
    <header className="bg-stone-800 text-amber-50 p-4 fixed top-0 left-0 right-0 z-50 h-24 flex items-center justify-between shadow-lg border-b-2 border-amber-700" style={{ backgroundImage: "url('/textures/wood-pattern.png')" }}>
      {/* Lado Esquerdo: Foto de Perfil, Nível e XP */}
      <div className="flex items-center space-x-4">
        <img 
          src={userData.profilePic} 
          alt="Foto de Perfil"
          className="w-16 h-16 rounded-full border-4 border-amber-500 shadow-md hover:opacity-90 transition-opacity duration-200 cursor-pointer"
          onClick={handleProfileClick} 
        />
        <div className="ml-3">
          <div className="text-lg font-bold text-amber-200 font-serif tracking-wider">{userData.name}</div>
          <div className="text-sm text-amber-100">Nível {userData.level} - {userData.title}</div>
          <div className="w-40 h-3 bg-stone-700 rounded-full mt-1 border border-amber-700">
            <div 
              className="h-full bg-green-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(userData.currentXp / userData.xpToNextLevel) * 100}%` }} 
            ></div>
          </div>
          <div className="text-xs text-amber-100 mt-0.5">XP: {userData.currentXp} / {userData.xpToNextLevel}</div>
        </div>
      </div>

      {/* Centro: Logo (Opcional, pode ser removido se não houver espaço) */}
      <div className="absolute left-1/2 transform -translate-x-1/2 hidden md:block">
        <img src="/logo/logo-keeper-of-realms-textura-madeira.png" alt="Logo Keeper of Realms" className="h-16" />
      </div>
      {/* <div className="absolute left-1/2 transform -translate-x-1/2">
        <img src="/logo-medieval.png" alt="Logo" className="h-12" />
      </div> */}

      {/* Lado Direito: Moedas, Notificações, Configurações */}
      <div className="flex items-center space-x-4 md:space-x-6">
        {/* Gemas */}
        <div className="flex items-center space-x-2 bg-black bg-opacity-30 p-2 rounded-lg border border-amber-600">
          <img src="/icons/gem-icon-medieval.png" alt="Gemas" className="w-8 h-8" />
          <span className="font-bold text-lg text-yellow-300">{userData.gems}</span>
        </div>
        {/* Diamantes */}
        <div className="flex items-center space-x-2 bg-black bg-opacity-30 p-2 rounded-lg border border-amber-600">
          <img src="/icons/diamond-icon-medieval.png" alt="Diamantes" className="w-8 h-8" />
          <span className="font-bold text-lg text-sky-300">{userData.diamonds}</span>
        </div>
        {/* Ouro */}
        <div className="flex items-center space-x-2 bg-black bg-opacity-30 p-2 rounded-lg border border-amber-600">
          <img src="/icons/gold-icon-medieval.png" alt="Ouro" className="w-8 h-8" />
          <span className="font-bold text-lg text-orange-300">{userData.gold}</span>
        </div>
        
        {/* Ícone de Notificações */}
        <button className="relative p-1 rounded-full hover:bg-amber-700 transition-colors duration-200" onClick={handleNotificationsClick}>
          <img src="/icons/notification-bell-medieval.png" alt="Notificações" className="w-9 h-9" />
          {unreadNotificationsCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 rounded-full border-2 border-stone-800 text-xs flex items-center justify-center text-white font-bold">
              {unreadNotificationsCount}
            </span>
          )}
        </button>

        {/* Ícone de Configurações */}
        <button className="p-1 rounded-full hover:bg-amber-700 transition-colors duration-200" onClick={handleSettingsClick}>
          <img src="/icons/settings-cog-medieval.png" alt="Configurações" className="w-9 h-9" />
        </button>
      </div>
    </header>

    {/* Modal de Perfil */}
    <ProfileModal 
      isOpen={isProfileModalOpen} 
      onClose={() => setIsProfileModalOpen(false)} 
    />

    {/* Modal de Notificações */}
    <NotificationsModal
      isOpen={isNotificationsModalOpen}
      onClose={() => setIsNotificationsModalOpen(false)}
      notifications={notifications}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
    />

    {/* Modal de Configurações */}
    <SettingsModal
      isOpen={isSettingsModalOpen}
      onClose={() => setIsSettingsModalOpen(false)}
    />
  );
};

export default Header;

// Adicionando o ProfileModal ao final do componente para renderização
// O modal em si controlará sua visibilidade com base na prop 'isOpen'
// No entanto, para que ele seja renderizado, precisa estar no DOM.
// Uma abordagem comum é renderizá-lo condicionalmente ou sempre e deixar o CSS/JS interno cuidar da visibilidade.
// Para este caso, vamos renderizá-lo e passar o estado.

/*
  Este comentário está aqui para garantir que o bloco de substituição seja único.
  O ProfileModal será adicionado abaixo do return do Header, mas dentro do escopo do componente funcional.
*/