
import React, { useState } from 'react';
import { PlusCircle, Trash2, ArrowUpCircle, ArrowDownCircle, Skull, Heart, Shield, Sword } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';

type Combatant = {
  id: string;
  name: string;
  initiative: number;
  hp: {
    current: number;
    max: number;
  };
  ac: number;
  type: 'player' | 'enemy';
  active: boolean;
  conditions: string[];
};

export function CombatTracker() {
  const [combatants, setCombatants] = useState<Combatant[]>([]);
  const [newCombatant, setNewCombatant] = useState({
    name: '',
    initiative: 0,
    hp: 10,
    ac: 10,
    type: 'enemy' as 'player' | 'enemy'
  });
  const [round, setRound] = useState(1);
  const [isCombatActive, setIsCombatActive] = useState(false);
  const [currentTurn, setCurrentTurn] = useState(0);

  const addCombatant = () => {
    if (newCombatant.name.trim() === '') return;
    
    const combatant: Combatant = {
      id: Date.now().toString(),
      name: newCombatant.name,
      initiative: newCombatant.initiative,
      hp: {
        current: newCombatant.hp,
        max: newCombatant.hp
      },
      ac: newCombatant.ac,
      type: newCombatant.type,
      active: false,
      conditions: []
    };
    
    setCombatants(prev => [...prev, combatant].sort((a, b) => b.initiative - a.initiative));
    setNewCombatant({
      name: '',
      initiative: 0,
      hp: 10,
      ac: 10,
      type: 'enemy'
    });
  };

  const removeCombatant = (id: string) => {
    setCombatants(prev => prev.filter(c => c.id !== id));
    if (isCombatActive) {
      // Ajustar o turno atual se necessário
      if (combatants.findIndex(c => c.id === id) < currentTurn) {
        setCurrentTurn(prev => Math.max(0, prev - 1));
      }
    }
  };

  const startCombat = () => {
    if (combatants.length === 0) return;
    
    setCombatants(prev => {
      const sorted = [...prev].sort((a, b) => b.initiative - a.initiative);
      sorted[0].active = true;
      return sorted;
    });
    
    setIsCombatActive(true);
    setCurrentTurn(0);
    setRound(1);
  };

  const endCombat = () => {
    setCombatants(prev => prev.map(c => ({ ...c, active: false })));
    setIsCombatActive(false);
    setCurrentTurn(0);
    setRound(1);
  };

  const nextTurn = () => {
    setCombatants(prev => {
      const newCombatants = [...prev];
      // Desativar o combatente atual
      newCombatants[currentTurn].active = false;
      
      // Avançar para o próximo turno
      const nextTurnIndex = (currentTurn + 1) % newCombatants.length;
      newCombatants[nextTurnIndex].active = true;
      
      // Se voltamos ao início da ordem, incrementar o round
      if (nextTurnIndex === 0) {
        setRound(r => r + 1);
      }
      
      setCurrentTurn(nextTurnIndex);
      return newCombatants;
    });
  };

  const updateHP = (id: string, amount: number) => {
    setCombatants(prev => 
      prev.map(c => 
        c.id === id 
          ? { 
              ...c, 
              hp: { 
                ...c.hp, 
                current: Math.max(0, Math.min(c.hp.current + amount, c.hp.max)) 
              } 
            }
          : c
      )
    );
  };

  const moveInitiative = (id: string, direction: 'up' | 'down') => {
    const index = combatants.findIndex(c => c.id === id);
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === combatants.length - 1) ||
      combatants.length <= 1
    ) {
      return;
    }
    
    const newCombatants = [...combatants];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Ajustar o turno atual se estiver manipulando os combatentes ativos
    if (isCombatActive) {
      if (index === currentTurn) {
        setCurrentTurn(swapIndex);
      } else if (swapIndex === currentTurn) {
        setCurrentTurn(index);
      }
    }
    
    // Trocar os valores de iniciativa
    [newCombatants[index].initiative, newCombatants[swapIndex].initiative] = 
      [newCombatants[swapIndex].initiative, newCombatants[index].initiative];
    
    // Reordenar o array
    setCombatants([...newCombatants].sort((a, b) => b.initiative - a.initiative));
  };

  return (
    <div className="fantasy-card p-4">
      <h2 className="text-xl font-medievalsharp text-fantasy-gold mb-4">Rastreador de Combate</h2>
      
      {/* Formulário para adicionar novo combatente */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Nome"
            value={newCombatant.name}
            onChange={(e) => setNewCombatant({ ...newCombatant, name: e.target.value })}
            className="bg-fantasy-dark/50 border-fantasy-purple/30"
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            placeholder="Init"
            value={newCombatant.initiative}
            onChange={(e) => setNewCombatant({ ...newCombatant, initiative: parseInt(e.target.value) || 0 })}
            className="bg-fantasy-dark/50 border-fantasy-purple/30"
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            placeholder="HP"
            value={newCombatant.hp}
            onChange={(e) => setNewCombatant({ ...newCombatant, hp: parseInt(e.target.value) || 0 })}
            className="bg-fantasy-dark/50 border-fantasy-purple/30"
          />
        </div>
        <div className="w-20">
          <Input
            type="number"
            placeholder="CA"
            value={newCombatant.ac}
            onChange={(e) => setNewCombatant({ ...newCombatant, ac: parseInt(e.target.value) || 0 })}
            className="bg-fantasy-dark/50 border-fantasy-purple/30"
          />
        </div>
        <div className="w-28">
          <select
            value={newCombatant.type}
            onChange={(e) => setNewCombatant({ ...newCombatant, type: e.target.value as 'player' | 'enemy' })}
            className="w-full h-10 bg-fantasy-dark/50 border-fantasy-purple/30 rounded-md px-3"
          >
            <option value="player">Jogador</option>
            <option value="enemy">Inimigo</option>
          </select>
        </div>
        <Button onClick={addCombatant} className="fantasy-button primary">
          <PlusCircle size={16} className="mr-1" /> Adicionar
        </Button>
      </div>
      
      {/* Controles de combate */}
      <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
        <div className="flex items-center gap-2">
          {!isCombatActive ? (
            <Button onClick={startCombat} className="fantasy-button primary" disabled={combatants.length === 0}>
              <Sword size={16} className="mr-1" /> Iniciar Combate
            </Button>
          ) : (
            <>
              <Button onClick={nextTurn} className="fantasy-button primary">
                Próximo Turno
              </Button>
              <Button onClick={endCombat} className="fantasy-button secondary">
                Encerrar Combate
              </Button>
            </>
          )}
        </div>
        
        {isCombatActive && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Round:</span>
              <span className="px-2 py-1 bg-fantasy-purple/20 rounded text-fantasy-gold font-medievalsharp">
                {round}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">Turno:</span>
              <span className="px-2 py-1 bg-fantasy-purple/20 rounded text-fantasy-gold font-medievalsharp">
                {combatants[currentTurn]?.name || '-'}
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de combatentes */}
      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {combatants.map((combatant) => (
            <div 
              key={combatant.id} 
              className={`p-3 rounded-md border ${
                combatant.active 
                  ? 'border-fantasy-gold bg-fantasy-dark/50' 
                  : 'border-fantasy-purple/30 bg-fantasy-dark/20'
              } transition-colors`}
            >
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`h-8 w-8 rounded-full flex items-center justify-center ${
                      combatant.type === 'player' 
                        ? 'bg-blue-500/20 text-blue-400' 
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {combatant.type === 'player' ? <Shield size={16} /> : <Skull size={16} />}
                    </span>
                    <div>
                      <div className="font-medium">{combatant.name}</div>
                      <div className="text-xs text-fantasy-stone">
                        Init: {combatant.initiative}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center justify-center w-16">
                    <div className="flex items-center gap-1 text-xs">
                      <Heart size={12} className="text-red-400" />
                      <span>{combatant.hp.current}/{combatant.hp.max}</span>
                    </div>
                    <div className="flex gap-1 mt-1">
                      <button 
                        onClick={() => updateHP(combatant.id, -1)}
                        className="h-6 w-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center"
                      >
                        -
                      </button>
                      <button 
                        onClick={() => updateHP(combatant.id, 1)}
                        className="h-6 w-6 rounded bg-green-500/20 text-green-400 flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center w-12">
                    <div className="flex items-center gap-1 text-xs">
                      <Shield size={12} className="text-blue-400" />
                      <span>{combatant.ac}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => moveInitiative(combatant.id, 'up')}
                      className="h-6 w-6 rounded bg-fantasy-dark/50 flex items-center justify-center"
                    >
                      <ArrowUpCircle size={14} />
                    </button>
                    <button 
                      onClick={() => moveInitiative(combatant.id, 'down')}
                      className="h-6 w-6 rounded bg-fantasy-dark/50 flex items-center justify-center"
                    >
                      <ArrowDownCircle size={14} />
                    </button>
                    <button 
                      onClick={() => removeCombatant(combatant.id)}
                      className="h-6 w-6 rounded bg-red-500/20 text-red-400 flex items-center justify-center"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Condições */}
              {combatant.conditions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {combatant.conditions.map((condition, index) => (
                    <span key={index} className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
                      {condition}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          {combatants.length === 0 && (
            <div className="text-center p-8 text-fantasy-stone/70">
              Adicione combatentes para iniciar o combate
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export default CombatTracker;
