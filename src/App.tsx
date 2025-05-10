
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { NotificationProvider } from './contexts/NotificationContext';
import { Toaster } from '@/components/ui/sonner';
import AppRoutes from './routes';
// import './index.css'; // Global stylesheet imported in main.tsx

function App() {
  return (
    <React.StrictMode>
      <NotificationProvider>
        <Router>
          <AppRoutes />
          <Toaster richColors />
        </Router>
      </NotificationProvider>
    </React.StrictMode>
  );
}

export default App;

