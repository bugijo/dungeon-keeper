import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SessionService, ScheduledSession } from '@/services/sessionService';
import { Calendar, Clock, CalendarDays, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, isToday, isTomorrow, addDays, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface UpcomingSessionsWidgetProps {
  limit?: number;
  showViewAll?: boolean;
}

const UpcomingSessionsWidget: React.FC<UpcomingSessionsWidgetProps> = ({ 
  limit = 3,
  showViewAll = true
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [upcomingSessions, setUpcomingSessions] = useState<ScheduledSession[]>([]);

  useEffect(() => {
    const fetchUpcomingSessions = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const sessions = await SessionService.getUserUpcomingSessions(user.id);
        setUpcomingSessions(sessions.slice(0, limit));
      } catch (error) {
        console.error('Erro ao carregar próximas sessões:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingSessions();
  }, [user, limit]);

  // Formatar data para exibição
  const formatSessionDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return 'Hoje';
      if (isTomorrow(date)) return 'Amanhã';
      return format(date, "dd 'de' MMMM", { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };

  // Determinar dia da semana com base na data
  const getWeekdayFromDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  // Verificar se a sessão está próxima (menos de 24 horas)
  const isSessionSoon = (dateStr: string, timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const sessionDate = parseISO(dateStr);
      sessionDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const timeDiff = sessionDate.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      return hoursDiff <= 24 && hoursDiff > 0;
    } catch (e) {
      return false;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Sessões</CardTitle>
          <CardDescription>Carregando suas sessões agendadas...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (upcomingSessions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próximas Sessões</CardTitle>
          <CardDescription>Você não tem sessões agendadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">Nenhuma sessão agendada</p>
          </div>
        </CardContent>
        {showViewAll && (
          <CardFooter>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate('/session-scheduler')}
            >
              Agendar Sessão
            </Button>
          </CardFooter>
        )}
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Próximas Sessões</CardTitle>
        <CardDescription>Suas próximas sessões agendadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {upcomingSessions.map(session => {
          const isSoon = isSessionSoon(session.scheduledDate, session.time);
          
          return (
            <div 
              key={session.id} 
              className={`p-3 rounded-md border ${isSoon ? 'border-primary bg-primary/5' : 'border-border'}`}
              onClick={() => navigate(`/game-master/${session.tableId}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{session.tableName}</h4>
                {isSoon && (
                  <span className="text-xs px-2 py-1 rounded-full bg-primary/20 text-primary">
                    Em breve
                  </span>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{formatSessionDate(session.scheduledDate)}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>{session.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
      {showViewAll && (
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={() => navigate('/session-scheduler')}
          >
            <span>Ver Todas</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default UpcomingSessionsWidget;