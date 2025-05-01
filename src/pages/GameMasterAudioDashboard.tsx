import React, { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Music, Map, Users, BookOpen, MessageSquare, Scroll, ArrowLeft, Image as ImageIcon, Volume2, VolumeX, User } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import AudioEnvironmentPanel from '@/components/game/master/AudioEnvironmentPanel';
import { useAudioSystem } from '@/hooks/useAudioSystem';
import { useEnvironmentControl } from '@/hooks/useEnvironmentControl';
import { toast } from 'sonner';
import { Slider } from '@/components/ui/slider';
import { ImageLoader } from '@/components/ImageLoader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { CharacterAudioControl } from '@/components/audio/CharacterAudioControl';

// Interface já definida no environmentService.ts
// Usando a interface importada via useEnvironmentControl

const GameMasterAudioDashboard: React.FC = () => {
  const { id: tableId } = useParams<{ id: string }>();
  const [narrativeText, setNarrativeText] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<string>('audio');
  
  // Usar o hook de controle de ambiente
  const {
    availableScenes,
    currentScene,
    activeImage,
    isLoading,
    activateScene,
    sendNarrative,
    changeImage,
    audioControls
  } = useEnvironmentControl({
    tableId: tableId || 'sessao-teste-123',
    isMaster: true
  });
  
  // Dados de exemplo para desenvolvimento
  const mockPlayers = [
    { id: '1', name: 'João', character: 'Thorin, o Anão Guerreiro', isOnline: true },
    { id: '2', name: 'Maria', character: 'Elaria, a Elfa Maga', isOnline: true },
    { id: '3', name: 'Pedro', character: 'Grom, o Meio-Orc Bárbaro', isOnline: false },
    { id: '4', name: 'Ana', character: 'Lyra, a Humana Clériga', isOnline: true },
  ];

  // Filtrar cenas com base na pesquisa
  const filteredScenes = searchQuery
    ? availableScenes.filter(scene => 
        scene.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scene.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (scene.description && scene.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : availableScenes;

  const handleSceneActivate = (scene: any) => {
    activateScene(scene);
  };

  const handleNarrativeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNarrativeText(e.target.value);
  };

  const handleSendNarrative = () => {
    if (!narrativeText.trim()) {
      toast.error('Digite uma narrativa antes de enviar');
      return;
    }
    
    sendNarrative(narrativeText);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-medievalsharp text-white">Painel de Áudio e Ambiente</h1>
          <Link to="/mestre">
            <Button className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Voltar ao Painel Principal
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Painel de Áudio e Ambiente - Ocupa 2/3 da largura em telas grandes */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music size={18} />
                  Controle de Ambiente
                </CardTitle>
                <CardDescription>
                  Gerencie sons ambientais, músicas temáticas e imagens para sua sessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
                  <TabsList className="grid grid-cols-3 mb-4">
                    <TabsTrigger value="audio" className="flex items-center gap-2">
                      <Music size={16} />
                      Ambiente
                    </TabsTrigger>
                    <TabsTrigger value="characters" className="flex items-center gap-2">
                      <User size={16} />
                      Personagens
                    </TabsTrigger>
                    <TabsTrigger value="visualization" className="flex items-center gap-2">
                      <ImageIcon size={16} />
                      Visualização
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="audio">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Input 
                          placeholder="Buscar por nome, tipo ou tag..."
                          value={searchQuery}
                          onChange={handleSearchChange}
                          className="max-w-sm"
                        />
                        {audioControls && (
                          <div className="flex items-center gap-2 ml-auto">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => audioControls.toggleMute()}
                            >
                              {audioControls.isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                            </Button>
                            <div className="w-24">
                              <Slider
                                value={[audioControls.volume]}
                                max={1}
                                step={0.01}
                                onValueChange={(value) => audioControls.setVolume(value[0])}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {filteredScenes.map((scene) => (
                            <Card 
                              key={scene.id} 
                              className={`cursor-pointer transition-all hover:bg-accent/50 ${currentScene?.id === scene.id ? 'ring-2 ring-primary' : ''}`}
                              onClick={() => handleSceneActivate(scene)}
                            >
                              <div className="flex h-full">
                                <div className="w-1/3 bg-muted">
                                  {scene.imageUrl ? (
                                    <ImageLoader
                                      src={scene.imageUrl}
                                      alt={scene.name}
                                      className="w-full h-full object-cover"
                                      fallbackText={scene.name}
                                    />
                                  ) : (
                                    <div className="flex items-center justify-center h-full">
                                      <ImageIcon size={24} className="text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                                <div className="w-2/3 p-3">
                                  <h3 className="font-bold">{scene.name}</h3>
                                  {scene.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-2">{scene.description}</p>
                                  )}
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {scene.tags.map((tag) => (
                                      <span key={tag} className="text-xs bg-secondary px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </ScrollArea>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="characters">
                    <div className="space-y-4">
                      <CharacterAudioControl 
                        onAudioActivate={(audio) => {
                          toast.success(`Áudio "${audio.name}" ativado para o personagem ${audio.characterName}`);
                          // Aqui poderia integrar com o sistema de ambiente para enviar o áudio aos jogadores
                          if (audio.imageUrl) {
                            changeImage(audio.imageUrl);
                          }
                        }}
                        onImageChange={(imageUrl) => {
                          changeImage(imageUrl);
                        }}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="visualization">
                    <div className="space-y-4">
                      <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                        {activeImage ? (
                          <img 
                            src={activeImage} 
                            alt="Cena atual" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full">
                            <div className="text-center text-muted-foreground">
                              <ImageIcon size={48} className="mx-auto mb-2 opacity-30" />
                              <p>Nenhuma imagem selecionada</p>
                              <p className="text-sm">Selecione uma cena com áudio para visualizar a imagem correspondente</p>
                            </div>
                          </div>
                        )}
                        
                        {currentScene && activeImage && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white">
                            <p className="font-medium">{currentScene.name}</p>
                            {currentScene.description && (
                              <p className="text-xs opacity-80">{currentScene.description}</p>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground">
                        <p>Esta imagem será exibida para os jogadores quando você ativar esta cena.</p>
                        <p>Você pode alternar entre diferentes cenas para criar uma experiência imersiva.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Scroll size={18} />
                  Narrativa e Escolhas
                </CardTitle>
                <CardDescription>
                  Crie narrativas imersivas e ofereça opções de escolha aos jogadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <textarea
                      className="w-full h-32 p-3 rounded-md border bg-background resize-none focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder="Digite sua narrativa aqui... Descreva a cena, ambiente e situação para os jogadores."
                      value={narrativeText}
                      onChange={handleNarrativeChange}
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      {activeScene && (
                        <span>Cena ativa: <strong>{activeScene.name}</strong></span>
                      )}
                    </div>
                    <Button onClick={handleSendNarrative} disabled={isLoading}>
                      Enviar aos Jogadores
                    </Button>
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-medium mb-2">Opções de Escolha</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Adicione opções para os jogadores escolherem o próximo passo da aventura
                    </p>
                    
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-grow p-2 rounded-md border bg-background"
                          placeholder="Ir para a taverna"
                        />
                        <Button variant="outline" size="sm">+</Button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-grow p-2 rounded-md border bg-background"
                          placeholder="Visitar o ferreiro"
                        />
                        <Button variant="outline" size="sm">+</Button>
                      </div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          className="flex-grow p-2 rounded-md border bg-background"
                          placeholder="Explorar a cidade"
                        />
                        <Button variant="outline" size="sm">+</Button>
                      </div>
                      
                      <Button className="w-full mt-2">Enviar Opções</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Painel lateral - Ocupa 1/3 da largura em telas grandes */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={18} />
                  Jogadores
                </CardTitle>
                <CardDescription>
                  Jogadores conectados à sessão
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockPlayers.map(player => (
                    <div key={player.id} className="flex items-center p-3 border rounded-lg">
                      <div className={`w-3 h-3 rounded-full mr-3 ${player.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <div>
                        <h3 className="font-medium">{player.name}</h3>
                        {player.character && (
                          <p className="text-sm text-muted-foreground">{player.character}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Map size={18} />
                  Visualização Atual
                </CardTitle>
                <CardDescription>
                  Imagem sendo exibida aos jogadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {activeImage ? (
                    <img 
                      src={activeImage} 
                      alt="Cena atual" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">Nenhuma imagem selecionada</p>
                    </div>
                  )}
                </div>
                
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>Esta é a imagem que os jogadores estão vendo atualmente.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default GameMasterAudioDashboard;