
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { toast } from 'sonner';
import LiveSessionMap from '@/components/game/live/LiveSessionMap';
import ChatPanel from '@/components/game/live/ChatPanel';
import DicePanel from '@/components/game/live/DicePanel';
import SessionHeader from '@/components/game/live/SessionHeader';
import GameMasterPanel from '@/components/game/master/GameMasterPanel';
import TurnTracker from '@/components/game/live/TurnTracker';
import { Button } from '@/components/ui/button';
import { MapToken } from '@/types/game';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog';

interface Participant {
  id: string;
  user_id: string;
  role: string;
  profiles: {
    display_name: string;
  } | null;
  characters?: {
    id: string;
    name: string;
    race: string;
    class: string;
  } | null;
}

const LiveSession = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tableData, setTableData] = useState<any>(null);
  const [isGameMaster, setIsGameMaster] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [activeMap, setActiveMap] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!id || !user) {
        navigate('/tables');
        return;
      }

      try {
        setLoading(true);

        const { data: participantData, error: participantError } = await supabase
          .from('table_participants')
          .select('role')
          .eq('table_id', id)
          .eq('user_id', user.id)
          .single();

        if (participantError || !participantData) {
          toast.error('Você não é participante desta mesa');
          navigate('/tables');
          return;
        }

        setIsGameMaster(participantData.role === 'gm');

        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('*, session_paused')
          .eq('id', id)
          .single();

        if (tableError || !tableData) {
          toast.error('Erro ao carregar dados da mesa');
          navigate('/tables');
          return;
        }

        setTableData(tableData);
        setIsPaused(tableData.session_paused || false);
        setSessionStartTime(new Date());

        const { data: participantsData, error: participantsError } = await supabase
          .from('table_participants')
          .select(`
            id, user_id, role,
            profiles:user_id (display_name),
            characters:character_id (id, name, race, class)
          `)
          .eq('table_id', id);
          
        if (participantsError) {
          console.error("Erro ao buscar participantes:", participantsError);
        } else if (participantsData) {
          const typedParticipants: Participant[] = participantsData.map(p => ({
            id: p.id,
            user_id: p.user_id,
            role: p.role,
            profiles: p.profiles as any,
            characters: p.characters
          }));
          
          setParticipants(typedParticipants);
        }

        // Fetch session tokens from the database
        const { data: tokensData, error: tokensError } = await supabase
          .from('session_tokens')
          .select('*')
          .eq('session_id', id);
          
        if (tokensError) {
          console.error("Erro ao buscar tokens:", tokensError);
        } else if (tokensData) {
          setTokens(tokensData as MapToken[]);
        }

        const tableStatusChannel = supabase
          .channel('table_status_changes')
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
                setIsPaused(payload.new.session_paused as boolean);
                
                if (payload.new.session_paused) {
                  toast.info("A sessão foi pausada pelo mestre");
                } else {
                  toast.info("A sessão foi retomada pelo mestre");
                }
              }
            }
          )
          .subscribe();
          
        // Subscribe to token changes
        const tokensChannel = supabase
          .channel('tokens_changes')
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
                setTokens(prev => [...prev, payload.new as MapToken]);
              } else if (payload.eventType === 'UPDATE') {
                setTokens(prev => 
                  prev.map(token => 
                    token.id === payload.new.id ? { ...payload.new as MapToken } : token
                  )
                );
              } else if (payload.eventType === 'DELETE') {
                setTokens(prev => prev.filter(token => token.id !== payload.old.id));
              }
            }
          )
          .subscribe();

        return () => {
          supabase.removeChannel(tableStatusChannel);
          supabase.removeChannel(tokensChannel);
        };
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
        toast.error('Erro ao carregar dados da sessão');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [id, user, navigate]);

  const handleEndSession = () => {
    if (!isGameMaster) return;
  };

  const handleTokenMove = async (tokenId: string, newX: number, newY: number) => {
    if (!isGameMaster && isPaused) {
      toast.error("A sessão está pausada. Aguarde o mestre retomá-la.");
      return;
    }
    
    try {
      const token = tokens.find(t => t.id === tokenId);
      if (!token) return;
      
      const { error } = await supabase
        .from('session_tokens')
        .update({ x: newX, y: newY })
        .eq('id', tokenId);
        
      if (error) throw error;
    } catch (error) {
      console.error("Erro ao mover token:", error);
      toast.error("Não foi possível mover o token");
    }
  };

  const addToken = async (tokenData: {
    name: string;
    type: string;
    color: string;
    size: number;
    x: number;
    y: number;
  }) => {
    if (!isGameMaster || !id) return;
    
    try {
      const { error } = await supabase
        .from('session_tokens')
        .insert({
          session_id: id,
          token_type: tokenData.type,
          name: tokenData.name,
          x: tokenData.x,
          y: tokenData.y,
          color: tokenData.color,
          size: tokenData.size,
          user_id: user?.id
        });
        
      if (error) throw error;
      
      toast.success('Token adicionado');
    } catch (error) {
      console.error("Erro ao adicionar token:", error);
      toast.error("Não foi possível adicionar o token");
    }
  };

  const deleteToken = async (tokenId: string) => {
    if (!isGameMaster) return;
    
    try {
      const { error } = await supabase
        .from('session_tokens')
        .delete()
        .eq('id', tokenId);
        
      if (error) throw error;
      
      setTokens(prev => prev.filter(t => t.id !== tokenId));
      toast.success('Token removido');
    } catch (error) {
      console.error("Erro ao remover token:", error);
      toast.error("Não foi possível remover o token");
    }
  };

  const toggleSessionPause = async () => {
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
    } catch (error) {
      console.error('Erro ao alterar estado da sessão:', error);
      toast.error('Erro ao alterar estado da sessão');
    }
  };

  const confirmEndSession = async () => {
    if (!isGameMaster) return;

    try {
      await supabase
        .from('tables')
        .update({ status: 'completed' })
        .eq('id', id);

      toast.success('Sessão encerrada com sucesso');
      navigate('/tables');
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Erro ao encerrar sessão');
    }
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

  return (
    <MainLayout>
      <div className="flex flex-col h-[calc(100vh-80px)]">
        <div className="flex justify-between items-center px-4 py-3 bg-fantasy-dark border-b border-fantasy-purple/30">
          <div className="flex items-center">
            <SessionHeader 
              sessionName={tableData?.name} 
              startTime={sessionStartTime} 
              onEndSession={handleEndSession} 
              isGameMaster={isGameMaster}
              isPaused={isPaused}
              onTogglePause={isGameMaster ? toggleSessionPause : undefined}
            />
          </div>
          
          {isGameMaster && (
            <div className="flex items-center gap-2">              
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="fantasy-button destructive">
                    Encerrar Sessão
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-fantasy-dark border border-fantasy-purple/50">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-fantasy-gold font-medievalsharp">
                      Encerrar Sessão
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-fantasy-stone">
                      Tem certeza que deseja encerrar esta sessão? Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="hover:bg-fantasy-dark/50 hover:text-white">
                      Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                      onClick={confirmEndSession} 
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Encerrar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="flex flex-1 overflow-hidden">
          <DicePanel 
            sessionId={id || ''} 
            userId={user?.id || ''} 
            isPaused={isPaused}
            isGameMaster={isGameMaster}
            participants={participants}
          />
          
          <div className="flex-1 relative h-full overflow-hidden">
            {isPaused && !isGameMaster && (
              <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center">
                <div className="text-center bg-fantasy-dark/90 p-6 rounded-lg border border-fantasy-purple max-w-md">
                  <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-3">
                    Sessão Pausada
                  </h2>
                  <p className="text-fantasy-stone">
                    O mestre pausou a sessão. Por favor, aguarde até que a sessão seja retomada.
                  </p>
                </div>
              </div>
            )}
            
            {isGameMaster && (
              <TurnTracker
                sessionId={id || ''}
                participants={participants}
                isPaused={isPaused}
              />
            )}
            
            <LiveSessionMap
              tokens={tokens}
              isGameMaster={isGameMaster}
              onTokenMove={handleTokenMove}
              onAddToken={addToken}
              onDeleteToken={deleteToken}
              participants={participants}
              isPaused={isPaused && !isGameMaster}
              userId={user?.id || ''}
            />
          </div>
          
          <ChatPanel 
            sessionId={id || ''} 
            userId={user?.id || ''}
            participants={participants}
          />

          {isGameMaster && (
            <GameMasterPanel 
              sessionId={id || ''} 
              userId={user?.id || ''} 
              isPaused={isPaused}
              onTogglePause={toggleSessionPause}
            />
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default LiveSession;
