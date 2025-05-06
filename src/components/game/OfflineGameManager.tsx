import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Wifi, WifiOff, Share2, Download, Upload, Trash2, Save, Plus, Users, RefreshCw, Eye, Map, Settings } from 'lucide-react';
import { useNotificationContext } from '@/contexts/NotificationContext';
import LineOfSightController from '@/components/map/LineOfSightController';
import MemorySystemController from '@/components/map/MemorySystemController';
import DynamicLightingController from '@/components/map/DynamicLightingController';
import EnhancedFogOfWarRenderer from '@/components/map/EnhancedFogOfWarRenderer';
import {
  LocalGameData,
  SyncPeer,
  listLocalGames,
  loadGameLocally,
  saveGameLocally,
  removeLocalGame,
  scanForNearbyPlayers,
  syncWithNearbyPlayer,
  exportGameData,
  importGameData,
  isBluetoothSupported,
  saveMemoryPointsLocally,
  saveLightSourcesLocally,
  saveGameSettingsLocally
} from '@/utils/offlineStorageUtils';
import { RevealedArea, Obstacle, Point } from '@/utils/fogOfWarUtils';
import { LightSource } from '@/utils/lightingUtils';

interface OfflineGameManagerProps {
  userId: string;
  userName: string;
  isGameMaster: boolean;
  onGameSelect: (gameData: LocalGameData) => void;
  currentGameId?: string;
  mapWidth?: number;
  mapHeight?: number;
  gridSize?: number;
}

