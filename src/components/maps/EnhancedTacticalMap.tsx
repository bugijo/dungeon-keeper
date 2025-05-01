import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, Move, Maximize } from 'lucide-react';
import DistanceMeasurementTool from './DistanceMeasurementTool';

interface MapToken {
  id: string;
  x: number;
  y: number;
  size: number;
  color: string;
  label: string;
  ownerId: string;
}

interface EnhancedTacticalMapProps {
  mapUrl: string;
  tokens?: MapToken[];
  gridSize?: number;
  unitSize?: number;
  unitName?: string;
  isGameMaster?: boolean;
  onTokenMove?: (tokenId: string, x: number, y: number) => void;
  fogOfWar?: boolean;
  revealedAreas?: { x: number, y: number, radius: number }[];
  isMeasuring?: boolean;
}

const EnhancedTacticalMap: React.FC<EnhancedTacticalMapProps> = ({
  mapUrl,
  tokens = [],
  gridSize = 50,
  unitSize = 5,
  unitName = 'pés',
  isGameMaster = false,
  onTokenMove,
  fogOfWar = false,
  revealedAreas = [],
  isMeasuring = false
}) => {
  const [scale, setScale] = useState<number>(1);
  const [position, setPosition] = useState<{ x: number, y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number, y: number } | null>(null);
  const [activeToken, setActiveToken] = useState<string | null>(null);
  // Usar o estado interno apenas se a prop não for fornecida
  const [internalMeasuringState, setInternalMeasuringState] = useState<boolean>(false);
  
  // Usar a prop se fornecida, caso contrário usar o estado interno
  const measuringActive = isMeasuring || internalMeasuringState;
  
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Função para aumentar o zoom
  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 2));
  };

  // Função para diminuir o zoom
  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  // Função para resetar o zoom e posição
  const resetView = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  // Manipulador para iniciar o arrasto do mapa
  const handleMapDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    if (measuringActive || activeToken) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Manipulador para o movimento durante o arrasto
  const handleMapDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;

    setPosition(prev => ({
      x: prev.x + dx,
      y: prev.y + dy
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Manipulador para finalizar o arrasto
  const handleMapDragEnd = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  // Manipulador para iniciar o arrasto de um token
  const handleTokenDragStart = (e: React.MouseEvent<HTMLDivElement>, tokenId: string) => {
    e.stopPropagation();
    if (!isGameMaster && tokens.find(t => t.id === tokenId)?.ownerId !== 'current-user-id') {
      return; // Apenas o mestre ou o dono do token pode movê-lo
    }
    
    setActiveToken(tokenId);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Manipulador para o movimento durante o arrasto de um token
  const handleTokenDragMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeToken || !dragStart || !mapRef.current) return;

    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    
    const token = tokens.find(t => t.id === activeToken);
    if (!token) return;

    // Calcular nova posição do token
    const newX = token.x + dx / scale;
    const newY = token.y + dy / scale;

    // Atualizar posição do token (em uma aplicação real, isso seria feito via props)
    if (onTokenMove) {
      onTokenMove(activeToken, newX, newY);
    }

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  // Manipulador para finalizar o arrasto de um token
  const handleTokenDragEnd = () => {
    setActiveToken(null);
    setDragStart(null);
  };

  // Efeito para adicionar/remover event listeners globais
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) handleMapDragEnd();
      if (activeToken) handleTokenDragEnd();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        e.preventDefault();
        handleMapDragMove(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
      if (activeToken) {
        e.preventDefault();
        handleTokenDragMove(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [isDragging, activeToken, dragStart]);

  // Renderizar a grade do mapa
  const renderGrid = () => {
    if (!mapRef.current) return null;
    
    const width = mapRef.current.clientWidth;
    const height = mapRef.current.clientHeight;
    
    const horizontalLines = [];
    const verticalLines = [];
    
    const scaledGridSize = gridSize * scale;
    
    // Linhas horizontais
    for (let y = 0; y <= height; y += scaledGridSize) {
      horizontalLines.push(
        <line 
          key={`h-${y}`} 
          x1={0} 
          y1={y} 
          x2={width} 
          y2={y} 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth={1} 
        />
      );
    }
    
    // Linhas verticais
    for (let x = 0; x <= width; x += scaledGridSize) {
      verticalLines.push(
        <line 
          key={`v-${x}`} 
          x1={x} 
          y1={0} 
          x2={x} 
          y2={height} 
          stroke="rgba(255,255,255,0.2)" 
          strokeWidth={1} 
        />
      );
    }
    
    return (
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 1 }}
      >
        {horizontalLines}
        {verticalLines}
      </svg>
    );
  };

  // Renderizar a névoa de guerra (fog of war)
  const renderFogOfWar = () => {
    if (!fogOfWar || !mapRef.current) return null;
    
    const width = mapRef.current.clientWidth;
    const height = mapRef.current.clientHeight;
    
    // Criar um caminho SVG para as áreas reveladas
    let revealedPath = '';
    revealedAreas.forEach(area => {
      const scaledX = area.x * scale;
      const scaledY = area.y * scale;
      const scaledRadius = area.radius * scale;
      revealedPath += `M${scaledX + scaledRadius},${scaledY} a${scaledRadius},${scaledRadius} 0 1,0 -${scaledRadius * 2},0 a${scaledRadius},${scaledRadius} 0 1,0 ${scaledRadius * 2},0 `;
    });
    
    return (
      <svg 
        className="absolute top-0 left-0 w-full h-full pointer-events-none" 
        style={{ zIndex: 3 }}
      >
        <defs>
          <mask id="fogMask">
            <rect width={width} height={height} fill="white" />
            <path d={revealedPath} fill="black" />
          </mask>
        </defs>
        <rect 
          width={width} 
          height={height} 
          fill="rgba(0,0,0,0.7)" 
          mask="url(#fogMask)" 
        />
      </svg>
    );
  };

  // Renderizar os tokens no mapa
  const renderTokens = () => {
    return tokens.map(token => {
      const isActive = token.id === activeToken;
      const scaledSize = token.size * scale;
      
      return (
        <div 
          key={token.id}
          className={`absolute rounded-full flex items-center justify-center cursor-grab ${isActive ? 'z-30 cursor-grabbing' : 'z-20'}`}
          style={{
            left: token.x * scale,
            top: token.y * scale,
            width: scaledSize,
            height: scaledSize,
            backgroundColor: token.color,
            border: isActive ? '2px solid yellow' : '1px solid black',
            transform: 'translate(-50%, -50%)'
          }}
          onMouseDown={(e) => handleTokenDragStart(e, token.id)}
        >
          <span className="text-xs font-bold text-white select-none">
            {token.label}
          </span>
        </div>
      );
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden" ref={mapContainerRef}>
      {/* Controles de zoom e ferramentas */}
      <div className="absolute top-2 left-2 z-40 flex flex-col gap-2">
        <Button variant="secondary" size="icon" onClick={zoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={zoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="icon" onClick={resetView}>
          <Maximize className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Ferramenta de medição */}
      <DistanceMeasurementTool 
        gridSize={gridSize}
        scale={scale}
        unitSize={unitSize}
        unitName={unitName}
        isActive={measuringActive}
        onToggle={() => setInternalMeasuringState(!internalMeasuringState)}
      />
      
      {/* Mapa e conteúdo */}
      <div 
        ref={mapRef}
        className={`relative w-full h-full ${!isMeasuring && !activeToken ? 'cursor-grab' : ''} ${isDragging ? 'cursor-grabbing' : ''}`}
        style={{
          transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          transformOrigin: 'center',
          transition: 'transform 0.1s ease-out'
        }}
        onMouseDown={handleMapDragStart}
      >
        {/* Imagem do mapa */}
        <img 
          src={mapUrl} 
          alt="Mapa tático" 
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {/* Grade do mapa */}
        {renderGrid()}
        
        {/* Tokens */}
        {renderTokens()}
        
        {/* Névoa de guerra */}
        {renderFogOfWar()}
      </div>
      
      {/* Informações de escala */}
      <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-40">
        Escala: 1 quadrado = {unitSize} {unitName} | Zoom: {(scale * 100).toFixed(0)}%
      </div>
    </div>
  );
};

export default EnhancedTacticalMap;