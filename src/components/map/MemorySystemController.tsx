import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Brain, Eraser, Save, RotateCcw, Eye } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Point, RevealedArea } from '@/utils/fogOfWarUtils';
import { saveMemoryPointsLocally } from '@/utils/offlineStorageUtils';

interface MemorySystemControllerProps {
  mapId: string;
  gameId: string;
  userId: string;
  isGameMaster: boolean;
  revealedAreas: RevealedArea[];
  memoryPoints: Point[];
  onMemoryPointsUpdate: (points: Point[]) => void;
  memoryEnabled: boolean;
  memoryOpacity: number;
  memoryColor: string;
  onMemorySettingsChange: (settings: {
    enabled: boolean;
    opacity: number;
    color: string;
  }) => void;
}

const MemorySystemController: React.FC<MemorySystemControllerProps> = ({
  mapId,
  gameId,
  userId,
  isGameMaster,
  revealedAreas,
  memoryPoints,
  onMemoryPointsUpdate,
  memoryEnabled,
  memoryOpacity,
  memoryColor,
  onMemorySettingsChange
}) => {
  const [showControls, setShowControls] = useState<boolean>(false);
  const [localMemoryEnabled, setLocalMemoryEnabled] = useState<boolean>(memoryEnabled);
  const [localMemoryOpacity, setLocalMemoryOpacity] = useState<number>(memoryOpacity);
  const [localMemoryColor, setLocalMemoryColor] = useState<string>(memoryColor);
  const { toast } = useToast();

  // Atualizar estados locais quando as props mudarem
  useEffect(() => {
    setLocalMemoryEnabled(memoryEnabled);
    setLocalMemoryOpacity(memoryOpacity);
    setLocalMemoryColor(memoryColor);
  }, [memoryEnabled, memoryOpacity, memoryColor]);

  // Atualizar configurações de memória
  const updateMemorySettings = () => {
    onMemorySettingsChange({
      enabled: localMemoryEnabled,
      opacity: localMemoryOpacity,
      color: localMemoryColor
    });

    toast({
      title: 'Configurações atualizadas',
      description: 'As configurações de memória foram atualizadas'
    });
  };

  // Capturar áreas reveladas como pontos de memória
  const captureRevealedAreasAsMemory = () => {
    if (!isGameMaster) return;

    // Converter áreas reveladas em pontos de memória
    const newMemoryPoints: Point[] = [];
    
    revealedAreas.forEach(area => {
      if (area.shape === 'circle') {
        // Para áreas circulares, criar pontos em um grid dentro do círculo
        const radius = area.radius;
        const centerX = area.x;
        const centerY = area.y;
        
        // Criar pontos em um grid dentro do círculo
        const gridSize = radius / 5; // Ajustar densidade conforme necessário
        
        for (let x = centerX - radius; x <= centerX + radius; x += gridSize) {
          for (let y = centerY - radius; y <= centerY + radius; y += gridSize) {
            // Verificar se o ponto está dentro do círculo
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            if (distance <= radius) {
              // Verificar se o ponto já existe na memória
              const pointExists = memoryPoints.some(p => 
                Math.abs(p.x - x) < 1 && Math.abs(p.y - y) < 1
              );
              
              if (!pointExists) {
                newMemoryPoints.push({ x, y });
              }
            }
          }
        }
      } else if (area.shape === 'polygon' && area.points) {
        // Para polígonos, adicionar todos os vértices como pontos de memória
        area.points.forEach(point => {
          const pointExists = memoryPoints.some(p => 
            Math.abs(p.x - point.x) < 1 && Math.abs(p.y - point.y) < 1
          );
          
          if (!pointExists) {
            newMemoryPoints.push({ x: point.x, y: point.y });
          }
        });
      }
    });

    // Atualizar pontos de memória
    const updatedMemoryPoints = [...memoryPoints, ...newMemoryPoints];
    onMemoryPointsUpdate(updatedMemoryPoints);
    
    // Salvar localmente se for um jogo offline
    if (gameId.startsWith('game-')) {
      saveMemoryPointsLocally(gameId, updatedMemoryPoints);
    }

    toast({
      title: 'Memória atualizada',
      description: `${newMemoryPoints.length} novos pontos de memória adicionados`
    });
  };

  // Limpar todos os pontos de memória
  const clearAllMemoryPoints = () => {
    if (!isGameMaster) return;

    onMemoryPointsUpdate([]);
    
    // Salvar localmente se for um jogo offline
    if (gameId.startsWith('game-')) {
      saveMemoryPointsLocally(gameId, []);
    }

    toast({
      title: 'Memória limpa',
      description: 'Todos os pontos de memória foram removidos'
    });
  };

  // Restaurar memória para áreas atualmente reveladas
  const resetMemoryToCurrentAreas = () => {
    if (!isGameMaster) return;

    captureRevealedAreasAsMemory();
    
    toast({
      title: 'Memória restaurada',
      description: 'A memória foi redefinida para as áreas atualmente reveladas'
    });
  };

  return (
    <div className="memory-system-controller">
      {isGameMaster && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Sistema de Memória</span>
              <Switch 
                checked={showControls} 
                onCheckedChange={setShowControls} 
              />
            </CardTitle>
            <CardDescription>
              Controle o que os jogadores lembram de áreas já exploradas
            </CardDescription>
          </CardHeader>
          
          {showControls && (
            <CardContent>
              <Tabs defaultValue="settings">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="settings">Configurações</TabsTrigger>
                  <TabsTrigger value="actions">Ações</TabsTrigger>
                </TabsList>
                
                <TabsContent value="settings" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="memory-enabled"
                        checked={localMemoryEnabled}
                        onCheckedChange={setLocalMemoryEnabled}
                      />
                      <Label htmlFor="memory-enabled">Habilitar sistema de memória</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="memory-opacity">Opacidade da memória</Label>
                      <Slider
                        id="memory-opacity"
                        min={0}
                        max={1}
                        step={0.1}
                        value={[localMemoryOpacity]}
                        onValueChange={(values) => setLocalMemoryOpacity(values[0])}
                        disabled={!localMemoryEnabled}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="memory-color">Cor da memória</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="memory-color"
                          type="color"
                          value={localMemoryColor}
                          onChange={(e) => setLocalMemoryColor(e.target.value)}
                          disabled={!localMemoryEnabled}
                          className="w-12 h-8 p-1"
                        />
                        <Input
                          type="text"
                          value={localMemoryColor}
                          onChange={(e) => setLocalMemoryColor(e.target.value)}
                          disabled={!localMemoryEnabled}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    
                    <Button 
                      onClick={updateMemorySettings} 
                      className="w-full"
                      disabled={!isGameMaster}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Configurações
                    </Button>
                  </div>
                </TabsContent>
                
                <TabsContent value="actions" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <Button 
                      onClick={captureRevealedAreasAsMemory} 
                      className="w-full"
                      disabled={!isGameMaster || !localMemoryEnabled}
                    >
                      <Brain className="h-4 w-4 mr-2" />
                      Capturar Áreas Reveladas
                    </Button>
                    
                    <Button 
                      onClick={resetMemoryToCurrentAreas} 
                      className="w-full"
                      disabled={!isGameMaster || !localMemoryEnabled}
                      variant="outline"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Restaurar para Áreas Atuais
                    </Button>
                    
                    <Button 
                      onClick={clearAllMemoryPoints} 
                      className="w-full"
                      disabled={!isGameMaster || !localMemoryEnabled}
                      variant="destructive"
                    >
                      <Eraser className="h-4 w-4 mr-2" />
                      Limpar Toda Memória
                    </Button>
                    
                    <div className="pt-2 border-t">
                      <p className="text-sm text-muted-foreground">
                        <Eye className="h-4 w-4 inline-block mr-1" />
                        {memoryPoints.length} pontos de memória ativos
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default MemorySystemController;