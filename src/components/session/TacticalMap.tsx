import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stage, Layer, Rect, Circle, Group, Text } from 'react-konva';
import { Button } from '@/components/ui/button';
import { 
  Plus, Minus, Grid3X3, Eye, EyeOff, 
  MapPin, X, Move, UserCircle, Sword, Users, Trash 
} from 'lucide-react';
import { TokenPosition } from '@/types/session';
import { toast } from 'sonner';
import debounce from 'lodash/debounce';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface TacticalMapProps {
  tokens: TokenPosition[];
  isGameMaster: boolean;
  isPaused: boolean;
  userId: string;
  sessionId: string;
  onTokenMove: (tokenId: string, x: number, y: number) => void;
  onTokenVisibilityToggle: (tokenId: string, isVisible: boolean) => void;
  onDeleteToken: (tokenId: string) => void;
  onAddToken: (token: Omit<TokenPosition, 'id' | 'session_id'>) => void;
}

const TacticalMap: React.FC<TacticalMapProps> = ({ 
  tokens, 
  isGameMaster, 
  isPaused,
  userId,
  sessionId,
  onTokenMove, 
  onTokenVisibilityToggle,
  onDeleteToken,
  onAddToken
}) => {
  const [scale, setScale] = useState(1);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [showGrid, setShowGrid] = useState(true);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [newToken, setNewToken] = useState({
    name: '',
    token_type: 'character' as 'character' | 'monster' | 'npc' | 'object' | string,
    color: '#3b82f6',
    size: 1,
    x: 5,
    y: 5,
    is_visible_to_players: true
  });
  
  const gridSize = 50;
  const stageRef = useRef<any>(null);
  
  const debouncedTokenMove = useCallback(
    debounce((tokenId: string, x: number, y: number) => {
      onTokenMove(tokenId, x, y);
    }, 500),
    [onTokenMove]
  );
  
  useEffect(() => {
    if (!containerRef) return;
    
    const handleResize = () => {
      setStageSize({
        width: containerRef.offsetWidth,
        height: containerRef.offsetHeight
      });
    };
    
    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [containerRef]);

  useEffect(() => {
    return () => {
      debouncedTokenMove.cancel();
    };
  }, [debouncedTokenMove]);

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.1, 3));
  };
  
  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.1, 0.5));
  };

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    
    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };
    
    const newScale = e.evt.deltaY < 0 ? oldScale * 1.1 : oldScale / 1.1;
    const limitedScale = Math.max(0.5, Math.min(3, newScale));
    
    stage.scale({ x: limitedScale, y: limitedScale });
    
    const newPos = {
      x: pointer.x - mousePointTo.x * limitedScale,
      y: pointer.y - mousePointTo.y * limitedScale,
    };
    
    stage.position(newPos);
    setScale(limitedScale);
  };

  const handleDragEnd = (e: any, tokenId: string) => {
    const token = tokens.find(t => t.id === tokenId);
    const canMove = isGameMaster || (token?.user_id === userId);
    
    if (!canMove || isPaused) {
      e.target.position({ 
        x: token!.x * gridSize, 
        y: token!.y * gridSize 
      });
      return;
    }
    
    const pos = e.target.position();
    const gridX = Math.round(pos.x / gridSize);
    const gridY = Math.round(pos.y / gridSize);
    
    e.target.position({
      x: gridX * gridSize,
      y: gridY * gridSize
    });
    
    debouncedTokenMove(tokenId, gridX, gridY);
  };

  const handleCreateToken = () => {
    if (!newToken.name.trim()) {
      toast.error('Nome do token é obrigatório');
      return;
    }
    
    onAddToken(newToken);
    
    const currentColor = newToken.color;
    setNewToken({
      name: '',
      token_type: 'character',
      color: currentColor,
      size: 1,
      x: 5,
      y: 5,
      is_visible_to_players: true
    });
  };

  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'token_type') {
      setNewToken(prev => ({
        ...prev,
        [name]: value as 'character' | 'monster' | 'npc' | 'object' | string
      }));
    } else {
      setNewToken(prev => ({
        ...prev,
        [name]: name === 'size' ? parseFloat(value) : value
      }));
    }
  };

  const handleTokenClick = (tokenId: string) => {
    setSelectedTokenId(tokenId === selectedTokenId ? null : tokenId);
  };

  const getTokenIcon = (type: string) => {
    switch (type) {
      case 'character': return <UserCircle className="mr-2" size={18} />;
      case 'monster': return <Sword className="mr-2" size={18} />;
      case 'npc': return <Users className="mr-2" size={18} />;
      default: return <MapPin className="mr-2" size={18} />;
    }
  };

  return (
    <div className="w-full h-full relative" ref={(ref) => setContainerRef(ref)}>
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomIn}
          className="bg-fantasy-dark/70"
        >
          <Plus size={18} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          onClick={handleZoomOut}
          className="bg-fantasy-dark/70"
        >
          <Minus size={18} />
        </Button>
        <Button
          variant={showGrid ? "default" : "secondary"}
          size="icon"
          onClick={() => setShowGrid(!showGrid)}
          className={showGrid ? "bg-fantasy-purple/20" : "bg-fantasy-dark/70"}
        >
          <Grid3X3 size={18} />
        </Button>
        
        {isGameMaster && (
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary" size="icon" className="bg-fantasy-purple/20">
                <MapPin size={18} />
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-fantasy-dark border-fantasy-purple/30">
              <SheetHeader>
                <SheetTitle className="text-fantasy-gold font-medievalsharp">Add Token</SheetTitle>
                <SheetDescription className="text-fantasy-stone">
                  Create a new token on the map
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm text-fantasy-stone">Name</label>
                  <input
                    type="text"
                    value={newToken.name}
                    onChange={(e) => setNewToken(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
                    placeholder="Token name"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-fantasy-stone">Type</label>
                  <select
                    name="token_type"
                    value={newToken.token_type}
                    onChange={handleTokenInputChange}
                    className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
                  >
                    <option value="character">Character</option>
                    <option value="monster">Monster</option>
                    <option value="npc">NPC</option>
                    <option value="object">Object</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-fantasy-stone">Color</label>
                  <input
                    type="color"
                    name="color"
                    value={newToken.color}
                    onChange={handleTokenInputChange}
                    className="w-full h-10 bg-fantasy-dark/50 border border-fantasy-purple/30 rounded"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-fantasy-stone">Size</label>
                  <select
                    name="size"
                    value={newToken.size}
                    onChange={(e) => setNewToken(prev => ({ ...prev, size: parseFloat(e.target.value) }))}
                    className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
                  >
                    <option value="0.5">Tiny</option>
                    <option value="0.75">Small</option>
                    <option value="1">Medium</option>
                    <option value="1.5">Large</option>
                    <option value="2">Huge</option>
                    <option value="3">Gargantuan</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm text-fantasy-stone">Initial Position</label>
                  <div className="flex gap-3">
                    <div className="flex-1">
                      <label className="text-xs text-fantasy-stone">X</label>
                      <input
                        type="number"
                        name="x"
                        value={newToken.x}
                        onChange={(e) => setNewToken(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-fantasy-stone">Y</label>
                      <input
                        type="number"
                        name="y"
                        value={newToken.y}
                        onChange={(e) => setNewToken(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="visibility"
                    checked={newToken.is_visible_to_players}
                    onChange={(e) => setNewToken(prev => ({ ...prev, is_visible_to_players: e.target.checked }))}
                    className="rounded border-fantasy-purple/30"
                  />
                  <label htmlFor="visibility" className="text-sm text-fantasy-stone">Visible to players</label>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleCreateToken} 
                    className="w-full fantasy-button primary"
                  >
                    <MapPin size={16} className="mr-2" /> Add Token
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      {selectedTokenId && isGameMaster && (
        <div className="absolute bottom-3 left-3 z-10 bg-fantasy-dark/90 border border-fantasy-purple/30 p-3 rounded-md max-w-xs">
          {(() => {
            const token = tokens.find(t => t.id === selectedTokenId);
            if (!token) return null;
            
            return (
              <>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    {getTokenIcon(token.token_type)}
                    <h3 className="text-white font-medievalsharp">{token.name}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-fantasy-stone hover:text-white"
                    onClick={() => setSelectedTokenId(null)}
                  >
                    <X size={14} />
                  </Button>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-fantasy-stone">Visibility:</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => onTokenVisibilityToggle(token.id, !token.is_visible_to_players)}
                    >
                      {token.is_visible_to_players ? (
                        <><Eye size={14} className="mr-1" /> Visible</>
                      ) : (
                        <><EyeOff size={14} className="mr-1" /> Hidden</>
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-fantasy-stone">Position:</span>
                    <span className="text-white">X: {token.x}, Y: {token.y}</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-fantasy-stone">Size:</span>
                    <span className="text-white">{
                      token.size === 0.5 ? 'Tiny' :
                      token.size === 0.75 ? 'Small' :
                      token.size === 1 ? 'Medium' :
                      token.size === 1.5 ? 'Large' :
                      token.size === 2 ? 'Huge' :
                      'Gargantuan'
                    }</span>
                  </div>
                  
                  <Button
                    variant="destructive"
                    size="sm"
                    className="w-full mt-2 h-7"
                    onClick={() => {
                      onDeleteToken(token.id);
                      setSelectedTokenId(null);
                    }}
                  >
                    <Trash size={14} className="mr-1" /> Delete Token
                  </Button>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <Stage
        width={stageSize.width}
        height={stageSize.height}
        ref={stageRef}
        draggable
        onWheel={handleWheel}
        scale={{ x: scale, y: scale }}
      >
        <Layer>
          <Rect
            x={-10000}
            y={-10000}
            width={20000}
            height={20000}
            fill="#1a1625"
          />
          
          {showGrid && Array.from({ length: 400 }).map((_, i) => (
            <React.Fragment key={`grid-v-${i}`}>
              <Rect
                x={i * gridSize - 10000}
                y={-10000}
                width={1}
                height={20000}
                fill="rgba(255, 255, 255, 0.1)"
              />
              <Rect
                x={-10000}
                y={i * gridSize - 10000}
                width={20000}
                height={1}
                fill="rgba(255, 255, 255, 0.1)"
              />
            </React.Fragment>
          ))}
          
          {tokens.map(token => {
            if (!token.is_visible_to_players && !isGameMaster) return null;
            
            const isOwner = token.user_id === userId;
            const canDrag = isGameMaster || isOwner;
            const size = token.size * gridSize;
            
            return (
              <Group
                key={token.id}
                x={token.x * gridSize}
                y={token.y * gridSize}
                draggable={canDrag && !isPaused}
                onDragEnd={(e) => handleDragEnd(e, token.id)}
                onClick={() => handleTokenClick(token.id)}
                onTap={() => handleTokenClick(token.id)}
              >
                <Circle
                  radius={size / 2}
                  fill={token.color}
                  stroke={token.id === selectedTokenId ? "white" : "rgba(255, 255, 255, 0.6)"}
                  strokeWidth={token.id === selectedTokenId ? 3 : 2}
                  opacity={token.is_visible_to_players || !isGameMaster ? 1 : 0.5}
                />
                
                <Text
                  text={token.name.substring(0, 2).toUpperCase()}
                  fill="white"
                  fontSize={size / 3}
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  width={size}
                  height={size}
                  offsetX={size / 2}
                  offsetY={size / 2}
                />
                
                {isGameMaster && !token.is_visible_to_players && (
                  <Circle
                    radius={size / 8}
                    fill="rgba(0, 0, 0, 0.5)"
                    stroke="rgba(255, 255, 255, 0.3)"
                    strokeWidth={1}
                    x={size / 2 - 5}
                    y={-size / 5}
                  >
                    <EyeOff size={size / 8} />
                  </Circle>
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default TacticalMap;
