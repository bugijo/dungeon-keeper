
import React from 'react';

interface Spell {
  name: string;
  level: number;
  description: string;
}

interface CharacterSpellsProps {
  spells: Spell[];
}

const CharacterSpells = ({ spells }: CharacterSpellsProps) => {
  return (
    <div className="fantasy-card p-6">
      <h3 className="text-xl font-medievalsharp text-white mb-4">Magias</h3>
      
      <div className="space-y-3">
        {spells.map((spell, index) => (
          <div key={index} className="p-3 rounded-lg bg-fantasy-dark/30">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white font-medievalsharp">{spell.name}</span>
              <span className="text-xs px-2 py-1 rounded bg-fantasy-purple/30 text-fantasy-purple">
                Nível {spell.level === 0 ? 'Truque' : spell.level}
              </span>
            </div>
            <p className="text-sm text-fantasy-stone">{spell.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CharacterSpells;
