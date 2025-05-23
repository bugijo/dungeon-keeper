// Este arquivo foi modificado para usar o cliente Supabase com tratamento de erros robusto
import { supabase as supabaseWithErrorHandling } from './client-with-error-handling';
import type { Database } from './types';

// Exporta o cliente com tratamento de erros
export const supabase = supabaseWithErrorHandling;

// Exporta também como default para compatibilidade
export default supabase;