/**
 * Cliente Supabase para conexão com o backend
 */
import { createClient } from '@supabase/supabase-js';

// Obter variáveis de ambiente
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Criar cliente Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Verificar se as credenciais foram fornecidas
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Credenciais do Supabase não encontradas. Funcionalidades online podem não funcionar corretamente.');
}