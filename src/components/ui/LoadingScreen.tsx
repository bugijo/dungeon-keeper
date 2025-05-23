import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 bg-opacity-80 z-50">
      <div className="p-6 rounded-lg bg-gray-800 shadow-xl max-w-md w-full mx-4 text-center">
        <div className="flex justify-center mb-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
        <h2 className="text-xl font-bold text-white mb-2">{message}</h2>
        <p className="text-gray-300 text-sm">
          Preparando sua aventura no mundo de Keeper of Realms...
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;