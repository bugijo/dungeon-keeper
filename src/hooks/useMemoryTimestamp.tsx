import { useState, useEffect, useRef } from 'react';
import { useAutoSave } from './useAutoSave';
import { supabase } from '@/integrations/supabase/client';

interface MemoryTimestampOptions {
  mapId: string;
  playerId: string;
  gridSize: { width: number; height: number };
  decayRate?: number; // Taxa base de desvanecimento (padrão: 1.0)
  checkInterval?: number; // Intervalo para verificar desvanecimento em ms (padrão: 60000 = 1min)
  offlineSupport?: boolean; // Suporte para modo offline
}

interface CellMemory {
  timestamp: number; // Momento em que a célula foi vista pela última vez
  detailLevel: number; // Nível de detalhe (0-100, onde 100 é detalhe completo)
  lightLevel: number; // Nível de iluminação quando a célula foi vista (0-100)
  visited: boolean; // Se a célula já foi visitada pelo jogador
}

interface MemoryGrid {
  cells: CellMemory[][];
  lastUpdate: number;
}

interface MemoryFactors {
  intelligence: number; // 0-100, afeta a qualidade inicial da memória
  wisdom: number; // 0-100, afeta a duração da memória
  perception: number; // 0-100, afeta a capacidade de ver detalhes em baixa luz
  modifiers: { // Modificadores adicionais
    race?: number; // Modificador racial
    class?: number; // Modificador de classe
    background?: number; // Modificador de background
    items?: number; // Modificador de itens equipados
    abilities?: number[]; // Modificadores de habilidades especiais
  };
}

/**
 * Hook para gerenciar o sistema de temporização de memória
 * Implementa o armazenamento de timestamps por célula e o algoritmo de desvanecimento progressivo
 */
