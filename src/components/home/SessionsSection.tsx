import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import UpcomingSessionsWidget from '@/components/session/UpcomingSessionsWidget';
import { Button } from '@/components/ui/button';
import { CalendarDays, Plus } from 'lucide-react';

const SessionsSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-medievalsharp text-white flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          Sessões
        </h2>
        <Button 
          size="sm" 
          onClick={() => navigate('/session-scheduler')}
          className="flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Agendar
        </Button>
      </div>
      
      <UpcomingSessionsWidget limit={3} showViewAll={true} />
    </div>
  );
};

export default SessionsSection;