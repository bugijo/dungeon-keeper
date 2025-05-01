import React, { useState, useEffect, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Eye, EyeOff, Grid, Move, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface MapToken {
  id: string;
  x: number;
  y: number;
  type: 'player' | 'monster' | 'npc' | 'object';
  name: string;
  size: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  imageUrl?: string;
  color?: string;
}

interface TokenProps {
  token: MapToken;
  onMove: (id: string, x: number, y: number) => void;
  gridSize: number;
  isDMView: boolean;
}

// Token component that can be dragged
const Token: React.FC<TokenProps> = ({ token, onMove, gridSize, isDMView }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'TOKEN',
    item: { id: token.id, x: token.x, y: token.y },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  // Size multiplier based on token size
  const getSizeMultiplier = () => {
    switch (token.size) {
      case 'tiny': return 0.5;
      case 'small': return 0.8;
      case 'medium': return 1;
      case 'large': return 2;
      case 'huge': return 3;
      default: return 1;
    }
  };

  const sizeMultiplier = getSizeMultiplier();
  const tokenSize = gridSize * sizeMultiplier;

  const tokenStyles: React.CSSProperties = {
    position: 'absolute',
    left: `${token.x * gridSize}px`,
    top: `${token.y * gridSize}px`,
    width: `${tokenSize}px`,
    height: `${tokenSize}px`,
    transform: `translate(-${tokenSize / 2}px, -${tokenSize / 2}px)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDMView ? 'move' : 'default',
    zIndex: 10,
    pointerEvents: isDMView ? 'auto' : 'none',
    backgroundColor: token.color || '#6366F1',
    borderColor: token.type === 'player' ? '#34D399' : '#F87171',
  };

  return (
    <div
      ref={drag}
      style={tokenStyles}
      className="rounded-full flex items-center justify-center text-center text-xs font-bold border-2 transition-all"
    >
      {token.imageUrl ? (
        <img 
          src={token.imageUrl} 
          alt={token.name} 
          className="w-full h-full object-cover rounded-full"
        />
      ) : (
        <span className="text-white truncate px-1">{token.name.charAt(0)}</span>
      )}
    </div>
  );
};

interface DropSquareProps {
  x: number;
  y: number;
  onDrop: (id: string, x: number, y: number) => void;
  gridSize: number;
  inFog: boolean;
  isDMView: boolean;
  onClick?: () => void;
  onMouseEnter?: (e: React.MouseEvent) => void;
}

// Droppable square on the grid
const DropSquare: React.FC<DropSquareProps> = ({ 
  x, 
  y, 
  onDrop, 
  gridSize, 
  inFog, 
  isDMView,
  onClick,
  onMouseEnter 
}) => {
  const [{ isOver }, drop] = useDrop(() => ({
    accept: 'TOKEN',
    drop: (item: { id: string }) => {
      onDrop(item.id, x, y);
      return { x, y };
    },
    collect: (monitor) => ({
      isOver: !!monitor.isOver(),
    }),
  }));

  return (
    <div
      ref={drop}
      style={{
        width: `${gridSize}px`,
        height: `${gridSize}px`,
        backgroundColor: isOver ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        position: 'relative',
      }}
      className={cn({
        'fog-of-war': inFog && !isDMView,
      })}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
    />
  );
};

interface TacticalMapProps {
  initialTokens?: MapToken[];
  backgroundImage?: string;
  isDMView?: boolean;
  onTokenMove?: (token: MapToken) => void;
}

const TacticalMap: React.FC<TacticalMapProps> = ({
  initialTokens = [],
  backgroundImage,
  isDMView = false,
  onTokenMove,
}) => {
  const [tokens, setTokens] = useState<MapToken[]>(initialTokens);
  const [gridSize, setGridSize] = useState(40);
  const [showFogOfWar, setShowFogOfWar] = useState(true);
  const [fogOfWarMap, setFogOfWarMap] = useState<boolean[][]>([]);
  const [mapSize, setMapSize] = useState({ width: 20, height: 15 });
  const [paintMode, setPaintMode] = useState<'reveal' | 'hide'>('reveal');
  const [measuring, setMeasuring] = useState(false);
  const [measureStart, setMeasureStart] = useState<{ x: number, y: number } | null>(null);
  const [measureEnd, setMeasureEnd] = useState<{ x: number, y: number } | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Initialize fog of war map
  useEffect(() => {
    const newFogMap = Array(mapSize.height).fill(null).map(() => 
      Array(mapSize.width).fill(true)
    );
    setFogOfWarMap(newFogMap);
  }, [mapSize]);

  // Handle token movement
  const handleTokenMove = (id: string, x: number, y: number) => {
    setTokens(prev => {
      const newTokens = prev.map(token => 
        token.id === id ? { ...token, x, y } : token
      );
      
      // Reveal fog around player tokens
      if (showFogOfWar && isDMView) {
        const movedToken = newTokens.find(t => t.id === id);
        if (movedToken && movedToken.type === 'player') {
          revealAreaAroundToken(movedToken, 3);
        }
      }
      
      // Notify parent component
      if (onTokenMove) {
        const updatedToken = newTokens.find(t => t.id === id);
        if (updatedToken) {
          onTokenMove(updatedToken);
        }
      }
      
      return newTokens;
    });
  };

  // Calculate distance between grid points (1 square = 5ft)
  const calculateDistance = (x1: number, y1: number, x2: number, y2: number) => {
    // Use Pythagorean theorem for diagonal distance
    const squareDistance = Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2);
    const gridDistance = Math.sqrt(squareDistance);
    // Convert grid distance to feet (5ft per square)
    return Math.round(gridDistance * 5);
  };

  // Toggle fog at a specific grid position
  const toggleFogAt = (x: number, y: number, visible: boolean) => {
    if (x < 0 || x >= mapSize.width || y < 0 || y >= mapSize.height) return;
    
    setFogOfWarMap(prev => {
      const newMap = [...prev.map(row => [...row])];
      newMap[y][x] = !visible;
      return newMap;
    });
  };

  // Reveal fog in an area around a token
  const revealAreaAroundToken = (token: MapToken, radius: number) => {
    const x = Math.floor(token.x);
    const y = Math.floor(token.y);
    
    for (let i = Math.max(0, y - radius); i <= Math.min(mapSize.height - 1, y + radius); i++) {
      for (let j = Math.max(0, x - radius); j <= Math.min(mapSize.width - 1, x + radius); j++) {
        // Only reveal if within circle radius
        if (calculateDistance(x, y, j, i) / 5 <= radius) {
          toggleFogAt(j, i, true);
        }
      }
    }
  };

  // Handle fog of war painting
  const handleGridClick = (x: number, y: number) => {
    if (!isDMView || !showFogOfWar) return;
    
    if (measuring) {
      if (!measureStart) {
        setMeasureStart({ x, y });
      } else if (!measureEnd) {
        setMeasureEnd({ x, y });
      } else {
        // Reset measurements if both start and end are already set
        setMeasureStart({ x, y });
        setMeasureEnd(null);
      }
      return;
    }
    
    toggleFogAt(x, y, paintMode === 'reveal');
  };

  // Handle painting by dragging
  const handleGridDrag = (e: React.MouseEvent, x: number, y: number) => {
    if (!isDMView || !showFogOfWar || !e.buttons) return;
    if (measuring) return;
    
    toggleFogAt(x, y, paintMode === 'reveal');
  };

  // Reset fog of war
  const resetFogOfWar = (allHidden = true) => {
    const newFogMap = Array(mapSize.height).fill(null).map(() => 
      Array(mapSize.width).fill(allHidden)
    );
    setFogOfWarMap(newFogMap);
  };

  // Reveal all fog of war
  const revealAll = () => {
    resetFogOfWar(false);
  };

  // Hide all fog of war
  const hideAll = () => {
    resetFogOfWar(true);
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="tactical-map-container flex flex-col gap-4">
        {isDMView && (
          <div className="controls flex flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-fantasy-stone">Grid Size:</span>
              <Slider 
                className="w-32"
                value={[gridSize]} 
                min={20} 
                max={60} 
                step={5} 
                onValueChange={(val) => setGridSize(val[0])}
              />
              <span className="text-xs text-fantasy-gold">{gridSize}px</span>
            </div>
            
            <Toggle
              pressed={showFogOfWar}
              onPressedChange={setShowFogOfWar}
              className="ml-4"
            >
              {showFogOfWar ? <Eye size={16} /> : <EyeOff size={16} />}
              <span className="ml-2">Fog of War</span>
            </Toggle>
            
            {showFogOfWar && isDMView && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPaintMode(paintMode === 'reveal' ? 'hide' : 'reveal')}
                  className={cn(
                    "ml-2",
                    paintMode === 'reveal' && "bg-green-500/20",
                    paintMode === 'hide' && "bg-red-500/20"
                  )}
                >
                  {paintMode === 'reveal' ? 'Reveal' : 'Hide'}
                </Button>
                
                <Button variant="outline" size="sm" onClick={revealAll} className="ml-2">
                  Reveal All
                </Button>
                
                <Button variant="outline" size="sm" onClick={hideAll} className="ml-2">
                  Hide All
                </Button>
              </>
            )}
            
            <Toggle
              pressed={measuring}
              onPressedChange={setMeasuring}
              className="ml-4"
            >
              <Ruler size={16} />
              <span className="ml-2">Measure</span>
            </Toggle>
          </div>
        )}
        
        <div 
          className="tactical-map relative border border-fantasy-purple/30 overflow-auto"
          style={{
            width: `${mapSize.width * gridSize}px`,
            height: `${mapSize.height * gridSize}px`,
            backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          ref={mapRef}
        >
          {/* Grid */}
          <div className="grid" style={{ position: 'relative' }}>
            {Array.from({ length: mapSize.height }).map((_, y) => (
              <div key={`row-${y}`} className="flex">
                {Array.from({ length: mapSize.width }).map((_, x) => (
                  <DropSquare
                    key={`cell-${x}-${y}`}
                    x={x}
                    y={y}
                    onDrop={handleTokenMove}
                    gridSize={gridSize}
                    inFog={fogOfWarMap[y]?.[x]}
                    isDMView={isDMView}
                    onClick={() => handleGridClick(x, y)}
                    onMouseEnter={(e) => handleGridDrag(e, x, y)}
                  />
                ))}
              </div>
            ))}
          </div>
          
          {/* Distance measurement line */}
          {measuring && measureStart && measureEnd && (
            <div
              className="distance-measurement"
              style={{
                position: 'absolute',
                left: `${measureStart.x * gridSize + gridSize / 2}px`,
                top: `${measureStart.y * gridSize + gridSize / 2}px`,
                width: '2px',
                height: '2px',
                backgroundColor: 'yellow',
                boxShadow: '0 0 10px yellow',
                zIndex: 30,
              }}
            >
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: `${mapSize.width * gridSize}px`,
                  height: `${mapSize.height * gridSize}px`,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              >
                <line
                  x1="0"
                  y1="0"
                  x2={(measureEnd.x - measureStart.x) * gridSize}
                  y2={(measureEnd.y - measureStart.y) * gridSize}
                  stroke="yellow"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                <text
                  x={(measureEnd.x - measureStart.x) * gridSize / 2}
                  y={(measureEnd.y - measureStart.y) * gridSize / 2}
                  fill="white"
                  fontSize="12px"
                  fontWeight="bold"
                  textAnchor="middle"
                  alignmentBaseline="middle"
                  stroke="black"
                  strokeWidth="4"
                  paintOrder="stroke"
                >
                  {calculateDistance(measureStart.x, measureStart.y, measureEnd.x, measureEnd.y)}ft
                </text>
              </svg>
            </div>
          )}
          
          {/* Tokens */}
          {tokens.map(token => (
            <Token
              key={token.id}
              token={token}
              onMove={handleTokenMove}
              gridSize={gridSize}
              isDMView={isDMView}
            />
          ))}
        </div>
      </div>
    </DndProvider>
  );
};

export default TacticalMap;
