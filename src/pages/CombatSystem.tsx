import React, { useState, useEffect } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { CombatTracker } from '@/components/game/CombatTracker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Play, Pause, RotateCcw, Dice1 } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  initiative: number;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  conditions: string[];
}

const CombatSystem = () => {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [newCharacterName, setNewCharacterName] = useState('');
  const [newCharacterAC, setNewCharacterAC] = useState('');
  const [newCharacterHP, setNewCharacterHP] = useState('');
  const [combatLog, setCombatLog] = useState<string[]>([]);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [isCombatActive, setIsCombatActive] = useState(false);

  useEffect(() => {
    if (isCombatActive && characters.length > 0) {
      const sortedCharacters = [...characters].sort((a, b) => b.initiative - a.initiative);
      setCharacters(sortedCharacters);
    }
  }, [isCombatActive, characters]);

  const addCharacter = () => {
    if (!newCharacterName || !newCharacterAC || !newCharacterHP) {
      alert('Please fill in all character details.');
      return;
    }

    const newCharacter: Character = {
      id: Date.now().toString(),
      name: newCharacterName,
      initiative: 0,
      armorClass: parseInt(newCharacterAC),
      hitPoints: parseInt(newCharacterHP),
      maxHitPoints: parseInt(newCharacterHP),
      conditions: []
    };

    setCharacters([...characters, newCharacter]);
    setNewCharacterName('');
    setNewCharacterAC('');
    setNewCharacterHP('');
  };

  const removeCharacter = (id: string) => {
    setCharacters(characters.filter(character => character.id !== id));
  };

  const rollInitiative = (id: string) => {
    const roll = Math.floor(Math.random() * 20) + 1;
    setCharacters(characters.map(character =>
      character.id === id ? { ...character, initiative: roll } : character
    ));
    setCombatLog([...combatLog, `${characters.find(c => c.id === id)?.name} rolled ${roll} for initiative.`]);
  };

  const startCombat = () => {
    if (characters.some(character => character.initiative === 0)) {
      alert('Please roll initiative for all characters before starting combat.');
      return;
    }
    setIsCombatActive(true);
  };

  const nextTurn = () => {
    setCurrentTurnIndex((currentTurnIndex + 1) % characters.length);
  };

  const endCombat = () => {
    setIsCombatActive(false);
    setCurrentTurnIndex(0);
    setCharacters(characters.map(character => ({ ...character, initiative: 0 })));
  };

  const resetCombat = () => {
    setIsCombatActive(false);
    setCurrentTurnIndex(0);
    setCharacters([]);
    setCombatLog([]);
  };

  return (
    <MainLayout>
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-white">Combat Tracker</h1>

        <div className="mb-4 p-4 border rounded shadow-md bg-gray-800">
          <h2 className="text-lg font-semibold mb-2 text-gray-100">Add New Character</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-gray-200">Name</Label>
              <Input
                type="text"
                id="name"
                value={newCharacterName}
                onChange={(e) => setNewCharacterName(e.target.value)}
                className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="ac" className="block text-sm font-medium text-gray-200">Armor Class</Label>
              <Input
                type="number"
                id="ac"
                value={newCharacterAC}
                onChange={(e) => setNewCharacterAC(e.target.value)}
                className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50"
              />
            </div>
            <div>
              <Label htmlFor="hp" className="block text-sm font-medium text-gray-200">Hit Points</Label>
              <Input
                type="number"
                id="hp"
                value={newCharacterHP}
                onChange={(e) => setNewCharacterHP(e.target.value)}
                className="mt-1 p-2 w-full rounded-md shadow-sm focus:ring focus:ring-opacity-50"
              />
            </div>
          </div>
          <Button onClick={addCharacter} className="mt-4 primary">
            <Plus className="mr-2 h-4 w-4" />
            Add Character
          </Button>
        </div>

        {characters.length > 0 && (
          <div className="mb-4 p-4 border rounded shadow-md bg-gray-800">
            <h2 className="text-lg font-semibold mb-2 text-gray-100">Combatants</h2>
            <CombatTracker />
          </div>
        )}

        {characters.length > 0 && (
          <div className="mb-4 p-4 border rounded shadow-md bg-gray-800">
            <h2 className="text-lg font-semibold mb-2 text-gray-100">Combat Controls</h2>
            <div className="flex gap-4">
              {!isCombatActive ? (
                <Button onClick={startCombat} className="primary">
                  <Play className="mr-2 h-4 w-4" />
                  Start Combat
                </Button>
              ) : (
                <>
                  <Button onClick={nextTurn} className="secondary">
                    Next Turn ({characters[currentTurnIndex].name}'s turn)
                  </Button>
                  <Button onClick={endCombat} className="destructive">
                    <Pause className="mr-2 h-4 w-4" />
                    End Combat
                  </Button>
                </>
              )}
              <Button onClick={resetCombat} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset Combat
              </Button>
            </div>
          </div>
        )}

        <div className="p-4 border rounded shadow-md bg-gray-800">
          <h2 className="text-lg font-semibold mb-2 text-gray-100">Combat Log</h2>
          <ul className="text-sm text-gray-300">
            {combatLog.map((log, index) => (
              <li key={index}>{log}</li>
            ))}
          </ul>
        </div>
      </div>
    </MainLayout>
  );
};

export default CombatSystem;
