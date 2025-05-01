
import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import MainLayout from "@/components/layout/MainLayout";
import { ArrowLeft } from "lucide-react";
import PlayerPreSessionScreen from "@/components/game/PlayerPreSessionScreen";
import PlayerEnvironmentView from "@/components/game/player/PlayerEnvironmentView";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useEnvironmentControl } from '@/hooks/useEnvironmentControl';
import { toast } from 'sonner';

const PlayerView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tableData, setTableData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [character, setCharacter] = useState<any>(null);
  
  useEffect(() => {
    const fetchData = async () => {
      if (!id || !user) return;
      
      try {
        setLoading(true);
        
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single();
          
        if (tableError) throw tableError;
        
        setTableData(tableData);
        
        const { data: participationData, error: participationError } = await supabase
          .from('table_participants')
          .select('*, characters:character_id(*)')
          .eq('table_id', id)
          .eq('user_id', user.id)
          .single();
          
        if (participationError && participationError.code !== 'PGRST116') {
          throw participationError;
        }
        
        if (!participationData) {
          toast.error('Você não está participando desta mesa');
          navigate('/tables');
          return;
        }
        
        if (participationData.characters) {
          setCharacter(participationData.characters);
        }
        
      } catch (error) {
        console.error('Error fetching table data:', error);
        toast.error('Erro ao carregar dados da mesa');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [id, user, navigate]);
  
  if (loading) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone animate-pulse">Carregando mesa...</p>
          </div>
        </div>
      </MainLayout>
    );
  }
  
  if (!tableData) {
    return (
      <MainLayout>
        <div className="container mx-auto py-6">
          <div className="fantasy-card p-6 text-center">
            <p className="text-fantasy-stone">Mesa não encontrada ou você não tem permissão para acessá-la.</p>
            <Link to="/tables" className="fantasy-button primary mt-4 inline-block">
              Voltar para Mesas
            </Link>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Usar o hook de controle de ambiente para jogadores
  const {
    currentScene,
    narrativeText,
    activeImage,
    audioControls
  } = useEnvironmentControl({
    tableId: id || '',
    isMaster: false
  });

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex items-center mb-6">
          <Link to="/tables" className="mr-4">
            <ArrowLeft className="text-fantasy-stone hover:text-white transition-colors" />
          </Link>
          <h1 className="text-3xl font-medievalsharp text-white">{tableData.name}</h1>
        </div>
        
        {/* Visualização do ambiente controlado pelo mestre */}
        <div className="mb-6">
          <PlayerEnvironmentView 
            sessionId={tableData.current_session_id || ''}
            tableId={id || ''}
          />
        </div>

        <PlayerPreSessionScreen 
          tableId={id || ''} 
          weekday={tableData.weekday}
          time={tableData.time}
          character={character}
        />
      </div>
    </MainLayout>
  );
};

export default PlayerView;
