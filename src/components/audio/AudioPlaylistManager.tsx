import React, { useState, useEffect } from 'react';
import { PlusCircle, Music, Save, Trash2, Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AudioPlayer } from './AudioPlayer';

// Tipos para o sistema de áudio
interface AudioTrack {
  id: string;
  title: string;
  url: string;
  category?: string;
  duration?: number;
  tags?: string[];
}

interface AudioPlaylist {
  id: string;
  name: string;
  tracks: string[]; // IDs das faixas
  category: string;
  createdBy: string;
  isDefault?: boolean;
}

interface AudioPlaylistManagerProps {
  isGameMaster?: boolean;
  onPlaylistSelect?: (playlistId: string) => void;
  onTrackPlay?: (trackId: string) => void;
}

const AMBIENT_CATEGORIES = [
  'batalha',
  'taverna',
  'floresta',
  'dungeon',
  'cidade',
  'mistério',
  'oceano',
  'montanha',
  'deserto',
  'celebração',
  'tensão',
];

// Dados de exemplo para desenvolvimento
const SAMPLE_TRACKS: AudioTrack[] = [
  { id: '1', title: 'Batalha Épica', url: '/assets/audio/battle-epic.mp3', category: 'batalha', tags: ['combate', 'épico'] },
  { id: '2', title: 'Taverna Animada', url: '/assets/audio/tavern-cheerful.mp3', category: 'taverna', tags: ['social'] },
  { id: '3', title: 'Floresta Misteriosa', url: '/assets/audio/forest-mystery.mp3', category: 'floresta', tags: ['natureza', 'mistério'] },
  { id: '4', title: 'Calabouço Sombrio', url: '/assets/audio/dungeon-dark.mp3', category: 'dungeon', tags: ['subterrâneo', 'terror'] },
  { id: '5', title: 'Cidade Movimentada', url: '/assets/audio/city-busy.mp3', category: 'cidade', tags: ['urbano', 'multidão'] },
];

const SAMPLE_PLAYLISTS: AudioPlaylist[] = [
  { id: '1', name: 'Combates Épicos', tracks: ['1'], category: 'batalha', createdBy: 'Mestre', isDefault: true },
  { id: '2', name: 'Ambientes de Taverna', tracks: ['2'], category: 'taverna', createdBy: 'Mestre' },
  { id: '3', name: 'Explorando a Floresta', tracks: ['3'], category: 'floresta', createdBy: 'Mestre' },
];

