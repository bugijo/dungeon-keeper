
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './styles/mobile.css' // Add mobile styles
import { AuthProvider } from '@/contexts/SupabaseAuthContext'
import { Toaster } from 'sonner'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60000, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
})

// Ensure the DOM is ready before rendering
const root = document.getElementById("root");
if (root) {
  createRoot(root).render(
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster position="top-right" />
      </QueryClientProvider>
    </AuthProvider>
  );
}
