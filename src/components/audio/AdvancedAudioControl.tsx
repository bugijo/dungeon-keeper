import React, { useState, useEffect } from 'react';
import { Music, Volume2, VolumeX, Play, Pause, Image, MapPin, Cloud, Users, Coffee, Sword, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AudioScene {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  audioTrackId: string;
  type: 'ambiente' | 'personagem' | 'evento';
  tags: string[];
}

interface AdvancedAudioControlProps {
  onSceneActivate?: (scene: AudioScene) => void;
  onImageChange?: (imageUrl: string) => void;
}

// Dados de exemplo para desenvolvimento
const SAMPLE_SCENES: AudioScene[] = [
  { 
    id: '1', 
    name: 'Taverna Animada', 
    description: 'Sons de uma taverna movimentada com música, conversas e risos', 
    imageUrl: '/assets/images/scenes/tavern.jpg', 
    audioTrackId: '2', 
    type: 'ambiente',
    tags: ['taverna', 'cidade', 'social']
  },
  { 
    id: '2', 
    name: 'Cidade Movimentada', 
    description: 'Barulho de uma cidade medieval com mercadores e transeuntes', 
    imageUrl: '/assets/images/scenes/city.jpg', 
    audioTrackId: '5', 
    type: 'ambiente',
    tags: ['cidade', 'mercado', 'urbano']
  },
  { 
    id: '3', 
    name: 'Floresta Misteriosa', 
    description: 'Sons da floresta com pássaros, vento nas folhas e galhos estalando', 
    imageUrl: '/assets/images/scenes/forest.jpg', 
    audioTrackId: '3', 
    type: 'ambiente',
    tags: ['floresta', 'natureza', 'mistério']
  },
  { 
    id: '4', 
    name: 'Calabouço Sombrio', 
    description: 'Ecos distantes, goteiras e sons inquietantes de um calabouço', 
    imageUrl: '/assets/images/scenes/dungeon.jpg', 
    audioTrackId: '4', 
    type: 'ambiente',
    tags: ['dungeon', 'subterrâneo', 'terror']
  },
  { 
    id: '5', 
    name: 'Batalha Épica', 
    description: 'Sons intensos de batalha com espadas, gritos e música épica', 
    imageUrl: '/assets/images/scenes/battle.jpg', 
    audioTrackId: '1', 
    type: 'evento',
    tags: ['batalha', 'combate', 'épico']
  },
  { 
    id: '6', 
    name: 'Chuva Forte', 
    description: 'Som de chuva forte com trovões e vento', 
    imageUrl: '/assets/images/scenes/rain.jpg', 
    audioTrackId: '3', 
    type: 'ambiente',
    tags: ['clima', 'chuva', 'tempestade']
  },
];

const QUICK_SOUND_EFFECTS = [
  { id: 'door', name: 'Porta Abrindo', icon: <MapPin size={18} /> },
  { id: 'thunder', name: 'Trovão', icon: <Cloud size={18} /> },
  { id: 'crowd', name: 'Multidão', icon: <Users size={18} /> },
  { id: 'drink', name: 'Bebida', icon: <Coffee size={18} /> },
  { id: 'sword', name: 'Espada', icon: <Sword size={18} /> },
  { id: 'impact', name: 'Impacto', icon: <Shield size={18} /> },
];

export const AdvancedAudioControl: React.FC<AdvancedAudioControlProps> = ({
  onSceneActivate,
  onImageChange
}) => {
  const audioSystem = useAudioSystem();
  const [scenes, setScenes] = useState<AudioScene[]>(SAMPLE_SCENES);
  const [activeScene, setActiveScene] = useState<AudioScene | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  // Filtrar cenas por categoria e termo de busca
  const filteredScenes = scenes.filter(scene => {
    const matchesCategory = selectedCategory === 'todos' || scene.type === selectedCategory || scene.tags.includes(selectedCategory);
    const matchesSearch = searchTerm === '' || 
      scene.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      scene.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });

  const handleSceneActivate = (scene: AudioScene) => {
    setActiveScene(scene);
    setIsPlaying(true);
    
    // Reproduzir o áudio associado à cena
    if (audioSystem) {
      audioSystem.playTrackById(scene.audioTrackId);
    }
    
    // Notificar componentes externos sobre a mudança de cena
    if (onSceneActivate) {
      onSceneActivate(scene);
    }
    
    // Atualizar a imagem se disponível
    if (scene.imageUrl && onImageChange) {
      onImageChange(scene.imageUrl);
    }
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (audioSystem) {
      if (isPlaying) {
        audioSystem.pause();
      } else if (activeScene) {
        audioSystem.playTrackById(activeScene.audioTrackId);
      }
    }
  };

  const handleVolumeChange = (values: number[]) => {
    const newVolume = values[0];
    setVolume(newVolume);
    
    if (audioSystem) {
      audioSystem.setVolume(newVolume / 100);
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    
    if (audioSystem) {
      audioSystem.setMute(!isMuted);
    }
  };

  const playSoundEffect = (effectId: string) => {
    // Implementar reprodução de efeitos sonoros rápidos
    console.log(`Reproduzindo efeito sonoro: ${effectId}`);
    // audioSystem.playSoundEffect(effectId);
    
    // Feedback visual temporário
    toast.success(`Efeito sonoro: ${effectId} reproduzido`);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="ambientes" className="w-full">
        <TabsList className="grid grid-cols-3 mb-4">
          <TabsTrigger value="ambientes">Ambientes</TabsTrigger>
          <TabsTrigger value="personagens">Personagens</TabsTrigger>
          <TabsTrigger value="efeitos">Efeitos Rápidos</TabsTrigger>
        </TabsList>
        
        <TabsContent value="ambientes" className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Input 
              placeholder="Buscar ambiente..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-grow"
            />
            <select 
              className="p-2 rounded-md border bg-background"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="ambiente">Ambientes</option>
              <option value="evento">Eventos</option>
              <option value="cidade">Cidade</option>
              <option value="floresta">Floresta</option>
              <option value="taverna">Taverna</option>
              <option value="dungeon">Calabouço</option>
              <option value="batalha">Batalha</option>
              <option value="clima">Clima</option>
            </select>
          </div>
          
          <ScrollArea className="h-[300px] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredScenes.map(scene => (
                <Card 
                  key={scene.id} 
                  className={`cursor-pointer transition-all hover:border-primary ${activeScene?.id === scene.id ? 'border-primary bg-primary/10' : ''}`}
                  onClick={() => handleSceneActivate(scene)}
                >
                  <CardHeader className="p-3 pb-0">
                    <CardTitle className="text-base flex justify-between items-center">
                      <span>{scene.name}</span>
                      {activeScene?.id === scene.id && (
                        <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); handlePlayPause(); }}>
                          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                        </Button>
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-2">{scene.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <div className="flex flex-wrap gap-1">
                      {scene.tags.map(tag => (
                        <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded-sm">{tag}</span>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {filteredScenes.length === 0 && (
                <div className="col-span-2 text-center py-8 text-muted-foreground">
                  <Music size={32} className="mx-auto mb-2 opacity-50" />
                  <p>Nenhum ambiente encontrado com esses critérios</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        
        <TabsContent value="personagens" className="space-y-4">
          <p className="text-muted-foreground text-center py-4">
            Adicione músicas temáticas para seus personagens e NPCs importantes.
          </p>
          
          {/* Implementação futura para músicas de personagens */}
          <div className="text-center py-8 text-muted-foreground">
            <Music size={32} className="mx-auto mb-2 opacity-50" />
            <p>Funcionalidade em desenvolvimento</p>
          </div>
        </TabsContent>
        
        <TabsContent value="efeitos" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {QUICK_SOUND_EFFECTS.map(effect => (
              <TooltipProvider key={effect.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="h-16 w-full flex flex-col gap-1 items-center justify-center"
                      onClick={() => playSoundEffect(effect.id)}
                    >
                      {effect.icon}
                      <span className="text-xs">{effect.name}</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reproduzir som de {effect.name}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Controles de áudio fixos na parte inferior */}
      <div className="mt-6 flex items-center justify-between bg-card p-3 rounded-lg">
        <div className="flex items-center gap-2">
          <Button 
            size="icon" 
            variant="ghost"
            onClick={handleMuteToggle}
            className="rounded-full"
          >
            {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </Button>
          
          <div className="w-24 px-1">
            <Slider
              value={[isMuted ? 0 : volume]}
              min={0}
              max={100}
              step={1}
              onValueChange={handleVolumeChange}
            />
          </div>
        </div>
        
        <div className="flex items-center">
          {activeScene && (
            <div className="text-sm mr-3">
              <span className="font-medium">{activeScene.name}</span>
            </div>
          )}
          
          {activeScene && (
            <Button 
              size="sm" 
              variant={isPlaying ? "default" : "outline"}
              onClick={handlePlayPause}
              className="gap-1"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              {isPlaying ? "Pausar" : "Reproduzir"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedAudioControl;