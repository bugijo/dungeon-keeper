import React, { useRef, useEffect, useState } from 'react';
import { RevealedArea, Obstacle, Point, isPointInRevealedArea, calculateVisibleArea } from '@/utils/fogOfWarUtils';
import { LightSource, calculateCombinedLighting, renderDynamicLighting } from '@/utils/lightingUtils';

interface EnhancedFogOfWarRendererProps {
  width: number;
  height: number;
  revealedAreas: RevealedArea[];
  obstacles: Obstacle[];
  lightSources: LightSource[];
  memoryPoints: Point[];
  memoryEnabled: boolean;
  memoryOpacity: number;
  memoryColor: string;
  fogOpacity: number;
  fogColor: string;
  ambientLight: number;
  isGameMaster: boolean;
  playerPosition?: Point;
  playerVisionRadius?: number;
}

const EnhancedFogOfWarRenderer: React.FC<EnhancedFogOfWarRendererProps> = ({
  width,
  height,
  revealedAreas,
  obstacles,
  lightSources,
  memoryPoints,
  memoryEnabled,
  memoryOpacity,
  memoryColor,
  fogOpacity,
  fogColor,
  ambientLight,
  isGameMaster,
  playerPosition,
  playerVisionRadius = 200
}) => {
  const fogCanvasRef = useRef<HTMLCanvasElement>(null);
  const lightingCanvasRef = useRef<HTMLCanvasElement>(null);
  const memoryCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar e limpar os canvas
  useEffect(() => {
    const fogCanvas = fogCanvasRef.current;
    const lightingCanvas = lightingCanvasRef.current;
    const memoryCanvas = memoryCanvasRef.current;

    if (!fogCanvas || !lightingCanvas || !memoryCanvas) return;

    // Configurar dimensões dos canvas
    fogCanvas.width = width;
    fogCanvas.height = height;
    lightingCanvas.width = width;
    lightingCanvas.height = height;
    memoryCanvas.width = width;
    memoryCanvas.height = height;

    setIsInitialized(true);

    return () => {
      // Limpar canvas ao desmontar
      const fogCtx = fogCanvas.getContext('2d');
      const lightingCtx = lightingCanvas.getContext('2d');
      const memoryCtx = memoryCanvas.getContext('2d');

      if (fogCtx) fogCtx.clearRect(0, 0, width, height);
      if (lightingCtx) lightingCtx.clearRect(0, 0, width, height);
      if (memoryCtx) memoryCtx.clearRect(0, 0, width, height);
    };
  }, [width, height]);

  // Renderizar névoa de guerra
  useEffect(() => {
    if (!isInitialized) return;

    const fogCanvas = fogCanvasRef.current;
    if (!fogCanvas) return;

    const ctx = fogCanvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Desenhar névoa de guerra (cobrindo todo o mapa)
    ctx.fillStyle = fogColor || '#1a1a1a';
    ctx.globalAlpha = fogOpacity;
    ctx.fillRect(0, 0, width, height);

    // Configurar para modo de composição 'destination-out' para criar buracos na névoa
    ctx.globalCompositeOperation = 'destination-out';
    ctx.globalAlpha = 1;

    // Revelar áreas baseadas nas áreas reveladas
    revealedAreas.forEach(area => {
      if (area.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
        ctx.fill();
      } else if (area.shape === 'polygon' && area.points && area.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(area.points[0].x, area.points[0].y);
        for (let i = 1; i < area.points.length; i++) {
          ctx.lineTo(area.points[i].x, area.points[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    });

    // Se o jogador tiver uma posição, calcular área visível baseada em obstáculos
    if (playerPosition && !isGameMaster) {
      const visibleArea = calculateVisibleArea(
        playerPosition.x,
        playerPosition.y,
        playerVisionRadius,
        obstacles.filter(obs => obs.blocks_vision),
        width,
        height
      );

      if (visibleArea && visibleArea.length > 0) {
        ctx.beginPath();
        ctx.moveTo(visibleArea[0].x, visibleArea[0].y);
        for (let i = 1; i < visibleArea.length; i++) {
          ctx.lineTo(visibleArea[i].x, visibleArea[i].y);
        }
        ctx.closePath();
        ctx.fill();
      }
    }

    // Restaurar modo de composição
    ctx.globalCompositeOperation = 'source-over';
  }, [isInitialized, width, height, revealedAreas, fogColor, fogOpacity, playerPosition, playerVisionRadius, obstacles, isGameMaster]);

  // Renderizar sistema de memória
  useEffect(() => {
    if (!isInitialized || !memoryEnabled) return;

    const memoryCanvas = memoryCanvasRef.current;
    if (!memoryCanvas) return;

    const ctx = memoryCanvas.getContext('2d');
    if (!ctx) return;

    // Limpar canvas
    ctx.clearRect(0, 0, width, height);

    // Configurar estilo para pontos de memória
    ctx.fillStyle = memoryColor || '#555555';
    ctx.globalAlpha = memoryOpacity;

    // Desenhar pontos de memória como pequenos círculos
    memoryPoints.forEach(point => {
      // Verificar se o ponto está em uma área atualmente revelada
      const isCurrentlyRevealed = revealedAreas.some(area => 
        isPointInRevealedArea(point, area)
      );

      // Só desenhar pontos de memória que não estão em áreas atualmente reveladas
      if (!isCurrentlyRevealed) {
        ctx.beginPath();
        ctx.arc(point.x, point.y, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Restaurar opacidade
    ctx.globalAlpha = 1;
  }, [isInitialized, memoryEnabled, memoryPoints, memoryColor, memoryOpacity, width, height, revealedAreas]);

  // Renderizar iluminação dinâmica
  useEffect(() => {
    if (!isInitialized) return;

    const lightingCanvas = lightingCanvasRef.current;
    if (!lightingCanvas) return;

    const ctx = lightingCanvas.getContext('2d');
    if (!ctx) return;

    // Renderizar iluminação dinâmica
    renderDynamicLighting(ctx, lightSources, obstacles, width, height, ambientLight);
  }, [isInitialized, lightSources, obstacles, width, height, ambientLight]);

  return (
    <div className="enhanced-fog-of-war-renderer" style={{ position: 'relative', width, height }}>
      {/* Canvas para memória (camada inferior) */}
      <canvas
        ref={memoryCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 1
        }}
      />
      
      {/* Canvas para névoa de guerra (camada do meio) */}
      <canvas
        ref={fogCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 2
        }}
      />
      
      {/* Canvas para iluminação dinâmica (camada superior) */}
      <canvas
        ref={lightingCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
          mixBlendMode: 'multiply'
        }}
      />
    </div>
  );
};

export default EnhancedFogOfWarRenderer;