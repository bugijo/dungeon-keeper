import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, X, Edit, Save, Trash, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  color: 'default' | 'red' | 'green' | 'blue' | 'purple' | 'yellow';
  isPinned: boolean;
  createdAt: Date;
  synced?: boolean;
  last_updated?: string;
}

interface QuickNotesProps {
  className?: string;
  initialNotes?: Note[];
  onNoteAdd?: (note: Note) => void;
  onNoteUpdate?: (note: Note) => void;
  onNoteDelete?: (noteId: string) => void;
  sessionId?: string;
  userId?: string;
  syncWithSupabase?: boolean;
}

/**
 * Componente de Lembretes e Notas Rápidas para o Mestre
 * Permite ao mestre criar e gerenciar notas durante a sessão
 */
export function QuickNotes({
  className,
  initialNotes = [],
  onNoteAdd,
  onNoteUpdate,
  onNoteDelete,
  sessionId,
  userId,
  syncWithSupabase = false,
}: QuickNotesProps) {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Partial<Note>>({
    title: '',
    content: '',
    color: 'default',
    isPinned: false,
  });
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);

  // Salvar notas no localStorage
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('dm-quick-notes', JSON.stringify(notes));
    }
    
    // Sincronizar com Supabase se necessário
    if (syncWithSupabase && sessionId && userId && !syncing) {
      const syncNotesWithSupabase = async () => {
        try {
          setSyncing(true);
          await syncNotesToSupabase();
        } catch (error) {
          console.error('Erro ao sincronizar notas:', error);
        } finally {
          setSyncing(false);
        }
      };
      
      // Debounce para evitar muitas chamadas
      const timeoutId = setTimeout(() => {
        syncNotesWithSupabase();
      }, 2000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [notes, syncWithSupabase, sessionId, userId]);

  // Carregar notas do localStorage ou Supabase na inicialização
  useEffect(() => {
    const loadNotes = async () => {
      try {
        setLoading(true);
        
        if (syncWithSupabase && sessionId && userId) {
          // Carregar do Supabase
          await loadNotesFromSupabase();
        } else if (initialNotes.length === 0) {
          // Carregar do localStorage
          const savedNotes = localStorage.getItem('dm-quick-notes');
          if (savedNotes) {
            try {
              const parsedNotes = JSON.parse(savedNotes);
              // Converter strings de data para objetos Date
              const notesWithDates = parsedNotes.map((note: any) => ({
                ...note,
                createdAt: new Date(note.createdAt),
              }));
              setNotes(notesWithDates);
            } catch (error) {
              console.error('Erro ao carregar notas:', error);
            }
          }
        }
      } catch (error) {
        console.error('Erro ao carregar notas:', error);
        toast.error('Erro ao carregar suas notas rápidas');
      } finally {
        setLoading(false);
      }
    };
    
    loadNotes();
    
    // Configurar inscrição em tempo real para atualizações de notas
    if (syncWithSupabase && sessionId) {
      const notesChannel = supabase
        .channel('quick_notes_changes')
        .on(
          'postgres_changes',
          { 
            event: '*', 
            schema: 'public', 
            table: 'quick_notes',
            filter: `session_id=eq.${sessionId}` 
          },
          (payload) => {
            if (payload.eventType === 'DELETE') {
              // Remover nota excluída
              setNotes(prevNotes => prevNotes.filter(note => 
                note.id !== payload.old.note_id
              ));
            } else if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              // Atualizar ou adicionar nota
              handleSupabaseNoteChange(payload.new);
            }
          }
        )
        .subscribe();
        
      return () => {
        supabase.removeChannel(notesChannel);
      };
    }
  }, [initialNotes, syncWithSupabase, sessionId, userId]);

  // Função para carregar notas do Supabase
  const loadNotesFromSupabase = async () => {
    if (!sessionId || !userId) return;
    
    try {
      const { data, error } = await supabase
        .from('quick_notes')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        const formattedNotes: Note[] = data.map(item => ({
          id: item.note_id,
          title: item.title,
          content: item.content,
          color: item.color as Note['color'],
          isPinned: item.is_pinned,
          createdAt: new Date(item.created_at),
          synced: true,
          last_updated: item.last_updated
        }));
        
        setNotes(formattedNotes);
        setLastSynced(new Date());
      }
    } catch (error) {
      console.error('Erro ao carregar notas do Supabase:', error);
      throw error;
    }
  };
  
  // Função para sincronizar notas com o Supabase
  const syncNotesToSupabase = async () => {
    if (!sessionId || !userId || notes.length === 0) return;
    
    try {
      // Obter notas existentes do Supabase
      const { data: existingNotes, error: fetchError } = await supabase
        .from('quick_notes')
        .select('note_id')
        .eq('session_id', sessionId)
        .eq('user_id', userId);
      
      if (fetchError) throw fetchError;
      
      const existingNoteIds = new Set(existingNotes?.map(n => n.note_id) || []);
      
      // Preparar operações em lote
      const notesToInsert = [];
      const notesToUpdate = [];
      
      for (const note of notes) {
        const noteData = {
          note_id: note.id,
          session_id: sessionId,
          user_id: userId,
          title: note.title,
          content: note.content,
          color: note.color,
          is_pinned: note.isPinned,
          created_at: note.createdAt.toISOString(),
          last_updated: new Date().toISOString()
        };
        
        if (existingNoteIds.has(note.id)) {
          notesToUpdate.push(noteData);
        } else {
          notesToInsert.push(noteData);
        }
      }
      
      // Inserir novas notas
      if (notesToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('quick_notes')
          .insert(notesToInsert);
          
        if (insertError) throw insertError;
      }
      
      // Atualizar notas existentes
      for (const noteData of notesToUpdate) {
        const { error: updateError } = await supabase
          .from('quick_notes')
          .update({
            title: noteData.title,
            content: noteData.content,
            color: noteData.color,
            is_pinned: noteData.is_pinned,
            last_updated: noteData.last_updated
          })
          .eq('note_id', noteData.note_id)
          .eq('session_id', noteData.session_id)
          .eq('user_id', noteData.user_id);
          
        if (updateError) throw updateError;
      }
      
      // Verificar se há notas para excluir (existem no Supabase mas não localmente)
      const currentNoteIds = new Set(notes.map(n => n.id));
      const notesToDelete = [...existingNoteIds].filter(id => !currentNoteIds.has(id));
      
      if (notesToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('quick_notes')
          .delete()
          .in('note_id', notesToDelete);
          
        if (deleteError) throw deleteError;
      }
      
      setLastSynced(new Date());
    } catch (error) {
      console.error('Erro ao sincronizar notas com Supabase:', error);
      throw error;
    }
  };
  
  // Função para processar mudanças de notas vindas do Supabase
  const handleSupabaseNoteChange = (noteData: any) => {
    const formattedNote: Note = {
      id: noteData.note_id,
      title: noteData.title,
      content: noteData.content,
      color: noteData.color as Note['color'],
      isPinned: noteData.is_pinned,
      createdAt: new Date(noteData.created_at),
      synced: true,
      last_updated: noteData.last_updated
    };
    
    setNotes(prevNotes => {
      // Verificar se a nota já existe
      const noteIndex = prevNotes.findIndex(n => n.id === formattedNote.id);
      
      if (noteIndex >= 0) {
        // Atualizar nota existente
        const updatedNotes = [...prevNotes];
        updatedNotes[noteIndex] = formattedNote;
        return updatedNotes;
      } else {
        // Adicionar nova nota
        return [...prevNotes, formattedNote];
      }
    });
  };

  const handleAddNote = async () => {
    if (!newNote.title || !newNote.content) return;

    const note: Note = {
      id: `note-${Date.now()}`,
      title: newNote.title,
      content: newNote.content,
      color: newNote.color as Note['color'],
      isPinned: newNote.isPinned || false,
      createdAt: new Date(),
    };

    const updatedNotes = [...notes, note];
    setNotes(updatedNotes);
    setIsAddingNote(false);
    setNewNote({
      title: '',
      content: '',
      color: 'default',
      isPinned: false,
    });

    if (onNoteAdd) {
      onNoteAdd(note);
    }
    
    // Sincronizar com Supabase se necessário
    if (syncWithSupabase && sessionId && userId) {
      try {
        setSyncing(true);
        await supabase
          .from('quick_notes')
          .insert({
            note_id: note.id,
            session_id: sessionId,
            user_id: userId,
            title: note.title,
            content: note.content,
            color: note.color,
            is_pinned: note.isPinned,
            created_at: note.createdAt.toISOString(),
            last_updated: new Date().toISOString()
          });
          
        setLastSynced(new Date());
        toast.success('Nota adicionada e sincronizada');
      } catch (error) {
        console.error('Erro ao adicionar nota no Supabase:', error);
        toast.error('Erro ao sincronizar nota');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleUpdateNote = async (noteId: string) => {
    const noteToUpdate = notes.find(note => note.id === noteId);
    if (!noteToUpdate) return;

    const updatedNote = {
      ...noteToUpdate,
      title: newNote.title || noteToUpdate.title,
      content: newNote.content || noteToUpdate.content,
      color: newNote.color as Note['color'] || noteToUpdate.color,
      isPinned: newNote.isPinned !== undefined ? newNote.isPinned : noteToUpdate.isPinned,
    };

    const updatedNotes = notes.map(note =>
      note.id === noteId ? updatedNote : note
    );

    setNotes(updatedNotes);
    setEditingNoteId(null);
    setNewNote({
      title: '',
      content: '',
      color: 'default',
      isPinned: false,
    });

    if (onNoteUpdate) {
      onNoteUpdate(updatedNote);
    }
    
    // Sincronizar com Supabase se necessário
    if (syncWithSupabase && sessionId && userId) {
      try {
        setSyncing(true);
        
        const { error } = await supabase
          .from('quick_notes')
          .update({
            title: updatedNote.title,
            content: updatedNote.content,
            color: updatedNote.color,
            is_pinned: updatedNote.isPinned,
            last_updated: new Date().toISOString()
          })
          .eq('note_id', noteId)
          .eq('session_id', sessionId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        setLastSynced(new Date());
        toast.success('Nota atualizada e sincronizada');
      } catch (error) {
        console.error('Erro ao atualizar nota no Supabase:', error);
        toast.error('Erro ao sincronizar nota');
      } finally {
        setSyncing(false);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    setNotes(updatedNotes);

    if (onNoteDelete) {
      onNoteDelete(noteId);
    }
    
    // Sincronizar com Supabase se necessário
    if (syncWithSupabase && sessionId && userId) {
      try {
        setSyncing(true);
        
        const { error } = await supabase
          .from('quick_notes')
          .delete()
          .eq('note_id', noteId)
          .eq('session_id', sessionId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        setLastSynced(new Date());
        toast.success('Nota excluída e sincronizada');
      } catch (error) {
        console.error('Erro ao excluir nota no Supabase:', error);
        toast.error('Erro ao sincronizar exclusão');
      } finally {
        setSyncing(false);
      }
    }
  };

  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setNewNote({
      title: note.title,
      content: note.content,
      color: note.color,
      isPinned: note.isPinned,
    });
  };

  const cancelEditing = () => {
    setEditingNoteId(null);
    setIsAddingNote(false);
    setNewNote({
      title: '',
      content: '',
      color: 'default',
      isPinned: false,
    });
  };

  const togglePin = async (noteId: string) => {
    const updatedNotes = notes.map(note =>
      note.id === noteId ? { ...note, isPinned: !note.isPinned } : note
    );

    setNotes(updatedNotes);

    if (onNoteUpdate) {
      const updatedNote = updatedNotes.find(note => note.id === noteId);
      if (updatedNote) {
        onNoteUpdate(updatedNote);
      }
    }
    
    // Sincronizar com Supabase se necessário
    if (syncWithSupabase && sessionId && userId) {
      try {
        setSyncing(true);
        
        const noteToUpdate = updatedNotes.find(note => note.id === noteId);
        if (!noteToUpdate) return;
        
        const { error } = await supabase
          .from('quick_notes')
          .update({
            is_pinned: noteToUpdate.isPinned,
            last_updated: new Date().toISOString()
          })
          .eq('note_id', noteId)
          .eq('session_id', sessionId)
          .eq('user_id', userId);
          
        if (error) throw error;
        
        setLastSynced(new Date());
      } catch (error) {
        console.error('Erro ao atualizar fixação no Supabase:', error);
      } finally {
        setSyncing(false);
      }
    }
  };

  // Cores das notas
  const noteColors = {
    default: 'bg-amber-950/70 border-amber-800/50',
    red: 'bg-red-950/70 border-red-800/50',
    green: 'bg-green-950/70 border-green-800/50',
    blue: 'bg-blue-950/70 border-blue-800/50',
    purple: 'bg-purple-950/70 border-purple-800/50',
    yellow: 'bg-yellow-950/70 border-yellow-800/50',
  };

  // Ordenar notas: fixadas primeiro, depois por data de criação (mais recentes primeiro)
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-amber-200 font-medievalsharp text-lg flex items-center gap-2">
          <StickyNote className="h-5 w-5" />
          Lembretes do Mestre
          {syncWithSupabase && syncing && (
            <RefreshCw className="h-3 w-3 text-amber-400 animate-spin ml-2" />
          )}
        </h3>
        <div className="flex items-center gap-2">
          {syncWithSupabase && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  setSyncing(true);
                  await syncNotesToSupabase();
                  toast.success('Notas sincronizadas com sucesso');
                } catch (error) {
                  toast.error('Erro ao sincronizar notas');
                } finally {
                  setSyncing(false);
                }
              }}
              disabled={syncing || loading}
              className="text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
            >
              <RefreshCw className={cn("h-3.5 w-3.5 mr-1", syncing && "animate-spin")} />
              Sincronizar
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setIsAddingNote(!isAddingNote);
              setEditingNoteId(null);
            }}
            className="text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
          >
            {isAddingNote ? 'Cancelar' : 'Nova Nota'}
          </Button>
        </div>
      </div>

      {/* Formulário para adicionar/editar nota */}
      {(isAddingNote || editingNoteId) && (
        <div className="p-3 rounded-md border border-amber-800/50 bg-amber-950/50">
          <div className="space-y-3">
            <Input
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              placeholder="Título"
              className="border-amber-800/50 bg-amber-950/30 text-amber-200 placeholder:text-amber-200/50"
            />
            <textarea
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              placeholder="Conteúdo da nota"
              rows={3}
              className="w-full rounded-md border border-amber-800/50 bg-amber-950/30 p-2 text-amber-200 placeholder:text-amber-200/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 focus-visible:ring-offset-2 focus-visible:ring-offset-amber-950"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                {Object.entries(noteColors).map(([color, className]) => (
                  <button
                    key={color}
                    onClick={() => setNewNote({ ...newNote, color: color as Note['color'] })}
                    className={cn(
                      'h-5 w-5 rounded-full border',
                      className,
                      newNote.color === color && 'ring-2 ring-amber-400 ring-offset-1 ring-offset-amber-950'
                    )}
                    aria-label={`Cor ${color}`}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setNewNote({ ...newNote, isPinned: !newNote.isPinned })}
                  className={cn(
                    'text-amber-400 hover:text-amber-300 transition-colors',
                    newNote.isPinned && 'text-amber-300'
                  )}
                  aria-label={newNote.isPinned ? 'Desafixar' : 'Fixar'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="17" x2="12" y2="22" />
                    <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                  </svg>
                </button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => editingNoteId ? handleUpdateNote(editingNoteId) : handleAddNote()}
                  className="text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
                >
                  {editingNoteId ? 'Atualizar' : 'Salvar'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEditing}
                  className="text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status de sincronização */}
      {syncWithSupabase && lastSynced && (
        <div className="text-xs text-amber-500/70 text-right">
          Última sincronização: {lastSynced.toLocaleString()}
        </div>
      )}
      
      {/* Lista de notas */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {loading ? (
          <div className="col-span-full text-center p-4 border border-dashed border-amber-800/30 rounded-md">
            <p className="text-sm text-amber-200/70 flex items-center justify-center">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Carregando notas...
            </p>
          </div>
        ) : sortedNotes.length === 0 && !isAddingNote ? (
          <div className="col-span-full text-center p-4 border border-dashed border-amber-800/30 rounded-md">
            <p className="text-sm text-amber-200/70">Nenhuma nota adicionada</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingNote(true)}
              className="mt-2 text-xs bg-amber-950/50 border-amber-800/70 hover:bg-amber-900/50 text-amber-200"
            >
              Adicionar nota
            </Button>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'relative p-3 rounded-md border',
                noteColors[note.color],
                'transition-all hover:shadow-md'
              )}
            >
              <div className="flex items-start justify-between">
                <h4 className="text-sm font-medievalsharp text-amber-200 pr-6">{note.title}</h4>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => togglePin(note.id)}
                    className={cn(
                      'text-amber-400 hover:text-amber-300 transition-colors',
                      note.isPinned && 'text-amber-300'
                    )}
                    aria-label={note.isPinned ? 'Desafixar' : 'Fixar'}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="12" y1="17" x2="12" y2="22" />
                      <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0-4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => startEditingNote(note)}
                    className="text-amber-400 hover:text-amber-300 transition-colors"
                    aria-label="Editar"
                  >
                    <Edit className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteNote(note.id)}
                    className="text-amber-400 hover:text-red-400 transition-colors"
                    aria-label="Excluir"
                  >
                    <Trash className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-amber-200/80 mt-1 whitespace-pre-line">{note.content}</p>
              <p className="text-xs text-amber-500/70 mt-2">
                {note.createdAt.toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}