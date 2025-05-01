import React, { useState, useEffect } from 'react';
import { User, Volume2, VolumeX, Play, Pause, Music, Search, Tag } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface CharacterAudio {
  id: string;
  name: string;
  characterName: string;
  description?: string;
  imageUrl?: string;
  audioTrackId: string;
  type: 'voz' | 'tema' | 'ação';
  tags: string[];
}

interface CharacterAudioControlProps {
  onAudioActivate?: (audio: CharacterAudio) => void;
  onImageChange?: (imageUrl: string) => void;
}

// Dados de exemplo para desenvolvimento
const SAMPLE_CHARACTER_AUDIO: CharacterAudio[] = [
  { 
    id: '1', 
    name: 'Voz de Thorin', 
    characterName: 'Thorin, o Anão Guerreiro',
    description: 'Voz grave e determinada do guerreiro anão', 
    imageUrl: '/assets/images/characters/dwarf-warrior.jpg', 
    audioTrackId: '10', 
    type: 'voz',
    tags: ['anão', 'guerreiro', 'masculino']
  },
  { 
    id: '2', 
    name: 'Tema de Elaria', 
    characterName: 'Elaria, a Elfa Maga',
    description: 'Música mística e etérea que acompanha a maga elfa', 
    imageUrl: '/assets/images/characters/elf-mage.jpg', 
    audioTrackId: '11', 
    type: 'tema',
    tags: ['elfo', 'mago', 'feminino', 'místico']
  },
  { 
    id: '3', 
    name: 'Rugido de Grom', 
    characterName: 'Grom, o Meio-Orc Bárbaro',
    description: 'Rugido feroz do bárbaro meio-orc', 
    imageUrl: '/assets/images/characters/half-orc.jpg', 
    audioTrackId: '12', 
    type: 'ação',
    tags: ['meio-orc', 'bárbaro', 'masculino', 'fúria']
  },
  { 
    id: '4', 
    name: 'Prece de Lyra', 
    characterName: 'Lyra, a Humana Clériga',
    description: 'Oração serena da clériga humana', 
    imageUrl: '/assets/images/characters/human-cleric.jpg', 
    audioTrackId: '13', 
    type: 'ação',
    tags: ['humano', 'clérigo', 'feminino', 'cura']
  },
  { 
    id: '5', 
    name: 'Tema Heróico de Thorin', 
    characterName: 'Thorin, o Anão Guerreiro',
    description: 'Música épica para momentos heróicos do guerreiro anão', 
    imageUrl: '/assets/images/characters/dwarf-warrior.jpg', 
    audioTrackId: '14', 
    type: 'tema',
    tags: ['anão', 'guerreiro', 'épico', 'batalha']
  },
  { 
    id: '6', 
    name: 'Encantamento de Elaria', 
    characterName: 'Elaria, a Elfa Maga',
    description: 'Som de magia sendo conjurada pela maga elfa', 
    imageUrl: '/assets/images/characters/elf-mage.jpg', 
    audioTrackId: '15', 
    type: 'ação',
    tags: ['elfo', 'mago', 'magia', 'encantamento']
  },
];

