// src/pages/GameTableDetailPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SupabaseAuthContext';

// Definir um tipo para os dados da mesa pode ser útil
interface GameTable {
  id: string;
  name: string;
  description: string | null;
  game_system: string | null;
  max_players: number | null;
  session_date_time: string | null;
  genre: string | null;
  full_story: string | null;
  image_url: string | null;
  master_id: string;
  created_at: string;
  // Adicionar profiles: { name: string } | null para o nome do mestre
  profiles: { user_name: string } | null; 
}

type UserTableStatus = 'loading' | 'isMaster' | 'isPlayer' | 'requestPending' | 'requestRejected' | 'canRequest' | 'error' | 'notLoggedIn';

const GameTableDetailPage: React.FC = () => {
  const { id: tableIdParams } = useParams<{ id: string }>();
  const { session, loading: loadingAuth } = useAuth();
  const [table, setTable] = useState<GameTable | null>(null);
  const [loadingTable, setLoadingTable] = useState(true);
  const [userTableStatus, setUserTableStatus] = useState<UserTableStatus>('loading');
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  useEffect(() => {
    const fetchTableDetails = async () => {
      if (!tableIdParams) return;
      setLoadingTable(true);
      try {
        const { data, error } = await supabase
          .from('game_tables')
          .select(`
            *,
            profiles ( user_name )
          `)
          .eq('id', tableIdParams)
          .single();

        if (error) {
          throw error;
        }
        setTable(data as GameTable);
      } catch (error: any) {
        console.error('Erro ao buscar detalhes da mesa:', error);
        toast.error('Erro ao carregar detalhes da mesa: ' + error.message);
        setTable(null); // Garante que table seja null em caso de erro
      }
      setLoadingTable(false);
    };

    fetchTableDetails();
  }, [tableIdParams]);

  const checkUserStatus = useCallback(async () => {
    if (loadingAuth || !table || !tableIdParams) return;

    if (!session?.user) {
      setUserTableStatus('notLoggedIn');
      return;
    }

    const currentUserId = session.user.id;

    if (currentUserId === table.master_id) {
      setUserTableStatus('isMaster');
      return;
    }

    setUserTableStatus('loading');
    try {
      // Verificar se é jogador
      const { data: playerData, error: playerError } = await supabase
        .from('game_table_players')
        .select('user_id')
        .eq('table_id', tableIdParams)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (playerError) throw playerError;
      if (playerData) {
        setUserTableStatus('isPlayer');
        return;
      }

      // Verificar se há solicitação pendente
      const { data: requestData, error: requestError } = await supabase
        .from('game_table_requests')
        .select('status')
        .eq('table_id', tableIdParams)
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (requestError) throw requestError;

      if (requestData) {
        if (requestData.status === 'pending') {
          setUserTableStatus('requestPending');
        } else if (requestData.status === 'approved') {
          // Se aprovado, deveria estar na tabela de players. Re-verificar ou tratar como player.
          setUserTableStatus('isPlayer'); 
        } else if (requestData.status === 'rejected') {
          setUserTableStatus('requestRejected');
        }
      } else {
        setUserTableStatus('canRequest');
      }
    } catch (error: any) {
      console.error('Erro ao verificar status do usuário na mesa:', error);
      toast.error('Erro ao verificar seu status para esta mesa.');
      setUserTableStatus('error');
    }
  }, [session, loadingAuth, table, tableIdParams]);

  useEffect(() => {
    if (!loadingTable && table) {
      checkUserStatus();
    }
  }, [loadingTable, table, checkUserStatus]);

  const handleRequestToJoin = async () => {
    if (!session?.user?.id || !table?.id) {
      toast.error("Você precisa estar logado para solicitar participação.");
      return;
    }
    if (userTableStatus !== 'canRequest') {
      toast.error("Não é possível enviar a solicitação neste momento.");
      return;
    }

    setIsSubmittingRequest(true);
    try {
      const { error } = await supabase
        .from('game_table_requests')
        .insert({ 
          table_id: table.id, 
          user_id: session.user.id, 
          status: 'pending' 
        });

      if (error) throw error;

      toast.success("Solicitação para participar enviada com sucesso!");
      setUserTableStatus('requestPending');
    } catch (error: any) {
      console.error('Erro ao enviar solicitação:', error);
      toast.error("Erro ao enviar solicitação: " + error.message);
      // setUserTableStatus('error'); // Ou volta para 'canRequest' para tentar de novo
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  if (loadingTable || loadingAuth) {
    return <div className="text-center p-10 text-white">Carregando...</div>;
  }

  if (!table) {
    return <div className="text-center p-10 text-white">Mesa não encontrada.</div>;
  }

  return (
    <div className="container mx-auto p-4 bg-gray-800 text-white min-h-screen">
      <div className="bg-gray-700 p-8 rounded-lg shadow-xl max-w-3xl mx-auto">
        {table.image_url && (
          <img src={table.image_url} alt={table.name} className="w-full h-64 object-cover rounded-md mb-6" />
        )}
        <h1 className="text-4xl font-bold mb-4 text-yellow-400">{table.name}</h1>
        <p className="text-sm text-gray-400 mb-1">Mestrado por: {table.profiles?.user_name || table.master_id}</p>
        <p className="text-sm text-gray-400 mb-4">ID da Mesa: {table.id}</p>

        <div className="mb-4">
          <h2 className="text-xl font-semibold text-yellow-300 mb-2">Descrição Curta</h2>
          <p className="text-gray-300 whitespace-pre-wrap">{table.description || 'Nenhuma descrição curta fornecida.'}</p>
        </div>

        {table.full_story && (
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-yellow-300 mb-2">História Completa</h2>
            <p className="text-gray-300 whitespace-pre-wrap">{table.full_story}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <p className="text-yellow-300">Gênero:</p>
            <p className="text-gray-300">{table.genre || 'Não especificado'}</p>
          </div>
          <div>
            <p className="text-yellow-300">Sistema:</p>
            <p className="text-gray-300">{table.game_system || 'Não especificado'}</p>
          </div>
          <div>
            <p className="text-yellow-300">Máximo de Jogadores:</p>
            <p className="text-gray-300">{table.max_players || 'Não especificado'}</p>
          </div>
          <div>
            <p className="text-yellow-300">Próxima Sessão:</p>
            <p className="text-gray-300">
              {table.session_date_time ? new Date(table.session_date_time).toLocaleString('pt-BR') : 'A definir'}
            </p>
          </div>
        </div>
        
        <div className="mt-8">
          {(() => {
            let buttonText = "Carregando status...";
            let buttonDisabled = true;
            let buttonOnClick: (() => void) | (() => Promise<void>) = () => {};

            if (userTableStatus === 'notLoggedIn') {
              buttonText = "Faça login para interagir";
            } else if (userTableStatus === 'isMaster') {
              buttonText = "Você é o mestre desta mesa";
            } else if (userTableStatus === 'isPlayer') {
              buttonText = "Você já participa desta mesa";
            } else if (userTableStatus === 'requestPending') {
              buttonText = "Solicitação Enviada";
            } else if (userTableStatus === 'requestRejected') {
              buttonText = "Solicitação Rejeitada"; // Poderia permitir nova solicitação após um tempo
            } else if (userTableStatus === 'canRequest') {
              buttonText = "Solicitar para Participar";
              buttonDisabled = isSubmittingRequest;
              buttonOnClick = handleRequestToJoin;
            } else if (userTableStatus === 'loading') {
              buttonText = "Verificando status...";
            } else if (userTableStatus === 'error') {
              buttonText = "Erro ao verificar status. Tente recarregar.";
            }

            if (isSubmittingRequest && userTableStatus === 'canRequest') {
                buttonText = "Enviando solicitação...";
            }

            return (
              <button
                onClick={buttonOnClick}
                disabled={buttonDisabled}
                className={`w-full font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline transition-colors duration-150 
                  ${buttonDisabled 
                    ? 'bg-gray-500 text-gray-300 cursor-not-allowed' 
                    : 'bg-yellow-500 hover:bg-yellow-600 text-gray-900'}`}
              >
                {buttonText}
              </button>
            );
          })()}
        </div>

      </div>
    </div>
  );
};

export default GameTableDetailPage;