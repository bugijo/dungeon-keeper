
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import './index.css'; // Importando o CSS global
import { AuthProvider } from '@/contexts/SupabaseAuthContext'; // Assumindo que AuthProvider é exportado daqui
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Cria uma instância do QueryClient
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
);
