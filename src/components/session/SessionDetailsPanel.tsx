import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SessionService, ScheduledSession } from '@/services/sessionService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Calendar, Clock, Users, Play, Pause, StopCircle, MessageCircle, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format, parseISO, differenceInMinutes } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

interface SessionDetailsPanelProps {
  sessionId: string;
  tableId: string;
  isGameMaster: boolean;
}

const SessionDetailsPanel: React.FC<SessionDetailsPanelProps> = ({ 
  sessionId, 
  tableId,
  isGameMaster 
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<ScheduledSession | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'not_started' | 'in_progress' | 'paused' | 'ended'>('not_started');
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [sessionDuration, setSessionDuration] = useState<number>(0);
  const [showEndSessionDialog, setShowEndSessionDialog] = useState(false);
  const [sessionNotes, setSessionNotes] = useState('');
  
  // Carregar detalhes da sessão
  useEffect(() => {
    const fetchSessionDetails = async () => {
      if (!sessionId || !tableId) return;

      try {
        setLoading(true);
        
        // Carregar dados da sessão agendada
        const sessionData = await SessionService.getSessionById(sessionId);
        if (sessionData) {
          setSessionData(sessionData);
        }
        
        // Carregar participantes da mesa
        const { data: participantsData, error: participantsError } = await supabase
          .from('table_participants')
          .select(`
            id, user_id, role, character_id,
            profiles:user_id (display_name, avatar_url),
            characters:character_id (id, name, race, class)
          `)
          .eq('table_id', tableId);
          
        if (participantsError) {
          console.error('Erro ao carregar participantes:', participantsError);
        } else if (participantsData) {
          setParticipants(participantsData);
        }
        
        // Verificar status atual da sessão
        const { data: tableData, error: tableError } = await supabase
          .from('tables')
          .select('session_status, session_started_at, session_paused')
          .eq('id', tableId)
          .single();
          
        if (tableError) {
          console.error('Erro ao carregar status da sessão:', tableError);
        } else if (tableData) {
          if (tableData.session_started_at) {
            setSessionStartTime(new Date(tableData.session_started_at));
            setSessionStatus(tableData.session_paused ? 'paused' : 'in_progress');
          }
        }
      } catch (error) {
        console.error('Erro ao carregar detalhes da sessão:', error);
        toast.error('Não foi possível carregar os detalhes da sessão');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionDetails();
    
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
            const { session_status, session_started_at, session_paused } = payload.new as any;
            
            if (session_started_at && !sessionStartTime) {
              setSessionStartTime(new Date(session_started_at));
            }
            
            if (session_status === 'in_progress') {
              setSessionStatus(session_paused ? 'paused' : 'in_progress');
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
  }, [sessionId, tableId, sessionStartTime]);
  
  // Atualizar duração da sessão a cada minuto
  useEffect(() => {
    if (!sessionStartTime || sessionStatus === 'ended') return;
    
    const updateDuration = () => {
      const now = new Date();
      const durationMinutes = differenceInMinutes(now, sessionStartTime);
      setSessionDuration(durationMinutes);
    };
    
    updateDuration();
    const interval = setInterval(updateDuration, 60000); // Atualizar a cada minuto
    
    return () => clearInterval(interval);
  }, [sessionStartTime, sessionStatus]);
  
  // Iniciar sessão
  const handleStartSession = async () => {
    if (!isGameMaster || !tableId) return;
    
    try {
      const now = new Date();
      
      const { error } = await supabase
        .from('tables')
        .update({
          session_status: 'in_progress',
          session_started_at: now.toISOString(),
          session_paused: false,
          last_activity: now.toISOString()
        })
        .eq('id', tableId);
        
      if (error) throw error;
      
      setSessionStatus('in_progress');
      setSessionStartTime(now);
      toast.success('Sessão iniciada com sucesso!');
      
      // Redirecionar para a sessão ao vivo
      navigate(`/live-session/${tableId}`);
    } catch (error) {
      console.error('Erro ao iniciar sessão:', error);
      toast.error('Não foi possível iniciar a sessão');
    }
  };
  
  // Pausar/retomar sessão
  const handleTogglePause = async () => {
    if (!isGameMaster || !tableId) return;
    
    try {
      const isPaused = sessionStatus === 'paused';
      
      const { error } = await supabase
        .from('tables')
        .update({
          session_paused: !isPaused,
          last_activity: new Date().toISOString()
        })
        .eq('id', tableId);
        
      if (error) throw error;
      
      setSessionStatus(isPaused ? 'in_progress' : 'paused');
      toast.success(isPaused ? 'Sessão retomada' : 'Sessão pausada');
    } catch (error) {
      console.error('Erro ao pausar/retomar sessão:', error);
      toast.error('Não foi possível atualizar o status da sessão');
    }
  };
  
  // Encerrar sessão
  const handleEndSession = async () => {
    if (!isGameMaster || !tableId) return;
    
    try {
      const { error } = await supabase
        .from('tables')
        .update({
          session_status: 'ended',
          session_paused: false,
          last_activity: new Date().toISOString()
        })
        .eq('id', tableId);
        
      if (error) throw error;
      
      // Atualizar status da sessão agendada
      if (sessionId) {
        await SessionService.updateSessionStatus(sessionId, 'completed');
        
        // Salvar notas da sessão
        if (sessionNotes.trim()) {
          await SessionService.updateSessionNotes(sessionId, sessionNotes);
        }
      }
      
      setSessionStatus('ended');
      setShowEndSessionDialog(false);
      toast.success('Sessão encerrada com sucesso!');
      
      // Redirecionar para a página da mesa
      navigate(`/game-master/${tableId}`);
    } catch (error) {
      console.error('Erro ao encerrar sessão:', error);
      toast.error('Não foi possível encerrar a sessão');
    }
  };
  
  // Formatar data para exibição
  const formatSessionDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
    } catch (e) {
      return dateStr;
    }
  };
  
  // Formatar duração da sessão
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Sessão</CardTitle>
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
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Detalhes da Sessão</CardTitle>
            <CardDescription>
              {sessionData ? formatSessionDate(sessionData.scheduledDate) : 'Sessão atual'}
            </CardDescription>
          </div>
          {sessionStatus !== 'ended' && sessionStatus !== 'not_started' && (
            <Badge 
              variant={sessionStatus === 'paused' ? 'outline' : 'default'}
              className={sessionStatus === 'in_progress' ? 'bg-green-500' : ''}
            >
              {sessionStatus === 'in_progress' ? 'Em andamento' : 'Pausada'}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessionData && (
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="capitalize">{format(parseISO(sessionData.scheduledDate), 'EEEE', { locale: ptBR })}</span>
            </div>
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{sessionData.time} ({sessionData.duration} min)</span>
            </div>
          </div>
        )}
        
        {sessionStartTime && (
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">Tempo de Sessão</h4>
            <div className="flex justify-between items-center">
              <span>Iniciada às {format(sessionStartTime, 'HH:mm')}</span>
              <span className="font-medium">{formatDuration(sessionDuration)}</span>
            </div>
          </div>
        )}
        
        <Separator className="my-3" />
        
        <div>
          <h4 className="text-sm font-medium mb-2">Participantes ({participants.length})</h4>
          <div className="space-y-2">
            {participants.map(participant => (
              <div key={participant.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {participant.profiles?.avatar_url ? (
                    <img 
                      src={participant.profiles.avatar_url} 
                      alt="Avatar" 
                      className="w-6 h-6 rounded-full mr-2"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-primary/20 mr-2" />
                  )}
                  <span>{participant.profiles?.display_name || 'Usuário'}</span>
                </div>
                <div className="flex items-center">
                  {participant.role === 'gm' ? (
                    <Badge variant="outline">Mestre</Badge>
                  ) : participant.characters ? (
                    <span className="text-xs text-muted-foreground">
                      {participant.characters.name} ({participant.characters.race} {participant.characters.class})
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">Sem personagem</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
      
      {isGameMaster && (
        <CardFooter className="flex-col space-y-2">
          {sessionStatus === 'not_started' ? (
            <Button 
              className="w-full" 
              onClick={handleStartSession}
            >
              <Play className="h-4 w-4 mr-2" /> Iniciar Sessão
            </Button>
          ) : sessionStatus !== 'ended' ? (
            <div className="w-full space-y-2">
              <Button 
                variant={sessionStatus === 'paused' ? 'default' : 'outline'}
                className="w-full" 
                onClick={handleTogglePause}
              >
                {sessionStatus === 'paused' ? (
                  <>
                    <Play className="h-4 w-4 mr-2" /> Retomar Sessão
                  </>
                ) : (
                  <>
                    <Pause className="h-4 w-4 mr-2" /> Pausar Sessão
                  </>
                )}
              </Button>
              
              <Button 
                variant="destructive" 
                className="w-full" 
                onClick={() => setShowEndSessionDialog(true)}
              >
                <StopCircle className="h-4 w-4 mr-2" /> Encerrar Sessão
              </Button>
            </div>
          ) : (
            <div className="w-full text-center">
              <p className="text-muted-foreground">Esta sessão foi encerrada</p>
            </div>
          )}
        </CardFooter>
      )}
      
      {/* Dialog para encerrar sessão */}
      <Dialog open={showEndSessionDialog} onOpenChange={setShowEndSessionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Encerrar Sessão</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja encerrar esta sessão? Você pode adicionar notas sobre o que aconteceu.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Textarea
              placeholder="Notas sobre a sessão (opcional)"
              value={sessionNotes}
              onChange={(e) => setSessionNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEndSessionDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleEndSession}>
              Encerrar Sessão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SessionDetailsPanel;