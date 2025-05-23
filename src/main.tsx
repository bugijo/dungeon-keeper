
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import './index.css'; // Importando o CSS global
import { AuthProvider } from '@/contexts/SupabaseAuthContext'; // Usando o alias @/ para importação
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ErrorBoundary from '@/components/common/ErrorBoundary'; // Importando o ErrorBoundary
import { Toaster } from 'sonner'; // Importando o Toaster para notificações

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

// Verificar se estamos em um ambiente que suporta process
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  window.process = { env: {} } as any;
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Toaster position="top-right" richColors />
            <AppRoutes />
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);
