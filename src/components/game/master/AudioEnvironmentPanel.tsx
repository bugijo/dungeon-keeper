import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Music, Image as ImageIcon } from 'lucide-react';
import AdvancedAudioControl from '@/components/audio/AdvancedAudioControl';

interface AudioScene {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  audioTrackId: string;
  type: 'ambiente' | 'personagem' | 'evento';
  tags: string[];
}

interface AudioEnvironmentPanelProps {
  sessionId?: string;
  onSceneChange?: (scene: AudioScene) => void;
}

const AudioEnvironmentPanel: React.FC<AudioEnvironmentPanelProps> = ({
  sessionId,
  onSceneChange
}) => {
  const [activeScene, setActiveScene] = useState<AudioScene | null>(null);
  const [activeImage, setActiveImage] = useState<string | null>(null);

  const handleSceneActivate = (scene: AudioScene) => {
    setActiveScene(scene);
    
    if (scene.imageUrl) {
      setActiveImage(scene.imageUrl);
    }
    
    if (onSceneChange) {
      onSceneChange(scene);
    }
  };

  const handleImageChange = (imageUrl: string) => {
    setActiveImage(imageUrl);
  };

  return (
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
        <Tabs defaultValue="audio" className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="audio" className="flex items-center gap-2">
              <Music size={16} />
              Áudio
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center gap-2">
              <ImageIcon size={16} />
              Visualização
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="audio">
            <AdvancedAudioControl 
              onSceneActivate={handleSceneActivate}
              onImageChange={handleImageChange}
            />
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
                
                {activeScene && activeImage && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-white">
                    <p className="font-medium">{activeScene.name}</p>
                    {activeScene.description && (
                      <p className="text-xs opacity-80">{activeScene.description}</p>
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
  );
};

export default AudioEnvironmentPanel;