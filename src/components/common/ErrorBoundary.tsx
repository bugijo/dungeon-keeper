import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Componente ErrorBoundary para capturar erros de renderização
 * e exibir uma UI de fallback em vez de quebrar a aplicação
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Atualiza o estado para que a próxima renderização mostre a UI de fallback
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Você pode renderizar qualquer UI de fallback personalizada
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100 text-center">
          <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-red-700 mb-4">Algo deu errado</h2>
            <p className="mb-4 text-gray-700">
              Encontramos um problema ao carregar esta página. Isso não impedirá que você use o aplicativo, mas algumas funcionalidades podem estar limitadas.
            </p>
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md mb-4">
              <p className="text-sm text-yellow-700">
                Erro: {this.state.error?.message || 'Erro desconhecido'}
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;