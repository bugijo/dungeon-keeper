import React, { useState, useEffect, useRef, ChangeEvent } from 'react';
import { Maximize2, Minimize2, Eye, EyeOff, Move, Ruler, Upload, Grid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AreaMeasurementTool from './AreaMeasurementTool';

interface MapPoint {
  x: number;
  y: number;
}

interface TacticalMapWithFogProps {
  mapImageUrl?: string;
  fogPoints?: MapPoint[];
  onMapClick?: (x: number, y: number) => void;
  isGameMaster?: boolean;
  tokens?: {
    id: string;
    x: number;
    y: number;
    color: string;
    label: string;
    size: number;
  }[];
  onTokenMove?: (id: string, x: number, y: number) => void;
  onMapChange?: (mapUrl: string) => void;
  onFogChange?: (fogPoints: MapPoint[]) => void;
  gridType?: 'square' | 'hex';
}

const TacticalMapWithFog = ({
  mapImageUrl = '/placeholder.svg',
  fogPoints = [],
  onMapClick,
  isGameMaster = false,
  tokens = [],
  onTokenMove,
  onMapChange,
  onFogChange,
  gridType = 'square'
}: TacticalMapWithFogProps) => {
  const [gridSize, setGridSize] = useState(20); // Tamanho da célula do grid
  const [mapWidth, setMapWidth] = useState(800); // Largura total do mapa
  const [mapHeight, setMapHeight] = useState(600); // Altura total do mapa
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFog, setShowFog] = useState(true);
  const [isDraggingToken, setIsDraggingToken] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showMeasurementTool, setShowMeasurementTool] = useState(false);
  const [showMapUploadModal, setShowMapUploadModal] = useState(false);
  const [customMapFile, setCustomMapFile] = useState<File | null>(null);
  const [customMapPreview, setCustomMapPreview] = useState<string | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      if (mapRef.current?.requestFullscreen) {
        mapRef.current.requestFullscreen();
        setIsFullscreen(true);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };
  
  const handleMapFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCustomMapFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setCustomMapPreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleMapUpload = () => {
    if (customMapPreview && onMapChange) {
      onMapChange(customMapPreview);
      setShowMapUploadModal(false);
    }
  };
  
  const handleAreaSelect = (area: {
    type: 'circle' | 'cone' | 'square';
    centerX: number;
    centerY: number;
    radius: number;
    rotation?: number;
  }) => {
    // Aqui você pode implementar a lógica para destacar a área selecionada
    console.log('Área selecionada:', area);
  };
  
  const toggleMeasurementTool = () => {
    setShowMeasurementTool(!showMeasurementTool);
  };
  
  const clearFog = () => {
    if (onFogChange) {
      onFogChange([]);
    }
  }
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingToken || !onMapClick) return;
    
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.floor((event.clientX - rect.left) / gridSize);
    const y = Math.floor((event.clientY - rect.top) / gridSize);
    onMapClick(x, y);
  };

  const handleTokenMouseDown = (event: React.MouseEvent, tokenId: string) => {
    if (!isGameMaster || !onTokenMove) return;
    
    event.stopPropagation();
    setIsDraggingToken(tokenId);
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const token = tokens.find(t => t.id === tokenId);
    if (!token) return;
    
    const offsetX = event.clientX - (rect.left + token.x * gridSize);
    const offsetY = event.clientY - (rect.top + token.y * gridSize);
    setDragOffset({ x: offsetX, y: offsetY });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDraggingToken || !isGameMaster || !onTokenMove) return;
    
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = Math.floor((event.clientX - rect.left - dragOffset.x) / gridSize);
    const y = Math.floor((event.clientY - rect.top - dragOffset.y) / gridSize);
    
    const boundedX = Math.max(0, Math.min(Math.floor(mapWidth / gridSize) - 1, x));
    const boundedY = Math.max(0, Math.min(Math.floor(mapHeight / gridSize) - 1, y));
    
    onTokenMove(isDraggingToken, boundedX, boundedY);
  };

  const handleMouseUp = () => {
    setIsDraggingToken(null);
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (isDraggingToken) {
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('mouseleave', handleMouseUp);
      
      return () => {
        window.removeEventListener('mouseup', handleMouseUp);
        window.removeEventListener('mouseleave', handleMouseUp);
      };
    }
  }, [isDraggingToken]);

  const cols = Math.floor(mapWidth / gridSize);
  const rows = Math.floor(mapHeight / gridSize);

  return (
    <div className="relative">
      <div className="flex justify-between mb-2 gap-2">
        <div className="flex gap-2">
          {isGameMaster && (
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={toggleMeasurementTool}
                className="flex items-center gap-1"
              >
                <Ruler size={14} />
                Medição
              </Button>
              
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowMapUploadModal(true)}
                className="flex items-center gap-1"
              >
                <Upload size={14} />
                Mapa
              </Button>
            </>
          )}
        </div>
        
        <div className="flex gap-2">
          {isGameMaster && (
            <>
              <Button 
                variant="outline"
                size="sm"
                onClick={() => setShowFog(!showFog)}
                className="flex items-center gap-1"
              >
                {showFog ? <EyeOff size={14} /> : <Eye size={14} />}
                {showFog ? 'Ocultar Névoa' : 'Mostrar Névoa'}
              </Button>
              
              {showFog && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={clearFog}
                  className="flex items-center gap-1 text-red-500"
                >
                  Limpar Névoa
                </Button>
              )}
            </>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={toggleFullscreen}
            className="flex items-center gap-1"
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            {isFullscreen ? 'Sair' : 'Tela Cheia'}
          </Button>
        </div>
      </div>
      
      <div
        ref={mapRef}
        style={{
          width: mapWidth,
          height: mapHeight,
          backgroundImage: `url('${mapImageUrl}')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          position: 'relative',
          border: '1px solid rgba(138, 75, 175, 0.3)',
          borderRadius: '0.5rem',
          overflow: 'hidden',
          cursor: isGameMaster ? 'pointer' : 'default'
        }}
        onClick={handleMapClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        {showMeasurementTool && (
          <AreaMeasurementTool
            gridSize={gridSize}
            isVisible={showMeasurementTool}
            onClose={toggleMeasurementTool}
            mapWidth={mapWidth}
            mapHeight={mapHeight}
            onAreaSelect={handleAreaSelect}
          />
        )}
        <div 
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{ 
            backgroundImage: gridType === 'square' ?
              `linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
               linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)` :
              // Padrão hexagonal para grid hexagonal
              `radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: gridType === 'square' ? 
              `${gridSize}px ${gridSize}px` : 
              `${gridSize * 1.732}px ${gridSize * 1.5}px`,
            backgroundPosition: gridType === 'square' ? 
              '0 0' : 
              `0 0, ${gridSize * 0.866}px ${gridSize * 0.75}px`
          }}
        />

        {showFog && fogPoints.map((point, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              left: point.x * gridSize,
              top: point.y * gridSize,
              width: gridSize,
              height: gridSize,
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            }}
          />
        ))}

        {tokens.map((token) => (
          <div
            key={token.id}
            style={{
              position: 'absolute',
              left: token.x * gridSize,
              top: token.y * gridSize,
              width: token.size * gridSize,
              height: token.size * gridSize,
              backgroundColor: token.color,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid white',
              color: 'white',
              fontWeight: 'bold',
              fontSize: token.size * gridSize / 2.5,
              transform: `translate(-${token.size * gridSize / 2}px, -${token.size * gridSize / 2}px)`,
              cursor: isGameMaster ? 'grab' : 'default',
              zIndex: isDraggingToken === token.id ? 10 : 1,
              boxShadow: '0 3px 6px rgba(0,0,0,0.3)',
            }}
            onMouseDown={(e) => handleTokenMouseDown(e, token.id)}
            onClick={(e) => e.stopPropagation()}
          >
            {token.label}
            {isGameMaster && isDraggingToken === token.id && (
              <div className="absolute -top-5 -right-5 bg-fantasy-purple rounded-full p-1">
                <Move size={14} />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {isGameMaster && (
        <div className="mt-2 text-sm text-fantasy-stone">
          {isDraggingToken ? (
            <p>Arraste para mover o token</p>
          ) : (
            <p>Clique para adicionar/remover névoa • Arraste tokens para movê-los</p>
          )}
        </div>
      )}
      
      {/* Modal de Upload de Mapa */}
      {showMapUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Upload de Mapa Customizado</h3>
            
            <Tabs defaultValue="upload">
              <TabsList className="mb-4">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="settings">Configurações</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="map-file">Selecione uma imagem de mapa</Label>
                  <Input 
                    id="map-file" 
                    type="file" 
                    accept="image/*" 
                    onChange={handleMapFileChange}
                    ref={fileInputRef}
                  />
                </div>
                
                {customMapPreview && (
                  <div className="mt-4">
                    <p className="text-sm text-gray-400 mb-2">Pré-visualização:</p>
                    <div className="border border-gray-600 rounded-md overflow-hidden">
                      <img 
                        src={customMapPreview} 
                        alt="Pré-visualização do mapa" 
                        className="max-h-[200px] w-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="settings" className="space-y-4">
                <div className="flex flex-col gap-2">
                  <Label>Tipo de Grid</Label>
                  <div className="flex gap-2">
                    <Button 
                      variant={gridType === 'square' ? "default" : "outline"}
                      size="sm"
                      onClick={() => gridType === 'hex' && onMapChange && onMapChange(mapImageUrl)}
                      className="flex items-center gap-1"
                    >
                      <Grid size={14} />
                      Quadrado
                    </Button>
                    <Button 
                      variant={gridType === 'hex' ? "default" : "outline"}
                      size="sm"
                      onClick={() => gridType === 'square' && onMapChange && onMapChange(mapImageUrl)}
                      className="flex items-center gap-1"
                    >
                      <Grid size={14} />
                      Hexagonal
                    </Button>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Label>Tamanho do Grid (px)</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[gridSize]}
                      min={10}
                      max={50}
                      step={1}
                      onValueChange={(values) => setGridSize(values[0])}
                      className="flex-1"
                    />
                    <span className="text-white">{gridSize}px</span>
                  </div>
                  <p className="text-xs text-gray-400">1 quadrado = 5 pés</p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button 
                variant="outline" 
                onClick={() => setShowMapUploadModal(false)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleMapUpload}
                disabled={!customMapPreview}
              >
                Aplicar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TacticalMapWithFog;