export const AudioPlaylistManager: React.FC<AudioPlaylistManagerProps> = ({
  isGameMaster = false,
  onPlaylistSelect,
  onTrackPlay,
}) => {
  const [tracks, setTracks] = useState<AudioTrack[]>(SAMPLE_TRACKS);
  const [playlists, setPlaylists] = useState<AudioPlaylist[]>(SAMPLE_PLAYLISTS);
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [currentPlaylist, setCurrentPlaylist] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  
  // Estados para criação/edição de playlist
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistCategory, setNewPlaylistCategory] = useState('');
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  
  // Filtrar tracks e playlists por categoria
  const filteredTracks = selectedCategory === 'todos' 
    ? tracks 
    : tracks.filter(track => track.category === selectedCategory);
  
  const filteredPlaylists = selectedCategory === 'todos' 
    ? playlists 
    : playlists.filter(playlist => playlist.category === selectedCategory);
  
  // Manipuladores de eventos
  const handlePlaylistSelect = (playlistId: string) => {
    setCurrentPlaylist(playlistId);
    if (onPlaylistSelect) {
      onPlaylistSelect(playlistId);
    }
    setIsPlaying(true);
  };
  
  const handleTrackSelect = (trackId: string) => {
    if (onTrackPlay) {
      onTrackPlay(trackId);
    }
    setIsPlaying(true);
  };
  
  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };
  
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };
  
  const handleVolumeChange = (values: number[]) => {
    setVolume(values[0]);
  };
  
  // Manipuladores para criação de playlist
  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim() === '' || selectedTracks.length === 0) return;
    
    const newPlaylist: AudioPlaylist = {
      id: Date.now().toString(),
      name: newPlaylistName,
      tracks: selectedTracks,
      category: newPlaylistCategory || 'outros',
      createdBy: 'Usuário',
    };
    
    setPlaylists([...playlists, newPlaylist]);
    setIsCreatePlaylistOpen(false);
    resetPlaylistForm();
  };
  
  const resetPlaylistForm = () => {
    setNewPlaylistName('');
    setNewPlaylistCategory('');
    setSelectedTracks([]);
  };
  
  const toggleTrackSelection = (trackId: string) => {
    if (selectedTracks.includes(trackId)) {
      setSelectedTracks(selectedTracks.filter(id => id !== trackId));
    } else {
      setSelectedTracks([...selectedTracks, trackId]);
    }
  };
  
  // Renderizar a lista de playlists
  const renderPlaylists = () => {
    if (filteredPlaylists.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Music size={32} className="mx-auto mb-2 opacity-50" />
          <p>Nenhuma playlist encontrada nesta categoria</p>
        </div>
      );
    }
    
    return filteredPlaylists.map(playlist => {
      const isActive = currentPlaylist === playlist.id;
      const playlistTracks = tracks.filter(track => playlist.tracks.includes(track.id));
      
      return (
        <div 
          key={playlist.id}
          className={`p-3 rounded-lg mb-3 cursor-pointer transition-all ${isActive ? 'bg-primary/20 border border-primary/30' : 'bg-card hover:bg-card/80'}`}
          onClick={() => handlePlaylistSelect(playlist.id)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-medium">{playlist.name}</h3>
              <p className="text-xs text-muted-foreground">{playlistTracks.length} faixas • {playlist.category}</p>
            </div>
            <div className="flex gap-1">
              {isActive && isPlaying ? (
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); togglePlayPause(); }}>
                  <Pause size={16} />
                </Button>
              ) : (
                <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePlaylistSelect(playlist.id); }}>
                  <Play size={16} />
                </Button>
              )}
              
              {isGameMaster && !playlist.isDefault && (
                <Button 
                  size="icon" 
                  variant="ghost" 
                  className="text-destructive hover:text-destructive"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setPlaylists(playlists.filter(p => p.id !== playlist.id));
                    if (currentPlaylist === playlist.id) setCurrentPlaylist(null);
                  }}
                >
                  <Trash2 size={16} />
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    });
  };
  
  // Renderizar a lista de faixas
  const renderTracks = () => {
    if (filteredTracks.length === 0) {
      return (
        <div className="text-center py-8 text-gray-400">
          <Music size={32} className="mx-auto mb-2 opacity-50" />
          <p>Nenhuma faixa encontrada nesta categoria</p>
        </div>
      );
    }
    
    return filteredTracks.map(track => (
      <div 
        key={track.id}
        className="p-3 rounded-lg mb-2 bg-card hover:bg-card/80 cursor-pointer transition-all"
        onClick={() => handleTrackSelect(track.id)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{track.title}</h3>
            <p className="text-xs text-muted-foreground">{track.category}</p>
          </div>
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handleTrackSelect(track.id); }}>
              <Play size={16} />
            </Button>
            
            {isCreatePlaylistOpen && (
              <Button 
                size="icon" 
                variant={selectedTracks.includes(track.id) ? "default" : "outline"}
                onClick={(e) => { 
                  e.stopPropagation(); 
                  toggleTrackSelection(track.id);
                }}
              >
                <PlusCircle size={16} />
              </Button>
            )}
          </div>
        </div>
      </div>
    ));
  };
  
  return (
    <div className="bg-background border rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Sistema de Áudio</h2>
          
          {isGameMaster && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="flex items-center gap-1"
            >
              <PlusCircle size={14} />
              Nova Playlist
            </Button>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <Button 
            size="icon" 
            variant={isPlaying ? "default" : "outline"}
            onClick={togglePlayPause}
            disabled={!currentPlaylist}
          >
            {isPlaying ? <Pause size={16} /> : <Play size={16} />}
          </Button>
          
          <Button 
            size="icon" 
            variant="outline"
            onClick={toggleMute}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </Button>
          
          <div className="flex-1 px-2">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
            />
          </div>
          
          <span className="text-sm w-8 text-right">{isMuted ? 0 : volume}%</span>
        </div>
      </div>
      
      <Tabs defaultValue="playlists" className="w-full">
        <div className="px-4 pt-2">
          <TabsList className="w-full">
            <TabsTrigger value="playlists" className="flex-1">Playlists</TabsTrigger>
            <TabsTrigger value="tracks" className="flex-1">Faixas</TabsTrigger>
          </TabsList>
        </div>
        
        <div className="p-4 pt-2">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-thin">
            <Button 
              variant={selectedCategory === 'todos' ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory('todos')}
              className="whitespace-nowrap"
            >
              Todos
            </Button>
            
            {AMBIENT_CATEGORIES.map(category => (
              <Button 
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="whitespace-nowrap capitalize"
              >
                {category}
              </Button>
            ))}
          </div>
          
          <TabsContent value="playlists" className="mt-0">
            <ScrollArea className="h-[300px] pr-4">
              {renderPlaylists()}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="tracks" className="mt-0">
            <ScrollArea className="h-[300px] pr-4">
              {renderTracks()}
            </ScrollArea>
          </TabsContent>
        </div>
      </Tabs>
      
      {/* Modal de criação de playlist */}
      <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Playlist</DialogTitle>
            <DialogDescription>
              Selecione as faixas e configure sua nova playlist de ambientação.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="playlist-name">Nome da Playlist</Label>
              <Input 
                id="playlist-name" 
                value={newPlaylistName} 
                onChange={(e) => setNewPlaylistName(e.target.value)} 
                placeholder="Ex: Batalha na Floresta"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="playlist-category">Categoria</Label>
              <Select value={newPlaylistCategory} onValueChange={setNewPlaylistCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {AMBIENT_CATEGORIES.map(category => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="mb-2 block">Selecione as Faixas</Label>
              <ScrollArea className="h-[200px] border rounded-md p-2">
                {tracks.map(track => (
                  <div 
                    key={track.id}
                    className={`p-2 rounded-md mb-1 flex items-center justify-between cursor-pointer ${selectedTracks.includes(track.id) ? 'bg-primary/20' : 'hover:bg-muted'}`}
                    onClick={() => toggleTrackSelection(track.id)}
                  >
                    <div className="flex items-center gap-2">
                      <Music size={16} />
                      <span>{track.title}</span>
                    </div>
                    <div className="text-xs text-muted-foreground capitalize">{track.category}</div>
                  </div>
                ))}
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-1">
                {selectedTracks.length} faixas selecionadas
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsCreatePlaylistOpen(false);
              resetPlaylistForm();
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreatePlaylist}
              disabled={newPlaylistName.trim() === '' || selectedTracks.length === 0}
            >
              <Save size={16} className="mr-2" />
              Salvar Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Player de áudio oculto para reprodução */}
      <div className="hidden">
        <AudioPlayer compact showPlaylist={false} />
      </div>
    </div>
  );
};

export default AudioPlaylistManager;