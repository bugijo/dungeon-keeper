
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

export interface UserBalance {
  gems: number;
  coins: number;
  loading: boolean;
  refetch: () => Promise<void>;
}

export const useUserBalance = (): UserBalance => {
  const { user } = useAuth();
  const [balance, setBalance] = useState<{ gems: number; coins: number }>({ gems: 0, coins: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  const fetchBalance = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_balance')
        .select('gems, coins')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // Se o erro for porque o registro não existe, criamos um
        if (error.code === 'PGRST116') {
          const { error: insertError } = await supabase
            .from('user_balance')
            .insert({ user_id: user.id, gems: 0, coins: 0 });
          
          if (insertError) throw insertError;
          
          setBalance({ gems: 0, coins: 0 });
        } else {
          throw error;
        }
      } else {
        // Ensure we're dealing with integer values
        const gems = data?.gems ? Math.round(Number(data.gems)) : 0;
        const coins = data?.coins ? Math.round(Number(data.coins)) : 0;
        
        setBalance({ gems, coins });
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
      toast.error('Erro ao carregar saldo do usuário');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
  }, [user]);

  return {
    ...balance,
    loading,
    refetch: fetchBalance
  };
};
