
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Pause, Bell } from 'lucide-react';
import MapTab from './MapTab';
import NotesTab from './NotesTab';
import StoryTab from './StoryTab';
import ChatTab from './ChatTab';
import PlayersTab from './PlayersTab';
import { GamePlayer } from '@/types/game';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

interface GameMasterPanelProps {
  sessionId: string;
  userId: string;
  isPaused?: boolean;
  onTogglePause?: () => void;
}

const GameMasterPanel: React.FC<GameMasterPanelProps> = ({ 
  sessionId, 
  userId,
  isPaused = false,
  onTogglePause
}) => {
  const [activeTab, setActiveTab] = useState('players');
  const [players, setPlayers] = useState<GamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showProgressChart, setShowProgressChart] = useState(false);
  
  // Dados mockados para o gráfico - em produção, seria carregado do banco de dados
  const campaignProgressData = [
    { session: 'Sessão 1', xp: 100, discoveries: 2, combats: 1 },
    { session: 'Sessão 2', xp: 250, discoveries: 3, combats: 2 },
    { session: 'Sessão 3', xp: 400, discoveries: 1, combats: 3 },
    { session: 'Sessão 4', xp: 700, discoveries: 4, combats: 2 },
    { session: 'Sessão 5', xp: 1000, discoveries: 3, combats: 4 },
  ];
  
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!sessionId) return;
      
      try {
        setLoading(true);
        
        // Fetch participants from the table
        const { data: participants, error: participantsError } = await supabase
          .from('table_participants')
          .select(`
            id,
            user_id,
            character_id,
            profiles:user_id (display_name),
            characters:character_id (id, name, race, class, level)
          `)
          .eq('table_id', sessionId);
        
        if (participantsError) {
          throw participantsError;
        }
        
        if (participants) {
          // Process the data and handle potential errors
          const processedPlayers: GamePlayer[] = participants.map(participant => {
            // Safely handle the profiles data with type checking
            let displayName = "Jogador";
            
            if (participant.profiles) {
              // Check if profiles is an object (not an error) and has display_name
              const profilesData = participant.profiles as any;
              if (typeof profilesData === 'object' && profilesData !== null && 'display_name' in profilesData) {
                displayName = profilesData.display_name || "Jogador";
              }
            }
              
            return {
              id: participant.id,
              name: displayName,
              characterId: participant.character_id,
              characterName: participant.characters?.name || null,
              characterClass: participant.characters?.class || null,
              characterRace: participant.characters?.race || null,
              characterLevel: participant.characters?.level || null,
              online: true // We can update this with real status later
            };
          });
          
          setPlayers(processedPlayers);
        }
      } catch (error) {
        console.error('Erro ao buscar participantes:', error);
        toast.error('Erro ao carregar participantes da sessão');
      } finally {
        setLoading(false);
      }
    };
    
    fetchParticipants();
    
    // Set up realtime presence to monitor player online status
    const channel = supabase.channel('room_' + sessionId);
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Online users:', state);
        
        // Update player online status based on presence data
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          presences.forEach(presence => {
            if (presence.user_id) {
              setPlayers(prev => 
                prev.map(player => 
                  player.id === presence.user_id 
                    ? { ...player, online: true } 
                    : player
                )
              );
            }
          });
        });
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
        // Handle user join event
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
        // Handle user leave event
        leftPresences.forEach((presence: any) => {
          if (presence.user_id) {
            setPlayers(prev => 
              prev.map(player => 
                player.id === presence.user_id 
                  ? { ...player, online: false } 
                  : player
              )
            );
          }
        });
      })
      .subscribe(async (status) => {
        if (status !== 'SUBSCRIBED') { return }
      
        // Send current user's presence
        const presenceTrackStatus = await channel.track({ 
          user_id: userId,
          online_at: new Date().toISOString() 
        });
        
        console.log('Presence tracking status:', presenceTrackStatus);
      });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [sessionId, userId]);
  
  const notifyPlayers = async () => {
    try {
      // Obter todos os participantes da mesa
      const { data: participants, error: participantsError } = await supabase
        .from('table_participants')
        .select('user_id')
        .eq('table_id', sessionId)
        .neq('user_id', userId); // Excluir o próprio mestre
      
      if (participantsError) throw participantsError;
      
      if (!participants || participants.length === 0) {
        toast.info('Não há jogadores para notificar');
        return;
      }
      
      // Obter dados da mesa
      const { data: tableData, error: tableError } = await supabase
        .from('tables')
        .select('name')
        .eq('id', sessionId)
        .single();
      
      if (tableError) throw tableError;
      
      // Criar notificações para cada participante
      const notifications = participants.map(participant => ({
        user_id: participant.user_id,
        title: 'Atenção requerida!',
        content: `O mestre está chamando a atenção na mesa "${tableData.name}"!`,
        type: 'attention',
        reference_type: 'table',
        reference_id: sessionId
      }));
      
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications);
      
      if (notificationError) throw notificationError;
      
      toast.success('Jogadores notificados com sucesso!');
    } catch (error) {
      console.error('Erro ao notificar jogadores:', error);
      toast.error('Erro ao enviar notificações');
    }
  };
  
  const handleTogglePlayerStatus = async (playerId: string, status: string) => {
    // Em uma implementação real, você enviaria essa mudança para o Supabase
    toast.success(`Status do jogador alterado para: ${status}`);
  };
  
  return (
    <div className="bg-fantasy-dark border border-fantasy-purple/30 w-80 h-full flex flex-col">
      <div className="p-3 border-b border-fantasy-purple/30 flex justify-between items-center">
        <h2 className="text-xl font-medievalsharp text-fantasy-gold">
          Painel do Mestre
        </h2>
        <div className="flex items-center gap-2">
          {onTogglePause && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onTogglePause}
              className="text-fantasy-stone hover:text-white hover:bg-fantasy-dark"
              title={isPaused ? "Retomar sessão" : "Pausar sessão"}
            >
              {isPaused ? <Play size={20} /> : <Pause size={20} />}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={notifyPlayers}
            className="text-fantasy-stone hover:text-white hover:bg-fantasy-dark"
            title="Notificar jogadores"
          >
            <Bell size={20} />
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="border-b border-fantasy-purple/30 bg-transparent">
          <TabsTrigger value="players" className="data-[state=active]:bg-fantasy-purple/20">Jogadores</TabsTrigger>
          <TabsTrigger value="map" className="data-[state=active]:bg-fantasy-purple/20">Mapa</TabsTrigger>
          <TabsTrigger value="chat" className="data-[state=active]:bg-fantasy-purple/20">Chat</TabsTrigger>
          <TabsTrigger value="notes" className="data-[state=active]:bg-fantasy-purple/20">Notas</TabsTrigger>
          <TabsTrigger value="story" className="data-[state=active]:bg-fantasy-purple/20">História</TabsTrigger>
        </TabsList>
        
        <TabsContent value="players" className="flex-1 overflow-y-auto p-4">
          <PlayersTab 
            players={players} 
            sessionId={sessionId}
            onTogglePlayerStatus={handleTogglePlayerStatus}
          />
          
          <div className="mt-6">
            <Popover open={showProgressChart} onOpenChange={setShowProgressChart}>
              <PopoverTrigger asChild>
                <Button className="w-full fantasy-button secondary">
                  Ver Progresso da Campanha
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0 bg-fantasy-dark border-fantasy-purple/50" align="end">
                <div className="p-4">
                  <h3 className="text-sm font-medievalsharp text-fantasy-gold mb-2">Progresso da Campanha</h3>
                  <div className="h-48 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={campaignProgressData}
                        margin={{ top: 5, right: 5, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#372c45" />
                        <XAxis dataKey="session" stroke="#8884d8" fontSize={10} />
                        <YAxis stroke="#8884d8" fontSize={10} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: 'rgba(17, 14, 23, 0.95)',
                            border: '1px solid rgba(138, 75, 175, 0.5)',
                            borderRadius: '4px',
                            color: '#fff'
                          }} 
                        />
                        <Area type="monotone" dataKey="xp" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="discoveries" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                        <Area type="monotone" dataKey="combats" stroke="#ffc658" fill="#ffc658" fillOpacity={0.3} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-fantasy-stone">
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-indigo-400 rounded-sm"></span>
                      <span>XP</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-green-400 rounded-sm"></span>
                      <span>Descobertas</span>
                    </div>
                    <div className="flex items-center">
                      <span className="inline-block w-3 h-3 mr-1 bg-yellow-400 rounded-sm"></span>
                      <span>Combates</span>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </TabsContent>
        
        <TabsContent value="map" className="flex-1 overflow-y-auto p-4">
          <MapTab sessionId={sessionId} />
        </TabsContent>
        
        <TabsContent value="chat" className="flex-1 overflow-y-auto p-4">
          <ChatTab sessionId={sessionId} userId={userId} />
        </TabsContent>
        
        <TabsContent value="notes" className="flex-1 overflow-y-auto p-4">
          <NotesTab sessionId={sessionId} userId={userId} />
        </TabsContent>
        
        <TabsContent value="story" className="flex-1 overflow-y-auto p-4">
          <StoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameMasterPanel;