const OfflineGameManager: React.FC<OfflineGameManagerProps> = ({
  userId,
  userName,
  isGameMaster,
  onGameSelect,
  currentGameId,
  mapWidth = 1000,
  mapHeight = 800,
  gridSize = 50
}) => {
  const [localGames, setLocalGames] = useState<LocalGameData[]>([]);
  const [nearbyPeers, setNearbyPeers] = useState<SyncPeer[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [newGameName, setNewGameName] = useState('');
  const [importData, setImportData] = useState('');
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [currentGame, setCurrentGame] = useState<LocalGameData | null>(null);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [memoryPoints, setMemoryPoints] = useState<Point[]>([]);
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [revealedAreas, setRevealedAreas] = useState<RevealedArea[]>([]);
  const [fogSettings, setFogSettings] = useState({
    fogOpacity: 0.7,
    fogColor: '#1a1a1a',
    memoryEnabled: true,
    memoryOpacity: 0.4,
    memoryColor: '#555555',
    ambientLight: 0.1
  });
  const { toast } = useToast();
  const { sendNotification } = useNotificationContext();

  // Verificar suporte a Bluetooth e carregar jogos locais ao iniciar
  useEffect(() => {
    setBluetoothSupported(isBluetoothSupported());
    loadLocalGames();
  }, []);

  // Carregar dados do jogo atual quando o ID mudar
  useEffect(() => {
    if (!currentGameId) {
      setCurrentGame(null);
      setObstacles([]);
      setMemoryPoints([]);
      setLightSources([]);
      setRevealedAreas([]);
      setFogSettings({
        fogOpacity: 0.7,
        fogColor: '#1a1a1a',
        memoryEnabled: true,
        memoryOpacity: 0.4,
        memoryColor: '#555555',
        ambientLight: 0.1
      });
      return;
    }

    const game = loadGameLocally(currentGameId);
    if (game) {
      setCurrentGame(game);
      setObstacles(game.obstacles || []);
      setMemoryPoints(game.memoryPoints || []);
      setLightSources(game.lightSources || []);
      setRevealedAreas(game.revealedAreas || []);
      
      if (game.settings) {
        setFogSettings({
          fogOpacity: game.settings.fogOpacity || 0.7,
          fogColor: game.settings.fogColor || '#1a1a1a',
          memoryEnabled: game.settings.memoryEnabled !== false,
          memoryOpacity: game.settings.memoryOpacity || 0.4,
          memoryColor: game.settings.memoryColor || '#555555',
          ambientLight: game.settings.ambientLight || 0.1
        });
      }
    }
  }, [currentGameId]);


  // Carregar jogos salvos localmente
  const loadLocalGames = () => {
    const games = listLocalGames();
    setLocalGames(games);
  };

  // Criar novo jogo local
  const createNewGame = () => {
    if (!newGameName.trim()) {
      toast({
        title: 'Nome inválido',
        description: 'Por favor, insira um nome para o jogo',
        variant: 'destructive'
      });
      return;
    }

    const newGame: LocalGameData = {
      id: `game-${Date.now()}`,
      name: newGameName,
      lastUpdated: new Date().toISOString(),
      mapId: `map-${Date.now()}`,
      revealedAreas: [],
      memoryPoints: [],
      lightSources: [],
      obstacles: [],
      settings: {
        fogOpacity: 0.7,
        fogColor: '#1a1a1a',
        memoryEnabled: true,
        memoryOpacity: 0.4,
        memoryColor: '#555555',
        ambientLight: 0.1
      }
    };

    saveGameLocally(newGame);
    loadLocalGames();
    setNewGameName('');

    toast({
      title: 'Jogo criado',
      description: `O jogo "${newGame.name}" foi criado com sucesso`,
    });
  };

  // Remover jogo local
  const handleRemoveGame = (gameId: string) => {
    if (removeLocalGame(gameId)) {
      loadLocalGames();
      toast({
        title: 'Jogo removido',
        description: 'O jogo foi removido com sucesso',
      });
    }
  };

  // Procurar por jogadores próximos
  const handleScanForPlayers = async () => {
    setIsScanning(true);
    try {
      const peers = await scanForNearbyPlayers();
      setNearbyPeers(peers);
      
      toast({
        title: 'Busca concluída',
        description: `${peers.length} jogadores encontrados nas proximidades`,
      });
    } catch (error) {
      console.error('Erro ao procurar jogadores:', error);
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível encontrar jogadores próximos',
        variant: 'destructive'
      });
    } finally {
      setIsScanning(false);
    }
  };

  // Sincronizar com jogador próximo
  const handleSyncWithPeer = async (peerId: string) => {
    if (!currentGameId) {
      toast({
        title: 'Nenhum jogo selecionado',
        description: 'Selecione um jogo para sincronizar',
        variant: 'destructive'
      });
      return;
    }

    setIsSyncing(true);
    try {
      const gameData = loadGameLocally(currentGameId);
      if (!gameData) throw new Error('Jogo não encontrado');

      const success = await syncWithNearbyPlayer(peerId, gameData);
      if (success) {
        toast({
          title: 'Sincronização concluída',
          description: 'Os dados do jogo foram sincronizados com sucesso',
        });
      } else {
        throw new Error('Falha na sincronização');
      }
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
      toast({
        title: 'Erro na sincronização',
        description: 'Não foi possível sincronizar os dados do jogo',
        variant: 'destructive'
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Exportar dados do jogo
  const handleExportGame = (gameId: string) => {
    const jsonData = exportGameData(gameId);
    if (!jsonData) {
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar os dados do jogo',
        variant: 'destructive'
      });
      return;
    }

    // Copiar para a área de transferência
    navigator.clipboard.writeText(jsonData).then(() => {
      toast({
        title: 'Dados exportados',
        description: 'Os dados do jogo foram copiados para a área de transferência',
      });
    }).catch(err => {
      console.error('Erro ao copiar para área de transferência:', err);
      // Fallback: mostrar os dados para o usuário copiar manualmente
      setImportData(jsonData);
    });
  };

  // Importar dados do jogo
  const handleImportGame = () => {
    if (!importData.trim()) {
      toast({
        title: 'Dados inválidos',
        description: 'Por favor, insira os dados do jogo',
        variant: 'destructive'
      });
      return;
    }

    try {
      const gameData = importGameData(importData);
      if (!gameData) throw new Error('Dados inválidos');

      loadLocalGames();
      setImportData('');

      toast({
        title: 'Jogo importado',
        description: `O jogo "${gameData.name}" foi importado com sucesso`,
      });
    } catch (error) {
      console.error('Erro ao importar jogo:', error);
      toast({
        title: 'Erro ao importar',
        description: 'Os dados fornecidos são inválidos ou estão corrompidos',
        variant: 'destructive'
      });
    }
  };

  // Atualizar obstáculos
  const handleObstaclesUpdate = (newObstacles: Obstacle[]) => {
    if (!currentGameId || !currentGame) return;
    
    setObstacles(newObstacles);
    
    // Salvar no jogo atual
    const updatedGame = {
      ...currentGame,
      obstacles: newObstacles,
      lastUpdated: new Date().toISOString()
    };
    
    saveGameLocally(updatedGame);
    setCurrentGame(updatedGame);
    
    toast({
      title: 'Obstáculos atualizados',
      description: `${newObstacles.length} obstáculos salvos no jogo`
    });
  };
  
  // Atualizar pontos de memória
  const handleMemoryPointsUpdate = (newPoints: Point[]) => {
    if (!currentGameId || !currentGame) return;
    
    setMemoryPoints(newPoints);
    
    // Salvar no jogo atual
    const updatedGame = {
      ...currentGame,
      memoryPoints: newPoints,
      lastUpdated: new Date().toISOString()
    };
    
    saveGameLocally(updatedGame);
    setCurrentGame(updatedGame);
    
    toast({
      title: 'Memória atualizada',
      description: `${newPoints.length} pontos de memória salvos`
    });
  };
  
  // Atualizar fontes de luz
  const handleLightSourcesUpdate = (newSources: LightSource[]) => {
    if (!currentGameId || !currentGame) return;
    
    setLightSources(newSources);
    
    // Salvar no jogo atual
    const updatedGame = {
      ...currentGame,
      lightSources: newSources,
      lastUpdated: new Date().toISOString()
    };
    
    saveGameLocally(updatedGame);
    setCurrentGame(updatedGame);
    
    toast({
      title: 'Iluminação atualizada',
      description: `${newSources.length} fontes de luz salvas`
    });
  };
  
  // Atualizar áreas reveladas
  const handleRevealedAreasUpdate = (newAreas: RevealedArea[]) => {
    if (!currentGameId || !currentGame) return;
    
    setRevealedAreas(newAreas);
    
    // Salvar no jogo atual
    const updatedGame = {
      ...currentGame,
      revealedAreas: newAreas,
      lastUpdated: new Date().toISOString()
    };
    
    saveGameLocally(updatedGame);
    setCurrentGame(updatedGame);
  };
  
  // Atualizar configurações de névoa
  const handleFogSettingsUpdate = (newSettings: any) => {
    if (!currentGameId || !currentGame) return;
    
    setFogSettings(prev => ({
      ...prev,
      ...newSettings
    }));
    
    // Salvar no jogo atual
    const updatedGame = {
      ...currentGame,
      settings: {
        ...currentGame.settings,
        ...newSettings
      },
      lastUpdated: new Date().toISOString()
    };
    
    saveGameLocally(updatedGame);
    setCurrentGame(updatedGame);
    
    toast({
      title: 'Configurações atualizadas',
      description: 'As configurações de névoa foram salvas'
    });
  };
  
  // Atualizar configurações de memória
  const handleMemorySettingsUpdate = (settings: {
    enabled: boolean;
    opacity: number;
    color: string;
  }) => {
    handleFogSettingsUpdate({
      memoryEnabled: settings.enabled,
      memoryOpacity: settings.opacity,
      memoryColor: settings.color
    });
  };

  return (
    <div className="offline-game-manager">
      <Tabs defaultValue="games">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="games">Jogos Locais</TabsTrigger>
          <TabsTrigger value="sync">Sincronização</TabsTrigger>
          <TabsTrigger value="import">Importar/Exportar</TabsTrigger>
          <TabsTrigger value="advanced" disabled={!currentGameId}>Configurações Avançadas</TabsTrigger>
        </TabsList>

        {/* Aba de Jogos Locais */}
        <TabsContent value="games" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Jogos Salvos Localmente</h3>
            <Button variant="outline" size="sm" onClick={loadLocalGames}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {localGames.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Nenhum jogo local encontrado.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {localGames.map(game => (
                <Card key={game.id} className={currentGameId === game.id ? 'border-primary' : ''}>
                  <CardHeader className="pb-2">
                    <CardTitle>{game.name}</CardTitle>
                    <CardDescription>
                      Última atualização: {new Date(game.lastUpdated).toLocaleString()}
                    </CardDescription>
                  </CardHeader>
                  <CardFooter className="flex justify-between">
                    <Button 
                      variant="default" 
                      onClick={() => onGameSelect(game)}
                      disabled={currentGameId === game.id}
                    >
                      {currentGameId === game.id ? 'Selecionado' : 'Selecionar'}
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => handleRemoveGame(game.id)}
                      disabled={currentGameId === game.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Criar Novo Jogo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="name">Nome do Jogo</Label>
                  <Input 
                    id="name" 
                    placeholder="Aventura nas Montanhas Sombrias" 
                    value={newGameName}
                    onChange={(e) => setNewGameName(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={createNewGame}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Jogo
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Aba de Sincronização */}
        <TabsContent value="sync" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sincronização por Proximidade</CardTitle>
              <CardDescription>
                Conecte-se com outros jogadores próximos para compartilhar dados do jogo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!bluetoothSupported ? (
                <div className="p-4 border rounded-md bg-muted">
                  <p className="text-center text-muted-foreground">
                    Seu dispositivo não suporta sincronização por Bluetooth.
                    Use a opção de importar/exportar para compartilhar dados do jogo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium">Jogadores Próximos</h4>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleScanForPlayers}
                      disabled={isScanning}
                    >
                      {isScanning ? (
                        <>Procurando...</>
                      ) : (
                        <>
                          <Users className="h-4 w-4 mr-2" />
                          Procurar
                        </>
                      )}
                    </Button>
                  </div>

                  {nearbyPeers.length === 0 ? (
                    <div className="p-4 border rounded-md text-center text-muted-foreground">
                      Nenhum jogador encontrado nas proximidades.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {nearbyPeers.map(peer => (
                        <div 
                          key={peer.id} 
                          className="p-3 border rounded-md flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">{peer.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {peer.isGameMaster ? 'Mestre do Jogo' : 'Jogador'}
                            </p>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleSyncWithPeer(peer.id)}
                            disabled={isSyncing || !currentGameId}
                          >
                            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <div className="flex items-center space-x-2 text-sm">
            <div className="flex h-2 w-2 rounded-full bg-green-500" />
            <p className="text-muted-foreground">
              {isGameMaster ? 
                'Você é o Mestre do Jogo e pode compartilhar dados com os jogadores.' :
                'Você é um Jogador e pode receber dados do Mestre do Jogo.'}
            </p>
          </div>
        </TabsContent>

        {/* Aba de Importar/Exportar */}
        <TabsContent value="import" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exportar Jogo</CardTitle>
              <CardDescription>
                Exporte os dados do jogo para compartilhar com outros jogadores.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {localGames.length === 0 ? (
                <div className="p-4 border rounded-md text-center text-muted-foreground">
                  Nenhum jogo disponível para exportar.
                </div>
              ) : (
                <div className="space-y-2">
                  {localGames.map(game => (
                    <div 
                      key={game.id} 
                      className="p-3 border rounded-md flex justify-between items-center"
                    >
                      <p className="font-medium">{game.name}</p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleExportGame(game.id)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Exportar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Importar Jogo</CardTitle>
              <CardDescription>
                Cole os dados do jogo exportado para importá-lo.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid w-full gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="import-data">Dados do Jogo</Label>
                  <textarea
                    id="import-data"
                    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    placeholder="Cole os dados do jogo aqui..."
                    value={importData}
                    onChange={(e) => setImportData(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleImportGame}>
                <Download className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        {/* Aba de Configurações Avançadas */}
        <TabsContent value="advanced" className="space-y-4">
          {currentGameId && currentGame ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Visualização do Fog of War</CardTitle>
                  <CardDescription>
                    Visualize como o Fog of War, memória e iluminação dinâmica funcionam juntos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative w-full h-[300px] border rounded-md overflow-hidden">
                    <EnhancedFogOfWarRenderer
                      width={mapWidth}
                      height={mapHeight}
                      revealedAreas={revealedAreas}
                      obstacles={obstacles}
                      lightSources={lightSources}
                      memoryPoints={memoryPoints}
                      memoryEnabled={fogSettings.memoryEnabled}
                      memoryOpacity={fogSettings.memoryOpacity}
                      memoryColor={fogSettings.memoryColor}
                      fogOpacity={fogSettings.fogOpacity}
                      fogColor={fogSettings.fogColor}
                      ambientLight={fogSettings.ambientLight}
                      isGameMaster={isGameMaster}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Controlador de Linha de Visão */}
                <LineOfSightController
                  mapId={currentGame.mapId}
                  gameId={currentGame.id}
                  userId={userId}
                  isGameMaster={isGameMaster}
                  obstacles={obstacles}
                  onObstaclesUpdate={handleObstaclesUpdate}
                  gridSize={gridSize}
                  width={mapWidth}
                  height={mapHeight}
                  enabled={true}
                />
                
                {/* Controlador de Sistema de Memória */}
                <MemorySystemController
                  mapId={currentGame.mapId}
                  gameId={currentGame.id}
                  userId={userId}
                  isGameMaster={isGameMaster}
                  revealedAreas={revealedAreas}
                  memoryPoints={memoryPoints}
                  onMemoryPointsUpdate={handleMemoryPointsUpdate}
                  memoryEnabled={fogSettings.memoryEnabled}
                  memoryOpacity={fogSettings.memoryOpacity}
                  memoryColor={fogSettings.memoryColor}
                  onMemorySettingsChange={handleMemorySettingsUpdate}
                />
              </div>
              
              {/* Controlador de Iluminação Dinâmica */}
              <DynamicLightingController
                mapId={currentGame.mapId}
                gameId={currentGame.id}
                userId={userId}
                isGameMaster={isGameMaster}
                lightSources={lightSources}
                onLightSourcesUpdate={handleLightSourcesUpdate}
                gridSize={gridSize}
                width={mapWidth}
                height={mapHeight}
                ambientLight={fogSettings.ambientLight}
                onAmbientLightUpdate={(value) => handleFogSettingsUpdate({ ambientLight: value })}
              />
              
              <Card>
                <CardHeader>
                  <CardTitle>Configurações Gerais de Névoa</CardTitle>
                  <CardDescription>
                    Ajuste as configurações básicas do Fog of War
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fog-opacity">Opacidade da Névoa</Label>
                      <Slider
                        id="fog-opacity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[fogSettings.fogOpacity]}
                        onValueChange={(values) => handleFogSettingsUpdate({ fogOpacity: values[0] })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fog-color">Cor da Névoa</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="fog-color"
                          type="color"
                          value={fogSettings.fogColor}
                          onChange={(e) => handleFogSettingsUpdate({ fogColor: e.target.value })}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={fogSettings.fogColor}
                          onChange={(e) => handleFogSettingsUpdate({ fogColor: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => {
                      if (!currentGameId || !currentGame) return;
                      
                      // Salvar todas as configurações
                      const updatedGame = {
                        ...currentGame,
                        settings: fogSettings,
                        lastUpdated: new Date().toISOString()
                      };
                      
                      saveGameLocally(updatedGame);
                      setCurrentGame(updatedGame);
                      
                      toast({
                        title: 'Configurações salvas',
                        description: 'Todas as configurações de Fog of War foram salvas'
                      });
                    }}
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Salvar Todas as Configurações
                  </Button>
                </CardFooter>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                Selecione um jogo para configurar as opções avançadas de Fog of War.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OfflineGameManager;