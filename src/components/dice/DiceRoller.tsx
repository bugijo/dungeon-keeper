
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dices } from 'lucide-react';
import { toast } from 'sonner';
import { DiceRollService } from '@/services/diceRollService';
import { DiceRoll } from '@/types/game';

type DiceType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

interface DiceRollResult {
  type: DiceType;
  value: number;
  timestamp: Date;
}

export default function DiceRoller() {
  const [selectedDice, setSelectedDice] = useState<DiceType>('d20');
  const [results, setResults] = useState<DiceRollResult[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Jogador');
  const [characterName, setCharacterName] = useState<string | undefined>(undefined);

  const rollDice = (diceType: DiceType) => {
    const maxValue = parseInt(diceType.substring(1));
    const result = Math.floor(Math.random() * maxValue) + 1;
    
    const newRoll: DiceRollResult = {
      type: diceType,
      value: result,
      timestamp: new Date()
    };
    
    setResults(prev => [newRoll, ...prev].slice(0, 10));
    setSelectedDice(diceType);
    
    // Show result animation
    const diceElement = document.getElementById('dice-result');
    if (diceElement) {
      diceElement.classList.add('dice-rolled');
      setTimeout(() => {
        diceElement?.classList.remove('dice-rolled');
      }, 500);
    }
  };

  const clearHistory = () => {
    setResults([]);
  };

  useEffect(() => {
    // Buscar sessionId e userId do contexto ou URL se necessário
    // Aqui está um exemplo simplificado, adapte conforme seu contexto real
    const urlParams = new URLSearchParams(window.location.search);
    setSessionId(urlParams.get('sessionId'));
    setUserId(urlParams.get('userId'));
    
    // Aqui você poderia buscar o nome do usuário e do personagem de algum contexto
    // Por exemplo, de um contexto de autenticação ou de personagem
    
    if (!sessionId) return;
    
    // Carregar histórico de rolagens
    const loadDiceRolls = async () => {
      try {
        const diceRolls = await DiceRollService.getSessionDiceRolls(sessionId);
        // Converter para o formato esperado pelo componente
        const formattedRolls = diceRolls.map(roll => ({
          type: roll.dice_type as DiceType,
          value: roll.result,
          timestamp: new Date(roll.created_at)
        }));
        setResults(formattedRolls.slice(0, 10));
      } catch (error) {
        console.error('Erro ao carregar histórico de rolagens:', error);
      }
    };
    
    loadDiceRolls();
    
    // Realtime: ouvir novas rolagens usando o serviço
    const subscription = DiceRollService.subscribeToSessionDiceRolls(sessionId, (roll: DiceRoll) => {
      // Apenas adicionar ao histórico se não for do usuário atual
      if (roll.user_id !== userId) {
        setResults(prev => [{
          type: roll.dice_type as DiceType,
          value: roll.result,
          timestamp: new Date(roll.created_at)
        }, ...prev].slice(0, 10));
        toast.success(`🎲 ${roll.user_name || 'Jogador'} rolou ${roll.dice_type}: ${roll.result}`);
      }
    });
    
    return () => { subscription.unsubscribe(); }
  }, [sessionId]);

  return (
    <div className="fantasy-card p-4 max-w-md mx-auto">
      <style>
        {`
          .dice-rolled {
            animation: dice-roll 0.5s ease-out;
          }
          
          @keyframes dice-roll {
            0% { transform: scale(0.8); opacity: 0.5; }
            50% { transform: scale(1.2); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
      
      <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-4 text-center">
        <Dices className="inline-block mr-2" />
        Rolador de Dados
      </h2>
      
      <div className="grid grid-cols-7 gap-2 mb-4">
        {(['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'] as DiceType[]).map((dice) => (
          <button
            key={dice}
            onClick={() => rollDice(dice)}
            className={`p-2 rounded text-center ${
              selectedDice === dice
                ? 'bg-fantasy-purple text-white'
                : 'bg-fantasy-dark text-fantasy-stone hover:bg-fantasy-purple/20'
            }`}
          >
            {dice}
          </button>
        ))}
      </div>
      
      <div id="dice-result" className="text-center py-8 px-4 bg-fantasy-dark/50 rounded-lg mb-4">
        <span className="text-4xl font-medievalsharp text-fantasy-gold">
          {results.length > 0 ? results[0].value : '?'}
        </span>
        <p className="text-fantasy-stone mt-2">
          {results.length > 0 ? `${selectedDice} rolado` : 'Escolha um dado'}
        </p>
      </div>
      
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medievalsharp text-fantasy-gold">
          Histórico
        </h3>
        <div className="space-x-2">
          <Button 
            onClick={() => setShowHistory(!showHistory)} 
            variant="outline" 
            className="text-xs"
          >
            {showHistory ? 'Esconder' : 'Mostrar'}
          </Button>
          {results.length > 0 && (
            <Button 
              onClick={clearHistory} 
              variant="destructive" 
              className="text-xs"
            >
              Limpar
            </Button>
          )}
        </div>
      </div>
      
      {showHistory && (
        <div className="bg-fantasy-dark/30 rounded-lg p-2 max-h-40 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="space-y-1">
              {results.map((result, index) => (
                <li key={index} className="text-sm flex justify-between">
                  <span>{result.type}: <strong>{result.value}</strong></span>
                  <span className="text-fantasy-stone/70">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-fantasy-stone/70 py-2">
              Sem registros
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const rollDice = async (diceType: DiceType) => {
  const maxValue = parseInt(diceType.substring(1));
  const result = Math.floor(Math.random() * maxValue) + 1;
  const newRoll: DiceRollResult = {
    type: diceType,
    value: result,
    timestamp: new Date()
  };
  setResults(prev => [newRoll, ...prev].slice(0, 10));
  setSelectedDice(diceType);
  
  // Persistir usando o serviço
  if (sessionId && userId) {
    try {
      await DiceRollService.saveDiceRoll({
        session_id: sessionId,
        user_id: userId,
        dice_type: diceType,
        result: result,
        user_name: userName,
        character_name: characterName
      });
    } catch (error) {
      console.error('Erro ao salvar rolagem de dados:', error);
    }
  }
  
  // Toast local (fallback)
  toast.success(`🎲 Você rolou ${diceType}: ${result}`);
  
  // Animação
  const diceElement = document.getElementById('dice-result');
  if (diceElement) {
    diceElement.classList.add('dice-rolled');
    setTimeout(() => {
      diceElement?.classList.remove('dice-rolled');
    }, 500);
  }
};
