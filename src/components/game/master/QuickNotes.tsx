import React, { useState, useEffect } from 'react';
import { StickyNote, Plus, X, Edit, Trash2, Check, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface Note {
  id: string;
  title: string;
  content: string;
  type: 'reminder' | 'note';
  color: string;
  pinned: boolean;
  reminderTime?: string;
  createdAt: string;
}

const COLORS = [
  { name: 'Roxo', value: 'bg-fantasy-purple/20 border-fantasy-purple/50' },
  { name: 'Azul', value: 'bg-blue-500/20 border-blue-500/50' },
  { name: 'Verde', value: 'bg-green-500/20 border-green-500/50' },
  { name: 'Âmbar', value: 'bg-amber-500/20 border-amber-500/50' },
  { name: 'Vermelho', value: 'bg-red-500/20 border-red-500/50' },
];

const QuickNotes: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState<Omit<Note, 'id' | 'createdAt'>>({ 
    title: '', 
    content: '', 
    type: 'note',
    color: COLORS[0].value,
    pinned: false
  });
  
  // Carregar notas do localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('dmQuickNotes');
    if (savedNotes) {
      try {
        setNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Erro ao carregar notas:', e);
      }
    }
  }, []);
  
  // Salvar notas no localStorage quando houver alterações
  useEffect(() => {
    if (notes.length > 0) {
      localStorage.setItem('dmQuickNotes', JSON.stringify(notes));
    }
  }, [notes]);
  
  // Verificar lembretes a cada minuto
  useEffect(() => {
    const checkReminders = () => {
      const now = new Date();
      
      notes.forEach(note => {
        if (note.type === 'reminder' && note.reminderTime) {
          const reminderTime = new Date(note.reminderTime);
          
          // Se o tempo do lembrete já passou e está dentro de 1 minuto
          if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60000)) {
            toast.info(`Lembrete: ${note.title}`, {
              description: note.content,
              duration: 10000,
            });
            
            // Reproduzir som de notificação
            const audio = new Audio('/sounds/notification-system.mp3');
            audio.play().catch(e => console.error('Erro ao reproduzir som:', e));
          }
        }
      });
    };
    
    // Verificar imediatamente e depois a cada minuto
    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    
    return () => clearInterval(interval);
  }, [notes]);
  
  // Adicionar nova nota
  const handleAddNote = () => {
    if (!newNote.title.trim()) {
      toast.error('O título da nota não pode estar vazio');
      return;
    }
    
    const note: Note = {
      ...newNote,
      id: Date.now().toString(),
      createdAt: new Date().toISOString()
    };
    
    setNotes(prev => [note, ...prev]);
    setNewNote({ 
      title: '', 
      content: '', 
      type: 'note',
      color: COLORS[0].value,
      pinned: false
    });
    setIsAddingNote(false);
    
    toast.success('Nota adicionada com sucesso!');
  };
  
  // Atualizar nota existente
  const handleUpdateNote = () => {
    if (!editingNoteId) return;
    
    if (!newNote.title.trim()) {
      toast.error('O título da nota não pode estar vazio');
      return;
    }
    
    setNotes(prev => prev.map(note => 
      note.id === editingNoteId 
        ? { ...note, ...newNote }
        : note
    ));
    
    setNewNote({ 
      title: '', 
      content: '', 
      type: 'note',
      color: COLORS[0].value,
      pinned: false
    });
    setEditingNoteId(null);
    
    toast.success('Nota atualizada com sucesso!');
  };
  
  // Excluir nota
  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    toast.success('Nota excluída com sucesso!');
  };
  
  // Alternar fixação da nota
  const togglePinNote = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id 
        ? { ...note, pinned: !note.pinned }
        : note
    ));
  };
  
  // Iniciar edição de nota
  const startEditingNote = (note: Note) => {
    setNewNote({
      title: note.title,
      content: note.content,
      type: note.type,
      color: note.color,
      pinned: note.pinned,
      reminderTime: note.reminderTime
    });
    setEditingNoteId(note.id);
    setIsAddingNote(true);
  };
  
  // Formatar data
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Ordenar notas: fixadas primeiro, depois por data de criação
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <StickyNote className="h-5 w-5 text-fantasy-purple" />
          <h2 className="text-xl font-medievalsharp text-fantasy-purple">Notas Rápidas</h2>
        </div>
        
        <Popover open={isAddingNote} onOpenChange={setIsAddingNote}>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="bg-fantasy-paper border-fantasy-stone/30 hover:bg-fantasy-paper/80 hover:border-fantasy-purple/50"
            >
              <Plus className="h-4 w-4 mr-1" />
              {editingNoteId ? 'Editar Nota' : 'Nova Nota'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-fantasy-paper border-fantasy-stone/30">
            <div className="space-y-3">
              <h3 className="font-medievalsharp text-fantasy-purple">
                {editingNoteId ? 'Editar Nota' : 'Nova Nota'}
              </h3>
              
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant={newNote.type === 'note' ? 'default' : 'outline'}
                    size="sm"
                    className={newNote.type === 'note' ? 'bg-fantasy-purple' : ''}
                    onClick={() => setNewNote({...newNote, type: 'note'})}
                  >
                    <StickyNote className="h-4 w-4 mr-1" />
                    Nota
                  </Button>
                  <Button
                    variant={newNote.type === 'reminder' ? 'default' : 'outline'}
                    size="sm"
                    className={newNote.type === 'reminder' ? 'bg-fantasy-purple' : ''}
                    onClick={() => setNewNote({...newNote, type: 'reminder'})}
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Lembrete
                  </Button>
                </div>
                
                <Input
                  placeholder="Título"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  className="bg-white/10 border-fantasy-stone/30"
                />
                
                <Textarea
                  placeholder="Conteúdo"
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  className="bg-white/10 border-fantasy-stone/30 min-h-[100px]"
                />
                
                {newNote.type === 'reminder' && (
                  <div className="space-y-1">
                    <label className="text-sm text-fantasy-stone">Data e hora do lembrete:</label>
                    <Input
                      type="datetime-local"
                      value={newNote.reminderTime || ''}
                      onChange={(e) => setNewNote({...newNote, reminderTime: e.target.value})}
                      className="bg-white/10 border-fantasy-stone/30"
                    />
                  </div>
                )}
                
                <div className="space-y-1">
                  <label className="text-sm text-fantasy-stone">Cor:</label>
                  <div className="flex space-x-2">
                    {COLORS.map((color) => (
                      <div 
                        key={color.value}
                        className={`w-6 h-6 rounded-full cursor-pointer ${color.value} flex items-center justify-center ${newNote.color === color.value ? 'ring-2 ring-fantasy-purple' : ''}`}
                        onClick={() => setNewNote({...newNote, color: color.value})}
                        title={color.name}
                      >
                        {newNote.color === color.value && <Check className="h-3 w-3 text-fantasy-stone" />}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="pin-note"
                    checked={newNote.pinned}
                    onChange={(e) => setNewNote({...newNote, pinned: e.target.checked})}
                    className="rounded border-fantasy-stone/30"
                  />
                  <label htmlFor="pin-note" className="text-sm text-fantasy-stone cursor-pointer">Fixar esta nota</label>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 pt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    setIsAddingNote(false);
                    setEditingNoteId(null);
                    setNewNote({ 
                      title: '', 
                      content: '', 
                      type: 'note',
                      color: COLORS[0].value,
                      pinned: false
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button 
                  size="sm"
                  onClick={editingNoteId ? handleUpdateNote : handleAddNote}
                >
                  {editingNoteId ? 'Atualizar' : 'Adicionar'}
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
      
      {notes.length === 0 ? (
        <Card className="bg-fantasy-paper/50 border-fantasy-stone/20">
          <CardContent className="p-6 text-center">
            <p className="text-fantasy-stone/70">Nenhuma nota ou lembrete adicionado.</p>
            <p className="text-fantasy-stone/50 text-sm mt-1">Clique em "Nova Nota" para adicionar.</p>
          </CardContent>
        </Card>
      ) : (
        <ScrollArea className="h-[300px] pr-4">
          <div className="space-y-3">
            {sortedNotes.map((note) => (
              <Card 
                key={note.id} 
                className={`${note.color} border transition-colors hover:border-fantasy-purple/70`}
              >
                <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-base font-medievalsharp text-fantasy-purple flex items-center">
                      {note.type === 'reminder' ? (
                        <Clock className="h-4 w-4 mr-1 inline-block" />
                      ) : (
                        <StickyNote className="h-4 w-4 mr-1 inline-block" />
                      )}
                      {note.title}
                      {note.pinned && (
                        <Badge variant="outline" className="ml-2 text-xs py-0 px-1 h-4">
                          Fixado
                        </Badge>
                      )}
                    </CardTitle>
                    {note.type === 'reminder' && note.reminderTime && (
                      <p className="text-xs text-fantasy-stone/70 mt-1">
                        Lembrete para: {formatDate(note.reminderTime)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-fantasy-stone/60 hover:text-fantasy-purple"
                      onClick={() => togglePinNote(note.id)}
                      title={note.pinned ? "Desafixar" : "Fixar"}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <line x1="12" y1="17" x2="12" y2="22" />
                        <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z" />
                      </svg>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-fantasy-stone/60 hover:text-fantasy-purple"
                      onClick={() => startEditingNote(note)}
                      title="Editar"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-fantasy-stone/60 hover:text-red-500"
                      onClick={() => handleDeleteNote(note.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-2">
                  <p className="text-sm text-fantasy-stone whitespace-pre-line">{note.content}</p>
                  <p className="text-xs text-fantasy-stone/50 mt-2">
                    Criado em: {formatDate(note.createdAt)}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default QuickNotes;