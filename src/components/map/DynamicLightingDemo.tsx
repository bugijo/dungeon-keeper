import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flame, Sun, Moon, Save, Download, Plus, Trash2, Settings } from 'lucide-react';
import { LightSource, createLightSource, updateLightSourcePosition, applyLightFlickering, renderDynamicLighting } from '@/utils/lightingUtils';
import DynamicLightingController from './DynamicLightingController';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  blocks_vision: boolean;
}

const DynamicLightingDemo: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [ambientLight, setAmbientLight] = useState<number>(0.1);
  const [mapWidth, setMapWidth] = useState<number>(800);
  const [mapHeight, setMapHeight] = useState<number>(600);
  const [gridSize, setGridSize] = useState<number>(32);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedLightId, setDraggedLightId] = useState<string | null>(null);
  
  // Presets de iluminação
  const [presets, setPresets] = useState<{
    id: string;
    name: string;
    lightSources: LightSource[];
    ambientLight: number;
  }[]>([]);
  const [presetName, setPresetName] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  
  // Inicializar o canvas e criar obstáculos de exemplo
  useEffect(() => {
    // Criar obstáculos de exemplo
    const sampleObstacles: Obstacle[] = [
      { id: 'wall1', x: 100, y: 100, width: 200, height: 30, blocks_vision: true },
      { id: 'wall2', x: 100, y: 100, width: 30, height: 200, blocks_vision: true },
      { id: 'wall3', x: 400, y: 300, width: 150, height: 30, blocks_vision: true },
      { id: 'wall4', x: 550, y: 200, width: 30, height: 130, blocks_vision: true },
      { id: 'wall5', x: 300, y: 400, width: 30, height: 100, blocks_vision: true },
      { id: 'furniture', x: 200, y: 200, width: 50, height: 50, blocks_vision: true },
    ];
    
    setObstacles(sampleObstacles);
    
    // Criar fontes de luz iniciais
    const initialLights: LightSource[] = [
      createLightSource({
        id: 'torch1',
        x: 150,
        y: 150,
        radius: 120,
        color: 'rgba(255, 200, 100, 0.8)',
        intensity: 0.8,
        flickering: true,
        flickerIntensity: 0.2,
        castShadows: true
      }),
      createLightSource({
        id: 'torch2',
        x: 450,
        y: 250,
        radius: 150,
        color: 'rgba(255, 200, 100, 0.8)',
        intensity: 0.8,
        flickering: true,
        flickerIntensity: 0.2,
        castShadows: true
      }),
      createLightSource({
        id: 'magic',
        x: 300,
        y: 350,
        radius: 100,
        color: 'rgba(100, 200, 255, 0.8)',
        intensity: 1,
        flickering: false,
        castShadows: true
      })
    ];
    
    setLightSources(initialLights);
  }, []);
  
  // Renderizar iluminação quando as fontes de luz ou obstáculos mudarem
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Configurar tamanho do canvas
    canvas.width = mapWidth;
    canvas.height = mapHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Aplicar efeito de oscilação nas fontes de luz
    const flickeringLights = applyLightFlickering(lightSources, 16);
    
    // Renderizar iluminação dinâmica
    renderDynamicLighting(ctx, flickeringLights, obstacles, mapWidth, mapHeight, ambientLight);
    
    // Renderizar obstáculos para visualização
    ctx.globalCompositeOperation = 'source-over';
    obstacles.forEach(obstacle => {
      ctx.fillStyle = 'rgba(100, 100, 100, 0.7)';
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      ctx.strokeStyle = '#333';
      ctx.strokeRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
    
    // Renderizar indicadores das fontes de luz
    lightSources.forEach(source => {
      ctx.fillStyle = source.color || 'rgba(255, 255, 200, 0.8)';
      ctx.beginPath();
      ctx.arc(source.position.x, source.position.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.stroke();
    });
  }, [lightSources, obstacles, ambientLight, mapWidth, mapHeight]);
  
  // Aplicar efeito de oscilação contínua
  useEffect(() => {
    const flickerInterval = setInterval(() => {
      setLightSources(prev => applyLightFlickering(prev, 16));
    }, 100);
    
    return () => clearInterval(flickerInterval);
  }, []);
  
  // Manipuladores de eventos para arrastar fontes de luz
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Verificar se clicou em alguma fonte de luz
    for (const source of lightSources) {
      const dx = source.position.x - x;
      const dy = source.position.y - y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance <= 10) { // Raio de seleção
        setIsDragging(true);
        setDraggedLightId(source.id);
        break;
      }
    }
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !draggedLightId) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Atualizar posição da fonte de luz
    setLightSources(prev => prev.map(source => {
      if (source.id === draggedLightId) {
        return updateLightSourcePosition(source, { x, y });
      }
      return source;
    }));
  };
  
  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedLightId(null);
  };
  
  // Adicionar nova fonte de luz
  const addRandomLight = () => {
    const x = Math.random() * mapWidth;
    const y = Math.random() * mapHeight;
    const radius = 80 + Math.random() * 100;
    const flickering = Math.random() > 0.5;
    
    // Gerar cor aleatória
    const colors = [
      'rgba(255, 200, 100, 0.8)', // Tocha
      'rgba(100, 200, 255, 0.8)', // Mágica
      'rgba(255, 100, 100, 0.8)', // Vermelha
      'rgba(100, 255, 100, 0.8)', // Verde
    ];
    const color = colors[Math.floor(Math.random() * colors.length)];
    
    const newLight = createLightSource({
      id: `light-${Date.now()}`,
      x,
      y,
      radius,
      color,
      intensity: 0.7 + Math.random() * 0.3,
      flickering,
      flickerIntensity: flickering ? 0.1 + Math.random() * 0.3 : 0,
      castShadows: true
    });
    
    setLightSources(prev => [...prev, newLight]);
  };
  
  // Remover todas as fontes de luz
  const clearLights = () => {
    setLightSources([]);
  };
  
  // Carregar presets de iluminação
  useEffect(() => {
    const loadPresets = async () => {
      try {
        // Em um ambiente real, isso viria do banco de dados
        // Aqui estamos usando presets de exemplo
        const mockPresets = [
          {
            id: 'preset-1',
            name: 'Caverna Escura',
            lightSources: [
              createLightSource({
                id: 'torch-preset-1',
                x: 150,
                y: 150,
                radius: 100,
                color: 'rgba(255, 200, 100, 0.8)',
                intensity: 0.7,
                flickering: true,
                flickerIntensity: 0.2,
                castShadows: true
              }),
              createLightSource({
                id: 'magic-preset-1',
                x: 400,
                y: 300,
                radius: 120,
                color: 'rgba(100, 200, 255, 0.8)',
                intensity: 0.9,
                flickering: false,
                castShadows: true
              })
            ],
            ambientLight: 0.05
          },
          {
            id: 'preset-2',
            name: 'Sala Iluminada',
            lightSources: [
              createLightSource({
                id: 'light-preset-2-1',
                x: 200,
                y: 200,
                radius: 200,
                color: 'rgba(255, 255, 200, 0.8)',
                intensity: 1,
                flickering: false,
                castShadows: true
              }),
              createLightSource({
                id: 'light-preset-2-2',
                x: 600,
                y: 400,
                radius: 200,
                color: 'rgba(255, 255, 200, 0.8)',
                intensity: 1,
                flickering: false,
                castShadows: true
              })
            ],
            ambientLight: 0.3
          },
          {
            id: 'preset-3',
            name: 'Acampamento',
            lightSources: [
              createLightSource({
                id: 'campfire-preset-3',
                x: 400,
                y: 300,
                radius: 150,
                color: 'rgba(255, 180, 100, 0.8)',
                intensity: 0.9,
                flickering: true,
                flickerIntensity: 0.3,
                castShadows: true
              })
            ],
            ambientLight: 0.1
          }
        ];
        
        setPresets(mockPresets);
      } catch (error) {
        console.error('Erro ao carregar presets:', error);
      }
    };

    loadPresets();
  }, []);

  // Salvar preset atual
  const savePreset = () => {
    if (!presetName.trim()) {
      toast.error('Digite um nome para o preset');
      return;
    }

    const newPreset = {
      id: `preset-${Date.now()}`,
      name: presetName,
      lightSources: [...lightSources],
      ambientLight
    };

    setPresets([...presets, newPreset]);
    setPresetName('');
    toast.success(`Preset "${presetName}" salvo com sucesso`);
  };

  // Carregar preset selecionado
  const loadPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setLightSources(preset.lightSources);
    setAmbientLight(preset.ambientLight);
    setSelectedPreset(presetId);
    toast.success(`Preset "${preset.name}" carregado`);
  };
  
  return (
    <div className="p-4 space-y-4">
      <Tabs defaultValue="demo" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="demo">Demonstração</TabsTrigger>
          <TabsTrigger value="controls">Controles</TabsTrigger>
          <TabsTrigger value="presets">Presets</TabsTrigger>
        </TabsList>
        
        <TabsContent value="demo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Flame className="h-5 w-5 text-amber-500" />
                Demonstração de Iluminação Dinâmica
              </CardTitle>
              <CardDescription>
                Arraste as fontes de luz para ver como elas interagem com os obstáculos e projetam sombras.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative border rounded-md overflow-hidden">
                  <canvas
                    ref={canvasRef}
                    width={mapWidth}
                    height={mapHeight}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="w-full h-auto cursor-pointer"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-sm font-medium mb-2">Controles de Demonstração</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <Label className="text-xs flex items-center gap-1">
                            <Moon className="h-3 w-3" /> Escuridão
                          </Label>
                          <Label className="text-xs flex items-center gap-1">
                            <Sun className="h-3 w-3" /> Claridade
                          </Label>
                        </div>
                        <Slider
                          min={0}
                          max={1}
                          step={0.05}
                          value={[ambientLight]}
                          onValueChange={(value) => setAmbientLight(value[0])}
                        />
                        <div className="text-xs text-center mt-1">
                          Luz Ambiente: {Math.round(ambientLight * 100)}%
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={addRandomLight} className="flex-1">
                          <Plus className="h-3 w-3 mr-1" /> Adicionar Luz
                        </Button>
                        <Button onClick={clearLights} variant="outline" className="flex-1">
                          Limpar Luzes
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-medium mb-2">Informações</h3>
                    <div className="space-y-2 text-sm">
                      <p>Fontes de luz ativas: {lightSources.length}</p>
                      <p>Obstáculos no mapa: {obstacles.length}</p>
                      <p className="text-xs text-muted-foreground">
                        As fontes de luz com oscilação simulam o efeito de tochas ou fogo.
                        Cada fonte projeta sombras quando encontra obstáculos.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="controls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Controlador de Iluminação</CardTitle>
              <CardDescription>
                Interface para o mestre controlar as fontes de luz durante o jogo
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DynamicLightingController
                mapId="demo-map"
                gameId="demo-game"
                userId="demo-user"
                isGameMaster={true}
                lightSources={lightSources}
                onLightSourcesUpdate={setLightSources}
                gridSize={gridSize}
                width={mapWidth}
                height={mapHeight}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fontes de Luz Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {lightSources.length === 0 ? (
                  <div className="text-center py-4 text-muted-foreground">
                    Nenhuma fonte de luz ativa. Adicione uma luz na aba Demonstração.
                  </div>
                ) : (
                  lightSources.map((source, index) => (
                    <div key={source.id} className="flex items-center justify-between p-2 bg-gray-100 dark:bg-gray-800 rounded-md">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: source.color || 'rgba(255, 200, 100, 0.8)' }}
                        />
                        <span className="text-sm">
                          {source.flickering ? 'Tocha' : 'Luz'} {index + 1}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">
                          Raio: {Math.round(source.radius)}px
                        </span>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setLightSources(prev => prev.filter(s => s.id !== source.id));
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                
                <Button 
                  className="w-full mt-3" 
                  variant="outline" 
                  size="sm"
                  onClick={addRandomLight}
                >
                  <Plus className="h-3 w-3 mr-1" /> Adicionar Fonte de Luz
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="presets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Presets de Iluminação</CardTitle>
              <CardDescription>
                Salve e carregue configurações de iluminação para diferentes cenários
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label htmlFor="preset-name" className="mb-1 block">Nome do Preset</Label>
                  <Input 
                    id="preset-name" 
                    placeholder="Ex: Caverna Escura" 
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                </div>
                <Button onClick={savePreset}>
                  <Save className="h-4 w-4 mr-1" /> Salvar
                </Button>
              </div>
              
              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium mb-2">Presets Salvos</h3>
                <div className="space-y-2">
                  {presets.map(preset => (
                    <div 
                      key={preset.id} 
                      className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-colors ${selectedPreset === preset.id ? 'bg-primary/10 border border-primary/30' : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      onClick={() => loadPreset(preset.id)}
                    >
                      <div className="flex items-center gap-2">
                        <Flame className={`h-4 w-4 ${selectedPreset === preset.id ? 'text-primary' : 'text-amber-500'}`} />
                        <span>{preset.name}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{preset.lightSources.length} {preset.lightSources.length === 1 ? 'luz' : 'luzes'}</span>
                        <span>•</span>
                        <span>Ambiente: {Math.round(preset.ambientLight * 100)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Integração com Fog of War</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>
                  Os presets de iluminação podem ser integrados com o sistema de Fog of War para revelar
                  automaticamente áreas do mapa com base nas fontes de luz.
                </p>
                <p>
                  Quando integrado, as áreas iluminadas são reveladas dinamicamente conforme as fontes de luz
                  são movidas pelo mapa, criando uma experiência imersiva para os jogadores.
                </p>
                <div className="flex justify-end mt-2">
                  <Button variant="outline" size="sm">
                    <Settings className="h-3 w-3 mr-1" /> Configurar Integração
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Demonstração:</strong> Visualize o efeito das luzes e sombras em tempo real.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Arraste as fontes de luz para reposicioná-las no mapa</li>
              <li>Observe como as luzes interagem com os obstáculos, projetando sombras</li>
              <li>Ajuste a luz ambiente para simular diferentes períodos do dia</li>
            </ul>
            <p><strong>Controles:</strong> Ajuste as propriedades das fontes de luz e da iluminação ambiente.</p>
            <p><strong>Presets:</strong> Salve e carregue configurações de iluminação para diferentes cenários.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DynamicLightingDemo;