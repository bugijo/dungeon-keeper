/**
 * Sistema de memória de áreas reveladas
 * Permite que jogadores se lembrem de áreas já visitadas, mesmo quando não estão mais visíveis
 */
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Brain, Trash2, Save, Eye, EyeOff } from 'lucide-react';
import { RevealedArea, Point } from '@/utils/fogOfWarUtils';

interface RevealedAreaMemorySystemProps {
  mapId: string;
  userId: string;
  gameId?: string;
  isGameMaster?: boolean;
  currentVisibleAreas: RevealedArea[];
  onMemoryUpdate?: (memoryAreas: RevealedArea[]) => void;
}

const RevealedAreaMemorySystem: React.FC<RevealedAreaMemorySystemProps> = ({
  mapId,
  userId,
  gameId,
  isGameMaster = false,
  currentVisibleAreas,
  onMemoryUpdate
}) => {
  const [memoryEnabled, setMemoryEnabled] = useState(true);
  const [memoryOpacity, setMemoryOpacity] = useState(0.4);
  const [memoryColor, setMemoryColor] = useState('rgba(100, 100, 255, 0.4)');
  const [memoryAreas, setMemoryAreas] = useState<RevealedArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [autoMemory, setAutoMemory] = useState(true);
  const [lastMemorySave, setLastMemorySave] = useState<Date | null>(null);

  // Carregar áreas de memória do jogador
  const loadMemoryAreas = useCallback(async () => {
    if (!mapId || !userId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('player_memory_areas')
        .select('*')
        .eq('map_id', mapId)
        .eq('player_id', userId);

      if (error) throw error;

      // Formatar áreas para o formato correto
      const formattedAreas = (data || []).map(area => ({
        ...area,
        opacity: memoryOpacity,
        color: memoryColor,
        is_memory: true
      }));

      setMemoryAreas(formattedAreas);
      
      if (onMemoryUpdate) {
        onMemoryUpdate(formattedAreas);
      }
    } catch (err) {
      console.error('Erro ao carregar áreas de memória:', err);
    } finally {
      setIsLoading(false);
    }
  }, [mapId, userId, memoryOpacity, memoryColor, onMemoryUpdate]);

  // Salvar áreas atuais na memória
  const saveToMemory = async () => {
    if (!mapId || !userId || currentVisibleAreas.length === 0) return;

    setIsLoading(true);
    try {
      // Filtrar áreas já existentes na memória para evitar duplicatas
      const newMemoryAreas = currentVisibleAreas.filter(visibleArea => {
        // Verificar se esta área já existe na memória (aproximadamente)
        return !memoryAreas.some(
          memory => 
            Math.abs(memory.x - visibleArea.x) < 10 &&
            Math.abs(memory.y - visibleArea.y) < 10 &&
            Math.abs(memory.radius - visibleArea.radius) < 10
        );
      });

      if (newMemoryAreas.length === 0) {
        setLastMemorySave(new Date());
        return; // Nada novo para salvar
      }

      // Preparar áreas para salvar
      const areasToSave = newMemoryAreas.map(area => ({
        ...area,
        id: `memory-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        map_id: mapId,
        player_id: userId,
        game_id: gameId,
        is_memory: true,
        is_dynamic: false,
        opacity: memoryOpacity,
        color: memoryColor,
        created_at: new Date().toISOString()
      }));

      // Salvar no banco de dados
      const { error } = await supabase
        .from('player_memory_areas')
        .insert(areasToSave);

      if (error) throw error;

      // Atualizar estado local
      const updatedMemoryAreas = [...memoryAreas, ...areasToSave];
      setMemoryAreas(updatedMemoryAreas);
      setLastMemorySave(new Date());
      
      if (onMemoryUpdate) {
        onMemoryUpdate(updatedMemoryAreas);
      }
    } catch (err) {
      console.error('Erro ao salvar áreas na memória:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Limpar memória do jogador
  const clearMemory = async () => {
    if (!mapId || !userId) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('player_memory_areas')
        .delete()
        .eq('map_id', mapId)
        .eq('player_id', userId);

      if (error) throw error;

      setMemoryAreas([]);
      
      if (onMemoryUpdate) {
        onMemoryUpdate([]);
      }
    } catch (err) {
      console.error('Erro ao limpar memória:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carregar áreas de memória ao inicializar
  useEffect(() => {
    loadMemoryAreas();
  }, [loadMemoryAreas]);

  // Salvar automaticamente na memória quando houver novas áreas visíveis
  useEffect(() => {
    if (!autoMemory || !memoryEnabled || !currentVisibleAreas.length) return;

    // Verificar se passou tempo suficiente desde o último salvamento (5 segundos)
    const shouldSave = !lastMemorySave || (new Date().getTime() - lastMemorySave.getTime() > 5000);
    
    if (shouldSave) {
      saveToMemory();
    }
  }, [currentVisibleAreas, autoMemory, memoryEnabled, lastMemorySave]);

  // Atualizar opacidade e cor das áreas de memória quando essas configurações mudarem
  useEffect(() => {
    if (memoryAreas.length === 0) return;
    
    const updatedAreas = memoryAreas.map(area => ({
      ...area,
      opacity: memoryOpacity,
      color: memoryColor
    }));
    
    setMemoryAreas(updatedAreas);
    
    if (onMemoryUpdate) {
      onMemoryUpdate(updatedAreas);
    }
  }, [memoryOpacity, memoryColor, onMemoryUpdate]);

  return (
    <Card className="w-full bg-fantasy-dark/90 border-fantasy-gold/30 text-fantasy-stone">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Brain size={16} className="text-fantasy-gold" />
          Sistema de Memória
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3 pb-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="memory-enabled" className="text-xs">
            Memória Ativada
          </Label>
          <Switch
            id="memory-enabled"
            checked={memoryEnabled}
            onCheckedChange={setMemoryEnabled}
            className="data-[state=checked]:bg-fantasy-gold"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-memory" className="text-xs">
            Salvar Automaticamente
          </Label>
          <Switch
            id="auto-memory"
            checked={autoMemory}
            onCheckedChange={setAutoMemory}
            className="data-[state=checked]:bg-fantasy-gold"
          />
        </div>
        
        <div className="space-y-1">
          <Label htmlFor="memory-opacity" className="text-xs">
            Opacidade da Memória: {Math.round(memoryOpacity * 100)}%
          </Label>
          <Slider
            id="memory-opacity"
            min={0.1}
            max={0.8}
            step={0.05}
            value={[memoryOpacity]}
            onValueChange={(value) => setMemoryOpacity(value[0])}
            className="py-1"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="memory-color" className="text-xs">
            Cor da Memória
          </Label>
          <input
            id="memory-color"
            type="color"
            value={memoryColor.replace(/[^#\w]/g, '').replace('rgba', '#')}
            onChange={(e) => {
              const hex = e.target.value;
              setMemoryColor(`rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${memoryOpacity})`);
            }}
            className="w-8 h-8 rounded border-none bg-transparent"
          />
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-0">
        <Button
          variant="outline"
          size="sm"
          onClick={saveToMemory}
          disabled={isLoading || currentVisibleAreas.length === 0}
          className="text-xs h-8 border-fantasy-gold/30 hover:bg-fantasy-gold/20 hover:text-fantasy-stone"
        >
          <Save size={14} className="mr-1" />
          Salvar Atual
        </Button>
        
        <Button
          variant="destructive"
          size="sm"
          onClick={clearMemory}
          disabled={isLoading || memoryAreas.length === 0}
          className="text-xs h-8"
        >
          <Trash2 size={14} className="mr-1" />
          Limpar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RevealedAreaMemorySystem;