export const useMemoryTimestamp = (options: MemoryTimestampOptions) => {
  const {
    mapId,
    playerId,
    gridSize,
    decayRate = 1.0,
    checkInterval = 60000,
    offlineSupport = true
  } = options;
  
  // Estado para a grade de memória
  const [memoryGrid, setMemoryGrid] = useState<MemoryGrid | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastProcessed, setLastProcessed] = useState<number>(Date.now());
  const [characterFactors, setCharacterFactors] = useState<MemoryFactors>({
    intelligence: 50,
    wisdom: 50,
    perception: 50,
    modifiers: {}
  });
  
  // Referência para o intervalo de verificação
  const checkIntervalRef = useRef<number | null>(null);
  
  // Hook para salvamento automático
  const { saveData, loadData } = useAutoSave({
    interval: 30000,
    offlineSupport: offlineSupport
  });
  
  // Inicializar a grade de memória
  useEffect(() => {
    initializeMemoryGrid();
    
    // Iniciar verificação periódica de desvanecimento
    if (checkIntervalRef.current) {
      window.clearInterval(checkIntervalRef.current);
    }
    
    checkIntervalRef.current = window.setInterval(() => {
      processMemoryDecay();
    }, checkInterval);
    
    // Carregar fatores do personagem
    loadCharacterFactors();
    
    return () => {
      if (checkIntervalRef.current) {
        window.clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [mapId, playerId, gridSize]);
  
  // Inicializar a grade de memória
  const initializeMemoryGrid = async () => {
    setIsLoading(true);
    
    try {
      // Tentar carregar dados existentes
      const savedData = await loadData('memory_grids', `${mapId}_${playerId}`);
      
      if (savedData) {
        setMemoryGrid(savedData);
      } else {
        // Criar nova grade se não existir dados salvos
        const newGrid: MemoryGrid = {
          cells: Array(gridSize.height).fill(null).map(() =>
            Array(gridSize.width).fill(null).map(() => ({
              timestamp: 0,
              detailLevel: 0,
              lightLevel: 0,
              visited: false
            }))
          ),
          lastUpdate: Date.now()
        };
        
        setMemoryGrid(newGrid);
        await saveMemoryGrid(newGrid);
      }
    } catch (error) {
      console.error('Erro ao inicializar grade de memória:', error);
      
      // Criar grade vazia em caso de erro
      const emptyGrid: MemoryGrid = {
        cells: Array(gridSize.height).fill(null).map(() =>
          Array(gridSize.width).fill(null).map(() => ({
            timestamp: 0,
            detailLevel: 0,
            lightLevel: 0,
            visited: false
          }))
        ),
        lastUpdate: Date.now()
      };
      
      setMemoryGrid(emptyGrid);
    }
    
    setIsLoading(false);
  };
  
  // Carregar fatores do personagem
  const loadCharacterFactors = async () => {
    try {
      // Carregar dados do personagem do Supabase
      const { data, error } = await supabase
        .from('characters')
        .select('attributes, race, class, background, items, abilities')
        .eq('id', playerId)
        .single();
      
      if (error) throw error;
      
      if (data) {
        // Calcular fatores com base nos atributos do personagem
        const factors: MemoryFactors = {
          intelligence: data.attributes?.intelligence || 50,
          wisdom: data.attributes?.wisdom || 50,
          perception: data.attributes?.perception || 50,
          modifiers: {
            race: getRaceModifier(data.race),
            class: getClassModifier(data.class),
            background: getBackgroundModifier(data.background),
            items: calculateItemsModifier(data.items),
            abilities: calculateAbilitiesModifiers(data.abilities)
          }
        };
        
        setCharacterFactors(factors);
      }
    } catch (error) {
      console.error('Erro ao carregar fatores do personagem:', error);
    }
  };
  
  // Salvar a grade de memória
  const saveMemoryGrid = async (grid: MemoryGrid = memoryGrid!) => {
    if (!grid) return;
    
    try {
      await saveData('memory_grids', {
        id: `${mapId}_${playerId}`,
        data: grid
      });
    } catch (error) {
      console.error('Erro ao salvar grade de memória:', error);
    }
  };
  
  // Processar o desvanecimento da memória
  const processMemoryDecay = () => {
    if (!memoryGrid) return;
    
    const now = Date.now();
    const timeSinceLastProcess = now - lastProcessed;
    
    // Calcular taxa de desvanecimento ajustada pelos fatores do personagem
    const adjustedDecayRate = calculateAdjustedDecayRate();
    
    // Criar cópia da grade para modificação
    const updatedGrid: MemoryGrid = {
      cells: JSON.parse(JSON.stringify(memoryGrid.cells)),
      lastUpdate: now
    };
    
    // Processar cada célula
    for (let y = 0; y < gridSize.height; y++) {
      for (let x = 0; x < gridSize.width; x++) {
        const cell = updatedGrid.cells[y][x];
        
        // Pular células não visitadas
        if (!cell.visited) continue;
        
        // Calcular tempo desde a última visualização
        const timeSinceLastView = now - cell.timestamp;
        
        // Aplicar desvanecimento apenas se a célula já foi vista
        if (cell.timestamp > 0 && cell.detailLevel > 0) {
          // Fórmula de desvanecimento não-linear
          // Células com maior iluminação duram mais tempo na memória
          const lightFactor = 0.5 + (cell.lightLevel / 200); // 0.5 a 1.0
          
          // Calcular novo nível de detalhe
          // Fórmula: detailLevel * e^(-adjustedDecayRate * timeSinceLastView * lightFactor)
          const decayAmount = Math.exp(
            -adjustedDecayRate * (timeSinceLastView / 3600000) * lightFactor
          );
          
          // Atualizar nível de detalhe
          cell.detailLevel = Math.max(0, Math.floor(cell.detailLevel * decayAmount));
        }
      }
    }
    
    // Atualizar estado
    setMemoryGrid(updatedGrid);
    setLastProcessed(now);
    
    // Salvar grade atualizada
    saveMemoryGrid(updatedGrid);
  };
  
  // Calcular taxa de desvanecimento ajustada pelos fatores do personagem
  const calculateAdjustedDecayRate = (): number => {
    // Base: decayRate definido nas opções
    let rate = decayRate;
    
    // Ajustar com base na sabedoria (maior sabedoria = menor taxa de desvanecimento)
    const wisdomFactor = 1 - (characterFactors.wisdom / 200); // 0.5 a 1.0
    rate *= wisdomFactor;
    
    // Aplicar modificadores
    const modifiers = characterFactors.modifiers;
    if (modifiers.race) rate *= (1 - modifiers.race / 100);
    if (modifiers.class) rate *= (1 - modifiers.class / 100);
    if (modifiers.background) rate *= (1 - modifiers.background / 100);
    if (modifiers.items) rate *= (1 - modifiers.items / 100);
    
    // Aplicar habilidades especiais
    if (modifiers.abilities && modifiers.abilities.length > 0) {
      modifiers.abilities.forEach(mod => {
        rate *= (1 - mod / 100);
      });
    }
    
    // Garantir que a taxa não seja negativa ou muito baixa
    return Math.max(0.01, rate);
  };
  
  // Atualizar a memória de uma célula
  const updateCellMemory = (x: number, y: number, lightLevel: number) => {
    if (!memoryGrid || x < 0 || y < 0 || x >= gridSize.width || y >= gridSize.height) return;
    
    // Criar cópia da grade para modificação
    const updatedGrid: MemoryGrid = {
      cells: JSON.parse(JSON.stringify(memoryGrid.cells)),
      lastUpdate: Date.now()
    };
    
    // Calcular nível de detalhe inicial com base na inteligência e percepção
    const intelligenceFactor = 0.5 + (characterFactors.intelligence / 200); // 0.5 a 1.0
    const perceptionFactor = 0.5 + (characterFactors.perception / 200); // 0.5 a 1.0
    
    // Ajustar nível de detalhe com base na iluminação e fatores do personagem
    // Fórmula: base + (lightLevel * perceptionFactor * intelligenceFactor)
    const baseDetailLevel = 50; // Nível base de detalhe
    const lightAdjustedDetail = lightLevel * perceptionFactor;
    const finalDetailLevel = Math.min(100, Math.floor(
      baseDetailLevel + (lightAdjustedDetail * intelligenceFactor)
    ));
    
    // Atualizar célula
    updatedGrid.cells[y][x] = {
      timestamp: Date.now(),
      detailLevel: finalDetailLevel,
      lightLevel: lightLevel,
      visited: true
    };
    
    // Atualizar estado
    setMemoryGrid(updatedGrid);
    
    // Salvar grade atualizada (com debounce para evitar muitas chamadas)
    saveMemoryGrid(updatedGrid);
  };
  
  // Obter o nível de detalhe atual de uma célula
  const getCellDetailLevel = (x: number, y: number): number => {
    if (!memoryGrid || x < 0 || y < 0 || x >= gridSize.width || y >= gridSize.height) return 0;
    return memoryGrid.cells[y][x].detailLevel;
  };
  
  // Verificar se uma célula já foi visitada
  const isCellVisited = (x: number, y: number): boolean => {
    if (!memoryGrid || x < 0 || y < 0 || x >= gridSize.width || y >= gridSize.height) return false;
    return memoryGrid.cells[y][x].visited;
  };
  
  // Utilitários para calcular modificadores
  const getRaceModifier = (race: string): number => {
    // Valores de exemplo para diferentes raças
    const raceModifiers: Record<string, number> = {
      'elf': 10, // Elfos têm melhor memória
      'dwarf': 5, // Anões têm boa memória para estruturas
      'human': 0, // Humanos são a base de comparação
      'halfling': 3, // Halflings têm boa percepção
      'gnome': 8, // Gnomos têm boa memória para detalhes
      'half-orc': -5, // Half-orcs têm memória um pouco pior
      'tiefling': 2, // Tieflings têm memória ligeiramente melhor
      'dragonborn': 0 // Dragonborn são neutros
    };
    
    return raceModifiers[race] || 0;
  };
  
  const getClassModifier = (characterClass: string): number => {
    // Valores de exemplo para diferentes classes
    const classModifiers: Record<string, number> = {
      'wizard': 15, // Magos têm excelente memória
      'rogue': 10, // Ladinos têm boa memória para detalhes
      'ranger': 8, // Rangers têm boa memória para terrenos
      'fighter': 0, // Guerreiros são a base de comparação
      'barbarian': -5, // Bárbaros têm memória um pouco pior
      'cleric': 5, // Clérigos têm boa memória
      'druid': 7, // Druidas têm boa memória para ambientes naturais
      'bard': 12, // Bardos têm excelente memória para histórias e detalhes
      'monk': 10, // Monges têm boa memória devido à meditação
      'paladin': 3, // Paladinos têm memória ligeiramente melhor
      'sorcerer': 5, // Feiticeiros têm memória razoável
      'warlock': 7 // Bruxos têm boa memória devido aos pactos
    };
    
    return classModifiers[characterClass] || 0;
  };
  
  const getBackgroundModifier = (background: string): number => {
    // Valores de exemplo para diferentes backgrounds
    const backgroundModifiers: Record<string, number> = {
      'sage': 15, // Sábios têm excelente memória
      'scholar': 12, // Estudiosos têm muito boa memória
      'criminal': 5, // Criminosos têm boa memória para detalhes
      'soldier': 0, // Soldados são a base de comparação
      'outlander': -3, // Forasteiros têm memória um pouco pior para ambientes urbanos
      'noble': 3, // Nobres têm memória ligeiramente melhor
      'acolyte': 7, // Acólitos têm boa memória para textos
      'guild_artisan': 5, // Artesãos têm boa memória para detalhes
      'hermit': 10, // Eremitas têm boa memória devido à contemplação
      'sailor': 2, // Marinheiros têm memória ligeiramente melhor
      'urchin': 3, // Órfãos têm memória ligeiramente melhor para sobrevivência
      'entertainer': 8 // Artistas têm boa memória para performances
    };
    
    return backgroundModifiers[background] || 0;
  };
  
  const calculateItemsModifier = (items: any[]): number => {
    if (!items || !Array.isArray(items)) return 0;
    
    // Calcular modificador com base nos itens equipados
    let totalModifier = 0;
    
    items.forEach(item => {
      // Verificar se o item afeta a memória
      if (item.effects?.memory) {
        totalModifier += item.effects.memory;
      }
    });
    
    return totalModifier;
  };
  
  const calculateAbilitiesModifiers = (abilities: any[]): number[] => {
    if (!abilities || !Array.isArray(abilities)) return [];
    
    // Filtrar apenas habilidades que afetam a memória
    return abilities
      .filter(ability => ability.effects?.memory)
      .map(ability => ability.effects.memory);
  };
  
  return {
    memoryGrid,
    isLoading,
    updateCellMemory,
    getCellDetailLevel,
    isCellVisited,
    processMemoryDecay,
    characterFactors,
    setCharacterFactors
  };
};