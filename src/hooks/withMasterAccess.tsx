
import React, { useEffect, useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';

// HOC para verificar se o usuário é mestre da mesa
export const withMasterAccess = <P extends object>(Component: React.ComponentType<P>) => {
  return (props: P) => {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [isMaster, setIsMaster] = useState(false);

    useEffect(() => {
      const checkMasterAccess = async () => {
        if (!id || !user) {
          setLoading(false);
          return;
        }

        try {
          const { data, error } = await supabase
            .from('table_participants')
            .select('role')
            .eq('table_id', id)
            .eq('user_id', user.id)
            .single();

          if (error || !data || data.role !== 'gm') {
            setIsMaster(false);
          } else {
            setIsMaster(true);
          }
        } catch (error) {
          console.error('Erro ao verificar acesso de mestre:', error);
          toast.error('Erro ao verificar permissões');
        } finally {
          setLoading(false);
        }
      };

      checkMasterAccess();
    }, [id, user]);

    if (loading) {
      return (
        <div className="flex justify-center items-center h-screen">
          <div className="animate-pulse text-fantasy-purple">Verificando permissões...</div>
        </div>
      );
    }

    if (!isMaster) {
      toast.error('Acesso negado. Você não é o mestre desta mesa.');
      return <Navigate to="/404" replace />;
    }

    return <Component {...props} />;
  };
};
