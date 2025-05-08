import React, { useRef, useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import MemorySystemIntegration from '@/components/map/MemorySystemIntegration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

/**
 * Página de demonstração do sistema integrado de memória
 * Esta página demonstra a integração dos três sistemas implementados:
 * 1. Efeitos de Sombra Avançados
 * 2. Sistema de Desvanecimento Gradual
 * 3. Opções de Configuração por Personagem
 */
const MemorySystemDemo: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const [playerId, setPlayerId] = useState<string>('');
  const [isGM, setIsGM] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Tamanho do grid para o mapa
  const gridSize = { width: 40, height: 30 };
  
  // Inicializar a página
  useEffect(() => {
    // Verificar se o mapId está presente
    if (!mapId) {
      toast.error('ID do mapa não fornecido');
      return;
    }
    
    // Carregar ID do jogador atual
    loadCurrentPlayer();
    
    // Inicializar o canvas
    initializeCanvas();
  }, [mapId]);
  
  // Carregar jogador atual
  const loadCurrentPlayer = async () => {
    try {
      // Em um cenário real, isso seria carregado do contexto de autenticação
      // Por enquanto, vamos usar um ID de exemplo
      setPlayerId('player123');
    } catch (error) {
      console.error('Erro ao carregar jogador atual:', error);
      toast.error('Erro ao carregar jogador atual');
    }
  };
  
  // Inicializar o canvas
  const initializeCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Definir tamanho do canvas
    canvas.width = 800;
    canvas.height = 600;
    
    // Limpar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Desenhar grid base
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.2)';
    
    const cellWidth = canvas.width / gridSize.width;
    const cellHeight = canvas.height / gridSize.height;
    
    for (let x = 0; x <= gridSize.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * cellWidth, 0);
      ctx.lineTo(x * cellWidth, canvas.height);
      ctx.stroke();
    }
    
    for (let y = 0; y <= gridSize.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * cellHeight);
      ctx.lineTo(canvas.width, y * cellHeight);
      ctx.stroke();
    }
  };
  
  // Alternar entre modo jogador e mestre
  const toggleGMMode = () => {
    setIsGM(prev => !prev);
    toast.success(`Modo ${!isGM ? 'Mestre' : 'Jogador'} ativado`);
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Memória Avançado</CardTitle>
          <CardDescription>
            Demonstração da integração dos sistemas de sombras avançadas, desvanecimento gradual e configuração por personagem.
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <div>
              <span className="font-medium">Mapa:</span> {mapId || 'Não especificado'}
            </div>
            <div>
              <span className="font-medium">Jogador:</span> {playerId || 'Carregando...'}
            </div>
            <Button onClick={toggleGMMode}>
              Modo {isGM ? 'Jogador' : 'Mestre'}
            </Button>
          </div>
          
          {playerId ? (
            <MemorySystemIntegration
              mapId={mapId || 'demo_map'}
              playerId={playerId}
              isGM={isGM}
              canvasRef={canvasRef}
              gridSize={gridSize}
            />
          ) : (
            <div className="p-4 text-center">
              Carregando dados do jogador...
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MemorySystemDemo;