
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Clock, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SessionHeaderProps {
  sessionName: string;
  startTime: Date | null;
  onEndSession: () => void;
  isGameMaster: boolean;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const SessionHeader: React.FC<SessionHeaderProps> = ({
  sessionName,
  startTime,
  onEndSession,
  isGameMaster,
  isPaused = false,
  onTogglePause
}) => {
  const [elapsedTime, setElapsedTime] = useState<string>('00:00:00');
  
  useEffect(() => {
    if (!startTime || isPaused) return;
    
    const intervalId = setInterval(() => {
      const now = new Date();
      const diff = now.getTime() - startTime.getTime();
      
      const hours = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const minutes = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const seconds = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      
      setElapsedTime(`${hours}:${minutes}:${seconds}`);
    }, 1000);
    
    return () => clearInterval(intervalId);
  }, [startTime, isPaused]);
  
  return (
    <div className="flex items-center">
      <Link to="/tables" className="text-fantasy-stone hover:text-white mr-4">
        &larr; Voltar
      </Link>
      <h1 className="text-xl font-medievalsharp text-fantasy-gold">
        {sessionName || "Sessão de RPG"}
      </h1>
      
      <div className="ml-4 flex items-center">
        <Clock size={20} className="text-fantasy-gold mr-2" />
        <span className="font-mono text-lg text-white">{elapsedTime}</span>
        
        {onTogglePause && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onTogglePause}
            className="ml-2"
            title={isPaused ? "Retomar sessão" : "Pausar sessão"}
          >
            {isPaused ? <Play size={18} /> : <Pause size={18} />}
          </Button>
        )}
      </div>
    </div>
  );
};

export default SessionHeader;