export const CharacterAudioControl: React.FC<CharacterAudioControlProps> = ({
  onAudioActivate,
  onImageChange
}) => {
  const audioSystem = useAudioSystem();
  const [characterAudios, setCharacterAudios] = useState<CharacterAudio[]>(SAMPLE_CHARACTER_AUDIO);
  const [activeAudio, setActiveAudio] = useState<CharacterAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('todos');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('todos');

  // Obter lista única de personagens
  const characters = Array.from(new Set(characterAudios.map(audio => audio.characterName)));

  // Filtrar áudios por tipo, personagem e termo de busca
  const filteredAudios = characterAudios.filter(audio => {
    const matchesType = selectedType === 'todos' || audio.type === selectedType;
    const matchesCharacter = selectedCharacter === 'todos' || audio.characterName === selectedCharacter;
    const matchesSearch = searchTerm === '' || 
      audio.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audio.characterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audio.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesType && matchesCharacter && matchesSearch;
  });

  const handleAudioActivate = (audio: CharacterAudio) => {
    setActiveAudio(audio);
    setIsPlaying(true);
    
    // Reproduzir o áudio associado ao personagem
    if (audioSystem) {
      audioSystem.playTrackById(audio.audioTrackId);
    }
    
    // Notificar componentes externos sobre a mudança de áudio
    if (onAudioActivate) {
      onAudioActivate(audio);
    }
    
    // Atualizar a imagem se disponível
    if (audio.imageUrl && onImageChange) {
      onImageChange(audio.imageUrl);
    }

    toast.success(`Áudio "${audio.name}" ativado`);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    
    if (audioSystem) {
      if (isPlaying) {
        audioSystem.pause();
      } else if (activeAudio) {
        audioSystem.playTrackById(activeAudio.audioTrackId);
      }
    }
  };

  const getAudioTypeIcon = (type: string) => {
    switch (type) {
      case 'voz':
        return <User size={16} />;
      case 'tema':
        return <Music size={16} />;
      case 'ação':
        return <Play size={16} />;
      default:
        return <Music size={16} />;
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <Input 
          placeholder="Buscar áudio de personagem..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
          icon={<Search size={16} />}
        />
        
        <div className="flex gap-2">
          <select 
            className="p-2 rounded-md border bg-background min-w-[120px]"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="todos">Todos os tipos</option>
            <option value="voz">Voz</option>
            <option value="tema">Tema</option>
            <option value="ação">Ação</option>
          </select>
          
          <select 
            className="p-2 rounded-md border bg-background min-w-[150px]"
            value={selectedCharacter}
            onChange={(e) => setSelectedCharacter(e.target.value)}
          >
            <option value="todos">Todos os personagens</option>
            {characters.map(character => (
              <option key={character} value={character}>{character}</option>
            ))}
          </select>
        </div>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAudios.map((audio) => (
            <Card 
              key={audio.id} 
              className={`cursor-pointer transition-all hover:bg-accent/50 ${activeAudio?.id === audio.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => handleAudioActivate(audio)}
            >
              <div className="flex h-full">
                <div className="w-1/3 bg-muted flex items-center justify-center">
                  {audio.imageUrl ? (
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={audio.imageUrl} alt={audio.characterName} />
                      <AvatarFallback>{audio.characterName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  ) : (
                    <Avatar className="h-16 w-16">
                      <AvatarFallback>{audio.characterName.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                  )}
                </div>
                <div className="w-2/3 p-3">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getAudioTypeIcon(audio.type)}
                      <span className="capitalize">{audio.type}</span>
                    </Badge>
                  </div>
                  <h3 className="font-bold mt-1">{audio.name}</h3>
                  <p className="text-sm text-muted-foreground">{audio.characterName}</p>
                  {audio.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{audio.description}</p>
                  )}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {audio.tags.map((tag) => (
                      <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Tag size={10} />
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </ScrollArea>
      
      {activeAudio && (
        <Card className="mt-4">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={activeAudio.imageUrl} alt={activeAudio.characterName} />
                  <AvatarFallback>{activeAudio.characterName.substring(0, 2)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-medium">{activeAudio.name}</h3>
                  <p className="text-sm text-muted-foreground">{activeAudio.characterName}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePlayPause}
                >
                  {isPlaying ? <Pause size={18} /> : <Play size={18} />}
                </Button>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          if (audioSystem) {
                            audioSystem.toggleMute();
                          }
                        }}
                      >
                        {audioSystem?.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{audioSystem?.isMuted ? 'Ativar som' : 'Silenciar'}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="w-24">
                  <Slider
                    value={[audioSystem?.volume || 0.5]}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => {
                      if (audioSystem) {
                        audioSystem.setVolume(value[0]);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};