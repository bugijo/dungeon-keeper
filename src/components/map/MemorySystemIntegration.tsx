import React, { useState, useEffect, useRef } from 'react';
import ShadowSystem from './ShadowSystem';
import { useMemoryTimestamp } from '@/hooks/useMemoryTimestamp';
import CharacterMemorySystem, { CharacterMemoryAttributes } from '@/components/character/CharacterMemorySystem';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface MemorySystemIntegrationProps {
  mapId: string;
  playerId: string;
  isGM: boolean;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  gridSize: { width: number; height: number };
}

interface LightSource {
  id: string;
  x: number;
  y: number;
  radius: number;
  intensity: number;
  color: string;
  flickering?: boolean;
  flickerIntensity?: number;
}

interface Obstacle {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  opacity: number;
  type: 'wall' | 'door' | 'window' | 'furniture' | 'water' | 'glass';
}

/**
 * Componente de integração dos sistemas de memória, sombras e configuração por personagem
 * Este componente conecta os três sistemas implementados para as prioridades do projeto
 */
const MemorySystemIntegration: React.FC<MemorySystemIntegrationProps> = ({
  mapId,
  playerId,
  isGM,
  canvasRef,
  gridSize
}) => {
  // Estado para fontes de luz e obstáculos
  const [lightSources, setLightSources] = useState<LightSource[]>([]);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [shadowQuality, setShadowQuality] = useState<'low' | 'medium' | 'high'>('medium');
  const [characterMemory, setCharacterMemory] = useState<CharacterMemoryAttributes | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Referência para o intervalo de atualização
  const updateIntervalRef = useRef<number | null>(null);
  
  // Hook de temporização de memória
  const {
    memoryGrid,
    isLoading,
    updateCellMemory,
    getCellDetailLevel,
    isCellVisited,
    processMemoryDecay,
    characterFactors,
    setCharacterFactors
  } = useMemoryTimestamp({
    mapId,
    playerId,
    gridSize,
    checkInterval: 60000, // Verificar desvanecimento a cada minuto
    offlineSupport: true
  });
  
  // Inicializar o sistema
  useEffect(() => {
    if (isInitialized) return;
    
    // Carregar fontes de luz e obstáculos do mapa
    loadMapElements();
    
    // Iniciar intervalo de atualização para sincronizar os sistemas
    if (updateIntervalRef.current) {
      window.clearInterval(updateIntervalRef.current);
    }
    
    updateIntervalRef.current = window.setInterval(() => {
      synchronizeSystems();
    }, 5000); // Sincronizar a cada 5 segundos
    
    setIsInitialized(true);
    
    return () => {
      if (updateIntervalRef.current) {
        window.clearInterval(updateIntervalRef.current);
        updateIntervalRef.current = null;
      }
    };
  }, [mapId, playerId]);
  
  // Atualizar fatores do personagem quando o characterMemory mudar
  useEffect(() => {
    if (characterMemory) {
      setCharacterFactors({
        intelligence: characterMemory.intelligence,
        wisdom: characterMemory.wisdom,
        perception: characterMemory.perception,
        modifiers: characterMemory.modifiers
      });
    }
  }, [characterMemory]);
  
  // Carregar elementos do mapa (fontes de luz e obstáculos)
  const loadMapElements = async () => {
    try {
      // Aqui seria implementada a lógica para carregar fontes de luz e obstáculos do banco de dados
      // Por enquanto, vamos usar dados de exemplo
      
      // Exemplo de fontes de luz
      const exampleLights: LightSource[] = [
        {
          id: 'light1',
          x: 100,
          y: 100,
          radius: 150,
          intensity: 0.8,
          color: '#ffaa33',
          flickering: true,
          flickerIntensity: 0.1
        },
        {
          id: 'light2',
          x: 300,
          y: 200,
          radius: 120,
          intensity: 0.6,
          color: '#3366ff'
        }
      ];
      
      // Exemplo de obstáculos
      const exampleObstacles: Obstacle[] = [
        {
          id: 'wall1',
          x: 150,
          y: 150,
          width: 100,
          height: 20,
          opacity: 1.0,
          type: 'wall'
        },
        {
          id: 'window1',
          x: 200,
          y: 250,
          width: 50,
          height: 10,
          opacity: 0.3,
          type: 'window'
        },
        {
          id: 'water1',
          x: 50,
          y: 300,
          width: 80,
          height: 80,
          opacity: 0.5,
          type: 'water'
        }
      ];
      
      setLightSources(exampleLights);
      setObstacles(exampleObstacles);
      
      toast.success('Elementos do mapa carregados com sucesso');
    } catch (error) {
      console.error('Erro ao carregar elementos do mapa:', error);
      toast.error('Erro ao carregar elementos do mapa');
    }
  };
  
  // Sincronizar os três sistemas
  const synchronizeSystems = () => {
    // Processar desvanecimento de memória
    processMemoryDecay();
    
    // Atualizar células com base nas condições de iluminação
    if (canvasRef.current && memoryGrid) {
      const cellSize = {
        width: canvasRef.current.width / gridSize.width,
        height: canvasRef.current.height / gridSize.height
      };
      
      // Para cada célula do grid
      for (let y = 0; y < gridSize.height; y++) {
        for (let x = 0; x < gridSize.width; x++) {
          // Calcular posição central da célula
          const centerX = x * cellSize.width + cellSize.width / 2;
          const centerY = y * cellSize.height + cellSize.height / 2;
          
          // Calcular nível de iluminação da célula
          const lightLevel = calculateCellLightLevel(centerX, centerY);
          
          // Atualizar memória da célula se estiver visível
          if (lightLevel > 10) { // Limiar mínimo de visibilidade
            updateCellMemory(x, y, lightLevel);
          }
        }
      }
    }
  };
  
  // Calcular nível de iluminação de uma célula
  const calculateCellLightLevel = (x: number, y: number): number => {
    let totalLight = 0;
    
    // Para cada fonte de luz
    lightSources.forEach(light => {
      // Calcular distância até a fonte de luz
      const dx = x - light.x;
      const dy = y - light.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Se estiver dentro do raio da luz
      if (distance <= light.radius) {
        // Calcular atenuação baseada na distância
        const attenuation = 1 - (distance / light.radius);
        
        // Verificar se há obstáculos bloqueando a luz
        const blocked = isLightBlocked(x, y, light.x, light.y);
        
        // Adicionar contribuição desta fonte de luz
        if (!blocked) {
          totalLight += 100 * attenuation * light.intensity;
        }
      }
    });
    
    // Limitar a 100
    return Math.min(100, totalLight);
  };
  
  // Verificar se a luz está bloqueada por obstáculos
  const isLightBlocked = (x1: number, y1: number, x2: number, y2: number): boolean => {
    // Implementação simplificada de raycasting
    for (const obstacle of obstacles) {
      // Pular obstáculos transparentes
      if (obstacle.opacity < 0.1) continue;
      
      // Verificar interseção da linha com o retângulo do obstáculo
      if (lineIntersectsRectangle(
        x1, y1, x2, y2,
        obstacle.x, obstacle.y, obstacle.x + obstacle.width, obstacle.y + obstacle.height
      )) {
        return true;
      }
    }
    
    return false;
  };
  
  // Verificar se uma linha intersecta um retângulo
  const lineIntersectsRectangle = (
    x1: number, y1: number, x2: number, y2: number,
    rectX1: number, rectY1: number, rectX2: number, rectY2: number
  ): boolean => {
    // Verificar interseção com cada lado do retângulo
    return (
      lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY1, rectX2, rectY1) || // Topo
      lineIntersectsLine(x1, y1, x2, y2, rectX2, rectY1, rectX2, rectY2) || // Direita
      lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY2, rectX2, rectY2) || // Base
      lineIntersectsLine(x1, y1, x2, y2, rectX1, rectY1, rectX1, rectY2)    // Esquerda
    );
  };
  
  // Verificar se duas linhas se intersectam
  const lineIntersectsLine = (
    a1x: number, a1y: number, a2x: number, a2y: number,
    b1x: number, b1y: number, b2x: number, b2y: number
  ): boolean => {
    const det = (a2x - a1x) * (b2y - b1y) - (b2x - b1x) * (a2y - a1y);
    if (det === 0) return false; // Linhas paralelas
    
    const lambda = ((b2y - b1y) * (b2x - a1x) + (b1x - b2x) * (b2y - a1y)) / det;
    const gamma = ((a1y - a2y) * (b2x - a1x) + (a2x - a1x) * (b2y - a1y)) / det;
    
    return (lambda > 0 && lambda < 1) && (gamma > 0 && gamma < 1);
  };
  
  // Renderizar o mapa de memória
  const renderMemoryMap = () => {
    if (!canvasRef.current || !memoryGrid) return;
    
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    
    const cellSize = {
      width: canvasRef.current.width / gridSize.width,
      height: canvasRef.current.height / gridSize.height
    };
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    // Para cada célula do grid
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        // Obter nível de detalhe da célula
        const detailLevel = getCellDetailLevel(x, y);
        const visited = isCellVisited(x, y);
        
        // Pular células não visitadas
        if (!visited) continue;
        
        // Calcular cor com base no nível de detalhe
        const alpha = detailLevel / 100;
        ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
        
        // Desenhar célula
        ctx.fillRect(
          x * cellSize.width,
          y * cellSize.height,
          cellSize.width,
          cellSize.height
        );
        
        // Adicionar detalhes para células com alto nível de detalhe
        if (detailLevel > 70) {
          ctx.strokeStyle = `rgba(100, 100, 100, ${alpha})`;
          ctx.strokeRect(
            x * cellSize.width,
            y * cellSize.height,
            cellSize.width,
            cellSize.height
          );
        }
      }
    }
  };
  
  // Atualizar configurações de memória do personagem
  const handleMemoryUpdate = (attributes: CharacterMemoryAttributes) => {
    setCharacterMemory(attributes);
    toast.success('Configurações de memória atualizadas');
  };
  
  if (isLoading) {
    return <div className="p-4">Carregando sistema de memória...</div>;
  }
  
  return (
    <div className="w-full space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="map">Mapa de Memória</TabsTrigger>
          <TabsTrigger value="shadows">Sistema de Sombras</TabsTrigger>
          <TabsTrigger value="character">Configuração do Personagem</TabsTrigger>
        </TabsList>
        
        <TabsContent value="map" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mapa de Memória</CardTitle>
              <CardDescription>
                Visualize as áreas memorizadas pelo personagem e seu nível de detalhe atual.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="relative">
                {/* Canvas para renderizar o mapa de memória */}
                <canvas
                  ref={canvasRef}
                  className="border border-gray-300 rounded-md"
                  width={800}
                  height={600}
                />
                
                {/* Botão para forçar renderização */}
                <Button
                  className="absolute top-2 right-2"
                  onClick={renderMemoryMap}
                >
                  Atualizar Visualização
                </Button>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={processMemoryDecay}>
                Processar Desvanecimento
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="shadows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sistema de Sombras</CardTitle>
              <CardDescription>
                Configure o sistema de sombras avançadas e visualize o efeito no mapa.
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="shadow-quality">Qualidade das Sombras</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Button
                      variant={shadowQuality === 'low' ? 'default' : 'outline'}
                      onClick={() => setShadowQuality('low')}
                    >
                      Baixa
                    </Button>
                    <Button
                      variant={shadowQuality === 'medium' ? 'default' : 'outline'}
                      onClick={() => setShadowQuality('medium')}
                    >
                      Média
                    </Button>
                    <Button
                      variant={shadowQuality === 'high' ? 'default' : 'outline'}
                      onClick={() => setShadowQuality('high')}
                    >
                      Alta
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium">Fontes de Luz</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {lightSources.map(light => (
                      <Card key={light.id} className="p-3">
                        <h4 className="font-medium">{light.id}</h4>
                        <p className="text-sm">
                          Posição: ({light.x}, {light.y})<br />
                          Raio: {light.radius}<br />
                          Intensidade: {light.intensity}
                        </p>
                        <div
                          className="w-6 h-6 rounded-full mt-2"
                          style={{ backgroundColor: light.color }}
                        />
                      </Card>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4">
                  <h3 className="text-lg font-medium">Obstáculos</h3>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    {obstacles.map(obstacle => (
                      <Card key={obstacle.id} className="p-3">
                        <h4 className="font-medium">{obstacle.id}</h4>
                        <p className="text-sm">
                          Tipo: {obstacle.type}<br />
                          Posição: ({obstacle.x}, {obstacle.y})<br />
                          Tamanho: {obstacle.width}x{obstacle.height}<br />
                          Opacidade: {obstacle.opacity * 100}%
                        </p>
                      </Card>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
            
            <CardFooter>
              <Button onClick={loadMapElements}>
                Recarregar Elementos
              </Button>
            </CardFooter>
          </Card>
          
          {/* Componente ShadowSystem (não renderiza nada diretamente) */}
          <ShadowSystem
            canvasRef={canvasRef}
            mapId={mapId}
            lightSources={lightSources}
            obstacles={obstacles}
            quality={shadowQuality}
            onRender={renderMemoryMap}
          />
        </TabsContent>
        
        <TabsContent value="character" className="space-y-4">
          <CharacterMemorySystem
            characterId={playerId}
            isGM={isGM}
            onUpdate={handleMemoryUpdate}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MemorySystemIntegration;