import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Spinner } from '@/components/ui/spinner';
import { TableHeader } from '@/components/table/TableHeader';
import { ParticipantsList } from '@/components/table/ParticipantsList';
import { TableActions } from '@/components/table/TableActions';

const TableDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, session } = useAuth();
  const [tableDetails, setTableDetails] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [joinRequestStatus, setJoinRequestStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);

  const isValidUUID = (uuid: string) => {
    try {
      const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return regex.test(uuid);
    } catch(e) {
      return false;
    }
  };

  useEffect(() => {
    const fetchTableDetails = async () => {
      if (!id) {
        setError("ID da mesa não fornecido");
        setLoading(false);
        return;
      }

      if (!isValidUUID(id)) {
        setError(`ID de mesa inválido: ${id}. Use um UUID válido.`);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single();

        if (tableError) {
          console.error("Erro ao carregar detalhes da mesa:", tableError);
          setError("Erro ao carregar detalhes da mesa: " + tableError.message);
          setLoading(false);
          return;
        }

        if (!tableData) {
          setError("Mesa não encontrada");
          setLoading(false);
          return;
        }

        setTableDetails(tableData);

        const { data: participantsData, error: participantsError } = await supabase
          .from('table_participants')
          .select('*, profiles(display_name)')
          .eq('table_id', id);

        if (participantsError) {
          console.error("Erro ao carregar participantes:", participantsError);
          toast.error('Erro ao carregar participantes');
        } else {
          setParticipants(participantsData || []);
        }

        if (session?.user) {
          const { data: requestData, error: requestError } = await supabase
            .from('table_join_requests')
            .select('status')
            .eq('table_id', id)
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (requestError) {
            console.error("Erro ao verificar solicitação:", requestError);
          } else {
            setJoinRequestStatus(requestData?.status || null);
          }
        }

        setLoading(false);
      } catch (err: any) {
        console.error("Erro ao carregar dados:", err);
        setError("Ocorreu um erro ao carregar os dados: " + (err.message || ''));
        setLoading(false);
      }
    };

    fetchTableDetails();
  }, [id, session]);

  const checkParticipation = async () => {
    if (!session?.user || !id) return;
    
    try {
      const { data, error } = await supabase
        .from('table_participants')
        .select('role')
        .eq('table_id', id)
        .eq('user_id', session.user.id)
        .maybeSingle();
      
      if (error) throw error;
      
      setIsParticipant(!!data);
      setUserRole(data?.role || null);
    } catch (err) {
      console.error("Error checking participation:", err);
    }
  };

  useEffect(() => {
    checkParticipation();
  }, [id, session]);

  const handleJoinRequest = async () => {
    if (!session?.user) {
      toast.error('Você precisa estar logado para solicitar participação');
      navigate('/login');
      return;
    }

    try {
      const { error } = await supabase
        .from('table_join_requests')
        .insert({
          table_id: id,
          user_id: session.user.id,
          status: 'pending'
        });

      if (error) {
        console.error("Erro ao enviar solicitação:", error);
        toast.error('Erro ao enviar solicitação: ' + error.message);
        return;
      }

      toast.success('Solicitação de participação enviada');
      setJoinRequestStatus('pending');
    } catch (err: any) {
      console.error("Erro ao enviar solicitação:", err);
      toast.error('Erro ao enviar solicitação: ' + (err.message || ''));
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-16 flex flex-col items-center justify-center">
          <Spinner size="lg" variant="shield" />
          <p className="text-fantasy-stone mt-4">Carregando detalhes da mesa...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="container mx-auto py-16 text-center">
          <div className="fantasy-card p-8">
            <h2 className="text-2xl text-red-500 mb-4">Erro</h2>
            <p className="text-fantasy-stone mb-6">{error}</p>
            <Button 
              onClick={() => navigate('/tables')}
              className="fantasy-button primary"
            >
              Voltar para Mesas
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!tableDetails) {
    return (
      <MainLayout>
        <div className="container mx-auto py-16 text-center">
          <div className="fantasy-card p-8">
            <h2 className="text-2xl text-fantasy-purple mb-4">Mesa não encontrada</h2>
            <p className="text-fantasy-stone mb-6">Não foi possível encontrar os detalhes desta mesa.</p>
            <Button 
              onClick={() => navigate('/tables')}
              className="fantasy-button primary"
            >
              Voltar para Mesas
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const isTableFull = participants.length >= (tableDetails?.max_players || 5);

  return (
    <MainLayout>
      <div className="container mx-auto py-8 px-4">
        <div className="fantasy-card p-6 mb-6">
          <h1 className="text-3xl font-medievalsharp text-fantasy-purple mb-4">
            {tableDetails?.name}
          </h1>
          
          {tableDetails && <TableHeader tableDetails={tableDetails} />}

          <div className="mb-6">
            <h2 className="text-xl font-medievalsharp text-fantasy-stone mb-2">Sinopse</h2>
            <p className="text-fantasy-stone">{tableDetails?.synopsis || 'Nenhuma sinopse disponível'}</p>
          </div>

          <ParticipantsList participants={participants} />

          <TableActions 
            tableId={id || ''}
            isTableFull={participants.length >= (tableDetails?.max_players || 5)}
            joinRequestStatus={joinRequestStatus}
            isParticipant={isParticipant}
            userRole={userRole}
            tableStatus={tableDetails?.status || 'open'}
            onJoinRequest={handleJoinRequest}
            userId={user?.id}
            tableOwnerId={tableDetails?.user_id}
          />
        </div>
      </div>
    </MainLayout>
  );
};

export default TableDetailsView;
