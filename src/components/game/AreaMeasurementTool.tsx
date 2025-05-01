import React, { useState, useEffect } from 'react';
import { Circle, Square, Target, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AreaMeasurementToolProps {
  gridSize: number;
  isVisible: boolean;
  onClose: () => void;
  mapWidth: number;
  mapHeight: number;
  onAreaSelect?: (area: {
    type: 'circle' | 'cone' | 'square';
    centerX: number;
    centerY: number;
    radius: number;
    rotation?: number;
  }) => void;
}

const AreaMeasurementTool: React.FC<AreaMeasurementToolProps> = ({
  gridSize,
  isVisible,
  onClose,
  mapWidth,
  mapHeight,
  onAreaSelect
}) => {
  const [areaType, setAreaType] = useState<'circle' | 'cone' | 'square'>('circle');
  const [radius, setRadius] = useState<number>(4); // Raio em células do grid (1 célula = 5ft)
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [rotation, setRotation] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Converter raio de células para pés (1 célula = 5ft)
  const radiusInFeet = radius * 5;
  
  // Resetar a ferramenta quando fechada
  useEffect(() => {
    if (!isVisible) {
      setPosition(null);
    }
  }, [isVisible]);
  
  // Lidar com clique no mapa para posicionar a área
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / gridSize);
    const y = Math.floor((e.clientY - rect.top) / gridSize);
    
    setPosition({ x, y });
    
    if (onAreaSelect && position) {
      onAreaSelect({
        type: areaType,
        centerX: x,
        centerY: y,
        radius,
        rotation: areaType === 'cone' ? rotation : undefined
      });
    }
  };
  
  // Iniciar arrasto da área
  const handleAreaMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDragging(true);
  };
  
  // Mover a área durante o arrasto
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && position) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.floor((e.clientX - rect.left) / gridSize);
      const y = Math.floor((e.clientY - rect.top) / gridSize);
      
      setPosition({ x, y });
    }
  };
  
  // Finalizar arrasto
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Renderizar a visualização da área
  const renderAreaVisualization = () => {
    if (!position) return null;
    
    const centerX = position.x * gridSize + gridSize / 2;
    const centerY = position.y * gridSize + gridSize / 2;
    const radiusInPixels = radius * gridSize;
    
    switch (areaType) {
      case 'circle':
        return (
          <div
            className="absolute rounded-full border-2 border-red-500 bg-red-500 bg-opacity-30"
            style={{
              left: centerX,
              top: centerY,
              width: radiusInPixels * 2,
              height: radiusInPixels * 2,
              transform: `translate(-50%, -50%)`,
              cursor: 'move',
              zIndex: 100
            }}
            onMouseDown={handleAreaMouseDown}
          />
        );
      
      case 'cone':
        return (
          <div
            className="absolute border-2 border-yellow-500 bg-yellow-500 bg-opacity-30"
            style={{
              left: centerX,
              top: centerY,
              width: 0,
              height: 0,
              borderLeft: `${radiusInPixels}px solid transparent`,
              borderRight: `${radiusInPixels}px solid transparent`,
              borderBottom: `${radiusInPixels * 2}px solid rgba(234, 179, 8, 0.3)`,
              transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
              cursor: 'move',
              zIndex: 100
            }}
            onMouseDown={handleAreaMouseDown}
          />
        );
      
      case 'square':
        return (
          <div
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-30"
            style={{
              left: centerX,
              top: centerY,
              width: radiusInPixels * 2,
              height: radiusInPixels * 2,
              transform: `translate(-50%, -50%)`,
              cursor: 'move',
              zIndex: 100
            }}
            onMouseDown={handleAreaMouseDown}
          />
        );
      
      default:
        return null;
    }
  };
  
  if (!isVisible) return null;
  
  return (
    <div className="absolute inset-0 z-50">
      <div 
        className="absolute inset-0"
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {renderAreaVisualization()}
      </div>
      
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-900 bg-opacity-80 p-3 rounded-lg flex flex-col gap-3 min-w-[300px]">
        <div className="flex justify-between items-center">
          <h3 className="text-white font-bold">Ferramenta de Medição</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X size={16} className="text-white" />
          </Button>
        </div>
        
        <div className="flex gap-2 justify-center">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={areaType === 'circle' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAreaType('circle')}
                >
                  <Circle size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Círculo (Fireball, etc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={areaType === 'cone' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAreaType('cone')}
                >
                  <Target size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Cone (Burning Hands, etc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={areaType === 'square' ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAreaType('square')}
                >
                  <Square size={16} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Quadrado (Thunderwave, etc)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-white text-sm">Raio: {radiusInFeet} pés ({radius} quadrados)</label>
          <Slider
            value={[radius]}
            min={1}
            max={20}
            step={1}
            onValueChange={(values) => setRadius(values[0])}
          />
        </div>
        
        {areaType === 'cone' && (
          <div className="flex flex-col gap-1">
            <label className="text-white text-sm">Rotação: {rotation}°</label>
            <Slider
              value={[rotation]}
              min={0}
              max={359}
              step={15}
              onValueChange={(values) => setRotation(values[0])}
            />
          </div>
        )}
        
        <div className="text-white text-xs">
          Clique no mapa para posicionar a área de efeito
        </div>
      </div>
    </div>
  );
};

export default AreaMeasurementTool;