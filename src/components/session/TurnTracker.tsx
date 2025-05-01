
import React, { useState, useEffect } from 'react';
import { SessionTurn, SessionParticipant } from '@/types/session';
import { Clock, User } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TurnTrackerProps {
  sessionTurn: SessionTurn | null;
  participants: SessionParticipant[];
  isGameMaster: boolean;
}

const TurnTracker: React.FC<TurnTrackerProps> = ({
  sessionTurn,
  participants,
  isGameMaster
}) => {
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [progress, setProgress] = useState(100);
  
  useEffect(() => {
    if (
      !sessionTurn || 
      !sessionTurn.current_turn_user_id || 
      !sessionTurn.turn_ends_at || 
      sessionTurn.is_paused
    ) {
      setRemainingTime(null);
      return;
    }
    
    const updateTimer = () => {
      const now = new Date();
      const turnEndsAt = new Date(sessionTurn.turn_ends_at!);
      const turnStartedAt = new Date(sessionTurn.turn_started_at!);
      const totalDuration = turnEndsAt.getTime() - turnStartedAt.getTime();
      const elapsed = now.getTime() - turnStartedAt.getTime();
      
      const remaining = Math.max(0, turnEndsAt.getTime() - now.getTime());
      const remainingSeconds = Math.ceil(remaining / 1000);
      
      setRemainingTime(remainingSeconds);
      setProgress(Math.max(0, 100 - (elapsed / totalDuration) * 100));
      
      if (remaining <= 0) {
        // Turn has ended
        clearInterval(timer);
      }
    };
    
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    
    return () => clearInterval(timer);
  }, [sessionTurn]);
  
  const getCurrentTurnParticipant = () => {
    if (!sessionTurn?.current_turn_user_id) return null;
    
    return participants.find(p => p.user_id === sessionTurn.current_turn_user_id);
  };
  
  const currentParticipant = getCurrentTurnParticipant();
  
  // If no active turn, don't display the tracker
  if (!sessionTurn?.current_turn_user_id) return null;
  
  return (
    <div className="absolute top-3 left-3 z-10 bg-fantasy-dark/90 border border-fantasy-purple/30 rounded px-4 py-2 min-w-64">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center">
          <Clock size={16} className="text-fantasy-gold mr-2" />
          <span className="text-white font-medievalsharp">Current Turn</span>
        </div>
        <div className="text-xs bg-fantasy-purple/20 px-2 py-0.5 rounded text-fantasy-stone">
          Round {sessionTurn.round_number}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-2">
        <div className="flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-fantasy-purple/20 flex items-center justify-center">
            <User size={16} className="text-fantasy-stone" />
          </div>
        </div>
        <div>
          <div className="text-white font-medium">
            {currentParticipant?.character_name || currentParticipant?.display_name || 'Unknown'}
          </div>
          <div className="text-xs text-fantasy-stone">
            {sessionTurn.is_paused 
              ? 'Timer paused' 
              : remainingTime !== null 
                ? `${remainingTime} seconds remaining` 
                : 'Turn in progress'}
          </div>
        </div>
      </div>
      
      {!sessionTurn.is_paused && remainingTime !== null && (
        <Progress value={progress} className="h-1 bg-fantasy-dark" />
      )}
    </div>
  );
};

export default TurnTracker;
