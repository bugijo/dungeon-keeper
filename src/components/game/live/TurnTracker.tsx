
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause, SkipForward } from 'lucide-react';
import { toast } from 'sonner';

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
  } | null;
}

interface TurnTrackerProps {
  sessionId: string;
  participants: Participant[];
  isPaused: boolean;
}

interface TurnState {
  id: string | null;
  currentTurnUserId: string | null;
  isActive: boolean;
  roundNumber: number;
  turnStartedAt: Date | null;
  turnEndsAt: Date | null;
}

const DEFAULT_TURN_TIME = 60; // seconds

const TurnTracker: React.FC<TurnTrackerProps> = ({ 
  sessionId,
  participants,
  isPaused
}) => {
  const [turnState, setTurnState] = useState<TurnState>({
    id: null,
    currentTurnUserId: null,
    isActive: false,
    roundNumber: 1,
    turnStartedAt: null,
    turnEndsAt: null
  });
  
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  
  const [turnTime, setTurnTime] = useState(DEFAULT_TURN_TIME);
  const [activePlayerIndex, setActivePlayerIndex] = useState<number | null>(null);
  
  const playerParticipants = participants.filter(p => p.role !== 'gm');
  
  useEffect(() => {
    const fetchTurnState = async () => {
      try {
        const { data, error } = await supabase
          .from('session_timers')
          .select('*')
          .eq('session_id', sessionId)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          const turnState: TurnState = {
            id: data.id,
            currentTurnUserId: data.current_turn_user_id,
            isActive: data.is_active,
            roundNumber: data.round_number,
            turnStartedAt: data.turn_started_at ? new Date(data.turn_started_at) : null,
            turnEndsAt: data.turn_ends_at ? new Date(data.turn_ends_at) : null
          };
          
          setTurnState(turnState);
          
          if (turnState.currentTurnUserId) {
            const index = playerParticipants.findIndex(p => p.user_id === turnState.currentTurnUserId);
            if (index !== -1) {
              setActivePlayerIndex(index);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching turn state:", error);
      }
    };
    
    fetchTurnState();
    
    const channel = supabase
      .channel('session_timer_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'session_timers',
          filter: `session_id=eq.${sessionId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const data = payload.new;
            const turnState: TurnState = {
              id: data.id,
              currentTurnUserId: data.current_turn_user_id,
              isActive: data.is_active,
              roundNumber: data.round_number,
              turnStartedAt: data.turn_started_at ? new Date(data.turn_started_at) : null,
              turnEndsAt: data.turn_ends_at ? new Date(data.turn_ends_at) : null
            };
            
            setTurnState(turnState);
            
            if (turnState.currentTurnUserId) {
              const index = playerParticipants.findIndex(p => p.user_id === turnState.currentTurnUserId);
              if (index !== -1) {
                setActivePlayerIndex(index);
              }
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, playerParticipants]);
  
  useEffect(() => {
    if (!turnState.isActive || isPaused || !turnState.turnEndsAt) {
      setTimeRemaining(null);
      return;
    }
    
    const interval = setInterval(() => {
      const now = new Date();
      const endTime = new Date(turnState.turnEndsAt || '');
      const remaining = Math.max(0, Math.floor((endTime.getTime() - now.getTime()) / 1000));
      
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        nextTurn();
        clearInterval(interval);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [turnState.isActive, turnState.turnEndsAt, isPaused]);
  
  const startCombat = async () => {
    try {
      if (playerParticipants.length === 0) {
        toast.error("Não há jogadores disponíveis para iniciar o combate");
        return;
      }
      
      // Select the first player to start
      const firstPlayerId = playerParticipants[0].user_id;
      const now = new Date();
      const endTime = new Date(now.getTime() + turnTime * 1000);
      
      const timerData = {
        session_id: sessionId,
        current_turn_user_id: firstPlayerId,
        is_active: true,
        round_number: 1,
        turn_started_at: now.toISOString(),
        turn_ends_at: endTime.toISOString()
      };
      
      if (turnState.id) {
        // Update existing timer
        const { error } = await supabase
          .from('session_timers')
          .update(timerData)
          .eq('id', turnState.id);
          
        if (error) throw error;
      } else {
        // Create new timer
        const { error } = await supabase
          .from('session_timers')
          .insert(timerData);
          
        if (error) throw error;
      }
      
      setActivePlayerIndex(0);
      toast.success("Combate iniciado!");
      
    } catch (error) {
      console.error("Error starting combat:", error);
      toast.error("Erro ao iniciar combate");
    }
  };
  
  const pauseCombat = async () => {
    if (!turnState.id) return;
    
    try {
      const { error } = await supabase
        .from('session_timers')
        .update({ is_active: false })
        .eq('id', turnState.id);
        
      if (error) throw error;
      
      toast.info("Combate pausado");
    } catch (error) {
      console.error("Error pausing combat:", error);
      toast.error("Erro ao pausar combate");
    }
  };
  
  const resumeCombat = async () => {
    if (!turnState.id || !turnState.currentTurnUserId) return;
    
    try {
      const now = new Date();
      const endTime = new Date(now.getTime() + turnTime * 1000);
      
      const { error } = await supabase
        .from('session_timers')
        .update({
          is_active: true,
          turn_started_at: now.toISOString(),
          turn_ends_at: endTime.toISOString()
        })
        .eq('id', turnState.id);
        
      if (error) throw error;
      
      toast.success("Combate retomado");
    } catch (error) {
      console.error("Error resuming combat:", error);
      toast.error("Erro ao retomar combate");
    }
  };
  
  const nextTurn = async () => {
    if (!turnState.id || playerParticipants.length === 0) return;
    
    try {
      let nextIndex = 0;
      
      if (activePlayerIndex !== null) {
        nextIndex = (activePlayerIndex + 1) % playerParticipants.length;
      }
      
      const nextPlayerId = playerParticipants[nextIndex].user_id;
      const now = new Date();
      const endTime = new Date(now.getTime() + turnTime * 1000);
      
      let roundNumber = turnState.roundNumber;
      
      // If we've gone through all players, increment the round
      if (nextIndex === 0) {
        roundNumber++;
      }
      
      const { error } = await supabase
        .from('session_timers')
        .update({
          current_turn_user_id: nextPlayerId,
          round_number: roundNumber,
          turn_started_at: now.toISOString(),
          turn_ends_at: endTime.toISOString(),
          is_active: true
        })
        .eq('id', turnState.id);
        
      if (error) throw error;
      
      setActivePlayerIndex(nextIndex);
      toast.info(`Turno de ${playerParticipants[nextIndex].profiles?.display_name || 'Jogador'}`);
      
    } catch (error) {
      console.error("Error advancing turn:", error);
      toast.error("Erro ao avançar turno");
    }
  };
  
  const endCombat = async () => {
    if (!turnState.id) return;
    
    try {
      const { error } = await supabase
        .from('session_timers')
        .delete()
        .eq('id', turnState.id);
        
      if (error) throw error;
      
      setTurnState({
        id: null,
        currentTurnUserId: null,
        isActive: false,
        roundNumber: 1,
        turnStartedAt: null,
        turnEndsAt: null
      });
      
      setActivePlayerIndex(null);
      setTimeRemaining(null);
      
      toast.success("Combate finalizado");
    } catch (error) {
      console.error("Error ending combat:", error);
      toast.error("Erro ao finalizar combate");
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const getCurrentPlayerName = (): string => {
    if (activePlayerIndex === null || !playerParticipants[activePlayerIndex]) {
      return "Ninguém";
    }
    
    const player = playerParticipants[activePlayerIndex];
    const characterName = player.characters?.name;
    const playerName = player.profiles?.display_name || "Jogador";
    
    return characterName ? `${characterName} (${playerName})` : playerName;
  };
  
  return (
    <div className="absolute top-0 left-0 right-0 bg-fantasy-dark/80 border-b border-fantasy-purple/30 p-3 z-10 flex justify-between items-center">
      <div className="flex items-center gap-2">
        <div className="bg-fantasy-purple/20 p-1 rounded">
          <Clock size={18} className="text-fantasy-gold" />
        </div>
        <span className="font-medievalsharp text-white">Turno:</span>
        <span className="font-bold text-fantasy-gold">{getCurrentPlayerName()}</span>
        
        {timeRemaining !== null && (
          <span className="ml-2 bg-fantasy-dark px-2 py-1 rounded font-mono text-white">
            {formatTime(timeRemaining)}
          </span>
        )}
        
        {turnState.roundNumber > 1 && (
          <span className="ml-2 text-fantasy-stone text-sm">
            Round {turnState.roundNumber}
          </span>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        {!turnState.id || !turnState.isActive ? (
          <Button
            onClick={startCombat}
            className="fantasy-button primary"
            disabled={isPaused || playerParticipants.length === 0}
          >
            Iniciar Combate
          </Button>
        ) : (
          <>
            {turnState.isActive ? (
              <Button
                onClick={pauseCombat}
                className="fantasy-button secondary"
                disabled={isPaused}
              >
                <Pause size={16} className="mr-1" />
                Pausar
              </Button>
            ) : (
              <Button
                onClick={resumeCombat}
                className="fantasy-button primary"
                disabled={isPaused}
              >
                <Play size={16} className="mr-1" />
                Retomar
              </Button>
            )}
            
            <Button
              onClick={nextTurn}
              className="fantasy-button secondary"
              disabled={isPaused || playerParticipants.length === 0}
            >
              <SkipForward size={16} className="mr-1" />
              Próximo
            </Button>
            
            <Button
              onClick={endCombat}
              className="fantasy-button destructive"
              disabled={isPaused}
            >
              Finalizar
            </Button>
          </>
        )}
        
        <select 
          className="bg-fantasy-dark border border-fantasy-purple/30 rounded p-1 text-white text-sm"
          value={turnTime}
          onChange={(e) => setTurnTime(parseInt(e.target.value))}
        >
          <option value="30">30s</option>
          <option value="60">1m</option>
          <option value="120">2m</option>
          <option value="300">5m</option>
        </select>
      </div>
    </div>
  );
};

export default TurnTracker;
