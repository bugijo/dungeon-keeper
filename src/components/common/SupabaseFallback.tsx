import React from 'react';

interface SupabaseFallbackProps {
  error?: Error | null;
  onRetry?: () => void;
}

/**
 * Componente de fallback específico para erros do Supabase
 * Exibe uma interface amigável quando há problemas de conexão
 */
const SupabaseFallback: React.FC<SupabaseFallbackProps> = ({ 
  error, 
  onRetry = () => window.location.reload() 
}) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
      <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-amber-700 mb-4">Problemas de Conexão</h2>
        <p className="mb-4 text-gray-700">
          Estamos enfrentando dificuldades para conectar ao servidor. Isso não impedirá que você use o aplicativo, mas algumas funcionalidades podem estar limitadas.
        </p>
        
        {error && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
            <p className="text-sm text-yellow-700">
              Erro: {error.message || 'Erro de conexão com o servidor'}
            </p>
          </div>
        )}
        
        <div className="flex flex-col space-y-3">
          <button 
            onClick={onRetry} 
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Tentar Novamente
          </button>
          
          <a 
            href="/diagnostico.html" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
          >
            Ver Diagnóstico
          </a>
        </div>
        
        <p className="mt-4 text-sm text-gray-500">
          Se o problema persistir, tente acessar a aplicação mais tarde ou entre em contato com o suporte.
        </p>
      </div>
    </div>
  );
};

export default SupabaseFallback;