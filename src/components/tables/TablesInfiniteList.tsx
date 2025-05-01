
import React from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useInView } from 'react-intersection-observer';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Table {
  id: string;
  name: string;
  description: string;
  system: string;
  user_id: string;
  max_players: number;
  created_at: string;
  weekday: string;
  time: string;
  campaign: string;
  status: string;
}

interface TableCardProps {
  table: Table;
}

const TableCardSkeleton = () => (
  <div className="fantasy-card p-4 animate-pulse">
    <div className="flex justify-between items-start">
      <div>
        <Skeleton className="h-6 w-52 mb-2" />
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-4 w-48 mb-2" />
      </div>
      <Skeleton className="h-10 w-10 rounded-full" />
    </div>
    <div className="mt-4">
      <Skeleton className="h-14 w-full" />
    </div>
    <div className="mt-4 flex justify-between">
      <Skeleton className="h-8 w-24" />
      <Skeleton className="h-8 w-24" />
    </div>
  </div>
);

const TableCard: React.FC<TableCardProps> = ({ table }) => {
  // Componente TableCard existente ou um novo. Implementação básica:
  return (
    <div className="fantasy-card p-4">
      <h3 className="text-lg font-medievalsharp text-fantasy-gold">{table.name}</h3>
      <div className="text-sm text-fantasy-stone">{table.system} • {table.campaign}</div>
      <div className="text-sm text-fantasy-stone">{table.weekday} às {table.time}</div>
      <p className="mt-2 text-sm">{table.description}</p>
      <div className="mt-4 flex justify-between items-center">
        <span className="text-xs bg-fantasy-purple/20 text-fantasy-purple px-2 py-1 rounded-full">
          {table.status}
        </span>
        <Button variant="outline" className="fantasy-button secondary">
          Ver Mesa
        </Button>
      </div>
    </div>
  );
};

const TablesInfiniteList = () => {
  const { ref, inView } = useInView();

  const fetchTables = async ({ pageParam = 0 }) => {
    const PAGE_SIZE = 10;
    const start = pageParam * PAGE_SIZE;
    
    const { data, error, count } = await supabase
      .from('tables')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, start + PAGE_SIZE - 1);
      
    if (error) throw error;
    
    return { 
      data, 
      nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      total: count
    };
  };

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = useInfiniteQuery({
    queryKey: ['tables'],
    queryFn: fetchTables,
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0, // Added missing initialPageParam
  });

  React.useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [inView, fetchNextPage, hasNextPage, isFetchingNextPage]);

  return (
    <div className="space-y-4">
      {status === 'pending' ? ( // Fixed: changed from comparing "error" | "success" with "pending"
        Array.from({ length: 3 }).map((_, i) => <TableCardSkeleton key={i} />)
      ) : status === 'error' ? (
        <div className="fantasy-card p-6 text-center">
          <p className="text-red-400">Erro ao carregar mesas: {error.message}</p>
        </div>
      ) : (
        <>
          {data?.pages.flatMap((page, i) => (
            page.data.map((table: Table) => (
              <TableCard key={table.id} table={table} />
            ))
          ))}
          
          {isFetchingNextPage && (
            Array.from({ length: 2 }).map((_, i) => <TableCardSkeleton key={i} />)
          )}
          
          <div ref={ref} className="h-10" />
          
          {!hasNextPage && data?.pages[0].total > 0 && (
            <p className="text-center text-fantasy-stone py-4">Todas as mesas foram carregadas</p>
          )}
          
          {data?.pages[0].total === 0 && (
            <div className="fantasy-card p-6 text-center">
              <p className="text-fantasy-stone">Nenhuma mesa encontrada</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TablesInfiniteList;
