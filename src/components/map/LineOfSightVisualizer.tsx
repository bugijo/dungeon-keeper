import React, { useEffect, useRef } from 'react';

interface LineOfSightVisualizerProps {
  startPoint: { x: number; y: number } | null;
  endPoint: { x: number; y: number } | null;
  width: number;
  height: number;
  gridSize: number;
  obstacles?: { x: number; y: number; width: number; height: number }[];
  onVisibleAreaChange?: (visibleArea: { x: number; y: number; radius: number }[]) => void;
}

const LineOfSightVisualizer: React.FC<LineOfSightVisualizerProps> = ({
  startPoint,
  endPoint,
  width,
  height,
  gridSize,
  obstacles = [],
  onVisibleAreaChange
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Renderizar a visualização da linha de visão
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !startPoint) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Limpar o canvas
    ctx.clearRect(0, 0, width, height);

    // Se não tiver ponto final, não desenhar nada
    if (!endPoint) return;

    // Desenhar linha de visão
    ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 3]);
    
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(endPoint.x, endPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Calcular distância
    const distance = Math.sqrt(
      Math.pow(endPoint.x - startPoint.x, 2) +
      Math.pow(endPoint.y - startPoint.y, 2)
    );

    // Desenhar círculo no ponto de origem
    ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(startPoint.x, startPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Desenhar círculo no ponto final
    ctx.fillStyle = 'rgba(255, 255, 0, 0.3)';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, 5, 0, Math.PI * 2);
    ctx.fill();

    // Desenhar círculo de visão
    ctx.fillStyle = 'rgba(0, 255, 0, 0.1)';
    ctx.beginPath();
    ctx.arc(endPoint.x, endPoint.y, distance / 3, 0, Math.PI * 2);
    ctx.fill();

    // Verificar colisões com obstáculos
    const hasLineOfSight = !obstacles.some(obstacle => {
      return lineIntersectsRectangle(
        startPoint.x, startPoint.y,
        endPoint.x, endPoint.y,
        obstacle.x, obstacle.y,
        obstacle.width, obstacle.height
      );
    });

    // Desenhar indicador de visibilidade
    if (hasLineOfSight) {
      ctx.fillStyle = 'rgba(0, 255, 0, 0.5)';
      ctx.font = '12px Arial';
      ctx.fillText('Visível', endPoint.x + 10, endPoint.y - 10);

      // Notificar sobre a área visível
      if (onVisibleAreaChange) {
        onVisibleAreaChange([{
          x: endPoint.x,
          y: endPoint.y,
          radius: distance / 3
        }]);
      }
    } else {
      ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
      ctx.font = '12px Arial';
      ctx.fillText('Obstruído', endPoint.x + 10, endPoint.y - 10);
    }

    // Exibir distância
    const distanceInGrids = Math.round(distance / gridSize * 10) / 10;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText(`${distanceInGrids} quadrados`, (startPoint.x + endPoint.x) / 2, (startPoint.y + endPoint.y) / 2 - 10);
  }, [startPoint, endPoint, width, height, gridSize, obstacles]);

  // Função para verificar se uma linha intersecta um retângulo
  const lineIntersectsRectangle = (
    x1: number, y1: number, // Ponto inicial da linha
    x2: number, y2: number, // Ponto final da linha
    rx: number, ry: number, // Posição do retângulo
    rw: number, rh: number  // Dimensões do retângulo
  ): boolean => {
    // Verificar se a linha intersecta alguma das 4 bordas do retângulo
    return (
      lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) || // Borda superior
      lineIntersectsLine(x1, y1, x2, y2, rx, ry, rx, ry + rh) || // Borda esquerda
      lineIntersectsLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh) || // Borda direita
      lineIntersectsLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh)    // Borda inferior
    );
  };

  // Função para verificar se duas linhas se intersectam
  const lineIntersectsLine = (
    x1: number, y1: number, // Primeira linha - ponto inicial
    x2: number, y2: number, // Primeira linha - ponto final
    x3: number, y3: number, // Segunda linha - ponto inicial
    x4: number, y4: number  // Segunda linha - ponto final
  ): boolean => {
    // Calcular os determinantes
    const den = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
    if (den === 0) return false; // Linhas paralelas

    const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / den;
    const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / den;

    // Verificar se a interseção está dentro dos segmentos de linha
    return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
  };

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute top-0 left-0 z-15 pointer-events-none"
    />
  );
};

export default LineOfSightVisualizer;