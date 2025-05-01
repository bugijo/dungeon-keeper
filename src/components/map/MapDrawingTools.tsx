import React, { useState, useRef, useEffect } from 'react';
import { Pencil, Eraser, Square, Circle, StraightLine, Type, Undo, Redo, Save, Trash2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface DrawingToolsProps {
  canvasRef: React.RefObject<HTMLCanvasElement>;
  mapId: string;
  isGM: boolean;
  onSave?: (imageData: string) => Promise<void>;
}

type DrawingTool = 'pencil' | 'eraser' | 'rectangle' | 'circle' | 'line' | 'text';
type DrawingAction = { type: string; data: any };

const MapDrawingTools: React.FC<DrawingToolsProps> = ({ canvasRef, mapId, isGM, onSave }) => {
  const [activeTool, setActiveTool] = useState<DrawingTool>('pencil');
  const [color, setColor] = useState('#9333ea'); // Roxo fantasy-purple
  const [lineWidth, setLineWidth] = useState(3);
  const [isDrawing, setIsDrawing] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState<{ x: number, y: number } | null>(null);
  const [undoStack, setUndoStack] = useState<DrawingAction[]>([]);
  const [redoStack, setRedoStack] = useState<DrawingAction[]>([]);
  
  const startPointRef = useRef<{ x: number, y: number } | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  
  // Cores predefinidas para o mestre
  const predefinedColors = [
    '#9333ea', // Roxo (fantasy-purple)
    '#3b82f6', // Azul
    '#22c55e', // Verde
    '#f59e0b', // Âmbar
    '#ef4444', // Vermelho
    '#ffffff', // Branco
    '#000000', // Preto
    '#8b5cf6', // Violeta
    '#06b6d4', // Ciano
    '#fbbf24', // Amarelo
  ];
  
  // Inicializar o contexto do canvas
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = color;
      context.lineWidth = lineWidth;
      contextRef.current = context;
      
      // Salvar o estado inicial do canvas
      saveCanvasState('init');
    }
  }, [canvasRef, color, lineWidth]);
  
  // Atualizar o estilo do contexto quando as propriedades mudarem
  useEffect(() => {
    if (!contextRef.current) return;
    
    contextRef.current.strokeStyle = color;
    contextRef.current.lineWidth = lineWidth;
  }, [color, lineWidth]);
  
  // Salvar o estado atual do canvas para desfazer/refazer
  const saveCanvasState = (actionType: string) => {
    if (!canvasRef.current) return;
    
    const imageData = canvasRef.current.toDataURL();
    setUndoStack(prev => [...prev, { type: actionType, data: imageData }]);
    setRedoStack([]);
  };
  
  // Desfazer a última ação
  const handleUndo = () => {
    if (undoStack.length <= 1) return; // Manter pelo menos o estado inicial
    
    const newUndoStack = [...undoStack];
    const lastAction = newUndoStack.pop();
    
    if (lastAction && canvasRef.current && contextRef.current) {
      setRedoStack(prev => [...prev, lastAction]);
      
      const previousAction = newUndoStack[newUndoStack.length - 1];
      const img = new Image();
      img.src = previousAction.data;
      img.onload = () => {
        contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        contextRef.current?.drawImage(img, 0, 0);
      };
      
      setUndoStack(newUndoStack);
    }
  };
  
  // Refazer a última ação desfeita
  const handleRedo = () => {
    if (redoStack.length === 0) return;
    
    const newRedoStack = [...redoStack];
    const actionToRedo = newRedoStack.pop();
    
    if (actionToRedo && canvasRef.current && contextRef.current) {
      setUndoStack(prev => [...prev, actionToRedo]);
      
      const img = new Image();
      img.src = actionToRedo.data;
      img.onload = () => {
        contextRef.current?.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
        contextRef.current?.drawImage(img, 0, 0);
      };
      
      setRedoStack(newRedoStack);
    }
  };
  
  // Limpar o canvas
  const handleClear = () => {
    if (!canvasRef.current || !contextRef.current) return;
    
    // Salvar o estado atual antes de limpar
    saveCanvasState('clear');
    
    contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    toast.success('Anotações do mapa apagadas');
  };
  
  // Salvar as anotações do mapa
  const handleSave = async () => {
    if (!canvasRef.current || !onSave) return;
    
    try {
      const imageData = canvasRef.current.toDataURL('image/png');
      await onSave(imageData);
      toast.success('Anotações do mapa salvas com sucesso');
    } catch (error) {
      console.error('Erro ao salvar anotações:', error);
      toast.error('Erro ao salvar anotações do mapa');
    }
  };
  
  // Iniciar o desenho
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (activeTool === 'text') {
      setTextPosition({ x, y });
      return;
    }
    
    contextRef.current.beginPath();
    
    if (activeTool === 'pencil' || activeTool === 'eraser') {
      contextRef.current.moveTo(x, y);
    } else {
      startPointRef.current = { x, y };
    }
    
    setIsDrawing(true);
  };
  
  // Desenhar
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !contextRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    if (activeTool === 'pencil') {
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
    } else if (activeTool === 'eraser') {
      const originalColor = contextRef.current.strokeStyle;
      contextRef.current.strokeStyle = '#FFFFFF'; // Cor do apagador
      contextRef.current.lineTo(x, y);
      contextRef.current.stroke();
      contextRef.current.strokeStyle = originalColor;
    } else if (startPointRef.current) {
      // Para formas, redesenhar o canvas a partir do último estado salvo
      if (undoStack.length > 0) {
        const lastState = undoStack[undoStack.length - 1];
        const img = new Image();
        img.src = lastState.data;
        img.onload = () => {
          if (!contextRef.current || !canvasRef.current) return;
          
          contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          contextRef.current.drawImage(img, 0, 0);
          
          // Desenhar a forma atual
          contextRef.current.beginPath();
          
          if (activeTool === 'rectangle') {
            const width = x - startPointRef.current!.x;
            const height = y - startPointRef.current!.y;
            contextRef.current.rect(startPointRef.current!.x, startPointRef.current!.y, width, height);
          } else if (activeTool === 'circle') {
            const radius = Math.sqrt(
              Math.pow(x - startPointRef.current!.x, 2) + Math.pow(y - startPointRef.current!.y, 2)
            );
            contextRef.current.arc(startPointRef.current!.x, startPointRef.current!.y, radius, 0, 2 * Math.PI);
          } else if (activeTool === 'line') {
            contextRef.current.moveTo(startPointRef.current!.x, startPointRef.current!.y);
            contextRef.current.lineTo(x, y);
          }
          
          contextRef.current.stroke();
        };
      }
    }
  };
  
  // Finalizar o desenho
  const stopDrawing = () => {
    if (!isDrawing || !contextRef.current) {
      setIsDrawing(false);
      return;
    }
    
    contextRef.current.closePath();
    setIsDrawing(false);
    
    // Salvar o estado após desenhar
    saveCanvasState(activeTool);
  };
  
  // Adicionar texto ao canvas
  const addText = () => {
    if (!textInput || !textPosition || !contextRef.current) {
      setTextPosition(null);
      return;
    }
    
    const originalFont = contextRef.current.font;
    contextRef.current.font = `${Math.max(lineWidth * 5, 14)}px Arial`;
    contextRef.current.fillStyle = color;
    contextRef.current.fillText(textInput, textPosition.x, textPosition.y);
    contextRef.current.font = originalFont;
    
    // Salvar o estado após adicionar texto
    saveCanvasState('text');
    
    setTextInput('');
    setTextPosition(null);
  };
  
  // Cancelar a adição de texto
  const cancelTextInput = () => {
    setTextInput('');
    setTextPosition(null);
  };
  
  return (
    <div className="flex flex-col space-y-2">
      {/* Ferramentas de desenho */}
      <div className="flex flex-wrap gap-1 bg-fantasy-paper/80 p-1 rounded-md border border-fantasy-stone/20">
        <Button
          variant={activeTool === 'pencil' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'pencil' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('pencil')}
          title="Lápis"
        >
          <Pencil className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === 'eraser' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'eraser' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('eraser')}
          title="Borracha"
        >
          <Eraser className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === 'rectangle' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'rectangle' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('rectangle')}
          title="Retângulo"
        >
          <Square className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === 'circle' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'circle' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('circle')}
          title="Círculo"
        >
          <Circle className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === 'line' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'line' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('line')}
          title="Linha"
        >
          <StraightLine className="h-4 w-4" />
        </Button>
        
        <Button
          variant={activeTool === 'text' ? 'default' : 'outline'}
          size="icon"
          className={`h-8 w-8 ${activeTool === 'text' ? 'bg-fantasy-purple' : ''}`}
          onClick={() => setActiveTool('text')}
          title="Texto"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        <div className="h-8 border-l border-fantasy-stone/20 mx-1"></div>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Cor"
              style={{ backgroundColor: color }}
            >
              <Palette className="h-4 w-4 text-white drop-shadow-sm" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-fantasy-paper border-fantasy-stone/30 p-2">
            <div className="grid grid-cols-5 gap-2">
              {predefinedColors.map((c) => (
                <div
                  key={c}
                  className={`w-8 h-8 rounded-full cursor-pointer ${color === c ? 'ring-2 ring-fantasy-purple ring-offset-2' : ''}`}
                  style={{ backgroundColor: c }}
                  onClick={() => setColor(c)}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center space-x-2">
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <span className="text-sm text-fantasy-stone">{color}</span>
            </div>
          </PopoverContent>
        </Popover>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              title="Espessura"
            >
              <div className="w-4 h-4 flex items-center justify-center">
                <div 
                  className="rounded-full bg-fantasy-stone" 
                  style={{ width: `${Math.min(lineWidth, 4) * 2}px`, height: `${Math.min(lineWidth, 4) * 2}px` }}
                />
              </div>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 bg-fantasy-paper border-fantasy-stone/30 p-4">
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-fantasy-stone">Fino</span>
                <span className="text-sm text-fantasy-stone">Grosso</span>
              </div>
              <Slider
                value={[lineWidth]}
                min={1}
                max={20}
                step={1}
                onValueChange={(value) => setLineWidth(value[0])}
              />
              <div className="text-center text-sm text-fantasy-stone">
                Espessura: {lineWidth}px
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        <div className="h-8 border-l border-fantasy-stone/20 mx-1"></div>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleUndo}
          disabled={undoStack.length <= 1}
          title="Desfazer"
        >
          <Undo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={handleRedo}
          disabled={redoStack.length === 0}
          title="Refazer"
        >
          <Redo className="h-4 w-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30"
          onClick={handleClear}
          title="Limpar"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        
        {isGM && onSave && (
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30"
            onClick={handleSave}
            title="Salvar"
          >
            <Save className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Input de texto (aparece apenas quando a ferramenta de texto está ativa e o usuário clicou no canvas) */}
      {activeTool === 'text' && textPosition && (
        <div className="flex space-x-2 bg-fantasy-paper p-2 rounded-md border border-fantasy-stone/20">
          <input
            type="text"
            value={textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder="Digite o texto..."
            className="flex-1 px-2 py-1 rounded border border-fantasy-stone/30 bg-white/10 text-fantasy-stone"
            autoFocus
          />
          <Button size="sm" onClick={addText} disabled={!textInput.trim()}>
            Adicionar
          </Button>
          <Button size="sm" variant="outline" onClick={cancelTextInput}>
            Cancelar
          </Button>
        </div>
      )}
      
      {/* Canvas para desenho */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        className="cursor-crosshair"
      />
    </div>
  );
};

export default MapDrawingTools;