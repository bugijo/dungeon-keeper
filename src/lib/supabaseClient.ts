/**
 * Cliente Supabase para conexão com o backend
 * Implementa tratamento de erros robusto para evitar quebras na aplicação
 */
import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Polyfill para process.env em ambientes que não o definem
if (typeof window !== 'undefined') {
  // @ts-ignore - Ignorando erro de tipagem para o polyfill
  window.process = window.process || { env: {} };
}

// Configurações do Supabase (valores fixos para garantir funcionamento)
const SUPABASE_URL = "https://iilbczoanafeqzjqovjb.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlpbGJjem9hbmFmZXF6anFvdmpiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMzAzMzEsImV4cCI6MjA1OTgwNjMzMX0.bFE7xLdOURKvfIHIzrTYJPWhCI08SvDhgsen2OwK2_k";

// Função para criar cliente com tratamento de erros
const createClientWithErrorHandling = (): SupabaseClient => {
  try {
    console.log('Inicializando cliente Supabase com tratamento de erros...');
    
    // Criar cliente real
    const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    
    // Envolver o cliente em um proxy para capturar erros
    return new Proxy(client, {
      get: (target, prop) => {
        const value = Reflect.get(target, prop);
        
        // Se a propriedade não for uma função, retorna o valor diretamente
        if (typeof value !== 'function') {
          return value;
        }
        
        // Envolver funções para capturar erros
        return function(...args: any[]) {
          try {
            const result = value.apply(target, args);
            
            // Se o resultado for uma Promise, adicionar tratamento de erro
            if (result instanceof Promise) {
              return result.catch(error => {
                console.error(`Erro na operação Supabase '${String(prop)}':`, error);
                // Não exibir toast para operações de autenticação que já têm tratamento próprio
                if (!String(prop).includes('auth')) {
                  toast.error(`Erro de conexão: ${error.message || 'Falha na comunicação com o servidor'}`);
                }
                // Retornar um objeto de erro padronizado para não quebrar a aplicação
                return { data: null, error };
              });
            }
            
            return result;
          } catch (error) {
            console.error(`Exceção na operação Supabase '${String(prop)}':`, error);
            // Retornar um objeto de erro padronizado para não quebrar a aplicação
            return { data: null, error };
          }
        };
      }
    });
  } catch (error) {
    console.error('Erro crítico ao inicializar cliente Supabase:', error);
    // Em caso de erro na inicialização, retornar cliente de fallback
    return createFallbackClient();
  }
};

// Cliente de fallback que não quebra a aplicação
const createFallbackClient = (): SupabaseClient => {
  console.warn('Usando cliente Supabase de fallback - funcionalidade limitada');
  
  // Cria um proxy que intercepta chamadas e evita quebrar a aplicação
  return new Proxy({} as any, {
    get: (target, prop) => {
      // Funções básicas de autenticação que retornam valores vazios
      if (prop === 'auth') {
        return {
          getSession: async () => ({ data: { session: null }, error: null }),
          getUser: async () => ({ data: { user: null }, error: null }),
          signUp: async () => ({ data: { user: null }, error: { message: 'Modo offline' } }),
          signInWithPassword: async () => ({ data: { user: null }, error: { message: 'Modo offline' } }),
          signInWithOAuth: async () => ({ data: { user: null }, error: { message: 'Modo offline' } }),
          signOut: async () => ({ error: null }),
          onAuthStateChange: (callback: any) => ({ data: { subscription: { unsubscribe: () => {} } } }),
          updateUser: async () => ({ data: { user: null }, error: null }),
          resetPasswordForEmail: async () => ({ error: null }),
          resend: async () => ({ error: null })
        };
      }
      
      // Para outras chamadas, retorna uma função que não falha
      return (...args: any[]) => {
        console.warn(`Chamada Supabase '${String(prop)}' em modo offline`, args);
        const mockResult = {
          data: null,
          error: { message: 'Aplicação em modo offline' },
          select: () => mockResult,
          eq: () => mockResult,
          in: () => mockResult,
          order: () => mockResult,
          limit: () => mockResult,
          single: () => mockResult,
          then: (callback: any) => Promise.resolve(mockResult).then(callback)
        };
        return mockResult;
      };
    }
  });
};

// Tenta criar o cliente com tratamento de erros, mas garante que sempre teremos um cliente
// mesmo que seja o de fallback
let supabaseInstance: SupabaseClient;
try {
  supabaseInstance = createClientWithErrorHandling();
} catch (e) {
  console.error('Erro fatal ao criar cliente Supabase, usando fallback:', e);
  supabaseInstance = createFallbackClient();
}

// Exporta o cliente com tratamento de erros
export const supabase = supabaseInstance;

// Exporta também como default para compatibilidade
export default supabase;