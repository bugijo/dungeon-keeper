
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const useSupabaseUsers = () => {
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email');
        
        if (error) throw error;
        
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Erro ao carregar usuários');
      }
    };

    fetchUsers();
  }, []);

  return users;
};
