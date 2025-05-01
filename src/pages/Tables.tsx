
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { SearchX, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

// Componente de card de mesa com skeleton
const TableCardSkeleton = () => {
  return (
    <div className="fantasy-card p-4 animate-pulse">
      <div className="h-6 w-3/4 bg-gray-700 rounded mb-2"></div>
      <div className="h-4 w-1/2 bg-gray-700 rounded mb-4"></div>
      <div className="h-4 w-full bg-gray-700/50 rounded mb-2"></div>
      <div className="h-4 w-3/4 bg-gray-700/50 rounded mb-4"></div>
      <div className="flex justify-between mt-4">
        <div className="h-8 w-20 bg-gray-700 rounded"></div>
        <div className="h-8 w-20 bg-gray-700 rounded"></div>
      </div>
    </div>
  );
};

const Tables = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filter, setFilter] = useState('');

  // Implementação com useInfiniteQuery
  const { 
    data, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    status 
  } = useInfiniteQuery({
    queryKey: ['tables'],
    queryFn: async ({ pageParam = 0 }) => {
      const start = pageParam * 10;
      const end = start + 9;

      // Consulta modificada para evitar o uso de relações que estão causando problemas
      const { data, error, count } = await supabase
        .from('tables')
        .select('*', { count: 'exact' })
        .range(start, end);
      
      if (error) throw error;

      // Para cada mesa, buscar informações adicionais separadamente
      const tablesWithDetails = await Promise.all(data.map(async (table) => {
        // Buscar nome do dono da mesa
        const { data: ownerData } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', table.user_id)
          .single();
        
        // Contar participantes
        const { count: participantsCount } = await supabase
          .from('table_participants')
          .select('*', { count: 'exact', head: true })
          .eq('table_id', table.id);
        
        return {
          ...table,
          profile: ownerData || { display_name: "Desconhecido" },
          participants: [{ count: participantsCount || 0 }]
        };
      }));
      
      return { 
        tables: tablesWithDetails, 
        count,
        nextPage: data.length === 10 ? pageParam + 1 : undefined 
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
    staleTime: 5 * 60 * 1000, // Cache por 5 minutos
  });

  const handleCreateTable = () => {
    navigate('/create-table');
  };

  const handleJoinTable = async (tableId: string) => {
    try {
      const { error } = await supabase
        .from('table_join_requests')
        .insert({
          table_id: tableId,
          user_id: user?.id,
          status: 'pending'
        });
        
      if (error) throw error;
      
      toast.success('Solicitação enviada!', {
        description: 'Aguarde a aprovação do Mestre',
      });
    } catch (error) {
      console.error('Erro ao solicitar entrada na mesa:', error);
      toast.error('Erro ao solicitar entrada na mesa');
    }
  };

  const handleViewTable = (tableId: string, isGM: boolean) => {
    if (isGM) {
      navigate(`/gm/${tableId}`);
    } else {
      navigate(`/table/${tableId}`);
    }
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-medievalsharp text-white">Mesas</h1>
          <Button onClick={handleCreateTable} className="fantasy-button primary">
            <Plus size={16} className="mr-2" />
            Criar Mesa
          </Button>
        </div>
        
        <div className="mb-6">
          <input
            type="text"
            placeholder="Buscar mesas..."
            className="w-full p-2 rounded bg-fantasy-dark border border-fantasy-purple/30 text-fantasy-stone"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        
        {status === 'pending' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <TableCardSkeleton key={i} />
            ))}
          </div>
        )}
        
        {status === 'error' && (
          <div className="text-center py-10">
            <SearchX size={48} className="mx-auto mb-4 text-fantasy-stone/50" />
            <p className="text-fantasy-stone text-lg">Ocorreu um erro ao carregar as mesas.</p>
          </div>
        )}
        
        {status === 'success' && (
          <>
            {data.pages.flatMap(page => page.tables).length === 0 ? (
              <div className="text-center py-10">
                <SearchX size={48} className="mx-auto mb-4 text-fantasy-stone/50" />
                <p className="text-fantasy-stone text-lg">Nenhuma mesa encontrada.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.pages.flatMap(page => page.tables).map((table: any) => {
                    const isGM = table.user_id === user?.id;
                    
                    return (
                      <div key={table.id} className="fantasy-card p-4">
                        <h2 className="text-xl font-medievalsharp text-white">{table.name}</h2>
                        <p className="text-fantasy-stone/80 text-sm">Mestre: {table.profile?.display_name || "Desconhecido"}</p>
                        <p className="mt-2 text-fantasy-stone line-clamp-3">{table.description || "Sem descrição"}</p>
                        
                        <div className="flex items-center mt-4 text-xs text-fantasy-stone/70">
                          <span>{table.system || "Sistema não definido"}</span>
                          <span className="mx-2">•</span>
                          <span>{table.participants?.[0]?.count || 0} jogadores</span>
                        </div>
                        
                        <div className="flex justify-between mt-4">
                          {isGM ? (
                            <Button 
                              onClick={() => handleViewTable(table.id, true)}
                              className="fantasy-button primary"
                            >
                              Gerenciar
                            </Button>
                          ) : (
                            <Button 
                              onClick={() => handleJoinTable(table.id)}
                              className="fantasy-button secondary"
                            >
                              Solicitar Entrada
                            </Button>
                          )}
                          
                          <Button 
                            onClick={() => handleViewTable(table.id, isGM)}
                            className="fantasy-button ghost"
                          >
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {hasNextPage && (
                  <div className="text-center mt-6">
                    <Button 
                      onClick={() => fetchNextPage()} 
                      className="fantasy-button secondary"
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Carregando mais mesas...' : 'Carregar mais mesas'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};

export default Tables;
