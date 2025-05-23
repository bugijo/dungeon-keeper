import React from 'react';

interface LoadingScreenProps {
  message?: string;
}

/**
 * Componente de tela de carregamento
 * Exibe uma animação de carregamento com uma mensagem opcional
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = 'Carregando...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-100 bg-opacity-90 z-50">
      <div className="p-6 rounded-lg bg-white shadow-lg text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-600 mx-auto mb-4"></div>
        <p className="text-lg text-gray-700">{message}</p>
      </div>
    </div>
  );
};

export default LoadingScreen;