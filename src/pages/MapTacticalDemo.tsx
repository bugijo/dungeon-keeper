import React, { useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import EnhancedTacticalMap from '@/components/maps/EnhancedTacticalMap';
import TutorialSystem from '@/components/tutorial/TutorialSystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MapPin, Users, Shield, Sword } from 'lucide-react';

// Dados de exemplo para demonstração
const demoMapUrl = '/lovable-uploads/03a33b04-e3b4-4b96-b0ab-e978d67fe3ee.png'; // Usando o mapa mencionado no README

const demoTokens = [
  { id: '1', x: 150, y: 150, size: 40, color: '#ff5500', label: 'P1', ownerId: 'current-user-id' },
  { id: '2', x: 250, y: 150, size: 40, color: '#0055ff', label: 'P2', ownerId: 'player-2' },
  { id: '3', x: 200, y: 250, size: 40, color: '#55ff00', label: 'P3', ownerId: 'player-3' },
  { id: '4', x: 350, y: 350, size: 50, color: '#ff0000', label: 'M1', ownerId: 'gm' },
];

const demoRevealedAreas = [
  { x: 150, y: 150, radius: 150 },
  { x: 350, y: 350, radius: 100 },
];

const MapTacticalDemo: React.FC = () => {
  const [isGM, setIsGM] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [tokens, setTokens] = useState(demoTokens);
  
  // Função para atualizar a posição de um token
  const handleTokenMove = (tokenId: string, x: number, y: number) => {
    setTokens(prev => 
      prev.map(token => 
        token.id === tokenId ? { ...token, x, y } : token
      )
    );
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Demonstração de Mapa Tático
            </CardTitle>
            <CardDescription>
              Experimente as novas ferramentas de medição e controle de mapa tático. Alterne entre as visualizações de jogador e mestre.
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Painel de controle */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Controles</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Modo de Visualização</h3>
                <Tabs defaultValue="player" onValueChange={(value) => setIsGM(value === 'gm')}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="player" className="flex items-center gap-1">
                      <Users className="h-4 w-4" /> Jogador
                    </TabsTrigger>
                    <TabsTrigger value="gm" className="flex items-center gap-1">
                      <Shield className="h-4 w-4" /> Mestre
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {isGM && (
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Opções do Mestre</h3>
                  <div className="flex flex-col gap-2">
                    <Button 
                      variant="outline" 
                      className="justify-start"
                      onClick={() => setShowFog(!showFog)}
                    >
                      {showFog ? 'Desativar' : 'Ativar'} Névoa de Guerra
                    </Button>
                    <Button variant="outline" className="justify-start">
                      Adicionar Token
                    </Button>
                    <Button variant="outline" className="justify-start">
                      Revelar Área
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <h3 className="text-sm font-medium">Instruções</h3>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Use a ferramenta de régua para medir distâncias</li>
                  <li>• Arraste o mapa para navegar</li>
                  <li>• Use os botões de zoom para aproximar/afastar</li>
                  {isGM && (
                    <>
                      <li>• Arraste tokens para movê-los</li>
                      <li>• Controle a névoa de guerra</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Mapa tático */}
          <Card className="lg:col-span-3">
            <CardContent className="p-0 h-[600px]">
              <EnhancedTacticalMap 
                mapUrl={demoMapUrl}
                tokens={tokens}
                gridSize={50}
                unitSize={5}
                unitName="pés"
                isGameMaster={isGM}
                onTokenMove={handleTokenMove}
                fogOfWar={showFog && !isGM}
                revealedAreas={demoRevealedAreas}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Sistema de Tutorial */}
      <TutorialSystem initialCategory="mapas" />
    </MainLayout>
  );
};

export default MapTacticalDemo;