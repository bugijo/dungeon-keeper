
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './routes';
import { AuthProvider } from '@/contexts/SupabaseAuthContext';

function App() {
  return (
    <Router>
      <NotificationProvider>
        <Toaster position="top-right" />

        
        <AppRoutes />
      </NotificationProvider>
    </Router>
  );
}

export default App;

