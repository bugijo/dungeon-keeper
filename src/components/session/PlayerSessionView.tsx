import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SessionService, ScheduledSession } from '@/services/sessionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Users, CalendarDays, ArrowRight, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PlayerSessionViewProps {
  tableId: string;
  userId: string;
}

const PlayerSessionView: React.FC<PlayerSessionViewProps> = ({ tableId, userId }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nextSession, setNextSession] = useState<ScheduledSession | null>(null);
  const [sessionStatus, setSessionStatus] = useState<'not_started' | 'in_progress' | 'paused' | 'ended'>('not_started');
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [confirmationsCount, setConfirmationsCount] = useState(0);
  const [participantsCount, setParticipantsCount] = useState(0);

  useEffect(() => {
    const fetchSessionData = async () => {
      if (!tableId || !userId) return;

      try {
        setLoading(true);
        
        // Buscar próxima sessão agendada para esta mesa
        const sessions = await SessionService.getUpcomingSessions(tableId);
        const nextSession = sessions.length > 0 ? sessions[0] : null;
        setNextSession(nextSession);
        
        if (nextSession) {
          // Verificar se o usuário já confirmou presença
          const isUserConfirmed = nextSession.participants?.includes(userId);
          setIsConfirmed(isUserConfirmed);
          setConfirmationsCount(nextSession.participants?.length || 0);
          
          // Buscar total de participantes da mesa
          const { count, error } = await supabase
            .from('table_participants')
            .select('id', { count: 'exact' })
            .eq('table_id', tableId);
            
          if (!error && count !== null) {
            setParticipantsCount(count);
          }
        }
        
        // Verificar status atual da sessão
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('session_status, session_paused')
          .eq('id', tableId)
          .single();
          
        if (!tableError && tableData) {
          if (tableData.session_status === 'in_progress') {
            setSessionStatus(tableData.session_paused ? 'paused' : 'in_progress');
          } else if (tableData.session_status === 'ended') {
            setSessionStatus('ended');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar dados da sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
    
    // Configurar canal de tempo real para atualizações de status da sessão
    const channel = supabase
      .channel(`table_status_${tableId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tables',
          filter: `id=eq.${tableId}`
        },
        (payload) => {
          if (payload.new) {
            const { session_status, session_paused } = payload.new as any;
            
            if (session_status === 'in_progress') {
              setSessionStatus(session_paused ? 'paused' : 'in_progress');
              
              if (!session_paused) {
                toast.info('A sessão foi iniciada pelo mestre!');
              }
            } else if (session_status === 'ended') {
              setSessionStatus('ended');
              toast.info('A sessão foi encerrada');
            }
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, userId]);

  // Confirmar presença na sessão
  const handleConfirmAttendance = async () => {
    if (!nextSession || !userId) return;
    
    try {
      const participants = [...(nextSession.participants || []), userId];
      await SessionService.updateSessionParticipants(nextSession.id, participants);
      
      setIsConfirmed(true);
      setConfirmationsCount(prev => prev + 1);
      toast.success('Presença confirmada!');
    } catch (error) {
      console.error('Erro ao confirmar presença:', error);
      toast.error('Não foi possível confirmar sua presença');
    }
  };
  
  // Cancelar presença na sessão
  const handleCancelAttendance = async () => {
    if (!nextSession || !userId) return;
    
    try {
      const participants = (nextSession.participants || []).filter(id => id !== userId);
      await SessionService.updateSessionParticipants(nextSession.id, participants);
      
      setIsConfirmed(false);
      setConfirmationsCount(prev => prev - 1);
      toast.success('Presença cancelada');
    } catch (error) {
      console.error('Erro ao cancelar presença:', error);
      toast.error('Não foi possível cancelar sua presença');
    }
  };
  
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
  
  // Verificar se a sessão está próxima (menos de 24 horas)
  const isSessionSoon = (dateStr: string, timeStr: string) => {
    try {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const sessionDate = parseISO(dateStr);
      sessionDate.setHours(hours, minutes, 0, 0);
      
      const now = new Date();
      const hoursDiff = differenceInHours(sessionDate, now);
      
      return hoursDiff <= 24 && hoursDiff > 0;
    } catch (e) {
      return false;
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próxima Sessão</CardTitle>
          <CardDescription>Carregando informações...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <p className="text-muted-foreground animate-pulse">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (sessionStatus === 'in_progress') {
    return (
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center">
            Sessão em Andamento
            <Badge className="ml-2 bg-green-500">Ao vivo</Badge>
          </CardTitle>
          <CardDescription>A sessão está acontecendo agora!</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">O mestre iniciou a sessão. Entre agora para participar!</p>
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full" 
            onClick={() => navigate(`/live-session/${tableId}`)}
          >
            Entrar na Sessão
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (sessionStatus === 'paused') {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Sessão Pausada
            <Badge variant="outline" className="ml-2">Pausada</Badge>
          </CardTitle>
          <CardDescription>O mestre pausou a sessão temporariamente</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-4">A sessão está em pausa. Aguarde o mestre retomar.</p>
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline"
            className="w-full" 
            onClick={() => navigate(`/live-session/${tableId}`)}
          >
            Verificar Status
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  if (!nextSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Próxima Sessão</CardTitle>
          <CardDescription>Nenhuma sessão agendada</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground">O mestre ainda não agendou a próxima sessão</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const isSoon = isSessionSoon(nextSession.scheduledDate, nextSession.time);
  
  return (
    <Card className={isSoon ? 'border-primary' : ''}>
      <CardHeader>
        <CardTitle>Próxima Sessão</CardTitle>
        <CardDescription>
          {formatSessionDate(nextSession.scheduledDate)}
          {isSoon && <Badge className="ml-2">Em breve</Badge>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="capitalize">
              {format(parseISO(nextSession.scheduledDate), 'EEEE', { locale: ptBR })}
            </span>
          </div>
          <div className="flex items-center">
            <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
            <span>{nextSession.time}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-2 text-muted-foreground" />
            <span className="text-sm">
              {confirmationsCount} de {participantsCount} confirmados
            </span>
          </div>
          
          {isConfirmed ? (
            <Badge variant="outline" className="text-green-500 border-green-500">
              <Check className="h-3 w-3 mr-1" /> Confirmado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-muted-foreground">
              Pendente
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        {isConfirmed ? (
          <Button 
            variant="outline" 
            className="w-full" 
            onClick={handleCancelAttendance}
          >
            <X className="h-4 w-4 mr-2" /> Cancelar Presença
          </Button>
        ) : (
          <Button 
            className="w-full" 
            onClick={handleConfirmAttendance}
          >
            <Check className="h-4 w-4 mr-2" /> Confirmar Presença
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

export default PlayerSessionView;