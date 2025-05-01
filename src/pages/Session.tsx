
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';
import TacticalMap from '@/components/session/TacticalMap';
import GameMasterPanel from '@/components/session/GameMasterPanel';
import ChatPanel from '@/components/session/ChatPanel';
import TurnTracker from '@/components/session/TurnTracker';
import { SessionParticipant, TokenPosition, SessionTurn, SessionMessage } from '@/types/session';
import debounce from 'lodash/debounce';

const Session = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [participants, setParticipants] = useState<SessionParticipant[]>([]);
  const [tokens, setTokens] = useState<TokenPosition[]>([]);
  const [sessionTurn, setSessionTurn] = useState<SessionTurn | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const verifyParticipation = async () => {
      if (!id || !user) {
        navigate('/tables');
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data: participantData, error: participantError } = await supabase
          .from('table_participants')
          .select('id, user_id, role, character_id')
          .eq('table_id', id)
          .eq('user_id', user.id)
          .single();

        if (participantError) {
          console.error('Participation check error:', participantError);
          throw new Error('Você não é participante desta sessão');
        }

        setIsGameMaster(participantData.role === 'gm');

        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*')
          .eq('id', id)
          .single();

        if (tableError) {
          throw new Error('Falha ao carregar dados da sessão');
        }

        setSessionData(tableData);
        setIsPaused(tableData.session_paused || false);

        const { data: allParticipants, error: allParticipantsError } = await supabase
          .from('table_participants')
          .select(`
            id, user_id, role, character_id,
            profiles:user_id (display_name),
            characters:character_id (id, name)
          `)
          .eq('table_id', id);

        if (allParticipantsError) {
          console.error('Error loading participants:', allParticipantsError);
        } else {
          const formattedParticipants: SessionParticipant[] = allParticipants.map((p: any) => ({
            id: p.id,
            user_id: p.user_id,
            role: p.role,
            display_name: p.profiles?.display_name,
            character_id: p.character_id,
            character_name: p.characters?.name
          }));
          setParticipants(formattedParticipants);
        }

        const { data: tokenData, error: tokenError } = await supabase
          .from('session_tokens')
          .select('*')
          .eq('session_id', id);

        if (tokenError) {
          console.error('Error loading tokens:', tokenError);
        } else {
          const formattedTokens: TokenPosition[] = (tokenData || []).map((token: any) => ({
            ...token,
            token_type: ['character', 'monster', 'npc', 'object'].includes(token.token_type) 
              ? token.token_type 
              : 'character',
            is_visible_to_players: true
          }));
          setTokens(formattedTokens);
        }

        const defaultTurn: SessionTurn = {
          id: id || '',
          session_id: id || '',
          current_turn_user_id: null,
          turn_started_at: null,
          turn_ends_at: null,
          turn_duration: 60,
          is_paused: false,
          round_number: 1,
          turn_order: []
        };

        const storedTurnData = localStorage.getItem(`session_turn_${id}`);
        
        if (storedTurnData) {
          try {
            const parsedTurnData = JSON.parse(storedTurnData);
            setSessionTurn({
              ...defaultTurn,
              ...parsedTurnData
            });
          } catch (e) {
            console.error('Error parsing stored turn data:', e);
            setSessionTurn(defaultTurn);
          }
        } else {
          setSessionTurn(defaultTurn);
        }
      } catch (err: any) {
        console.error('Session loading error:', err);
        setError(err.message || 'Ocorreu um erro ao carregar a sessão');
        toast.error(err.message || 'Falha ao carregar sessão');
        navigate('/tables');
      } finally {
        setLoading(false);
      }
    };

    verifyParticipation();
  }, [id, user, navigate]);

  useEffect(() => {
    if (!id) return;

    // Configurar realtime para atualizar tokens
    const tokenChannel = supabase
      .channel('session_tokens_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_tokens',
          filter: `session_id=eq.${id}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newToken = {
              ...payload.new,
              token_type: ['character', 'monster', 'npc', 'object'].includes(payload.new.token_type)
                ? payload.new.token_type
                : 'character',
              is_visible_to_players: true
            } as TokenPosition;
            
            setTokens(prev => [...prev, newToken]);
          } else if (payload.eventType === 'UPDATE') {
            const updatedToken = {
              ...payload.new,
              token_type: ['character', 'monster', 'npc', 'object'].includes(payload.new.token_type)
                ? payload.new.token_type
                : 'character',
              is_visible_to_players: true
            } as TokenPosition;
            
            setTokens(prev => 
              prev.map(token => token.id === updatedToken.id ? updatedToken : token)
            );
          } else if (payload.eventType === 'DELETE') {
            setTokens(prev => prev.filter(token => token.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    // Canal para atualizar status da sessão
    const tableChannel = supabase
      .channel('table_custom_data_changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${id}`
        },
        (payload) => {
          if (payload.new && 'session_paused' in payload.new) {
            setIsPaused(payload.new.session_paused);
            if (payload.new.session_paused) {
              toast.info('Sessão pausada pelo Mestre');
            } else {
              toast.info('Sessão retomada pelo Mestre');
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tokenChannel);
      supabase.removeChannel(tableChannel);
    };
  }, [id]);

  const updateSessionTurn = (turnData: Partial<SessionTurn>) => {
    if (!sessionTurn || !id) return;
    
    const updatedTurn = {
      ...sessionTurn,
      ...turnData
    };
    
    setSessionTurn(updatedTurn);
    
    localStorage.setItem(`session_turn_${id}`, JSON.stringify(updatedTurn));
  };

  // Versão com debounce para evitar muitas chamadas
  const debouncedTokenMove = debounce(async (tokenId: string, x: number, y: number) => {
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    
    const canMove = isGameMaster || token.user_id === user?.id;
    if (!canMove || isPaused) return;

    try {
      const { error } = await supabase
        .from('session_tokens')
        .update({ x, y })
        .eq('id', tokenId);

      if (error) throw error;
    } catch (error) {
      console.error('Error moving token:', error);
      toast.error('Falha ao mover token');
    }
  }, 500);

  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    // Atualiza a UI imediatamente
    setTokens(prev => prev.map(token => 
      token.id === tokenId ? { ...token, x, y } : token
    ));
    
    // Chama a versão com debounce para o banco de dados
    debouncedTokenMove(tokenId, x, y);
  };

  const handleTogglePause = async () => {
    if (!isGameMaster || !id) return;

    try {
      const newPausedState = !isPaused;
      const { error } = await supabase
        .from('tables')
        .update({ session_paused: newPausedState })
        .eq('id', id);

      if (error) throw error;
      
      setIsPaused(newPausedState);
      toast.success(newPausedState ? 'Sessão pausada' : 'Sessão retomada');

      if (sessionTurn) {
        updateSessionTurn({ is_paused: newPausedState });
      }
    } catch (error) {
      console.error('Error toggling session pause:', error);
      toast.error('Falha ao atualizar estado da sessão');
    }
  };

  const handleTokenVisibility = async (tokenId: string, isVisible: boolean) => {
    if (!isGameMaster) return;

    try {
      setTokens(prev =>
        prev.map(token => 
          token.id === tokenId ? { ...token, is_visible_to_players: isVisible } : token
        )
      );
      
      toast.success(`Token ${isVisible ? 'mostrado aos' : 'escondido dos'} jogadores`);
    } catch (error) {
      console.error('Error updating token visibility:', error);
      toast.error('Falha ao atualizar visibilidade do token');
    }
  };

  const handleAddToken = async (tokenData: Omit<TokenPosition, 'id' | 'session_id'>) => {
    if (!isGameMaster || !id) return;

    try {
      const { is_visible_to_players, ...dbSafeTokenData } = tokenData;
      
      const validatedTokenData = {
        ...dbSafeTokenData,
        token_type: ['character', 'monster', 'npc', 'object'].includes(dbSafeTokenData.token_type)
          ? dbSafeTokenData.token_type
          : 'character'
      };
      
      const { data, error } = await supabase
        .from('session_tokens')
        .insert([{
          ...validatedTokenData,
          session_id: id,
          user_id: user?.id
        }])
        .select();

      if (error) throw error;
      
      if (data && data[0]) {
        const newToken: TokenPosition = {
          ...data[0],
          token_type: ['character', 'monster', 'npc', 'object'].includes(data[0].token_type)
            ? data[0].token_type as 'character' | 'monster' | 'npc' | 'object'
            : 'character',
          is_visible_to_players: tokenData.is_visible_to_players || true
        };
        
        setTokens(prev => [...prev, newToken]);
      }
      
      toast.success('Token adicionado');
    } catch (error) {
      console.error('Error adding token:', error);
      toast.error('Falha ao adicionar token');
    }
  };

  const handleDeleteToken = async (tokenId: string) => {
    if (!isGameMaster) return;

    try {
      const { error } = await supabase
        .from('session_tokens')
        .delete()
        .eq('id', tokenId);

      if (error) throw error;
      toast.success('Token removido');
    } catch (error) {
      console.error('Error deleting token:', error);
      toast.error('Falha ao excluir token');
    }
  };

  const handleTurnUpdate = (turnData: Partial<SessionTurn>) => {
    if (!isGameMaster) return;
    updateSessionTurn(turnData);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center items-center h-[calc(100vh-80px)]">
          <div className="animate-pulse text-fantasy-purple">Carregando sessão...</div>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout>
        <div className="flex flex-col justify-center items-center h-[calc(100vh-80px)]">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            onClick={() => navigate('/tables')} 
            className="fantasy-button primary"
          >
            Retornar às mesas
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-fantasy-dark">
      <header className="bg-fantasy-dark border-b border-fantasy-purple/30 p-3 flex justify-between items-center">
        <h1 className="text-xl font-medievalsharp text-fantasy-gold">{sessionData?.name || 'Sessão de RPG'}</h1>
        
        {isGameMaster && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePause}
              className={`fantasy-button ${isPaused ? 'primary' : 'secondary'}`}
            >
              {isPaused ? 'Retomar Sessão' : 'Pausar Sessão'}
            </button>
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {isGameMaster && (
          <GameMasterPanel 
            sessionId={id || ''} 
            participants={participants}
            isPaused={isPaused}
            onTogglePause={handleTogglePause}
            sessionTurn={sessionTurn}
            onAddToken={handleAddToken}
            onTurnUpdate={handleTurnUpdate}
          />
        )}

        <div className="flex-1 relative">
          {isPaused && !isGameMaster && (
            <div className="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">
              <div className="bg-fantasy-dark p-6 rounded-lg border border-fantasy-purple text-center max-w-md">
                <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-3">Sessão Pausada</h2>
                <p className="text-fantasy-stone">O Mestre da sessão pausou o jogo. Aguarde até que ele retome.</p>
              </div>
            </div>
          )}

          <TurnTracker
            sessionTurn={sessionTurn}
            participants={participants}
            isGameMaster={isGameMaster}
          />
          
          <TacticalMap
            tokens={tokens}
            isGameMaster={isGameMaster}
            isPaused={isPaused}
            onTokenMove={handleTokenMove}
            onTokenVisibilityToggle={handleTokenVisibility}
            onDeleteToken={handleDeleteToken}
            onAddToken={handleAddToken}
            userId={user?.id || ''}
            sessionId={id || ''}
          />
        </div>

        <ChatPanel
          sessionId={id || ''}
          userId={user?.id || ''}
          participants={participants}
          isPaused={isPaused && !isGameMaster}
        />
      </div>
    </div>
  );
};

export default Session;
