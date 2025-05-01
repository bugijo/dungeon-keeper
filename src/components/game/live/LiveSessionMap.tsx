
import React, { useState, useEffect, useRef } from 'react';
import { Stage, Layer, Rect, Circle, Text, Group } from 'react-konva';
import { Button } from '@/components/ui/button';
import { MapPin, Plus, Minus, Grid, User, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { MapToken } from '@/types/game';
import { supabase } from '@/integrations/supabase/client';

interface TokenFormData {
  name: string;
  token_type: string;
  color: string;
  size: number;
}

interface LiveSessionMapProps {
  tokens: MapToken[];
  isGameMaster: boolean;
  onTokenMove: (tokenId: string, x: number, y: number) => void;
  onAddToken: (token: any) => void;
  onDeleteToken: (tokenId: string) => void;
  participants: any[];
  isPaused?: boolean;
  userId: string;
  sessionId: string; // ID da sessão para sincronização em tempo real
}

const LiveSessionMap: React.FC<LiveSessionMapProps> = ({
  tokens,
  isGameMaster,
  onTokenMove,
  onAddToken,
  onDeleteToken,
  participants,
  isPaused = false,
  userId,
  sessionId
}) => {
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [scale, setScale] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);
  const [showTokenForm, setShowTokenForm] = useState(false);
  const [newToken, setNewToken] = useState<TokenFormData>({
    name: '',
    token_type: 'character',
    color: '#3b82f6',
    size: 1
  });
  const [fogOfWar, setFogOfWar] = useState<{x: number, y: number}[]>([]);
  const [showFogTool, setShowFogTool] = useState(false);
  const [drawMode, setDrawMode] = useState<'add' | 'remove'>('add');
  const [showFog, setShowFog] = useState(true);
  const [mapData, setMapData] = useState<any>(null);
  const [realtimeChannel, setRealtimeChannel] = useState<any>(null);
  
  const gridSize = 50;
  
  useEffect(() => {
    if (!containerRef) return;
    
    const resizeMap = () => {
      const width = containerRef.offsetWidth;
      const height = containerRef.offsetHeight;
      setStageSize({ width, height });
    };
    
    resizeMap();
    window.addEventListener('resize', resizeMap);
    
    return () => {
      window.removeEventListener('resize', resizeMap);
    };
  }, [containerRef]);
  
  // Efeito para carregar dados iniciais do mapa e configurar sincronização em tempo real
  useEffect(() => {
    if (!sessionId) return;
    
    // Função para carregar dados do mapa
    const fetchMapData = async () => {
      try {
        const { data, error } = await supabase
          .from('sessions')
          .select('map_data')
          .eq('id', sessionId)
          .single();
          
        if (error) {
          console.error('Erro ao carregar dados do mapa:', error);
          return;
        }
        
        if (data && data.map_data) {
          setMapData(data.map_data);
          // Aqui você pode atualizar outros estados com base nos dados do mapa
          // Por exemplo, se map_data contiver tokens, você pode atualizá-los
        }
      } catch (err) {
        console.error('Erro ao buscar dados do mapa:', err);
      }
    };
    
    // Configurar canal de tempo real para ouvir mudanças na sessão
    const setupRealtimeChannel = () => {
      const channel = supabase
        .channel(`sessions:${sessionId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'sessions',
          filter: `id=eq.${sessionId}`
        }, (payload) => {
          console.log('Mudanças em tempo real recebidas:', payload);
          if (payload.new && payload.new.map_data) {
            setMapData(payload.new.map_data);
            // Atualizar outros estados conforme necessário
          }
        })
        .subscribe((status) => {
          console.log('Status da inscrição em tempo real:', status);
          if (status === 'SUBSCRIBED') {
            toast.success('Sincronização em tempo real ativada');
          }
        });
      
      setRealtimeChannel(channel);
    };
    
    fetchMapData();
    setupRealtimeChannel();
    
    // Limpar inscrição quando o componente for desmontado
    return () => {
      if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
      }
    };
  }, [sessionId]);
  
  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    
    const scaleBy = 1.1;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointerPosition = stage.getPointerPosition();
    
    if (!pointerPosition) return;
    
    const mousePointTo = {
      x: (pointerPosition.x - stage.x()) / oldScale,
      y: (pointerPosition.y - stage.y()) / oldScale,
    };
    
    let newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    newScale = Math.max(0.5, Math.min(3, newScale));
    
    stage.scale({ x: newScale, y: newScale });
    
    const newPos = {
      x: pointerPosition.x - mousePointTo.x * newScale,
      y: pointerPosition.y - mousePointTo.y * newScale,
    };
    
    stage.position(newPos);
    stage.batchDraw();
    
    setScale(newScale);
  };
  
  const handleDragEnd = (e: any, tokenId: string) => {
    const canMoveToken = isGameMaster || 
                          (tokens.find(t => t.id === tokenId)?.user_id === userId &&
                          tokens.find(t => t.id === tokenId)?.token_type === 'character');
    
    if (!canMoveToken || isPaused) return;
    
    const pos = e.target.position();
    const gridAlignedX = Math.round(pos.x / gridSize) * gridSize;
    const gridAlignedY = Math.round(pos.y / gridSize) * gridSize;
    
    e.target.position({
      x: gridAlignedX,
      y: gridAlignedY
    });
    
    onTokenMove(tokenId, gridAlignedX / gridSize, gridAlignedY / gridSize);
    
    // Atualizar dados do mapa no Supabase
    updateMapDataInSupabase();
  };
  
  const zoomIn = () => {
    const newScale = Math.min(scale + 0.2, 3);
    setScale(newScale);
  };
  
  const zoomOut = () => {
    const newScale = Math.max(scale - 0.2, 0.5);
    setScale(newScale);
  };
  
  const handleAddToken = () => {
    if (!newToken.name) {
      toast.error('O nome do token é obrigatório');
      return;
    }
    
    const centerX = Math.round(stageSize.width / gridSize / 2);
    const centerY = Math.round(stageSize.height / gridSize / 2);
    
    onAddToken({
      ...newToken,
      x: centerX,
      y: centerY
    });
    
    setShowTokenForm(false);
    setNewToken({
      name: '',
      token_type: 'character',
      color: '#3b82f6',
      size: 1
    });
    
    // Atualizar dados do mapa no Supabase
    updateMapDataInSupabase();
  };
  
  const handleTokenInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewToken(prev => ({
      ...prev,
      [name]: name === 'size' ? parseFloat(value) : value
    }));
  };
  
  const addParticipantToken = (participant: any) => {
    const characterName = participant.characters?.name || participant.profiles?.display_name;
    const tokenType = participant.role === 'gm' ? 'npc' : 'character';
    
    const centerX = Math.round(stageSize.width / gridSize / 2);
    const centerY = Math.round(stageSize.height / gridSize / 2);
    
    onAddToken({
      name: characterName,
      token_type: tokenType,
      color: getRandomColor(),
      size: 1,
      x: centerX,
      y: centerY,
      user_id: participant.user_id,
      character_id: participant.characters?.id
    });
  };
  
  const getRandomColor = () => {
    const colors = [
      '#3b82f6', '#10b981', '#ef4444', '#f59e0b', 
      '#8b5cf6', '#ec4899', '#0ea5e9', '#a855f7'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };
  
  const getTokenColor = (tokenType: string) => {
    switch (tokenType) {
      case 'character': return '#3b82f6'; // Blue
      case 'monster': return '#ef4444';   // Red
      case 'npc': return '#f59e0b';       // Orange
      case 'object': return '#8b5cf6';    // Purple
      default: return '#10b981';          // Green
    }
  };
  
  // Função para atualizar os dados do mapa no Supabase
  const updateMapDataInSupabase = async () => {
    if (!sessionId) return;
    
    try {
      // Criar objeto com os dados atualizados do mapa
      const updatedMapData = {
        tokens: tokens,
        fogOfWar: fogOfWar,
        // Adicione outros dados relevantes do mapa aqui
      };
      
      const { error } = await supabase
        .from('sessions')
        .update({ map_data: updatedMapData })
        .eq('id', sessionId);
        
      if (error) {
        console.error('Erro ao atualizar dados do mapa:', error);
        toast.error('Erro ao sincronizar mapa');
      }
    } catch (err) {
      console.error('Erro ao atualizar dados do mapa:', err);
      toast.error('Erro ao sincronizar mapa');
    }
  };
  
  const handleGridClick = (e: any) => {
    if (!isGameMaster || !showFogTool) return;
    
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    if (!pointerPosition) return;
    
    const scale = stage.scaleX();
    const stagePos = stage.position();
    
    // Adjust for stage position and scale
    const x = Math.floor((pointerPosition.x - stagePos.x) / (gridSize * scale));
    const y = Math.floor((pointerPosition.y - stagePos.y) / (gridSize * scale));
    
    if (drawMode === 'add') {
      if (!fogOfWar.some(point => point.x === x && point.y === y)) {
        setFogOfWar(prev => [...prev, { x, y }]);
      }
    } else {
      setFogOfWar(prev => prev.filter(point => !(point.x === x && point.y === y)));
    }
  };
  
  const clearFog = () => {
    setFogOfWar([]);
  };
  
  return (
    <div className="relative h-full" ref={(ref) => setContainerRef(ref)}>
      <div className="absolute top-2 right-2 flex flex-col gap-2 z-10">
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
          onClick={zoomIn}
          title="Aumentar zoom"
        >
          <Plus size={18} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className="w-9 h-9 p-0"
          onClick={zoomOut}
          title="Diminuir zoom"
        >
          <Minus size={18} />
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          className={`w-9 h-9 p-0 ${showGrid ? 'bg-fantasy-purple/20' : ''}`}
          onClick={() => setShowGrid(!showGrid)}
          title="Mostrar/esconder grade"
        >
          <Grid size={18} />
        </Button>
        
        {isGameMaster && (
          <Button
            variant="outline"
            size="sm"
            className="w-9 h-9 p-0"
            onClick={() => setShowTokenForm(!showTokenForm)}
            title="Adicionar token"
          >
            <MapPin size={18} />
          </Button>
        )}
        
        {isGameMaster && (
          <Button
            variant="outline"
            size="sm"
            className={`w-9 h-9 p-0 ${showFogTool ? 'bg-fantasy-purple/20' : ''}`}
            onClick={() => setShowFogTool(!showFogTool)}
            title="Ferramentas de névoa"
          >
            {showFog ? <Eye size={18} /> : <EyeOff size={18} />}
          </Button>
        )}
      </div>

      {isGameMaster && showTokenForm && (
        <div className="absolute top-2 left-2 p-4 bg-fantasy-dark border border-fantasy-purple/30 rounded-md z-10 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medievalsharp">Adicionar Token</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowTokenForm(false)}
            >
              <X size={14} />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <label className="text-sm text-fantasy-stone">Nome</label>
              <input
                type="text"
                name="name"
                value={newToken.name}
                onChange={handleTokenInputChange}
                className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
              />
            </div>
            
            <div>
              <label className="text-sm text-fantasy-stone">Tipo</label>
              <select
                name="token_type"
                value={newToken.token_type}
                onChange={handleTokenInputChange}
                className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
              >
                <option value="character">Personagem</option>
                <option value="monster">Monstro</option>
                <option value="npc">NPC</option>
                <option value="object">Objeto</option>
              </select>
            </div>
            
            <div>
              <label className="text-sm text-fantasy-stone">Cor</label>
              <input
                type="color"
                name="color"
                value={newToken.color}
                onChange={handleTokenInputChange}
                className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-1 h-8"
              />
            </div>
            
            <div>
              <label className="text-sm text-fantasy-stone">Tamanho</label>
              <select
                name="size"
                value={newToken.size.toString()}
                onChange={handleTokenInputChange}
                className="w-full bg-fantasy-dark/50 border border-fantasy-purple/30 rounded p-2 text-white"
              >
                <option value="0.5">Minúsculo</option>
                <option value="0.75">Pequeno</option>
                <option value="1">Médio</option>
                <option value="2">Grande</option>
                <option value="3">Enorme</option>
              </select>
            </div>
            
            <div className="flex gap-2 mt-3">
              <Button 
                variant="default"
                className="flex-1 fantasy-button primary"
                onClick={handleAddToken}
              >
                Adicionar
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {isGameMaster && showFogTool && (
        <div className="absolute top-2 left-2 p-4 bg-fantasy-dark border border-fantasy-purple/30 rounded-md z-10 w-64">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-white font-medievalsharp">Névoa de Guerra</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => setShowFogTool(false)}
            >
              <X size={14} />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={drawMode === 'add' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDrawMode('add')}
              >
                Adicionar
              </Button>
              <Button
                variant={drawMode === 'remove' ? 'default' : 'outline'}
                className="flex-1"
                onClick={() => setDrawMode('remove')}
              >
                Remover
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-fantasy-stone">Mostrar Névoa</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFog(!showFog)}
              >
                {showFog ? <Eye size={14} /> : <EyeOff size={14} />}
              </Button>
            </div>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={clearFog}
              className="w-full"
            >
              Limpar Névoa
            </Button>
          </div>
        </div>
      )}

      {isGameMaster && (
        <div className="absolute bottom-2 left-2 p-3 bg-fantasy-dark border border-fantasy-purple/30 rounded-md z-10 max-w-xs">
          <h3 className="text-white font-medievalsharp text-sm mb-2">Participantes</h3>
          
          <div className="max-h-32 overflow-y-auto space-y-1">
            {participants.map(participant => (
              <div 
                key={participant.id}
                className="flex items-center justify-between text-sm p-1 hover:bg-fantasy-purple/10 rounded"
              >
                <div className="flex items-center">
                  <User size={14} className="mr-1 text-fantasy-purple" />
                  <span className="text-fantasy-stone">
                    {participant.profiles?.display_name || "Jogador"}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => addParticipantToken(participant)}
                >
                  +Token
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <Stage
        width={stageSize.width}
        height={stageSize.height}
        onWheel={handleWheel}
        scaleX={scale}
        scaleY={scale}
        draggable
        onClick={handleGridClick}
      >
        <Layer>
          {/* Background */}
          <Rect
            width={stageSize.width * 2}
            height={stageSize.height * 2}
            x={-stageSize.width / 2}
            y={-stageSize.height / 2}
            fill="#1a1625"
          />
          
          {/* Grid */}
          {showGrid && Array.from({ length: stageSize.width * 2 / gridSize }).map((_, i) => (
            <Rect
              key={`vertical-${i}`}
              x={i * gridSize - stageSize.width / 2}
              y={-stageSize.height / 2}
              width={1}
              height={stageSize.height * 2}
              fill="rgba(255, 255, 255, 0.1)"
            />
          ))}
          
          {showGrid && Array.from({ length: stageSize.height * 2 / gridSize }).map((_, i) => (
            <Rect
              key={`horizontal-${i}`}
              x={-stageSize.width / 2}
              y={i * gridSize - stageSize.height / 2}
              width={stageSize.width * 2}
              height={1}
              fill="rgba(255, 255, 255, 0.1)"
            />
          ))}
          
          {/* Fog of War */}
          {showFog && fogOfWar.map((tile, index) => (
            <Rect
              key={`fog-${index}`}
              x={tile.x * gridSize}
              y={tile.y * gridSize}
              width={gridSize}
              height={gridSize}
              fill="rgba(0, 0, 0, 0.7)"
            />
          ))}
          
          {/* Tokens */}
          {tokens.map(token => {
            const tokenSize = token.size * gridSize;
            const x = token.x * gridSize;
            const y = token.y * gridSize;
            const canDrag = isGameMaster || (token.user_id === userId && token.token_type === 'character');
            
            return (
              <Group
                key={token.id}
                x={x}
                y={y}
                draggable={canDrag && !isPaused}
                onDragEnd={(e) => handleDragEnd(e, token.id)}
              >
                <Circle
                  radius={tokenSize / 2}
                  fill={token.color || getTokenColor(token.token_type)}
                  stroke="white"
                  strokeWidth={2}
                />
                <Text
                  text={token.name?.substring(0, 2) || "??"}
                  fill="white"
                  fontSize={tokenSize / 3}
                  fontStyle="bold"
                  align="center"
                  verticalAlign="middle"
                  width={tokenSize}
                  height={tokenSize}
                  offsetX={tokenSize / 2}
                  offsetY={tokenSize / 2}
                />
                {isGameMaster && (
                  <Circle
                    radius={tokenSize / 5}
                    fill="red"
                    x={tokenSize / 2}
                    y={-tokenSize / 5}
                    opacity={0.7}
                    onClick={() => onDeleteToken(token.id)}
                  />
                )}
              </Group>
            );
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default LiveSessionMap;
