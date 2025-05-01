
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Save } from 'lucide-react';

export interface NotesTabProps {
  sessionId?: string;
  userId?: string;
  notes?: string;
  setNotes?: React.Dispatch<React.SetStateAction<string>>;
}

const NotesTab: React.FC<NotesTabProps> = ({ sessionId, userId }) => {
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Carregar notas do mestre
    const loadNotes = async () => {
      if (!sessionId || !userId) return;
      
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('master_notes')
          .select('content, last_updated')
          .eq('table_id', sessionId)
          .eq('user_id', userId)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = não encontrado
          throw error;
        }
        
        if (data) {
          setNotes(data.content);
          setLastSaved(new Date(data.last_updated));
        }
      } catch (error) {
        console.error("Erro ao carregar notas:", error);
        toast.error("Erro ao carregar suas notas");
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
    
    // Setup realtime subscription for notes updates
    const notesChannel = supabase
      .channel('master_notes_changes')
      .on(
        'postgres_changes',
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'master_notes',
          filter: `table_id=eq.${sessionId}` 
        },
        (payload) => {
          if (payload.new && payload.new.user_id === userId) {
            setNotes(payload.new.content);
            setLastSaved(new Date(payload.new.last_updated));
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(notesChannel);
    };
  }, [sessionId, userId]);

  const saveNotes = async () => {
    if (!sessionId || !userId) return;
    
    try {
      setSaving(true);
      
      const { data, error: selectError } = await supabase
        .from('master_notes')
        .select('id')
        .eq('table_id', sessionId)
        .eq('user_id', userId)
        .single();
      
      if (selectError && selectError.code !== 'PGRST116') {
        throw selectError;
      }
      
      const now = new Date();
      
      if (data) {
        // Atualizar nota existente
        const { error } = await supabase
          .from('master_notes')
          .update({ 
            content: notes,
            last_updated: now.toISOString()
          })
          .eq('id', data.id);
          
        if (error) throw error;
      } else {
        // Criar nova nota
        const { error } = await supabase
          .from('master_notes')
          .insert({
            table_id: sessionId,
            user_id: userId,
            content: notes,
            last_updated: now.toISOString()
          });
          
        if (error) throw error;
      }
      
      setLastSaved(now);
      toast.success("Notas salvas com sucesso");
    } catch (error) {
      console.error("Erro ao salvar notas:", error);
      toast.error("Erro ao salvar suas notas");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-lg font-medievalsharp text-fantasy-gold mb-2">Notas do Mestre</h3>
      <p className="text-fantasy-stone text-sm mb-4">
        Suas anotações privadas para esta sessão. Somente você pode ver estas notas.
      </p>
      
      <div className="flex-grow flex flex-col">
        {loading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-pulse text-fantasy-stone">Carregando suas notas...</div>
          </div>
        ) : (
          <ScrollArea className="flex-1">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva suas notas aqui..."
              className="min-h-[300px] bg-fantasy-dark/50 border-fantasy-purple/30 text-white resize-none"
            />
          </ScrollArea>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          {lastSaved && (
            <div className="text-xs text-fantasy-stone">
              Último salvamento: {lastSaved.toLocaleString()}
            </div>
          )}
          <Button
            onClick={saveNotes}
            disabled={saving || loading}
            className="fantasy-button primary"
          >
            {saving ? (
              <span className="flex items-center">
                <span className="animate-spin mr-2">⟳</span> Salvando...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save size={16} /> Salvar Notas
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotesTab;
