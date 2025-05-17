import React from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Adicionar outras props necessárias, como dados do usuário
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  // Simulação de dados do usuário - idealmente viria de um contexto ou API, como no Header
  const userData = {
    name: "Jogador Aventura",
    level: 5,
    currentXp: 750,
    xpToNextLevel: 1500,
    profilePic: "/placeholders/profile-placeholder-medieval.png", // Placeholder temático
    title: "Explorador de Masmorras",
    // Adicione mais dados se necessário para o modal
  };
  if (!isOpen) return null;



  const handleLogout = () => {
    // Lógica de logout aqui
    console.log('Usuário deslogado');
    onClose(); // Fechar o modal após o logout
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[100] p-4 backdrop-blur-sm"
      onClick={onClose} // Fechar ao clicar fora do conteúdo do modal
    >
      <div 
        className="bg-stone-800 text-amber-50 p-6 rounded-xl shadow-2xl w-full max-w-md border-2 border-amber-700 transform transition-all duration-300 ease-out scale-100 font-serif" style={{ backgroundImage: "url('/textures/wood-pattern-dark.png')" }}
        onClick={(e) => e.stopPropagation()} // Evitar que o clique dentro do modal o feche
      >
        <div className="flex flex-col items-center mb-6">
          <img 
            src={userData.profilePic} // Usando profilePic dos dados simulados
            alt="Foto de Perfil"
            className="w-28 h-28 rounded-full border-4 border-amber-500 shadow-lg mb-4"
          />
          <h2 className="text-3xl font-bold text-amber-300 tracking-wider">{userData.name}</h2>
          <p className="text-md text-amber-100 italic">{userData.title}</p>
        </div>

        <nav className="space-y-3 mb-8">
          <a 
            href="#" 
            className="block w-full text-center py-3 px-4 bg-amber-600 hover:bg-amber-700 text-stone-900 rounded-lg transition-all duration-200 font-semibold text-lg shadow-md border border-amber-800 hover:shadow-lg transform hover:scale-105"
          >
            Minhas Criações
          </a>
          <a 
            href="#" 
            className="block w-full text-center py-3 px-4 bg-amber-600 hover:bg-amber-700 text-stone-900 rounded-lg transition-all duration-200 font-semibold text-lg shadow-md border border-amber-800 hover:shadow-lg transform hover:scale-105"
          >
            Minhas Mesas
          </a>
          <a 
            href="#" 
            className="block w-full text-center py-3 px-4 bg-amber-600 hover:bg-amber-700 text-stone-900 rounded-lg transition-all duration-200 font-semibold text-lg shadow-md border border-amber-800 hover:shadow-lg transform hover:scale-105"
          >
            Editar Perfil
          </a>
        </nav>

        <button 
          onClick={handleLogout}
          className="w-full py-3 px-4 bg-red-700 hover:bg-red-800 text-white rounded-lg transition-all duration-200 font-bold text-lg shadow-md border border-red-900 hover:shadow-lg transform hover:scale-105"
        >
          Logout
        </button>

        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-amber-200 hover:text-amber-50 transition-colors duration-150 p-1 rounded-full hover:bg-white hover:bg-opacity-10"
          aria-label="Fechar modal"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ProfileModal;