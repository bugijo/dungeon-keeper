import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SessionService, ScheduledSession } from '@/services/sessionService';
import { TableService, GameTable, TableParticipant } from '@/services/tableService';
import { format, addDays, parseISO, isValid } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Clock, Users, Check, X, Calendar as CalendarIcon2 } from 'lucide-react';

interface SessionSchedulerProps {
  tableId: string;
  isGameMaster: boolean;
  onSessionScheduled?: () => void;
}

const weekdays = [
  { value: 'sunday', label: 'Domingo' },
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
];

const SessionScheduler: React.FC<SessionSchedulerProps> = ({ tableId, isGameMaster, onSessionScheduled }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('upcoming');
  const [table, setTable] = useState<GameTable | null>(null);
  const [sessions, setSessions] = useState<ScheduledSession[]>([]);
  const [participants, setParticipants] = useState<TableParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para nova sessão
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [weekday, setWeekday] = useState<string>('');
  const [time, setTime] = useState<string>('19:00');
  const [duration, setDuration] = useState<number>(180);
  const [notes, setNotes] = useState<string>('');
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  
  // Carregar dados da mesa e sessões
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Carregar dados da mesa
        const tableData = await TableService.getTableById(tableId);
        setTable(tableData);
        
        // Carregar participantes
        const participantsData = await TableService.getTableParticipants(tableId);
        setParticipants(participantsData);
        
        // Carregar sessões agendadas
        const sessionsData = await SessionService.getTableSessions(tableId);
        setSessions(sessionsData);
        
        // Se a mesa tiver dia e horário padrão, preencher
        if (tableData?.weekday) {
          setWeekday(tableData.weekday);
        }
        
        if (tableData?.time) {
          setTime(tableData.time);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
        toast.error('Não foi possível carregar os dados da mesa');
        setLoading(false);
      }
    };
    
    if (tableId) {
      fetchData();
    }
  }, [tableId]);
  
  // Agendar nova sessão
  const handleScheduleSession = async () => {
    if (!user) {
      toast.error('Você precisa estar logado para agendar uma sessão');
      return;
    }
    
    try {
      // Validar dados
      if (isRecurring && !weekday) {
        toast.error('Selecione o dia da semana para sessões recorrentes');
        return;
      }
      
      if (!isRecurring && !date) {
        toast.error('Selecione uma data para a sessão');
        return;
      }
      
      if (!time) {
        toast.error('Informe o horário da sessão');
        return;
      }
      
      // Preparar dados da sessão
      const sessionData: Partial<ScheduledSession> = {
        tableId,
        time,
        duration,
        notes,
        isRecurring,
        createdBy: user.id,
        status: 'scheduled',
        participants: [user.id] // Criador já é participante
      };
      
      if (isRecurring) {
        // Para sessões recorrentes, agendar para o próximo dia da semana
        sessionData.weekday = weekday;
        
        // Calcular a próxima data para esse dia da semana
        const today = new Date();
        const weekdayIndex = weekdays.findIndex(w => w.value === weekday);
        const daysUntilNext = (weekdayIndex + 7 - today.getDay()) % 7;
        const nextDate = addDays(today, daysUntilNext || 7); // Se for hoje, agendar para próxima semana
        
        sessionData.scheduledDate = format(nextDate, 'yyyy-MM-dd');
      } else {
        // Para sessão única, usar a data selecionada
        sessionData.scheduledDate = format(date as Date, 'yyyy-MM-dd');
      }
      
      // Salvar sessão
      await SessionService.scheduleSession(sessionData);
      
      // Atualizar lista de sessões
      const updatedSessions = await SessionService.getTableSessions(tableId);
      setSessions(updatedSessions);
      
      // Limpar formulário
      setDate(undefined);
      setNotes('');
      
      toast.success('Sessão agendada com sucesso!');
      
      // Notificar componente pai
      if (onSessionScheduled) {
        onSessionScheduled();
      }
      
      // Mudar para a aba de próximas sessões
      setActiveTab('upcoming');
    } catch (error) {
      console.error('Erro ao agendar sessão:', error);
      toast.error('Não foi possível agendar a sessão');
    }
  };
  
  // Confirmar participação em uma sessão
  const handleConfirmParticipation = async (sessionId: string) => {
    if (!user) {
      toast.error('Você precisa estar logado para confirmar participação');
      return;
    }
    
    try {
      await SessionService.confirmParticipation(sessionId, user.id);
      
      // Atualizar lista de sessões
      const updatedSessions = await SessionService.getTableSessions(tableId);
      setSessions(updatedSessions);
      
      toast.success('Participação confirmada!');
    } catch (error) {
      console.error('Erro ao confirmar participação:', error);
      toast.error('Não foi possível confirmar sua participação');
    }
  };
  
  // Cancelar participação em uma sessão
  const handleCancelParticipation = async (sessionId: string) => {
    if (!user) return;
    
    try {
      await SessionService.cancelParticipation(sessionId, user.id);
      
      // Atualizar lista de sessões
      const updatedSessions = await SessionService.getTableSessions(tableId);
      setSessions(updatedSessions);
      
      toast.success('Participação cancelada');
    } catch (error) {
      console.error('Erro ao cancelar participação:', error);
      toast.error('Não foi possível cancelar sua participação');
    }
  };
  
  // Cancelar uma sessão (apenas para mestres)
  const handleCancelSession = async (sessionId: string) => {
    if (!isGameMaster) return;
    
    try {
      await SessionService.cancelSession(sessionId);
      
      // Atualizar lista de sessões
      const updatedSessions = await SessionService.getTableSessions(tableId);
      setSessions(updatedSessions);
      
      toast.success('Sessão cancelada com sucesso');
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      toast.error('Não foi possível cancelar a sessão');
    }
  };
  
  // Formatar data para exibição
  const formatSessionDate = (session: ScheduledSession) => {
    if (session.isRecurring) {
      const weekdayName = weekdays.find(w => w.value === session.weekday)?.label || session.weekday;
      return `${weekdayName} às ${session.time}`;
    } else {
      try {
        const date = parseISO(session.scheduledDate);
        if (!isValid(date)) return 'Data inválida';
        return `${format(date, 'dd/MM/yyyy', { locale: ptBR })} às ${session.time}`;
      } catch (e) {
        return 'Data inválida';
      }
    }
  };
  
  // Verificar se o usuário está confirmado em uma sessão
  const isUserConfirmed = (session: ScheduledSession) => {
    return user ? session.participants.includes(user.id) : false;
  };
  
  // Filtrar sessões por status
  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const pastSessions = sessions.filter(s => s.status === 'completed');
  const cancelledSessions = sessions.filter(s => s.status === 'cancelled');
  
  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="upcoming">Próximas Sessões</TabsTrigger>
          <TabsTrigger value="past">Sessões Anteriores</TabsTrigger>
          <TabsTrigger value="schedule">Agendar</TabsTrigger>
        </TabsList>
        
        {/* Próximas sessões */}
        <TabsContent value="upcoming" className="space-y-4">
          {loading ? (
            <p className="text-center text-fantasy-stone/70">Carregando sessões...</p>
          ) : upcomingSessions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon2 className="mx-auto h-12 w-12 text-fantasy-stone/40 mb-3" />
              <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">Nenhuma sessão agendada</h3>
              <p className="text-fantasy-stone/70 mb-4">Não há sessões agendadas para esta mesa.</p>
              {isGameMaster && (
                <Button onClick={() => setActiveTab('schedule')}>
                  Agendar Nova Sessão
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingSessions.map(session => (
                <Card key={session.id} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-fantasy-gold font-medievalsharp">
                      {session.isRecurring ? 'Sessão Recorrente' : 'Sessão Agendada'}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {formatSessionDate(session)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-fantasy-stone/70 mb-2">
                      <Clock className="h-4 w-4" />
                      <span>Duração: {session.duration} minutos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-fantasy-stone/70 mb-3">
                      <Users className="h-4 w-4" />
                      <span>Confirmados: {session.participants.length} jogadores</span>
                    </div>
                    {session.notes && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">Notas:</p>
                        <p className="text-fantasy-stone/90">{session.notes}</p>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter className="flex justify-between pt-2">
                    {user && (
                      isUserConfirmed(session) ? (
                        <Button variant="outline" size="sm" onClick={() => handleCancelParticipation(session.id)}>
                          <X className="h-4 w-4 mr-1" /> Cancelar Participação
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => handleConfirmParticipation(session.id)}>
                          <Check className="h-4 w-4 mr-1" /> Confirmar Presença
                        </Button>
                      )
                    )}
                    {isGameMaster && (
                      <Button variant="destructive" size="sm" onClick={() => handleCancelSession(session.id)}>
                        Cancelar Sessão
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
          
          {/* Sessões canceladas */}
          {cancelledSessions.length > 0 && (
            <div className="mt-8">
              <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-3">Sessões Canceladas</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {cancelledSessions.map(session => (
                  <Card key={session.id} className="overflow-hidden border-fantasy-stone/20 bg-fantasy-stone/5">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-fantasy-stone/60 font-medievalsharp">
                        Sessão Cancelada
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 text-fantasy-stone/50">
                        <CalendarIcon className="h-4 w-4" />
                        {formatSessionDate(session)}
                      </CardDescription>
                    </CardHeader>
                    {session.notes && (
                      <CardContent className="pb-2">
                        <div className="mt-2 text-sm text-fantasy-stone/50">
                          <p className="font-semibold mb-1">Notas:</p>
                          <p>{session.notes}</p>
                        </div>
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Sessões anteriores */}
        <TabsContent value="past" className="space-y-4">
          {loading ? (
            <p className="text-center text-fantasy-stone/70">Carregando sessões...</p>
          ) : pastSessions.length === 0 ? (
            <div className="text-center py-8">
              <CalendarIcon2 className="mx-auto h-12 w-12 text-fantasy-stone/40 mb-3" />
              <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">Nenhuma sessão anterior</h3>
              <p className="text-fantasy-stone/70">Não há registro de sessões anteriores para esta mesa.</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastSessions.map(session => (
                <Card key={session.id} className="overflow-hidden border-fantasy-stone/30 bg-fantasy-stone/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-fantasy-gold/80 font-medievalsharp">
                      Sessão Concluída
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {formatSessionDate(session)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="flex items-center gap-2 text-sm text-fantasy-stone/70 mb-2">
                      <Users className="h-4 w-4" />
                      <span>Participantes: {session.participants.length} jogadores</span>
                    </div>
                    {session.notes && (
                      <div className="mt-2 text-sm">
                        <p className="font-semibold mb-1">Notas:</p>
                        <p className="text-fantasy-stone/90">{session.notes}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        {/* Agendar nova sessão */}
        <TabsContent value="schedule" className="space-y-4">
          {!isGameMaster ? (
            <div className="text-center py-8">
              <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">Permissão Negada</h3>
              <p className="text-fantasy-stone/70">Apenas o mestre pode agendar novas sessões.</p>
            </div>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-fantasy-gold font-medievalsharp">Agendar Nova Sessão</CardTitle>
                <CardDescription>
                  Defina a data, horário e detalhes para a próxima sessão desta mesa.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="recurring" 
                    checked={isRecurring} 
                    onCheckedChange={(checked) => setIsRecurring(checked as boolean)} 
                  />
                  <Label htmlFor="recurring">Sessão recorrente (semanal)</Label>
                </div>
                
                {isRecurring ? (
                  <div className="space-y-2">
                    <Label htmlFor="weekday">Dia da semana</Label>
                    <Select value={weekday} onValueChange={setWeekday}>
                      <SelectTrigger id="weekday">
                        <SelectValue placeholder="Selecione o dia da semana" />
                      </SelectTrigger>
                      <SelectContent>
                        {weekdays.map(day => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>Data da sessão</Label>
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={setDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border mx-auto"
                    />
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="time">Horário</Label>
                  <Input 
                    id="time" 
                    type="time" 
                    value={time} 
                    onChange={(e) => setTime(e.target.value)} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duração (minutos)</Label>
                  <Input 
                    id="duration" 
                    type="number" 
                    min="30" 
                    step="30" 
                    value={duration} 
                    onChange={(e) => setDuration(parseInt(e.target.value))} 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notas para os jogadores</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Informações adicionais sobre a sessão..." 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={() => setActiveTab('upcoming')}>Cancelar</Button>
                <Button onClick={handleScheduleSession}>Agendar Sessão</Button>
              </CardFooter>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SessionScheduler;