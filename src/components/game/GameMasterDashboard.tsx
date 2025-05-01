import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dice, Map, Music, Users, BookOpen, MessageSquare } from 'lucide-react';
import TacticalMapWithFog from './TacticalMapWithFog';
import GameAudioControls from './GameAudioControls';
import { useAudioSystem } from '@/hooks/useAudioSystem';

interface MapToken {
  id: string;
  x: number;
  y: number;
  color: string;
  label: string;
  size: number;
}

interface MapPoint {
  x: number;
  y: number;
}

interface GameMasterDashboardProps {
  sessionId?: string;
  players?: {
    id: string;
    name: string;
    character?: string;
    isOnline: boolean;
  }[];
}

const GameMasterDashboard: React.FC<GameMasterDashboardProps> = ({
  sessionId,
  players = []
}) => {
  // Estado para o mapa tático
  const [mapImageUrl, setMapImageUrl] = useState('/placeholder.svg');
  const [fogPoints, setFogPoints] = useState<MapPoint[]>([]);
  const [tokens, setTokens] = useState<MapToken[]>([]);
  const [gridType, setGridType] = useState<'square' | 'hex'>('square');
  
  // Usar o hook de sistema de áudio
  const audioSystem = useAudioSystem();
  
  // Manipuladores para o mapa tático
  const handleMapClick = (x: number, y: number) => {
    // Verificar se o ponto já existe no fog
    const existingPointIndex = fogPoints.findIndex(
      point => point.x === x && point.y === y
    );
    
    if (existingPointIndex >= 0) {
      // Remover o ponto se já existir
      const newFogPoints = [...fogPoints];
      newFogPoints.splice(existingPointIndex, 1);
      setFogPoints(newFogPoints);
    } else {
      // Adicionar o ponto se não existir
      setFogPoints([...fogPoints, { x, y }]);
    }
  };
  
  const handleTokenMove = (id: string, x: number, y: number) => {
    setTokens(prevTokens =>
      prevTokens.map(token =>
        token.id === id ? { ...token, x, y } : token
      )
    );
  };
  
  const handleMapChange = (mapUrl: string) => {
    setMapImageUrl(mapUrl);
  };
  
  const handleFogChange = (newFogPoints: MapPoint[]) => {
    setFogPoints(newFogPoints);
  };
  
  const addToken = () => {
    const newToken: MapToken = {
      id: `token-${Date.now()}`,
      x: Math.floor(Math.random() * 20),
      y: Math.floor(Math.random() * 15),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16),
      label: `T${tokens.length + 1}`,
      size: 1
    };
    
    setTokens([...tokens, newToken]);
  };
  
  // Efeito para sincronizar com outros jogadores (simulado)
  useEffect(() => {
    // Aqui você implementaria a sincronização em tempo real
    // com outros jogadores usando websockets ou similar
    console.log('Mapa atualizado, sincronizando com jogadores...');
  }, [fogPoints, tokens, mapImageUrl]);
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Painel do Mestre</h1>
      
      <Tabs defaultValue="map" className="w-full">
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="map" className="flex items-center gap-2">
            <Map size={16} />
            Mapa Tático
          </TabsTrigger>
          <TabsTrigger value="players" className="flex items-center gap-2">
            <Users size={16} />
            Jogadores
          </TabsTrigger>
          <TabsTrigger value="dice" className="flex items-center gap-2">
            <Dice size={16} />
            Dados
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2">
            <BookOpen size={16} />
            Notas
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageSquare size={16} />
            Chat
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa Tático</CardTitle>
              <CardDescription>
                Gerencie o mapa de batalha, tokens e a névoa de guerra.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button onClick={addToken} className="flex items-center gap-2">
                  Adicionar Token
                </Button>
              </div>
              
              <TacticalMapWithFog
                mapImageUrl={mapImageUrl}
                fogPoints={fogPoints}
                onMapClick={handleMapClick}
                isGameMaster={true}
                tokens={tokens}
                onTokenMove={handleTokenMove}
                onMapChange={handleMapChange}
                onFogChange={handleFogChange}
                gridType={gridType}
              />
              
              <div className="mt-4 text-sm text-muted-foreground">
                <p>Dica: Clique no mapa para adicionar/remover névoa. Arraste tokens para movê-los.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="players">
          <Card>
            <CardHeader>
              <CardTitle>Jogadores</CardTitle>
              <CardDescription>
                Gerencie os jogadores e seus personagens.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {players.map(player => (
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
                
                {players.length === 0 && (
                  <p className="text-muted-foreground col-span-2 text-center py-8">
                    Nenhum jogador conectado à sessão.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="dice">
          <Card>
            <CardHeader>
              <CardTitle>Rolagem de Dados</CardTitle>
              <CardDescription>
                Faça rolagens de dados visíveis apenas para você ou para todos os jogadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Sistema de dados em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>Notas da Campanha</CardTitle>
              <CardDescription>
                Mantenha suas anotações e referências para a sessão atual.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Sistema de notas em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="chat">
          <Card>
            <CardHeader>
              <CardTitle>Chat da Sessão</CardTitle>
              <CardDescription>
                Comunique-se com os jogadores durante a sessão.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-muted-foreground">
                Sistema de chat em desenvolvimento...
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Controles de áudio fixos na parte inferior */}
      <GameAudioControls isGameMaster={true} />
    </div>
  );
};

export default GameMasterDashboard;