
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dices, History, Trash2, Plus, Minus } from 'lucide-react';
import { toast } from 'sonner';
import DiceRoller from './DiceRoller';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DiceRollResult {
  type: DiceType;
  value: number;
  timestamp: Date;
  modifier?: number;
  total?: number;
}

interface EnhancedDiceRollerProps {
  onRollComplete?: (result: DiceRollResult) => void;
  compact?: boolean;
  showInChat?: boolean;
  className?: string;
}

const diceColors = {
  'd4': 'rgb(255, 87, 51)', // Vermelho
  'd6': 'rgb(76, 175, 80)', // Verde
  'd8': 'rgb(33, 150, 243)', // Azul
  'd10': 'rgb(156, 39, 176)', // Roxo
  'd12': 'rgb(255, 193, 7)', // Amarelo
  'd20': 'rgb(255, 152, 0)', // Laranja
  'd100': 'rgb(0, 188, 212)', // Ciano
};

const EnhancedDiceRoller: React.FC<EnhancedDiceRollerProps> = ({ 
  onRollComplete, 
  compact = false, 
  showInChat = false,
  className = ''
}) => {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [results, setResults] = useState<DiceRollResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [modifier, setModifier] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [rollValues, setRollValues] = useState<number[]>([]);
  
  const diceRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Efeito para salvar o histórico no localStorage
  useEffect(() => {
    const savedResults = localStorage.getItem('diceRollHistory');
    if (savedResults) {
      try {
        const parsed = JSON.parse(savedResults);
        // Converter strings de data de volta para objetos Date
        const resultsWithDates = parsed.map((result: any) => ({
          ...result,
          timestamp: new Date(result.timestamp)
        }));
        setResults(resultsWithDates);
      } catch (e) {
        console.error('Erro ao carregar histórico de dados:', e);
      }
    }
  }, []);

  // Salvar resultados no localStorage quando mudar
  useEffect(() => {
    if (results.length > 0) {
      localStorage.setItem('diceRollHistory', JSON.stringify(results));
    }
  }, [results]);

  const rollDice = (diceType: DiceType) => {
    setIsRolling(true);
    setSelectedDice(diceType);
    
    // Reproduzir som de rolagem (se disponível)
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error('Erro ao reproduzir áudio:', e));
    }
    
    // Simular rolagem com valores intermediários
    const maxValue = parseInt(diceType.substring(1));
    const rollDuration = 1000; // 1 segundo de animação
    const intervalTime = 50; // Atualizar a cada 50ms
    const iterations = rollDuration / intervalTime;
    let currentIteration = 0;
    
    // Gerar valores finais antecipadamente
    const finalValues: number[] = [];
    let total = 0;
    
    for (let i = 0; i < quantity; i++) {
      const value = Math.floor(Math.random() * maxValue) + 1;
      finalValues.push(value);
      total += value;
    }
    
    // Adicionar modificador ao total
    const finalTotal = total + modifier;
    
    // Iniciar animação
    const rollInterval = setInterval(() => {
      currentIteration++;
      
      // Gerar valores temporários para a animação
      const tempValues = finalValues.map((finalValue, index) => {
        if (currentIteration >= iterations) {
          return finalValue; // Mostrar valor final
        } else {
          // Valores aleatórios durante a animação
          return Math.floor(Math.random() * maxValue) + 1;
        }
      });
      
      setRollValues(tempValues);
      
      // Finalizar animação
      if (currentIteration >= iterations) {
        clearInterval(rollInterval);
        setIsRolling(false);
        
        // Criar resultado final
        const newRoll: DiceRollResult = {
          type: diceType,
          value: total,
          timestamp: new Date(),
          modifier: modifier,
          total: finalTotal
        };
        
        // Atualizar histórico
        setResults(prev => [newRoll, ...prev].slice(0, 20));
        
        // Notificar componente pai se necessário
        if (onRollComplete) {
          onRollComplete(newRoll);
        }
        
        // Mostrar toast com resultado
        if (!showInChat) {
          toast.success(
            <div className="flex flex-col items-center">
              <span className="text-lg font-bold">{finalTotal}</span>
              <span className="text-sm">
                {quantity > 1 ? `${quantity}${diceType} [${finalValues.join(', ')}]` : diceType}
                {modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}
              </span>
            </div>,
            { duration: 3000 }
          );
        }
      }
    }, intervalTime);
  };

  const clearHistory = () => {
    setResults([]);
    localStorage.removeItem('diceRollHistory');
    toast.info('Histórico de rolagens limpo');
  };

  const handleModifierChange = (delta: number) => {
    setModifier(prev => prev + delta);
  };

  const handleQuantityChange = (delta: number) => {
    setQuantity(prev => {
      const newValue = prev + delta;
      return newValue >= 1 && newValue <= 10 ? newValue : prev;
    });
  };

  // Se o modo compacto estiver ativado, retornar o componente DiceRoller original
  if (compact) {
    return (
      <div className={`dice-roller-compact ${className}`}>
        <DiceRoller />
      </div>
    );
  }

  return (
    <div className={`fantasy-card p-4 max-w-md mx-auto ${className}`}>
      <audio ref={audioRef} src="/assets/sounds/dice-roll.mp3" preload="auto" />
      
      <style jsx>{`
        .dice-container {
          perspective: 1000px;
        }
        
        .dice-face {
          width: 80px;
          height: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          background-color: ${diceColors[selectedDice]}20;
          color: ${diceColors[selectedDice]};
          border: 2px solid ${diceColors[selectedDice]};
        }
        
        .dice-value {
          font-size: 2.5rem;
          font-weight: bold;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }
        
        .dice-button {
          transition: all 0.2s ease;
        }
        
        .dice-button:hover {
          transform: translateY(-2px);
        }
        
        .dice-button:active {
          transform: translateY(1px);
        }
        
        .history-item {
          border-left: 3px solid ${diceColors[selectedDice]};
        }
        
        @keyframes dice-roll {
          0% { transform: scale(0.8) rotate(0deg); opacity: 0.5; }
          50% { transform: scale(1.2) rotate(180deg); opacity: 1; }
          100% { transform: scale(1) rotate(360deg); opacity: 1; }
        }
        
        .dice-rolling {
          animation: dice-roll 1s ease-out;
        }
      `}</style>
      
      <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-4 text-center">
        <Dices className="inline-block mr-2" />
        Rolador de Dados
      </h2>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map((dice) => (
          <button
            key={dice}
            onClick={() => rollDice(dice)}
            className={`p-2 rounded text-center dice-button ${isRolling ? 'opacity-50 cursor-not-allowed' : ''}`}
            style={{ 
              backgroundColor: `${diceColors[dice]}20`, 
              color: diceColors[dice],
              border: selectedDice === dice ? `1px solid ${diceColors[dice]}` : 'none'
            }}
            disabled={isRolling}
          >
            {dice}
          </button>
        ))}
      </div>
      
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <span className="text-fantasy-stone mr-2">Quantidade:</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => handleQuantityChange(-1)}
            disabled={quantity <= 1 || isRolling}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="mx-2 text-fantasy-gold">{quantity}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => handleQuantityChange(1)}
            disabled={quantity >= 10 || isRolling}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center">
          <span className="text-fantasy-stone mr-2">Modificador:</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => handleModifierChange(-1)}
            disabled={isRolling}
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="mx-2 text-fantasy-gold">{modifier >= 0 ? `+${modifier}` : modifier}</span>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-6 w-6" 
            onClick={() => handleModifierChange(1)}
            disabled={isRolling}
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>
      
      <div className="dice-container mb-6" ref={diceRef}>
        <div className={`flex flex-wrap justify-center gap-2 ${isRolling ? 'dice-rolling' : ''}`}>
          {rollValues.length > 0 ? (
            rollValues.map((value, index) => (
              <div key={index} className="dice-face">
                <span className="dice-value">{value}</span>
              </div>
            ))
          ) : (
            <div className="dice-face">
              <span className="dice-value">?</span>
            </div>
          )}
        </div>
        
        {results.length > 0 && (
          <div className="text-center mt-4">
            <div className="text-2xl font-medievalsharp text-fantasy-gold">
              {results[0].total}
            </div>
            <p className="text-fantasy-stone">
              {quantity > 1 ? `${quantity}${selectedDice}` : selectedDice}
              {modifier !== 0 ? ` ${modifier > 0 ? '+' : ''}${modifier}` : ''}
            </p>
          </div>
        )}
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medievalsharp text-fantasy-gold flex items-center">
          <History className="inline-block mr-2" size={16} />
          Histórico
        </h3>
        <div className="space-x-2">
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            variant="outline" 
            className="text-xs"
          >
            {showHistory ? 'Ocultar' : 'Mostrar'}
          </Button>
          {results.length > 0 && (
            <Button 
              onClick={clearHistory} 
              variant="destructive" 
              className="text-xs"
            >
              <Trash2 size={14} />
            </Button>
          )}
        </div>
      </div>
      
      {showHistory && (
        <div className="bg-fantasy-dark/30 rounded-lg p-2 max-h-40 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((result, index) => (
                <li 
                  key={index} 
                  className="history-item pl-2 py-1 text-sm flex justify-between"
                  style={{ borderLeftColor: diceColors[result.type] }}
                >
                  <span>
                    <span className="font-bold">{result.total}</span>
                    <span className="text-fantasy-stone ml-1">
                      {result.type}
                      {result.modifier !== 0 ? ` ${result.modifier > 0 ? '+' : ''}${result.modifier}` : ''}
                    </span>
                  </span>
                  <span className="text-xs text-fantasy-stone">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-fantasy-stone text-sm py-2">
              Nenhuma rolagem ainda
            </p>
          )}
        </div>
      )}
      
      <div className="mt-4">
        <Button 
          onClick={() => rollDice(selectedDice)} 
          className="w-full bg-fantasy-purple hover:bg-fantasy-purple/80"
          disabled={isRolling}
        >
          {isRolling ? 'Rolando...' : 'Rolar Dados'}
        </Button>
      </div>
    </div>
  );
};

export default EnhancedDiceRoller;
