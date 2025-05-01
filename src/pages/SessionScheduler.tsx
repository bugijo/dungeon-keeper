import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { SessionService, ScheduledSession } from '@/services/sessionService';
import { toast } from 'sonner';
import { Calendar, Clock, Users, Edit, Trash2, Plus, Check, X, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { format, parseISO, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';

const SessionScheduler = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userTables, setUserTables] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [upcomingSessions, setUpcomingSessions] = useState<ScheduledSession[]>([]);
  const [pastSessions, setPastSessions] = useState<ScheduledSession[]>([]);
  const [showNewSessionDialog, setShowNewSessionDialog] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  
  // Estado para nova sessão
  const [newSession, setNewSession] = useState({
    tableId: '',
    scheduledDate: format(new Date(), 'yyyy-MM-dd'),
    time: '19:00',
    duration: 180,
    isRecurring: false,
    weekday: '',
    notes: ''
  });

  // Carregar mesas do usuário
  useEffect(() => {
    const fetchUserTables = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('tables')
          .select(`
            id, name,
            table_participants!inner(user_id, role)
          `)
          .eq('table_participants.user_id', user.id);

        if (error) throw error;

        // Filtrar para obter apenas mesas onde o usuário é mestre
        const masterTables = data?.filter(table => {
          const participant = table.table_participants.find((p: any) => p.user_id === user.id);
          return participant && participant.role === 'gm';
        }) || [];

        setUserTables(masterTables);
        
        if (masterTables.length > 0) {
          setSelectedTable(masterTables[0].id);
          setNewSession(prev => ({ ...prev, tableId: masterTables[0].id }));
          await loadTableSessions(masterTables[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar mesas:', error);
        toast.error('Não foi possível carregar suas mesas');
      } finally {
        setLoading(false);
      }
    };

    fetchUserTables();
  }, [user, navigate]);

  // Carregar sessões de uma mesa específica
  const loadTableSessions = async (tableId: string) => {
    try {
      setLoading(true);
      
      // Carregar todas as sessões da mesa
      const allSessions = await SessionService.getTableSessions(tableId);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Separar em sessões passadas e futuras
      const upcoming = allSessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate >= today && session.status === 'scheduled';
      });
      
      const past = allSessions.filter(session => {
        const sessionDate = new Date(session.scheduledDate);
        sessionDate.setHours(0, 0, 0, 0);
        return sessionDate < today || session.status !== 'scheduled';
      });
      
      setUpcomingSessions(upcoming);
      setPastSessions(past);
    } catch (error) {
      console.error('Erro ao carregar sessões:', error);
      toast.error('Não foi possível carregar as sessões agendadas');
    } finally {
      setLoading(false);
    }
  };

  // Mudar mesa selecionada
  const handleTableChange = async (tableId: string) => {
    setSelectedTable(tableId);
    setNewSession(prev => ({ ...prev, tableId }));
    await loadTableSessions(tableId);
  };

  // Criar nova sessão
  const handleCreateSession = async () => {
    if (!user) return;
    
    try {
      // Validar campos obrigatórios
      if (!newSession.tableId || !newSession.scheduledDate || !newSession.time) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      
      // Preparar dados da sessão
      const sessionData: Partial<ScheduledSession> = {
        tableId: newSession.tableId,
        scheduledDate: newSession.scheduledDate,
        time: newSession.time,
        duration: newSession.duration,
        isRecurring: newSession.isRecurring,
        weekday: newSession.weekday,
        notes: newSession.notes,
        createdBy: user.id,
        status: 'scheduled'
      };
      
      // Criar sessão
      await SessionService.scheduleSession(sessionData);
      
      toast.success('Sessão agendada com sucesso!');
      setShowNewSessionDialog(false);
      
      // Recarregar sessões
      await loadTableSessions(newSession.tableId);
      
      // Resetar formulário
      setNewSession({
        tableId: newSession.tableId,
        scheduledDate: format(new Date(), 'yyyy-MM-dd'),
        time: '19:00',
        duration: 180,
        isRecurring: false,
        weekday: '',
        notes: ''
      });
    } catch (error) {
      console.error('Erro ao agendar sessão:', error);
      toast.error('Não foi possível agendar a sessão');
    }
  };

  // Cancelar sessão
  const handleCancelSession = async (sessionId: string) => {
    try {
      await SessionService.updateSessionStatus(sessionId, 'cancelled');
      toast.success('Sessão cancelada com sucesso!');
      
      // Recarregar sessões
      await loadTableSessions(selectedTable);
      setConfirmDeleteId(null);
    } catch (error) {
      console.error('Erro ao cancelar sessão:', error);
      toast.error('Não foi possível cancelar a sessão');
    }
  };

  // Marcar sessão como concluída
  const handleCompleteSession = async (sessionId: string) => {
    try {
      await SessionService.updateSessionStatus(sessionId, 'completed');
      toast.success('Sessão marcada como concluída!');
      
      // Recarregar sessões
      await loadTableSessions(selectedTable);
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      toast.error('Não foi possível atualizar o status da sessão');
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

  // Determinar dia da semana com base na data
  const getWeekdayFromDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'EEEE', { locale: ptBR });
    } catch (e) {
      return '';
    }
  };

  // Renderizar card de sessão
  const renderSessionCard = (session: ScheduledSession, isPast: boolean = false) => {
    const sessionDate = parseISO(session.scheduledDate);
    const isToday = format(new Date(), 'yyyy-MM-dd') === format(sessionDate, 'yyyy-MM-dd');
    
    return (
      <Card key={session.id} className={`mb-4 ${isToday ? 'border-primary' : ''}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg">
                {session.tableName}
                {isToday && <span className="ml-2 text-sm text-primary font-normal">Hoje</span>}
              </CardTitle>
              <CardDescription>
                {formatSessionDate(session.scheduledDate)}
                {session.isRecurring && <span className="ml-2">(Recorrente)</span>}
              </CardDescription>
            </div>
            {!isPast && (
              <div className="flex space-x-1">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => navigate(`/game-master/${session.tableId}`)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => setConfirmDeleteId(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              <span>{session.time} ({session.duration} minutos)</span>
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
              <span className="capitalize">{getWeekdayFromDate(session.scheduledDate)}</span>
            </div>
          </div>
          {session.notes && (
            <div className="mt-2 text-sm">
              <p className="text-muted-foreground">Notas:</p>
              <p className="whitespace-pre-line">{session.notes}</p>
            </div>
          )}
        </CardContent>
        <CardFooter className="pt-0">
          {!isPast ? (
            <div className="w-full flex justify-between">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleCompleteSession(session.id)}
              >
                <Check className="h-4 w-4 mr-1" /> Marcar como realizada
              </Button>
              <Button 
                variant="default" 
                size="sm"
                onClick={() => navigate(`/live-session/${session.tableId}`)}
              >
                Iniciar Sessão
              </Button>
            </div>
          ) : (
            <div className="w-full">
              <span className="text-sm font-medium">
                Status: 
                <span className={`ml-1 ${session.status === 'completed' ? 'text-green-500' : 'text-red-500'}`}>
                  {session.status === 'completed' ? 'Realizada' : 'Cancelada'}
                </span>
              </span>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-medievalsharp text-white">Agendamento de Sessões</h1>
          <Button onClick={() => setShowNewSessionDialog(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nova Sessão
          </Button>
        </div>

        {loading && userTables.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground animate-pulse">Carregando...</p>
          </div>
        ) : userTables.length === 0 ? (
          <div className="text-center py-8 border rounded-lg">
            <h3 className="text-xl mb-2">Nenhuma mesa encontrada</h3>
            <p className="text-muted-foreground mb-4">Você precisa ser mestre de pelo menos uma mesa para agendar sessões.</p>
            <Button onClick={() => navigate('/tables')}>Ver Minhas Mesas</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-1">
              <div className="sticky top-6">
                <h3 className="text-lg font-semibold mb-3">Minhas Mesas</h3>
                <div className="space-y-2">
                  {userTables.map(table => (
                    <Card 
                      key={table.id} 
                      className={`cursor-pointer hover:bg-accent transition-colors ${selectedTable === table.id ? 'border-primary' : ''}`}
                      onClick={() => handleTableChange(table.id)}
                    >
                      <CardHeader className="py-3">
                        <CardTitle className="text-base">{table.name}</CardTitle>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="md:col-span-3">
              <Tabs defaultValue="upcoming">
                <TabsList className="mb-4">
                  <TabsTrigger value="upcoming">Próximas Sessões</TabsTrigger>
                  <TabsTrigger value="past">Sessões Anteriores</TabsTrigger>
                </TabsList>
                
                <TabsContent value="upcoming">
                  {upcomingSessions.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-xl mb-2">Nenhuma sessão agendada</h3>
                      <p className="text-muted-foreground mb-4">Clique em "Nova Sessão" para agendar uma sessão para esta mesa.</p>
                    </div>
                  ) : (
                    <div>
                      {upcomingSessions.map(session => renderSessionCard(session))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="past">
                  {pastSessions.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <h3 className="text-xl mb-2">Nenhuma sessão anterior</h3>
                      <p className="text-muted-foreground">As sessões passadas ou canceladas aparecerão aqui.</p>
                    </div>
                  ) : (
                    <div>
                      {pastSessions.map(session => renderSessionCard(session, true))}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}

        {/* Dialog para nova sessão */}
        <Dialog open={showNewSessionDialog} onOpenChange={setShowNewSessionDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agendar Nova Sessão</DialogTitle>
              <DialogDescription>
                Preencha os detalhes para agendar uma nova sessão de jogo.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="table" className="text-right">
                  Mesa
                </Label>
                <Select 
                  value={newSession.tableId} 
                  onValueChange={(value) => setNewSession({...newSession, tableId: value})}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Selecione uma mesa" />
                  </SelectTrigger>
                  <SelectContent>
                    {userTables.map(table => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Data
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={newSession.scheduledDate}
                  onChange={(e) => setNewSession({...newSession, scheduledDate: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Horário
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={newSession.time}
                  onChange={(e) => setNewSession({...newSession, time: e.target.value})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duração (min)
                </Label>
                <Input
                  id="duration"
                  type="number"
                  value={newSession.duration}
                  onChange={(e) => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                  className="col-span-3"
                />
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="recurring" className="text-right">
                  Recorrente
                </Label>
                <div className="flex items-center space-x-2 col-span-3">
                  <Switch
                    id="recurring"
                    checked={newSession.isRecurring}
                    onCheckedChange={(checked) => setNewSession({...newSession, isRecurring: checked})}
                  />
                  <Label htmlFor="recurring">
                    Repetir semanalmente
                  </Label>
                </div>
              </div>
              
              {newSession.isRecurring && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weekday" className="text-right">
                    Dia da Semana
                  </Label>
                  <Select 
                    value={newSession.weekday || getWeekdayFromDate(newSession.scheduledDate)} 
                    onValueChange={(value) => setNewSession({...newSession, weekday: value})}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o dia da semana" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="domingo">Domingo</SelectItem>
                      <SelectItem value="segunda-feira">Segunda-feira</SelectItem>
                      <SelectItem value="terça-feira">Terça-feira</SelectItem>
                      <SelectItem value="quarta-feira">Quarta-feira</SelectItem>
                      <SelectItem value="quinta-feira">Quinta-feira</SelectItem>
                      <SelectItem value="sexta-feira">Sexta-feira</SelectItem>
                      <SelectItem value="sábado">Sábado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="notes" className="text-right">
                  Notas
                </Label>
                <Textarea
                  id="notes"
                  placeholder="Informações adicionais sobre a sessão"
                  value={newSession.notes}
                  onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                  className="col-span-3"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowNewSessionDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleCreateSession}>
                Agendar Sessão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação para cancelar sessão */}
        <Dialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Sessão</DialogTitle>
              <DialogDescription>
                Tem certeza que deseja cancelar esta sessão? Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDeleteId(null)}>
                Voltar
              </Button>
              <Button variant="destructive" onClick={() => confirmDeleteId && handleCancelSession(confirmDeleteId)}>
                Cancelar Sessão
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default SessionScheduler;