import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Ruler } from 'lucide-react';
import { Tooltip } from '@/components/ui/tooltip';
import { TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface Point {
  x: number;
  y: number;
}

interface DistanceMeasurementToolProps {
  gridSize: number; // Tamanho da grade em pixels
  scale: number; // Escala atual do mapa
  unitSize: number; // Tamanho de cada unidade (ex: 5 pés por quadrado)
  unitName?: string; // Nome da unidade (ex: "pés", "metros")
  isActive: boolean;
  onToggle: () => void;
}

const DistanceMeasurementTool: React.FC<DistanceMeasurementToolProps> = ({
  gridSize,
  scale,
  unitSize,
  unitName = 'pés',
  isActive,
  onToggle
}) => {
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [endPoint, setEndPoint] = useState<Point | null>(null);
  const [distance, setDistance] = useState<number>(0);
  const [measuring, setMeasuring] = useState<boolean>(false);
  const mapRef = useRef<HTMLDivElement>(null);

  // Função para calcular a distância entre dois pontos na grade
  const calculateGridDistance = (start: Point, end: Point): number => {
    // Converter coordenadas de pixel para coordenadas de grade
    const startGridX = Math.floor(start.x / (gridSize * scale));
    const startGridY = Math.floor(start.y / (gridSize * scale));
    const endGridX = Math.floor(end.x / (gridSize * scale));
    const endGridY = Math.floor(end.y / (gridSize * scale));

    // Calcular distância de Manhattan (para grade quadrada)
    // ou distância euclidiana (para movimento livre)
    const dx = Math.abs(endGridX - startGridX);
    const dy = Math.abs(endGridY - startGridY);
    
    // Para D&D 5e, geralmente usamos a regra de movimento diagonal
    // onde cada diagonal conta como 1.5 unidades
    // Aqui estamos usando uma aproximação simples
    const diagonalMovement = Math.min(dx, dy);
    const straightMovement = Math.abs(dx - dy);
    
    // Cada unidade de grade representa unitSize unidades de medida (ex: 5 pés)
    return (diagonalMovement * 1.5 + straightMovement) * unitSize;
  };

  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isActive || !mapRef.current) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (!measuring) {
      // Iniciar medição
      setStartPoint({ x, y });
      setEndPoint({ x, y }); // Inicialmente, o ponto final é igual ao inicial
      setMeasuring(true);
      setDistance(0);
    } else {
      // Finalizar medição
      setEndPoint({ x, y });
      setMeasuring(false);
      
      if (startPoint) {
        const calculatedDistance = calculateGridDistance(startPoint, { x, y });
        setDistance(calculatedDistance);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!measuring || !mapRef.current || !startPoint) return;

    const rect = mapRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setEndPoint({ x, y });
    const calculatedDistance = calculateGridDistance(startPoint, { x, y });
    setDistance(calculatedDistance);
  };

  const resetMeasurement = () => {
    setStartPoint(null);
    setEndPoint(null);
    setDistance(0);
    setMeasuring(false);
  };

  useEffect(() => {
    if (!isActive) {
      resetMeasurement();
    }
  }, [isActive]);

  return (
    <div className="relative">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant={isActive ? "default" : "outline"}
              size="icon"
              onClick={onToggle}
              className={`absolute top-2 right-2 z-10 ${isActive ? 'bg-primary text-primary-foreground' : ''}`}
            >
              <Ruler className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Ferramenta de Medição</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {isActive && (
        <div 
          ref={mapRef} 
          className="absolute inset-0 cursor-crosshair z-20" 
          onClick={handleMapClick}
          onMouseMove={handleMouseMove}
        >
          {startPoint && endPoint && (
            <svg className="absolute inset-0 pointer-events-none">
              <line
                x1={startPoint.x}
                y1={startPoint.y}
                x2={endPoint.x}
                y2={endPoint.y}
                stroke="#ff5500"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
              <circle
                cx={startPoint.x}
                cy={startPoint.y}
                r="4"
                fill="#ff5500"
              />
              <circle
                cx={endPoint.x}
                cy={endPoint.y}
                r="4"
                fill="#ff5500"
              />
              
              {/* Texto com a distância */}
              <foreignObject
                x={(startPoint.x + endPoint.x) / 2 - 40}
                y={(startPoint.y + endPoint.y) / 2 - 15}
                width="80"
                height="30"
              >
                <div className="bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs text-center">
                  {distance.toFixed(1)} {unitName}
                </div>
              </foreignObject>
            </svg>
          )}
        </div>
      )}

      {isActive && distance > 0 && !measuring && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-2 rounded z-30">
          <p className="text-sm font-medium">Distância: {distance.toFixed(1)} {unitName}</p>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetMeasurement}
            className="mt-1 text-xs text-white hover:text-white hover:bg-red-800"
          >
            Limpar
          </Button>
        </div>
      )}
    </div>
  );
};

export default DistanceMeasurementTool;