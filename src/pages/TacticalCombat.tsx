
import React, { useState, lazy, Suspense } from 'react';
import MainLayout from '@/components/layout/MainLayout';
// Importação com lazy loading para o mapa tático
const TacticalMapWithFog = lazy(() => import('@/components/game/TacticalMapWithFog'));
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Point {
  x: number;
  y: number;
}

const TacticalCombat = () => {
  const [fogPoints, setFogPoints] = useState<Point[]>([]);
  const [selectedTool, setSelectedTool] = useState<"select" | "draw" | "rectangle" | "circle" | "add" | "remove">("select");

  const handleMapClick = (x: number, y: number) => {
    if (selectedTool === 'add') {
      setFogPoints(prev => [...prev, { x, y }]);
    } else if (selectedTool === 'remove') {
      setFogPoints(prev => prev.filter(p => !(p.x === x && p.y === y)));
    }
  };

  const clearFog = () => {
    setFogPoints([]);
  };

  return (
    <MainLayout>
      <div className="container mx-auto py-6">
        <h1 className="text-3xl font-medievalsharp text-fantasy-gold mb-4">Combate Tático</h1>

        <Tabs defaultValue="map" className="w-full mb-4">
          <TabsList className="bg-fantasy-dark/70 border border-fantasy-purple/30 w-full">
            <TabsTrigger value="map" className="data-[state=active]:bg-fantasy-purple/20">Mapa</TabsTrigger>
            <TabsTrigger value="tools" className="data-[state=active]:bg-fantasy-purple/20">Ferramentas</TabsTrigger>
          </TabsList>
          <TabsContent value="map">
            <div className="relative">
              <Suspense fallback={
                <div className="w-full h-96 flex items-center justify-center bg-fantasy-dark/30 rounded-lg">
                  <div className="animate-pulse text-fantasy-purple">Carregando mapa tático...</div>
                </div>
              }>
                <TacticalMapWithFog fogPoints={fogPoints} onMapClick={handleMapClick} />
              </Suspense>
            </div>
          </TabsContent>
          <TabsContent value="tools">
            <div className="flex flex-col gap-4">
              <div className="flex gap-2">
                <Button 
                  onClick={() => setSelectedTool('add')}
                  className={selectedTool === 'add' ? "fantasy-button primary" : "fantasy-button secondary"}
                >
                  Adicionar Névoa
                </Button>
                <Button 
                  onClick={() => setSelectedTool('remove')}
                  className={selectedTool === 'remove' ? "fantasy-button primary" : "fantasy-button secondary"}
                >
                  Remover Névoa
                </Button>
              </div>
              <Button onClick={clearFog} className="fantasy-button destructive">Limpar Névoa</Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default TacticalCombat;
