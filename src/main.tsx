
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Importando o CSS global
import { AuthProvider } from './contexts/SupabaseAuthContext'; // Ajuste o caminho se necessário
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
