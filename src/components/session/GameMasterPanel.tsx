
import React, { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SessionParticipant, SessionTurn, TokenPosition } from '@/types/session';
import {
  Users, MapPin, Clock, Shield, Play, Pause, Crown,
  ArrowRight, User, FileText, Save, Trash 
} from 'lucide-react';

interface GameMasterPanelProps {
  sessionId: string;
  participants: SessionParticipant[];
  isPaused: boolean;
  onTogglePause: () => void;
  sessionTurn: SessionTurn | null;
  onAddToken: (token: Omit<TokenPosition, 'id' | 'session_id'>) => void;
  onTurnUpdate?: (turnData: Partial<SessionTurn>) => void;
}

const GameMasterPanel: React.FC<GameMasterPanelProps> = ({
  sessionId,
  participants,
  isPaused,
  onTogglePause,
  sessionTurn,
  onAddToken,
  onTurnUpdate
}) => {
  const [activeTab, setActiveTab] = useState('participants');
  const [turnDuration, setTurnDuration] = useState(sessionTurn?.turn_duration || 60);
  const [isEditingTurn, setIsEditingTurn] = useState(false);
  const [notes, setNotes] = useState('');
  
  // Update turn order
  const updateTurnOrder = async (participantIds: string[]) => {
    if (!sessionId || !onTurnUpdate) return;
    
    try {
      onTurnUpdate({ 
        turn_order: participantIds,
        turn_duration: turnDuration
      });
      
      toast.success('Turn order updated');
    } catch (error) {
      console.error('Error updating turn order:', error);
      toast.error('Failed to update turn order');
    }
  };
  
  // Start turn tracking
  const startTurn = async () => {
    if (!sessionTurn?.turn_order.length || !onTurnUpdate) {
      toast.error('You need to set a turn order first');
      return;
    }
    
    try {
      const firstParticipantId = sessionTurn.turn_order[0];
      const now = new Date();
      const turnEnds = new Date(now.getTime() + turnDuration * 1000);
      
      onTurnUpdate({ 
        current_turn_user_id: firstParticipantId,
        turn_started_at: now.toISOString(),
        turn_ends_at: turnEnds.toISOString(),
        turn_duration: turnDuration,
        is_paused: false,
        round_number: 1,
        turn_order: sessionTurn.turn_order
      });
      
      toast.success(`${getParticipantName(firstParticipantId)}'s turn has started`);
    } catch (error) {
      console.error('Error starting turn:', error);
      toast.error('Failed to start turn');
    }
  };
  
  // Advance to the next turn
  const nextTurn = async () => {
    if (!sessionTurn?.turn_order.length || !onTurnUpdate) return;
    
    try {
      const currentIndex = sessionTurn.turn_order.indexOf(sessionTurn.current_turn_user_id || '');
      const nextIndex = (currentIndex + 1) % sessionTurn.turn_order.length;
      const nextParticipantId = sessionTurn.turn_order[nextIndex];
      
      onTurnUpdate({ 
        current_turn_user_id: nextParticipantId,
        turn_started_at: new Date().toISOString(),
        turn_ends_at: new Date(Date.now() + sessionTurn.turn_duration * 1000).toISOString(),
        round_number: nextIndex === 0 ? sessionTurn.round_number + 1 : sessionTurn.round_number
      });
      
      toast.success(`${getParticipantName(nextParticipantId)}'s turn has started`);
    } catch (error) {
      console.error('Error advancing turn:', error);
      toast.error('Failed to advance turn');
    }
  };
  
  // Pause/resume turn timer
  const toggleTurnTimer = async () => {
    if (!sessionTurn || !onTurnUpdate) return;
    
    try {
      onTurnUpdate({ 
        is_paused: !sessionTurn.is_paused
      });
      
      toast.success(sessionTurn.is_paused ? 'Timer resumed' : 'Timer paused');
    } catch (error) {
      console.error('Error toggling turn timer:', error);
      toast.error('Failed to toggle timer');
    }
  };
  
  // Add a participant token to the map
  const addParticipantToken = (participant: SessionParticipant) => {
    const isCharacter = !!participant.character_id;
    
    onAddToken({
      name: participant.character_name || participant.display_name || 'Unknown',
      token_type: isCharacter ? 'character' : 'npc',
      color: isCharacter ? '#3b82f6' : '#f59e0b',
      size: 1,
      x: 5,
      y: 5,
      is_visible_to_players: true,
      user_id: participant.user_id,
      character_id: participant.character_id
    });
    
    toast.success('Token added to map');
  };
  
  // Update turn duration
  const updateTurnSettings = async () => {
    if (!sessionTurn || !onTurnUpdate) return;
    
    try {
      onTurnUpdate({ 
        turn_duration: turnDuration
      });
      
      setIsEditingTurn(false);
      toast.success('Turn settings updated');
    } catch (error) {
      console.error('Error updating turn settings:', error);
      toast.error('Failed to update turn settings');
    }
  };
  
  // Save notes to database
  const saveNotes = async () => {
    try {
      const { data, error: existingNoteError } = await supabase
        .from('master_notes')
        .select('id')
        .eq('table_id', sessionId)
        .maybeSingle();
        
      if (existingNoteError) throw existingNoteError;
      
      if (data) {
        // Update existing note
        const { error } = await supabase
          .from('master_notes')
          .update({ 
            content: notes,
            last_updated: new Date().toISOString()
          })
          .eq('id', data.id);
          
        if (error) throw error;
      } else {
        // Create new note
        const { error } = await supabase
          .from('master_notes')
          .insert({
            table_id: sessionId,
            content: notes,
            user_id: participants.find(p => p.role === 'gm')?.user_id
          });
          
        if (error) throw error;
      }
      
      toast.success('Notes saved');
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };
  
  // Helper function to get participant name
  const getParticipantName = (userId: string) => {
    const participant = participants.find(p => p.user_id === userId);
    return participant?.character_name || participant?.display_name || 'Unknown';
  };
  
  // Load notes from database
  React.useEffect(() => {
    const loadNotes = async () => {
      try {
        const { data, error } = await supabase
          .from('master_notes')
          .select('content')
          .eq('table_id', sessionId)
          .maybeSingle();
          
        if (error) throw error;
        
        if (data) {
          setNotes(data.content);
        }
      } catch (error) {
        console.error('Error loading notes:', error);
      }
    };
    
    if (activeTab === 'notes') {
      loadNotes();
    }
  }, [activeTab, sessionId]);
  
  return (
    <div className="w-64 bg-fantasy-dark border-r border-fantasy-purple/30 flex flex-col">
      <div className="p-3 border-b border-fantasy-purple/30">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-fantasy-gold font-medievalsharp">Game Master Panel</h2>
          <Shield size={18} className="text-fantasy-gold" />
        </div>
        <Button
          onClick={onTogglePause}
          size="sm"
          variant={isPaused ? "default" : "outline"}
          className={`w-full ${isPaused ? "bg-fantasy-purple hover:bg-fantasy-purple/80" : ""}`}
        >
          {isPaused ? (
            <><Play size={16} className="mr-1" /> Resume Session</>
          ) : (
            <><Pause size={16} className="mr-1" /> Pause Session</>
          )}
        </Button>
      </div>
      
      <Tabs 
        defaultValue="participants" 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsList className="bg-fantasy-dark/70 border-b border-fantasy-purple/20 p-0 justify-start">
          <TabsTrigger 
            value="participants" 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-fantasy-gold rounded-none"
          >
            <Users size={16} />
          </TabsTrigger>
          <TabsTrigger 
            value="turns" 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-fantasy-gold rounded-none"
          >
            <Clock size={16} />
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="flex-1 py-2 data-[state=active]:border-b-2 data-[state=active]:border-fantasy-gold rounded-none"
          >
            <FileText size={16} />
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="participants" className="flex-1 p-0 m-0">
          <ScrollArea className="h-[calc(100vh-144px)]">
            <div className="p-3 space-y-2">
              <h3 className="text-sm font-medievalsharp text-fantasy-gold">Participants</h3>
              
              {participants.map(participant => (
                <div 
                  key={participant.id} 
                  className="p-2 bg-fantasy-dark/40 rounded border border-fantasy-purple/10 space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {participant.role === 'gm' ? (
                        <Crown size={14} className="text-fantasy-gold mr-1" />
                      ) : (
                        <User size={14} className="text-fantasy-stone mr-1" />
                      )}
                      <span className="text-white text-sm">
                        {participant.display_name || 'Unknown'}
                      </span>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-1"
                      onClick={() => addParticipantToken(participant)}
                    >
                      <MapPin size={14} />
                    </Button>
                  </div>
                  
                  {participant.character_name && (
                    <div className="text-xs text-fantasy-stone pl-5">
                      Playing: {participant.character_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="turns" className="flex-1 p-0 m-0">
          <ScrollArea className="h-[calc(100vh-144px)]">
            <div className="p-3 space-y-3">
              <h3 className="text-sm font-medievalsharp text-fantasy-gold">Turn Tracker</h3>
              
              {!isEditingTurn ? (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-fantasy-stone">Turn Duration:</span>
                    <span className="text-white">{sessionTurn?.turn_duration || turnDuration} seconds</span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={() => setIsEditingTurn(true)}
                  >
                    Edit Settings
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="text-xs text-fantasy-stone">Turn Duration (seconds)</label>
                    <input
                      type="number"
                      value={turnDuration}
                      onChange={(e) => setTurnDuration(parseInt(e.target.value) || 60)}
                      min="10"
                      max="300"
                      className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-1 text-white"
                    />
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    className="w-full text-xs h-7"
                    onClick={updateTurnSettings}
                  >
                    Save Settings
                  </Button>
                </div>
              )}
              
              <div className="pt-2 border-t border-fantasy-purple/20">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm text-fantasy-gold">Turn Order</h4>
                  {sessionTurn?.current_turn_user_id && (
                    <div className="text-xs bg-fantasy-purple/20 px-2 py-1 rounded">
                      Round {sessionTurn.round_number}
                    </div>
                  )}
                </div>
                
                {/* Drag-and-drop turn order list would go here - simplified version for now */}
                <div className="space-y-1">
                  {participants
                    .filter(p => p.role !== 'gm')
                    .map((participant) => {
                      const isCurrentTurn = sessionTurn?.current_turn_user_id === participant.user_id;
                      
                      return (
                        <div 
                          key={participant.id}
                          className={`p-2 rounded text-sm flex items-center justify-between
                            ${isCurrentTurn 
                              ? 'bg-fantasy-purple/40 border border-fantasy-purple/60' 
                              : 'bg-fantasy-dark/40 border border-fantasy-purple/10'
                            }`}
                        >
                          <div>
                            <div className="flex items-center">
                              {isCurrentTurn && <ArrowRight size={14} className="text-fantasy-gold mr-1" />}
                              <span className={isCurrentTurn ? 'text-white font-medium' : 'text-fantasy-stone'}>
                                {participant.character_name || participant.display_name}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
                
                <div className="mt-4 space-y-2">
                  {!sessionTurn?.current_turn_user_id ? (
                    <Button
                      variant="default"
                      size="sm"
                      className="w-full"
                      onClick={startTurn}
                      disabled={!sessionTurn?.turn_order.length}
                    >
                      <Play size={14} className="mr-1" /> Start Combat
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={nextTurn}
                      >
                        <ArrowRight size={14} className="mr-1" /> Next Turn
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={toggleTurnTimer}
                      >
                        {sessionTurn.is_paused ? (
                          <><Play size={14} className="mr-1" /> Resume Timer</>
                        ) : (
                          <><Pause size={14} className="mr-1" /> Pause Timer</>
                        )}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="notes" className="flex-1 p-0 m-0">
          <div className="p-3 h-[calc(100vh-144px)] flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medievalsharp text-fantasy-gold">Game Notes</h3>
              <Button 
                variant="ghost" 
                size="sm"
                className="h-7 text-xs"
                onClick={saveNotes}
              >
                <Save size={14} className="mr-1" /> Save
              </Button>
            </div>
            
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="flex-1 bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white resize-none"
              placeholder="Write your game notes here..."
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GameMasterPanel;
